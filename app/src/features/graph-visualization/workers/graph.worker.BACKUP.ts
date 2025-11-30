/**
 * Web Worker para procesamiento de grafos en background
 *
 * Este worker ejecuta el procesamiento pesado de grafos en un hilo separado,
 * evitando que la interfaz se congele durante el análisis de datasets grandes.
 *
 * Operaciones que realiza:
 * - Procesamiento de JSON de tweets
 * - Construcción de grafos de menciones y co-hashtags
 * - Cálculo de estadísticas
 * - Detección simple de comunidades (Louvain se mantiene en Python)
 *
 * Beneficios:
 * - UI responsiva durante procesamiento pesado
 * - Mejor experiencia de usuario
 * - Manejo de grafos con miles de nodos sin congelar navegador
 *
 * Autor: 686f6c61
 * Licencia: MIT
 * Versión: 0.4
 */

// Importar stopwords
import stopwordsData from '../../../data/stopwords.json';

// Mensajes del worker
const sendProgress = (message, progress) => {
    self.postMessage({
        type: 'progress',
        message: message,
        progress: progress
    });
};

const sendError = (error) => {
    self.postMessage({
        type: 'error',
        error: error.message || error
    });
};

const sendResult = (data) => {
    self.postMessage({
        type: 'complete',
        data: data
    });
};

/**
 * Calcula estadísticas de usuarios a partir de enriched_users
 * @param {Object} enrichedUsers - Objeto enriched_users del dataset
 * @returns {Object|undefined} - Estadísticas de usuarios o undefined si no hay datos
 */
const calculateUserStatistics = (enrichedUsers) => {
    if (!enrichedUsers || Object.keys(enrichedUsers).length === 0) {
        console.log('[Worker] No hay enriched_users en el dataset');
        return undefined;
    }

    console.log('[Worker] Calculando estadísticas de usuarios...');

    const usersList = Object.entries(enrichedUsers)
        .filter(([_, data]) => !data.unavailable)
        .map(([username, data]) => ({
            username,
            ...data
        }));

    const totalUsers = usersList.length;
    console.log(`[Worker] ${totalUsers} usuarios enriquecidos disponibles`);

    if (totalUsers === 0) return undefined;

    // 1. Agregados generales
    const avgFollowers = usersList.reduce((sum, u) => sum + (u.followers || 0), 0) / totalUsers;
    const avgFollowing = usersList.reduce((sum, u) => sum + (u.following || 0), 0) / totalUsers;

    // Calcular antigüedad de cuentas
    const now = new Date();
    const accountAges = usersList
        .filter(u => u.createdAt)
        .map(u => {
            const created = new Date(u.createdAt);
            return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // días
        });

    const avgAccountAge = accountAges.length > 0
        ? accountAges.reduce((sum, age) => sum + age, 0) / accountAges.length
        : 0;

    // Mediana de seguidores
    const followersSorted = usersList.map(u => u.followers || 0).sort((a, b) => a - b);
    const medianFollowers = followersSorted.length > 0
        ? followersSorted[Math.floor(followersSorted.length / 2)]
        : 0;

    // 2. Distribuciones
    const verified = usersList.filter(u => u.verifiedType === 'Business' || u.verifiedType === 'Government').length;
    const blueVerified = usersList.filter(u => u.isBlueVerified).length;
    const unverified = totalUsers - verified - blueVerified;

    const likelyBots = usersList.filter(u => u.isAutomated).length;

    // Bucketing por followers
    const followerBuckets = {
        '0-100': 0,
        '100-1K': 0,
        '1K-10K': 0,
        '10K-100K': 0,
        '100K+': 0
    };

    usersList.forEach(u => {
        const f = u.followers || 0;
        if (f < 100) followerBuckets['0-100']++;
        else if (f < 1000) followerBuckets['100-1K']++;
        else if (f < 10000) followerBuckets['1K-10K']++;
        else if (f < 100000) followerBuckets['10K-100K']++;
        else followerBuckets['100K+']++;
    });

    // Bucketing por antigüedad
    const ageBuckets = {
        '< 1 month': 0,
        '1-6 months': 0,
        '6-12 months': 0,
        '1-5 years': 0,
        '5+ years': 0
    };

    accountAges.forEach(age => {
        if (age < 30) ageBuckets['< 1 month']++;
        else if (age < 180) ageBuckets['1-6 months']++;
        else if (age < 365) ageBuckets['6-12 months']++;
        else if (age < 1825) ageBuckets['1-5 years']++;
        else ageBuckets['5+ years']++;
    });

    // Top locations
    const locationCounts = {};
    usersList.forEach(u => {
        if (u.location && u.location.trim()) {
            locationCounts[u.location] = (locationCounts[u.location] || 0) + 1;
        }
    });

    const locationDistribution = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // 3. Top usuarios (hasta 50 para paginación en frontend)
    const topByFollowers = [...usersList]
        .sort((a, b) => (b.followers || 0) - (a.followers || 0))
        .slice(0, 50)
        .map(u => ({
            username: u.username,
            followers: u.followers || 0,
            following: u.following || 0,
            verified: u.verifiedType === 'Business' || u.verifiedType === 'Government',
            blue_verified: u.isBlueVerified || false,
            location: u.location || '',
            description: u.description || ''
        }));

    const topByActivity = [...usersList]
        .sort((a, b) => (b.statusesCount || 0) - (a.statusesCount || 0))
        .slice(0, 10)
        .map(u => ({
            username: u.username,
            statusesCount: u.statusesCount || 0,
            followers: u.followers || 0,
            verified: u.verifiedType === 'Business' || u.verifiedType === 'Government'
        }));

    const suspectedBots = usersList
        .filter(u => u.isAutomated)
        .sort((a, b) => (b.followers || 0) - (a.followers || 0))
        .slice(0, 10)
        .map(u => ({
            username: u.username,
            isAutomated: u.isAutomated,
            automatedBy: u.automatedBy || null,
            followers: u.followers || 0
        }));

    console.log(`[Worker] Estadísticas de usuarios calculadas:
      - Promedio seguidores: ${Math.round(avgFollowers)}
      - Verificados: ${verified}, Blue Verified: ${blueVerified}
      - Posibles bots: ${likelyBots}`);

    return {
        total_unique_users: totalUsers,
        total_enriched_users: totalUsers,
        avg_followers: Math.round(avgFollowers),
        avg_following: Math.round(avgFollowing),
        avg_account_age_days: Math.round(avgAccountAge),
        median_followers: medianFollowers,
        verified_distribution: {
            verified,
            unverified,
            blue_verified: blueVerified
        },
        bot_distribution: {
            likely_bot: likelyBots,
            human: totalUsers - likelyBots
        },
        follower_buckets: followerBuckets,
        account_age_buckets: ageBuckets,
        location_distribution: locationDistribution,
        top_users_by_followers: topByFollowers,
        top_users_by_activity: topByActivity,
        suspected_bots: suspectedBots
    };
};

/**
 * Procesa el JSON de tweets y construye estructuras de datos
 */
const processTweetsData = (data) => {
    console.time('[Worker] Total processing time');
    sendProgress('Extrayendo datos de tweets...', 10);

    const tweets = data.tweets || [];
    const usersMetadata = data.users_metadata || {}; // Metadata enriquecida de usuarios (users_metadata = enriched_users)
    const enrichmentInfo = data.enrichment_info || null;

    // Log si hay enriquecimiento
    if (enrichmentInfo) {
        console.log(`[Worker] 📊 Dataset enriquecido: ${enrichmentInfo.users_enriched}/${enrichmentInfo.total_users} usuarios`);
    }

    const userStats = {};
    const mentionPairs = [];
    const userHashtags = {};
    const allHashtags = [];
    const tweetTimes = [];
    const userTweets = {};

    tweets.forEach((item, index) => {
        // Progreso cada 100 tweets
        if (index % 100 === 0) {
            const progress = 10 + (index / tweets.length) * 20;
            sendProgress(`Procesando tweet ${index}/${tweets.length}...`, progress);
        }

        const tweet = item.tweet;
        const username = tweet.username;
        const name = tweet.name;

        // Inicializar usuario
        if (!userStats[username]) {
            userStats[username] = {
                tweets: 0,
                likes: 0,
                retweets: 0,
                replies: 0,
                views: 0,
                name: name,
                hashtags: [],
                follower_count: tweet.follower_count || 0
            };
            userHashtags[username] = {};
            userTweets[username] = [];
        }

        // Actualizar follower_count si viene en el tweet (siempre tomamos el último valor)
        if (tweet.follower_count) {
            userStats[username].follower_count = tweet.follower_count;
        }

        // Estadísticas
        userStats[username].tweets++;
        userStats[username].likes += tweet.likes || 0;
        userStats[username].retweets += tweet.retweets || 0;
        userStats[username].replies += tweet.replies || 0;
        userStats[username].views += tweet.views || 0;

        // Guardar tweets del usuario
        userTweets[username].push({
            text: tweet.text,
            url: tweet.permanent_url,
            likes: tweet.likes || 0,
            time: tweet.time_parsed
        });

        // Hashtags
        const hashtags = tweet.hashtags || [];
        hashtags.forEach(tag => {
            allHashtags.push(tag);
            userStats[username].hashtags.push(tag);
            userHashtags[username][tag] = (userHashtags[username][tag] || 0) + 1;
        });

        // Menciones
        const mentions = tweet.mentions || [];
        mentions.forEach(mention => {
            if (mention.username) {
                mentionPairs.push([username, mention.username]);
            }
        });

        // Tiempo
        if (tweet.time_parsed) {
            tweetTimes.push(tweet.time_parsed);
        }
    });

    console.time('[Worker] Build mentions graph');
    sendProgress('Construyendo grafo de menciones...', 40);
    const mentionsGraph = buildMentionsGraph(mentionPairs, userStats, userTweets, usersMetadata);
    console.timeEnd('[Worker] Build mentions graph');

    console.time('[Worker] Build cohashtags graph');
    sendProgress('Construyendo grafo de co-hashtags...', 60);
    const cohashtagsGraph = buildCohashtagsGraph(userHashtags, userStats, userTweets);
    console.timeEnd('[Worker] Build cohashtags graph');

    console.time('[Worker] Calculate statistics');
    sendProgress('Calculando estadísticas...', 80);
    const statistics = calculateStats(userStats, allHashtags, tweetTimes, tweets, usersMetadata);
    console.timeEnd('[Worker] Calculate statistics');

    console.time('[Worker] Extract word frequencies');
    sendProgress('Analizando frecuencias de palabras...', 90);
    const wordFrequencies = extractWordFrequencies(tweets);
    console.timeEnd('[Worker] Extract word frequencies');

    console.time('[Worker] Analyze URLs');
    sendProgress('Analizando URLs compartidas...', 95);
    const urlAnalysis = analyzeSharedUrls(tweets);
    console.timeEnd('[Worker] Analyze URLs');

    sendProgress('Finalizando...', 98);

    // Calcular datos detallados de comunidades
    sendProgress('Calculando estadísticas de comunidades...', 85);
    const communitiesData = calculateCommunityStatistics(mentionsGraph.nodes, mentionsGraph.edges, userStats, tweets);

    // Calcular estadísticas de usuarios si hay users_metadata (enriched users)
    const userStatistics = calculateUserStatistics(usersMetadata);

    // Enriquecer statistics con datos de los grafos y análisis adicionales
    const enrichedStatistics = {
        ...statistics,
        // Mentions graph stats
        nodes: mentionsGraph.nodes.length,
        edges: mentionsGraph.edges.length,
        density: mentionsGraph.edges.length / (mentionsGraph.nodes.length * (mentionsGraph.nodes.length - 1) || 1),
        avg_degree: mentionsGraph.edges.length * 2 / (mentionsGraph.nodes.length || 1),
        word_frequencies: wordFrequencies,
        total_engagement: statistics.top_engagement_users.reduce((sum, u) => sum + u.engagement, 0),
        avg_engagement: statistics.top_engagement_users.length > 0
            ? statistics.top_engagement_users.reduce((sum, u) => sum + u.engagement, 0) / statistics.top_engagement_users.length
            : 0,
        communities: communitiesData.communities,
        // Network Motifs del grafo de menciones
        triangles: mentionsGraph.network_stats?.motifs?.triangles || 0,
        stars: mentionsGraph.network_stats?.motifs?.stars || 0,
        chains: mentionsGraph.network_stats?.motifs?.chains || 0,
        cohesion: mentionsGraph.network_stats?.motifs?.cohesion || 0,
        trianglesList: mentionsGraph.network_stats?.motifs?.trianglesList || [],
        starsList: mentionsGraph.network_stats?.motifs?.starsList || [],
        chainsList: mentionsGraph.network_stats?.motifs?.chainsList || [],
        modularity: communitiesData.modularity,
        community_distribution: communitiesData.distribution,
        // Cohashtags graph stats
        cohashtagsStats: {
            nodes: cohashtagsGraph.nodes.length,
            edges: cohashtagsGraph.edges.length,
            density: cohashtagsGraph.edges.length > 0
                ? cohashtagsGraph.edges.length / (cohashtagsGraph.nodes.length * (cohashtagsGraph.nodes.length - 1) || 1)
                : 0,
            communities: cohashtagsGraph.network_stats?.num_communities || 0,
            modularity: cohashtagsGraph.network_stats?.modularity || 0
        },
        // User statistics (from enriched_users)
        user_statistics: userStatistics
    };

    const result = {
        mentions: mentionsGraph,
        cohashtags: cohashtagsGraph,
        statistics: enrichedStatistics,
        urlAnalysis: urlAnalysis
    };

    console.log('[Worker] Retornando datos:');
    console.log('  - wordFrequencies:', wordFrequencies.length, 'palabras');
    console.timeEnd('[Worker] Total processing time');

    return result;
};

/**
 * Detecta comunidades usando algoritmo de Louvain simplificado
 *
 * Implementa detección basada en componentes conectados con merge por densidad.
 * Más simple y efectivo que Louvain completo para redes pequeñas/medianas.
 *
 * @param {Array} nodes - Nodos del grafo
 * @param {Array} edges - Aristas con peso
 * @returns {Object} - { communities: Map<nodeId, communityId>, modularity: number, sizes: Array }
 */
const calculateLouvainCommunities = (nodes, edges) => {
    if (nodes.length === 0) {
        return { communities: new Map(), modularity: 0, sizes: [] };
    }

    // Construir mapa de adyacencia
    const adjacency = new Map();
    const nodeSet = new Set(nodes.map(n => n.id));

    nodeSet.forEach(id => adjacency.set(id, new Map()));

    edges.forEach(edge => {
        const weight = edge.weight || 1;
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Map());
        if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Map());
        adjacency.get(edge.source).set(edge.target, weight);
        adjacency.get(edge.target).set(edge.source, weight);
    });

    // Calcular grados
    const degree = new Map();
    nodeSet.forEach(id => {
        let sum = 0;
        adjacency.get(id).forEach(w => sum += w);
        degree.set(id, sum);
    });

    const m = edges.reduce((sum, e) => sum + (e.weight || 1), 0);
    if (m === 0) {
        const firstNode = [...nodeSet][0];
        const map = new Map();
        map.set(firstNode, 0);
        return { communities: map, modularity: 0, sizes: [nodeSet.size] };
    }

    // Union-Find para componentes conectados
    const parent = new Map();
    const rank = new Map();

    nodeSet.forEach(id => {
        parent.set(id, id);
        rank.set(id, 0);
    });

    const find = (x) => {
        if (parent.get(x) !== x) {
            parent.set(x, find(parent.get(x)));
        }
        return parent.get(x);
    };

    const union = (x, y) => {
        const rootX = find(x);
        const rootY = find(y);

        if (rootX === rootY) return;

        if (rank.get(rootX) < rank.get(rootY)) {
            parent.set(rootX, rootY);
        } else if (rank.get(rootX) > rank.get(rootY)) {
            parent.set(rootY, rootX);
        } else {
            parent.set(rootY, rootX);
            rank.set(rootX, rank.get(rootX) + 1);
        }
    };

    // Crear comunidades basadas en conectividad fuerte
    // Unir nodos si tienen conexión fuerte (peso > umbral)
    const avgWeight = edges.reduce((sum, e) => sum + (e.weight || 1), 0) / edges.length;
    const threshold = avgWeight * 0.5; // Umbral adaptativo

    edges.forEach(edge => {
        const weight = edge.weight || 1;
        if (weight >= threshold) {
            union(edge.source, edge.target);
        }
    });

    // Agrupar nodos por comunidad
    const communities = new Map();
    const communityGroups = new Map();

    nodeSet.forEach(id => {
        const root = find(id);
        if (!communityGroups.has(root)) {
            communityGroups.set(root, []);
        }
        communityGroups.get(root).push(id);
    });

    // Si hay demasiadas comunidades pequeñas, fusionar las más pequeñas
    let commList = Array.from(communityGroups.values());

    // Objetivo: entre 3 y 8 comunidades
    const targetMin = 3;
    const targetMax = 8;

    if (commList.length > targetMax) {
        // Ordenar por tamaño
        commList.sort((a, b) => b.length - a.length);

        // Mantener las X más grandes, fusionar el resto en una comunidad
        const keep = commList.slice(0, targetMax - 1);
        const merge = commList.slice(targetMax - 1).flat();

        commList = [...keep, merge];
    }

    // Asignar IDs de comunidad
    commList.forEach((members, idx) => {
        members.forEach(nodeId => {
            communities.set(nodeId, idx);
        });
    });

    // Calcular modularidad
    const m2 = 2 * m;
    let Q = 0;

    edges.forEach(edge => {
        if (communities.get(edge.source) === communities.get(edge.target)) {
            const weight = edge.weight || 1;
            const ki = degree.get(edge.source) || 0;
            const kj = degree.get(edge.target) || 0;
            Q += weight - (ki * kj) / m2;
        }
    });
    Q = Q / m;

    // Calcular tamaños
    const sizes = new Array(commList.length).fill(0);
    communities.forEach(comm => sizes[comm]++);

    console.log(`[Louvain] Detectadas ${commList.length} comunidades, Q=${Q.toFixed(4)}, tamaños=${sizes.join(',')}`);

    return {
        communities: communities,
        modularity: Q,
        sizes: sizes
    };
};

/**
 * Construye el grafo de menciones
 */
const buildMentionsGraph = (mentionPairs, userStats, userTweets, usersMetadata = {}) => {
    const nodes = [];
    const edges = [];
    const edgeMap = {};

    // Contar menciones
    mentionPairs.forEach(([source, target]) => {
        const key = `${source}->${target}`;
        edgeMap[key] = (edgeMap[key] || 0) + 1;
    });

    // Crear nodos
    const allUsers = new Set([...Object.keys(userStats)]);
    mentionPairs.forEach(([s, t]) => {
        allUsers.add(s);
        allUsers.add(t);
    });

    allUsers.forEach(user => {
        const stats = userStats[user] || { tweets: 0, likes: 0, retweets: 0, views: 0, replies: 0, name: user, hashtags: [], follower_count: 0 };
        const tweets = userTweets[user] || [];
        const enrichedData = usersMetadata[user]; // Metadata enriquecida (puede ser null)

        // Obtener top tweet (más likes)
        const topTweet = tweets.length > 0
            ? tweets.sort((a, b) => b.likes - a.likes)[0]
            : null;

        // Si hay metadata enriquecida, usarla; si no, usar valores por defecto
        const nodeData = {
            id: user,
            label: stats.name,
            tweets: stats.tweets,
            engagement: stats.likes + stats.views + stats.replies,
            total_likes: stats.likes || 0,
            total_retweets: stats.retweets || 0,
            follower_count: enrichedData?.followers || stats.follower_count || 0,
            following_count: enrichedData?.following || 0,
            is_blue_verified: enrichedData?.isBlueVerified || false,
            verified_type: enrichedData?.verifiedType || '',
            account_created_at: enrichedData?.createdAt || '',
            statuses_count: enrichedData?.statusesCount || 0,
            location: enrichedData?.location || '',
            is_automated: enrichedData?.isAutomated || false,
            automated_by: enrichedData?.automatedBy || null,
            description: enrichedData?.description || '',
            unavailable: enrichedData?.unavailable || false,
            unavailable_reason: enrichedData?.unavailableReason || null,
            community: 0, // Se asignará después con Louvain
            degree_centrality: 0,
            betweenness_centrality: 0,
            pagerank: 1 / allUsers.size,
            top_connections: [],
            top_hashtags: getTopHashtags(stats.hashtags, 3),
            top_tweet: topTweet
        };

        nodes.push(nodeData);
    });

    // Crear edges
    Object.entries(edgeMap).forEach(([key, weight]) => {
        const [source, target] = key.split('->');
        edges.push({ source, target, weight });
    });

    // Detectar comunidades con Louvain
    sendProgress('Detectando comunidades (Louvain)...', 43);
    const louvainResult = calculateLouvainCommunities(nodes, edges);

    // Asignar comunidades a nodos
    nodes.forEach(node => {
        node.community = louvainResult.communities.get(node.id) || 0;
    });

    // Calcular métricas avanzadas
    sendProgress('Calculando degree centrality...', 43);
    const degreeCentrality = calculateDegreeCentrality(nodes, edges);

    sendProgress('Calculando clustering coefficient...', 45);
    const clustering = calculateClusteringCoefficient(nodes, edges);

    sendProgress('Calculando betweenness centrality...', 46);
    const betweenness = calculateBetweennessCentrality(nodes, edges);

    sendProgress('Calculando closeness centrality...', 47);
    const closeness = calculateClosenessCentrality(nodes, edges);

    sendProgress('Calculando eigenvector centrality...', 52);
    const eigenvector = calculateEigenvectorCentrality(nodes, edges);

    sendProgress('Calculando k-core...', 54);
    const kcore = calculateKCore(nodes, edges);

    sendProgress('Calculando core number...', 55);
    const coreNumber = calculateCoreNumber(nodes, edges);

    // Debug: Ver distribución de core numbers
    const coreDistribution = {};
    Object.values(coreNumber).forEach(core => {
        coreDistribution[core] = (coreDistribution[core] || 0) + 1;
    });
    console.log('[Worker] Core Number distribution:', coreDistribution);

    sendProgress('Calculando assortativity...', 56);
    const assortativity = calculateAssortativity(nodes, edges);

    sendProgress('Calculando PageRank...', 57);
    const pagerank = calculatePageRank(nodes, edges);

    // Verificar variación en PageRank (menciones)
    const pagerankValues = Object.values(pagerank);
    const prMin = Math.min(...pagerankValues);
    const prMax = Math.max(...pagerankValues);
    const prUnique = new Set(pagerankValues.map(v => v.toFixed(8))).size;

    console.log(`[Worker] PageRank stats: min=${prMin.toFixed(6)}, max=${prMax.toFixed(6)}, unique=${prUnique}/${nodes.length}`)

    // Añadir métricas a los nodos
    nodes.forEach(node => {
        node.pagerank = pagerank[node.id] || 0;
        node.degree_centrality = degreeCentrality[node.id] || 0;
        node.clustering_coefficient = clustering[node.id] || 0;
        node.betweenness_centrality = betweenness[node.id] || 0;
        node.closeness_centrality = closeness[node.id] || 0;
        node.eigenvector_centrality = eigenvector[node.id] || 0;
        node.kcore = kcore[node.id] || 0;
        node.core_number = coreNumber[node.id] || 0;
    });

    // Calcular Influencer Scores
    sendProgress('Calculando Influencer Scores...', 58);
    calculateInfluencerScores(nodes);
    console.log('[Worker] Influencer scores calculados para', nodes.length, 'nodos');

    // Calcular Bot Scores
    sendProgress('Calculando Bot Scores...', 59);
    calculateBotScores(nodes, userTweets);
    console.log('[Worker] Bot scores calculados para', nodes.length, 'nodos');

    // Calcular Network Motifs
    sendProgress('Calculando patrones de red...', 65);
    const motifs = calculateNetworkMotifs(nodes, edges, clustering);
    console.log('[Worker] Motifs calculados:', motifs);

    return {
        nodes,
        edges,
        network_stats: {
            num_nodes: nodes.length,
            num_edges: edges.length,
            density: edges.length > 0 ? (2 * edges.length) / (nodes.length * (nodes.length - 1)) : 0,
            num_communities: louvainResult.sizes.length,
            community_sizes: louvainResult.sizes,
            modularity: louvainResult.modularity,
            avg_clustering: Object.values(clustering).reduce((a, b) => a + b, 0) / nodes.length,
            assortativity: assortativity,
            // Network Motifs
            motifs: {
                triangles: motifs.triangles,
                stars: motifs.stars,
                chains: motifs.chains,
                cohesion: motifs.cohesion,
                trianglesList: motifs.trianglesList,
                starsList: motifs.starsList,
                chainsList: motifs.chainsList
            }
        }
    };
};

/**
 * Construye el grafo de co-hashtags
 */
const buildCohashtagsGraph = (userHashtags, userStats, userTweets) => {
    const nodes = [];
    const edges = [];
    const users = Object.keys(userHashtags);

    // Crear nodos
    users.forEach(user => {
        const stats = userStats[user] || { tweets: 0, likes: 0, views: 0, replies: 0, name: user, hashtags: [] };
        const tweets = userTweets[user] || [];

        const topTweet = tweets.length > 0
            ? tweets.sort((a, b) => b.likes - a.likes)[0]
            : null;

        nodes.push({
            id: user,
            label: stats.name,
            tweets: stats.tweets,
            engagement: stats.likes + stats.views + stats.replies,
            community: 0, // Se asignará después con Louvain
            degree_centrality: 0,
            betweenness_centrality: 0,
            pagerank: 1 / users.length,
            top_connections: [],
            top_hashtags: getTopHashtags(stats.hashtags, 3),
            top_tweet: topTweet
        });
    });

    // Crear edges (hashtags en común)
    for (let i = 0; i < users.length; i++) {
        if (i % 10 === 0) {
            // Actualizar progreso
            const progress = 60 + (i / users.length) * 15;
            sendProgress(`Calculando co-hashtags ${i}/${users.length}...`, progress);
        }

        for (let j = i + 1; j < users.length; j++) {
            const user1 = users[i];
            const user2 = users[j];
            const hashtags1 = new Set(Object.keys(userHashtags[user1]));
            const hashtags2 = new Set(Object.keys(userHashtags[user2]));
            const common = [...hashtags1].filter(h => hashtags2.has(h));

            if (common.length > 0) {
                edges.push({ source: user1, target: user2, weight: common.length });
            }
        }
    }

    // Detectar comunidades con Louvain
    sendProgress('Detectando comunidades (Louvain)...', 74);
    const louvainResult = calculateLouvainCommunities(nodes, edges);

    // Asignar comunidades a nodos
    nodes.forEach(node => {
        node.community = louvainResult.communities.get(node.id) || 0;
    });

    // Calcular métricas avanzadas
    sendProgress('Calculando clustering coefficient...', 75);
    const clustering = calculateClusteringCoefficient(nodes, edges);

    sendProgress('Calculando closeness centrality...', 76);
    const closeness = calculateClosenessCentrality(nodes, edges);

    sendProgress('Calculando eigenvector centrality...', 77);
    const eigenvector = calculateEigenvectorCentrality(nodes, edges);

    sendProgress('Calculando k-core...', 78);
    const kcore = calculateKCore(nodes, edges);

    sendProgress('Calculando core number...', 78.5);
    const coreNumber = calculateCoreNumber(nodes, edges);

    sendProgress('Calculando assortativity...', 79);
    const assortativity = calculateAssortativity(nodes, edges);

    sendProgress('Calculando PageRank...', 79.5);
    const pagerank = calculatePageRank(nodes, edges);

    // Crear objeto degreeCentrality calculando desde edges
    const degreeCentrality: Record<string, number> = {};
    nodes.forEach(node => {
        degreeCentrality[node.id] = 0;
    });
    edges.forEach(edge => {
        degreeCentrality[edge.source] = (degreeCentrality[edge.source] || 0) + 1;
        degreeCentrality[edge.target] = (degreeCentrality[edge.target] || 0) + 1;
    });
    // Normalizar
    const maxDegreeRaw = Math.max(...Object.values(degreeCentrality), 1);
    Object.keys(degreeCentrality).forEach(nodeId => {
        degreeCentrality[nodeId] = degreeCentrality[nodeId] / maxDegreeRaw;
    });

    // Verificar variación en PageRank (cohashtags)
    const pagerankValuesCH = Object.values(pagerank);
    const prMinCH = Math.min(...pagerankValuesCH);
    const prMaxCH = Math.max(...pagerankValuesCH);
    const prUniqueCH = new Set(pagerankValuesCH.map((v: number) => v.toFixed(8))).size;

    console.log(`[Worker] PageRank (cohashtags) stats: min=${prMinCH.toFixed(6)}, max=${prMaxCH.toFixed(6)}, unique=${prUniqueCH}/${nodes.length}`)

    // Añadir métricas a los nodos
    nodes.forEach(node => {
        node.pagerank = pagerank[node.id] || 0;
        node.degree_centrality = degreeCentrality[node.id] || 0;
        node.clustering_coefficient = clustering[node.id] || 0;
        node.closeness_centrality = closeness[node.id] || 0;
        node.betweenness_centrality = 0; // No se calcula en cohashtags
        node.eigenvector_centrality = eigenvector[node.id] || 0;
        node.kcore = kcore[node.id] || 0;
        node.core_number = coreNumber[node.id] || 0;
    });

    // Calcular Influencer Scores
    calculateInfluencerScores(nodes);
    console.log('[Worker] Influencer scores calculados (cohashtags) para', nodes.length, 'nodos');

    // Calcular Bot Scores
    calculateBotScores(nodes, userTweets);
    console.log('[Worker] Bot scores calculados (cohashtags) para', nodes.length, 'nodos');

    // Calcular Network Motifs
    const motifs = calculateNetworkMotifs(nodes, edges, clustering);
    console.log('[Worker] Motifs calculados (cohashtags):', motifs);

    return {
        nodes,
        edges,
        network_stats: {
            num_nodes: nodes.length,
            num_edges: edges.length,
            density: edges.length > 0 ? (2 * edges.length) / (nodes.length * (nodes.length - 1)) : 0,
            num_communities: louvainResult.sizes.length,
            community_sizes: louvainResult.sizes,
            modularity: louvainResult.modularity,
            avg_clustering: Object.values(clustering).reduce((a, b) => a + b, 0) / nodes.length,
            assortativity: assortativity,
            // Network Motifs
            motifs: {
                triangles: motifs.triangles,
                stars: motifs.stars,
                chains: motifs.chains,
                cohesion: motifs.cohesion,
                trianglesList: motifs.trianglesList,
                starsList: motifs.starsList,
                chainsList: motifs.chainsList
            }
        }
    };
};

/**
 * Obtiene los top hashtags de un array
 */
const getTopHashtags = (hashtags, limit) => {
    const counts = {};
    hashtags.forEach(h => counts[h] = (counts[h] || 0) + 1);
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([hashtag, count]) => ({ hashtag, count }));
};

/**
 * Calcula el Clustering Coefficient para cada nodo
 *
 * El clustering coefficient mide qué tan conectados están los vecinos de un nodo.
 * C(v) = 2 * E(v) / (k_v * (k_v - 1))
 * donde E(v) es el número de conexiones entre vecinos y k_v es el grado del nodo.
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Mapa de nodeId -> clustering coefficient
 */
const calculateClusteringCoefficient = (nodes, edges) => {
    const clustering = {};

    // Crear mapa de adyacencia
    const adjacency = {};
    nodes.forEach(node => {
        adjacency[node.id] = new Set();
        clustering[node.id] = 0;
    });

    // Construir grafo no dirigido (para clustering usamos versión no dirigida)
    edges.forEach(edge => {
        adjacency[edge.source].add(edge.target);
        adjacency[edge.target].add(edge.source);
    });

    // Calcular clustering para cada nodo
    nodes.forEach(node => {
        const neighbors = Array.from(adjacency[node.id]);
        const k = neighbors.length;

        if (k < 2) {
            clustering[node.id] = 0;
            return;
        }

        // Contar conexiones entre vecinos
        let connections = 0;
        for (let i = 0; i < neighbors.length; i++) {
            for (let j = i + 1; j < neighbors.length; j++) {
                if (adjacency[neighbors[i]].has(neighbors[j])) {
                    connections++;
                }
            }
        }

        // C = 2 * E / (k * (k-1))
        clustering[node.id] = (2 * connections) / (k * (k - 1));
    });

    return clustering;
};

/**
 * Calcula Closeness Centrality usando BFS
 *
 * Closeness mide qué tan cerca está un nodo de todos los demás.
 * Fórmula: C(v) = (n-1) / Σ d(v, u) para todos los u
 * donde d(v,u) es la distancia más corta entre v y u.
 *
 * IMPORTANTE: Los valores están normalizados considerando el tamaño del componente alcanzable.
 * Para grafos desconectados, usamos la variante harmonic mean.
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Mapa de nodeId -> closeness centrality normalizada [0,1]
 */
const calculateClosenessCentrality = (nodes, edges) => {
    const closeness = {};
    const n = nodes.length;

    if (n <= 1) {
        nodes.forEach(node => {
            closeness[node.id] = 0;
        });
        return closeness;
    }

    // Crear mapa de adyacencia (no dirigido para closeness)
    const adjacency = {};
    nodes.forEach(node => {
        adjacency[node.id] = [];
        closeness[node.id] = 0;
    });

    edges.forEach(edge => {
        adjacency[edge.source].push(edge.target);
        adjacency[edge.target].push(edge.source);
    });

    // BFS desde cada nodo
    nodes.forEach(startNode => {
        const distances = {};
        const queue = [startNode.id];
        distances[startNode.id] = 0;

        while (queue.length > 0) {
            const current = queue.shift();
            const currentDist = distances[current];

            adjacency[current].forEach(neighbor => {
                if (distances[neighbor] === undefined) {
                    distances[neighbor] = currentDist + 1;
                    queue.push(neighbor);
                }
            });
        }

        // Calcular suma de distancias a nodos alcanzables
        let totalDistance = 0;
        let reachableNodes = 0;

        nodes.forEach(node => {
            if (node.id !== startNode.id && distances[node.id] !== undefined) {
                totalDistance += distances[node.id];
                reachableNodes++;
            }
        });

        // Closeness usando fórmula estándar normalizada
        // Para grafos potencialmente desconectados, usamos Wasserman-Faust normalization
        if (reachableNodes > 0 && totalDistance > 0) {
            // Closeness raw = reachableNodes / totalDistance
            const rawCloseness = reachableNodes / totalDistance;

            // Normalizar por el tamaño de la red
            // Esto da valores entre 0 y 1 donde 1 significa conectado directamente a todos
            closeness[startNode.id] = (rawCloseness * reachableNodes) / (n - 1);
        } else {
            closeness[startNode.id] = 0;
        }
    });

    return closeness;
};

/**
 * Calcula Eigenvector Centrality usando el método de potencias
 *
 * Eigenvector centrality mide la influencia de un nodo basándose en
 * la importancia de sus vecinos. Similar a PageRank pero para grafos no dirigidos.
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @param {number} maxIter - Máximo número de iteraciones (default: 100)
 * @returns {Object} - Mapa de nodeId -> eigenvector centrality
 */
const calculateEigenvectorCentrality = (nodes, edges, maxIter = 100) => {
    const eigenvector = {};

    // Inicializar con 1/n
    nodes.forEach(node => {
        eigenvector[node.id] = 1 / nodes.length;
    });

    // Crear mapa de adyacencia (no dirigido)
    const adjacency = {};
    nodes.forEach(node => {
        adjacency[node.id] = [];
    });

    edges.forEach(edge => {
        adjacency[edge.source].push(edge.target);
        adjacency[edge.target].push(edge.source);
    });

    // Método de potencias iterativo
    for (let iter = 0; iter < maxIter; iter++) {
        const newEigenvector = {};

        // x_new = A * x_old
        nodes.forEach(node => {
            let sum = 0;
            adjacency[node.id].forEach(neighbor => {
                sum += eigenvector[neighbor];
            });
            newEigenvector[node.id] = sum;
        });

        // Normalizar (evitar overflow)
        let norm = 0;
        nodes.forEach(node => {
            norm += newEigenvector[node.id] * newEigenvector[node.id];
        });
        norm = Math.sqrt(norm);

        if (norm === 0) break;

        nodes.forEach(node => {
            newEigenvector[node.id] /= norm;
        });

        // Actualizar
        Object.assign(eigenvector, newEigenvector);
    }

    return eigenvector;
};

/**
 * Calcula Degree Centrality
 *
 * Degree centrality mide cuántas conexiones directas tiene un nodo.
 * Se normaliza dividiendo por el número máximo posible de conexiones (n-1).
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Mapa de nodeId -> degree centrality
 */
const calculateDegreeCentrality = (nodes, edges) => {
    const degree = {};
    const n = nodes.length;

    // Inicializar todos los nodos con 0
    nodes.forEach(node => {
        degree[node.id] = 0;
    });

    // Contar grados (no dirigido - contar ambas direcciones)
    edges.forEach(edge => {
        degree[edge.source] = (degree[edge.source] || 0) + 1;
        degree[edge.target] = (degree[edge.target] || 0) + 1;
    });

    // Normalizar por (n-1) para obtener centralidad
    if (n > 1) {
        nodes.forEach(node => {
            degree[node.id] = degree[node.id] / (n - 1);
        });
    }

    return degree;
};

/**
 * Calcula Weighted PageRank considerando métricas de usuario
 *
 * Mejora sobre PageRank clásico que pondera los enlaces según:
 * - Actividad del usuario (número de tweets)
 * - Audiencia (seguidores)
 * - Engagement (likes + retweets)
 *
 * Esto evita que cuentas pequeñas con posición estratégica tengan
 * PageRank artificialmente alto.
 *
 * @param {Array} nodes - Lista de nodos con métricas (tweets, follower_count, etc.)
 * @param {Array} edges - Lista de aristas
 * @param {number} dampingFactor - Factor de amortiguación (default: 0.85)
 * @param {number} maxIterations - Máximo número de iteraciones (default: 100)
 * @param {number} tolerance - Convergencia (default: 1e-6)
 * @returns {Object} - Mapa de nodeId -> pagerank
 */
const calculatePageRank = (nodes, edges, dampingFactor = 0.85, maxIterations = 100, tolerance = 1e-6) => {
    const n = nodes.length;
    if (n === 0) return {};

    const pagerank = {};
    const newPagerank = {};

    // Calcular peso de cada nodo basado en métricas reales
    const nodeWeight = {};
    const maxFollowers = Math.max(...nodes.map(n => n.follower_count || 0), 1);
    const maxTweets = Math.max(...nodes.map(n => n.tweets || 0), 1);
    const maxEngagement = Math.max(...nodes.map(n => (n.total_likes || 0) + (n.total_retweets || 0)), 1);

    nodes.forEach(node => {
        // Normalizar métricas a [0, 1]
        const followerScore = (node.follower_count || 0) / maxFollowers;
        const activityScore = (node.tweets || 0) / maxTweets;
        const engagementScore = ((node.total_likes || 0) + (node.total_retweets || 0)) / maxEngagement;

        // Peso combinado (60% seguidores, 20% actividad, 20% engagement)
        // Agregamos +0.1 como baseline para que nadie tenga peso 0
        nodeWeight[node.id] = 0.1 + (0.6 * followerScore + 0.2 * activityScore + 0.2 * engagementScore);

        // Inicializar PageRank ponderado por peso del nodo
        pagerank[node.id] = nodeWeight[node.id] / n;
    });

    // Normalizar pesos iniciales
    const totalInitial = Object.values(pagerank).reduce((sum, val) => sum + val, 0);
    nodes.forEach(node => {
        pagerank[node.id] = pagerank[node.id] / totalInitial;
    });

    // Crear mapa de adyacencia (dirigido: source -> target)
    const inlinks = {}; // Quién apunta a cada nodo (con pesos)
    const outDegree = {}; // Suma de pesos salientes
    const outWeightSum = {}; // Suma total de pesos de salida

    nodes.forEach(node => {
        inlinks[node.id] = [];
        outDegree[node.id] = 0;
        outWeightSum[node.id] = 0;
    });

    // Construir grafo dirigido con pesos
    edges.forEach(edge => {
        if (!inlinks[edge.target]) inlinks[edge.target] = [];

        // El peso del enlace es el peso del nodo fuente
        const edgeWeight = nodeWeight[edge.source] || 0.1;

        inlinks[edge.target].push({
            nodeId: edge.source,
            weight: edgeWeight
        });

        outDegree[edge.source] = (outDegree[edge.source] || 0) + 1;
        outWeightSum[edge.source] = (outWeightSum[edge.source] || 0) + edgeWeight;
    });

    // Iteración del algoritmo con pesos
    let iteration = 0;
    let converged = false;

    while (iteration < maxIterations && !converged) {
        // Calcular nuevo PageRank para cada nodo
        nodes.forEach(node => {
            let sum = 0;

            // Sumar contribuciones ponderadas de nodos que apuntan a este nodo
            inlinks[node.id].forEach(inlink => {
                const sourcePR = pagerank[inlink.nodeId];
                const sourceOutWeightSum = outWeightSum[inlink.nodeId] || 1;

                // Contribución = PR del nodo fuente × (peso del enlace / suma de pesos salientes)
                sum += sourcePR * (inlink.weight / sourceOutWeightSum);
            });

            // Fórmula PageRank ponderado
            // El término de teleportación también está ponderado por el peso del nodo
            const teleportation = ((1 - dampingFactor) * nodeWeight[node.id]) / n;
            newPagerank[node.id] = teleportation + dampingFactor * sum;
        });

        // Verificar convergencia
        let maxDiff = 0;
        nodes.forEach(node => {
            const diff = Math.abs(newPagerank[node.id] - pagerank[node.id]);
            if (diff > maxDiff) maxDiff = diff;
        });

        if (maxDiff < tolerance) {
            converged = true;
        }

        // Actualizar valores
        nodes.forEach(node => {
            pagerank[node.id] = newPagerank[node.id];
        });

        iteration++;
    }

    // Normalizar para que la suma sea 1
    const total = Object.values(pagerank).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
        nodes.forEach(node => {
            pagerank[node.id] = pagerank[node.id] / total;
        });
    }

    console.log(`[Worker] Weighted PageRank convergió en ${iteration} iteraciones (converged=${converged})`);

    return pagerank;
};

/**
 * Calcula Betweenness Centrality
 *
 * Betweenness centrality mide cuántas veces un nodo aparece en el camino más corto
 * entre otros pares de nodos. Indica nodos que actúan como "puentes".
 *
 * Usa el algoritmo de Brandes (2001) optimizado.
 * Para grafos grandes (>500 nodos), usa sampling para reducir complejidad.
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Mapa de nodeId -> betweenness centrality
 */
const calculateBetweennessCentrality = (nodes, edges) => {
    const betweenness = {};
    const n = nodes.length;

    // Inicializar
    nodes.forEach(node => {
        betweenness[node.id] = 0;
    });

    // Crear mapa de adyacencia (no dirigido)
    const adjacency = {};
    nodes.forEach(node => {
        adjacency[node.id] = new Set();
    });
    edges.forEach(edge => {
        adjacency[edge.source].add(edge.target);
        adjacency[edge.target].add(edge.source);
    });

    // Determinar si usar sampling
    const useSampling = n > 500;
    const sampleSize = useSampling ? Math.min(200, Math.ceil(n * 0.3)) : n;

    // Seleccionar nodos fuente (todos o muestra)
    let sourceNodes;
    if (useSampling) {
        // Muestreo estratificado: seleccionar nodos con diferentes grados
        const nodesByDegree = [...nodes].sort((a, b) => {
            const degA = adjacency[a.id]?.size || 0;
            const degB = adjacency[b.id]?.size || 0;
            return degB - degA;
        });

        // Tomar una muestra distribuida
        const step = Math.floor(n / sampleSize);
        sourceNodes = [];
        for (let i = 0; i < n && sourceNodes.length < sampleSize; i += step) {
            sourceNodes.push(nodesByDegree[i]);
        }

        console.log(`[Worker] Betweenness: Usando sampling (${sourceNodes.length}/${n} nodos)`);
    } else {
        sourceNodes = nodes;
    }

    // Factor de normalización ajustado por sampling
    const normalizationFactor = useSampling ? (n / sampleSize) : 1;

    // Algoritmo de Brandes para cada nodo fuente
    sourceNodes.forEach(source => {
        const stack = [];
        const paths = {}; // Número de caminos más cortos desde source
        const distance = {}; // Distancia desde source
        const predecessors = {}; // Predecesores en caminos más cortos
        const delta = {}; // Acumulador de dependencias

        nodes.forEach(node => {
            paths[node.id] = 0;
            distance[node.id] = -1;
            predecessors[node.id] = [];
            delta[node.id] = 0;
        });

        paths[source.id] = 1;
        distance[source.id] = 0;

        // BFS
        const queue = [source.id];
        while (queue.length > 0) {
            const v = queue.shift();
            stack.push(v);

            for (const w of adjacency[v]) {
                // Primera vez que encontramos w
                if (distance[w] < 0) {
                    queue.push(w);
                    distance[w] = distance[v] + 1;
                }
                // Camino más corto a w via v
                if (distance[w] === distance[v] + 1) {
                    paths[w] += paths[v];
                    predecessors[w].push(v);
                }
            }
        }

        // Acumulación - procesar nodos en orden inverso de distancia
        while (stack.length > 0) {
            const w = stack.pop();
            for (const v of predecessors[w]) {
                delta[v] += (paths[v] / paths[w]) * (1 + delta[w]);
            }
            if (w !== source.id) {
                betweenness[w] += delta[w];
            }
        }
    });

    // Normalizar por 2*(n-1)*(n-2) para grafos no dirigidos
    // Ajustar por sampling si se usó
    if (n > 2) {
        const norm = 2.0 * (n - 1) * (n - 2);
        nodes.forEach(node => {
            betweenness[node.id] = (betweenness[node.id] * normalizationFactor) / norm;
        });
    }

    return betweenness;
};

/**
 * Calcula K-Core Decomposition
 *
 * K-core es el subgrafo máximo donde cada nodo tiene al menos k conexiones.
 * El k-core number de un nodo indica el núcleo más denso al que pertenece.
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Mapa de nodeId -> k-core number
 */
const calculateKCore = (nodes, edges) => {
    const kcore = {};

    // Crear mapa de adyacencia (no dirigido)
    const adjacency = {};
    const degree = {};

    nodes.forEach(node => {
        adjacency[node.id] = new Set();
        degree[node.id] = 0;
        kcore[node.id] = 0;
    });

    edges.forEach(edge => {
        adjacency[edge.source].add(edge.target);
        adjacency[edge.target].add(edge.source);
    });

    // Calcular grados iniciales
    nodes.forEach(node => {
        degree[node.id] = adjacency[node.id].size;
    });

    // Algoritmo de k-core
    const removed = new Set();
    let k = 0;

    while (removed.size < nodes.length) {
        // Encontrar el grado mínimo actual
        let minDegree = Infinity;
        nodes.forEach(node => {
            if (!removed.has(node.id) && degree[node.id] < minDegree) {
                minDegree = degree[node.id];
            }
        });

        if (minDegree === Infinity) break;
        k = Math.max(k, minDegree);

        // Remover nodos con grado <= k
        const toRemove = [];
        nodes.forEach(node => {
            if (!removed.has(node.id) && degree[node.id] <= k) {
                toRemove.push(node.id);
            }
        });

        toRemove.forEach(nodeId => {
            removed.add(nodeId);
            kcore[nodeId] = k;

            // Actualizar grados de vecinos
            adjacency[nodeId].forEach(neighbor => {
                if (!removed.has(neighbor)) {
                    degree[neighbor]--;
                }
            });
        });
    }

    return kcore;
};

/**
 * Calcula Core Number (shell index) - más granular que k-core
 *
 * El core number de un nodo es el k-shell más alto al que pertenece.
 * A diferencia del k-core básico, esto da valores más diferenciados.
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Mapa de nodeId -> core number
 */
const calculateCoreNumber = (nodes, edges) => {
    const coreNumber = {};
    const adjacency = {};
    const degree = {};

    // Inicializar estructuras
    nodes.forEach(node => {
        adjacency[node.id] = new Set();
        degree[node.id] = 0;
        coreNumber[node.id] = 0;
    });

    // Construir grafo no dirigido
    edges.forEach(edge => {
        adjacency[edge.source].add(edge.target);
        adjacency[edge.target].add(edge.source);
    });

    // Calcular grados iniciales
    nodes.forEach(node => {
        degree[node.id] = adjacency[node.id].size;
    });

    // Algoritmo de Batagelj-Zaversnik
    const processed = new Set();
    let currentCore = 0;

    while (processed.size < nodes.length) {
        // Encontrar el nodo no procesado con menor grado
        let minDegree = Infinity;
        let minNode = null;

        nodes.forEach(node => {
            if (!processed.has(node.id) && degree[node.id] < minDegree) {
                minDegree = degree[node.id];
                minNode = node.id;
            }
        });

        if (minNode === null) break;

        // El core number es el máximo entre el grado actual y el core anterior
        currentCore = Math.max(currentCore, minDegree);
        coreNumber[minNode] = currentCore;
        processed.add(minNode);

        // Decrementar grados de vecinos no procesados
        adjacency[minNode].forEach(neighborId => {
            if (!processed.has(neighborId)) {
                degree[neighborId]--;
            }
        });
    }

    return coreNumber;
};

/**
 * Calcula Assortativity del grafo completo
 *
 * Mide si nodos con grados similares tienden a conectarse.
 * Valores positivos = homofilia, negativos = hub-and-spoke
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {number} - Coeficiente de assortativity (-1 a 1)
 */
const calculateAssortativity = (nodes, edges) => {
    if (edges.length === 0) return 0;

    // Calcular grados
    const degree = {};
    nodes.forEach(node => {
        degree[node.id] = 0;
    });

    // Contar grados (no dirigido)
    edges.forEach(edge => {
        degree[edge.source] = (degree[edge.source] || 0) + 1;
        degree[edge.target] = (degree[edge.target] || 0) + 1;
    });

    // Calcular assortativity
    let sumJK = 0;
    let sumJ = 0;
    let sumK = 0;
    let sumJ2 = 0;
    let sumK2 = 0;
    const M = edges.length;

    edges.forEach(edge => {
        const j = degree[edge.source];
        const k = degree[edge.target];

        sumJK += j * k;
        sumJ += j;
        sumK += k;
        sumJ2 += j * j;
        sumK2 += k * k;
    });

    const numerator = sumJK / M - (sumJ / M) * (sumK / M);
    const denominator = Math.sqrt((sumJ2 / M - (sumJ / M) ** 2) * (sumK2 / M - (sumK / M) ** 2));

    return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * Calcula el Influencer Score para cada nodo
 *
 * Combina múltiples métricas con pesos específicos:
 * - PageRank (30%): Influencia por conexiones de calidad
 * - Eigenvector (20%): Conectado con otros importantes
 * - Betweenness (15%): Puente entre comunidades
 * - Degree (10%): Cuántos te mencionan/conectan
 * - Engagement (15%): Interacción total
 * - Engagement Rate (10%): Calidad sobre cantidad
 *
 * @param {Array} nodes - Lista de nodos con todas las métricas calculadas
 * @returns {Array} - Nodos con influencer_score y category añadidos
 */
const calculateInfluencerScores = (nodes) => {
    console.log('[Worker] calculateInfluencerScores llamado con', nodes.length, 'nodos');
    if (nodes.length === 0) return nodes;

    // Función helper para normalizar valores a rango 0-1
    const normalize = (value, min, max) => {
        if (max === min) return 0;
        return (value - min) / (max - min);
    };

    // Extraer valores para normalización
    const pageranks = nodes.map(n => n.pagerank || 0);
    const eigenvectors = nodes.map(n => n.eigenvector_centrality || 0);
    const betweennesses = nodes.map(n => n.betweenness_centrality || 0);
    const degrees = nodes.map(n => n.degree_centrality || 0);
    const engagements = nodes.map(n => n.engagement || 0);
    const tweets = nodes.map(n => n.tweets || 1); // Evitar división por 0

    // Calcular engagement rate
    const engagementRates = nodes.map((n, i) => engagements[i] / tweets[i]);

    // Obtener min/max para normalización
    const maxPagerank = Math.max(...pageranks);
    const minPagerank = Math.min(...pageranks);
    const maxEigenvector = Math.max(...eigenvectors);
    const minEigenvector = Math.min(...eigenvectors);
    const maxBetweenness = Math.max(...betweennesses);
    const minBetweenness = Math.min(...betweennesses);
    const maxDegree = Math.max(...degrees);
    const minDegree = Math.min(...degrees);
    const maxEngagement = Math.max(...engagements);
    const minEngagement = Math.min(...engagements);
    const maxEngagementRate = Math.max(...engagementRates);
    const minEngagementRate = Math.min(...engagementRates);

    // Calcular score para cada nodo
    nodes.forEach((node, i) => {
        const normPagerank = normalize(pageranks[i], minPagerank, maxPagerank);
        const normEigenvector = normalize(eigenvectors[i], minEigenvector, maxEigenvector);
        const normBetweenness = normalize(betweennesses[i], minBetweenness, maxBetweenness);
        const normDegree = normalize(degrees[i], minDegree, maxDegree);
        const normEngagement = normalize(engagements[i], minEngagement, maxEngagement);
        const normEngagementRate = normalize(engagementRates[i], minEngagementRate, maxEngagementRate);

        // Score compuesto (0-100)
        const score = (
            normPagerank * 0.30 +
            normEigenvector * 0.20 +
            normBetweenness * 0.15 +
            normDegree * 0.10 +
            normEngagement * 0.15 +
            normEngagementRate * 0.10
        ) * 100;

        node.influencer_score = score;
        node.engagement_rate = engagementRates[i];

        // Categorizar
        if (score >= 80) {
            node.influencer_category = 'mega';
        } else if (score >= 60) {
            node.influencer_category = 'macro';
        } else if (score >= 40) {
            node.influencer_category = 'micro';
        } else {
            node.influencer_category = 'nano';
        }
    });

    // Log de verificación
    const scoresCalculados = nodes.filter(n => n.influencer_score !== undefined).length;
    console.log('[Worker] Scores asignados a', scoresCalculados, 'nodos');
    if (nodes.length > 0) {
        console.log('[Worker] Ejemplo:', nodes[0].id, 'score:', nodes[0].influencer_score, 'category:', nodes[0].influencer_category);
    }

    return nodes;
};

/**
 * Detecta picos de actividad en la timeline con análisis avanzado
 *
 * Métricas calculadas:
 * - Estadísticas básicas: media, σ, umbral, intensidad
 * - Velocidad de propagación: tweets/hora vs baseline
 * - Duración del evento: horas consecutivas
 * - Alcance: suma de views/likes
 * - Usuarios más activos del periodo
 * - Tasa de crecimiento respecto a la media
 * - Análisis de propagación: nodo iniciador, influencers, tiempo al pico
 * - Detección de patrones: orgánico vs coordinado
 * - Palabras clave y URLs compartidas
 *
 * @param {Array} temporalActivity - Array de {time, count}
 * @param {Object} hashtagsByTime - Map de time -> array de hashtags
 * @param {Object} tweetsByTime - Map de time -> array de tweets completos
 * @param {Array} allTweets - Array completo de tweets
 * @returns {Array} - Array de eventos detectados con métricas avanzadas
 */
const detectActivityPeaks = (temporalActivity, hashtagsByTime, tweetsByTime, allTweets) => {
    console.log('[Worker] detectActivityPeaks llamado');
    console.log('  temporalActivity.length:', temporalActivity.length);
    console.log('  tweetsByTime keys:', Object.keys(tweetsByTime).length);

    if (temporalActivity.length === 0) {
        console.log('[Worker] temporalActivity vacío, retornando []');
        return [];
    }

    // Calcular estadísticas del volumen
    const counts = temporalActivity.map(d => d.count);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
    const stddev = Math.sqrt(variance);

    // Umbral adaptativo basado en cantidad de datos
    let thresholdMultiplier = 1.5;

    // Si hay pocos datos, ser más permisivo
    if (temporalActivity.length <= 5) {
        thresholdMultiplier = 0.5; // Más permisivo
    } else if (temporalActivity.length <= 10) {
        thresholdMultiplier = 1.0;
    }

    const threshold = mean + (thresholdMultiplier * stddev);

    console.log('[Worker] Estadísticas:', {
        mean: mean.toFixed(2),
        stddev: stddev.toFixed(2),
        threshold: threshold.toFixed(2),
        multiplier: thresholdMultiplier
    });

    // Detectar picos
    let peaks = temporalActivity.filter(d => d.count >= threshold);

    // Si no se detectaron picos, tomar los top 30% con más actividad (mínimo 1)
    if (peaks.length === 0) {
        const topN = Math.max(1, Math.ceil(temporalActivity.length * 0.3));
        const sorted = [...temporalActivity].sort((a, b) => b.count - a.count);
        peaks = sorted.slice(0, topN);
        console.log('[Worker] Sin picos por umbral, usando top', topN, 'periodos con más actividad');
    }

    console.log('[Worker] Picos detectados:', peaks.length);
    if (peaks.length > 0) {
        console.log('[Worker] Primer pico:', peaks[0]);
    }

    // Para cada pico, calcular métricas avanzadas
    const detectedEvents = peaks.map((peak, peakIndex) => {
        const hashtagsInPeriod = hashtagsByTime[peak.time] || [];
        const tweetsInPeriod = tweetsByTime[peak.time] || [];

        // 1. HASHTAGS TRENDING
        const hashtagFreq = {};
        hashtagsInPeriod.forEach(tag => {
            hashtagFreq[tag] = (hashtagFreq[tag] || 0) + 1;
        });
        const topHashtags = Object.entries(hashtagFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([hashtag, count]) => ({ hashtag, count }));

        // 2. VELOCIDAD DE PROPAGACIÓN
        const velocityVsBaseline = ((peak.count - mean) / mean * 100).toFixed(1);
        const tweetsPerHour = peak.count; // Ya está agregado por hora

        // 3. DURACIÓN DEL EVENTO (horas consecutivas por encima del umbral)
        let duration = 1;
        const peakIdx = temporalActivity.findIndex(d => d.time === peak.time);

        // Contar hacia atrás
        for (let i = peakIdx - 1; i >= 0; i--) {
            if (temporalActivity[i].count >= threshold * 0.8) { // 80% del umbral
                duration++;
            } else break;
        }
        // Contar hacia adelante
        for (let i = peakIdx + 1; i < temporalActivity.length; i++) {
            if (temporalActivity[i].count >= threshold * 0.8) {
                duration++;
            } else break;
        }

        // 4. ALCANCE ESTIMADO (suma de views/likes)
        const totalViews = tweetsInPeriod.reduce((sum, t) => sum + (t.views || 0), 0);
        const totalLikes = tweetsInPeriod.reduce((sum, t) => sum + (t.likes || 0), 0);
        const totalRetweets = tweetsInPeriod.reduce((sum, t) => sum + (t.retweets || 0), 0);
        const reach = totalViews + totalLikes;

        // 5. USUARIOS MÁS ACTIVOS DEL PERIODO
        const userActivity = {};
        tweetsInPeriod.forEach(t => {
            const user = t.username;
            if (!userActivity[user]) {
                userActivity[user] = { username: user, name: t.name, tweets: 0, likes: 0, retweets: 0 };
            }
            userActivity[user].tweets++;
            userActivity[user].likes += t.likes || 0;
            userActivity[user].retweets += t.retweets || 0;
        });
        const topUsers = Object.values(userActivity)
            .sort((a, b) => b.tweets - a.tweets)
            .slice(0, 5);

        // 6. TASA DE CRECIMIENTO
        const growthRate = velocityVsBaseline; // Ya calculado

        // 7. ANÁLISIS DE PROPAGACIÓN

        // Nodo iniciador (primer tweet del periodo)
        const sortedTweets = [...tweetsInPeriod].sort((a, b) =>
            new Date(a.time_parsed) - new Date(b.time_parsed)
        );
        const initiator = sortedTweets[0] ? {
            username: sortedTweets[0].username,
            name: sortedTweets[0].name,
            time: sortedTweets[0].time_parsed
        } : null;

        // Influencers clave (más retweets)
        const influencers = Object.values(userActivity)
            .sort((a, b) => b.retweets - a.retweets)
            .slice(0, 3)
            .map(u => ({ username: u.username, name: u.name, retweets: u.retweets }));

        // Tiempo hasta el pico (desde primer tweet del periodo hasta el momento actual)
        const timeToPeak = sortedTweets.length > 0 ? peak.time : null;

        // 8. DETECCIÓN DE PATRONES

        // Orgánico vs Coordinado (heurística)
        const uniqueUsers = Object.keys(userActivity).length;
        const avgTweetsPerUser = tweetsInPeriod.length / uniqueUsers;
        const isCoordinated = avgTweetsPerUser > 3 || uniqueUsers < 5; // Si pocos usuarios tuitean mucho

        // Bot score promedio de usuarios activos
        const botScores = tweetsInPeriod.map(t => t.bot_score || 0).filter(s => s > 0);
        const avgBotScore = botScores.length > 0
            ? (botScores.reduce((a, b) => a + b, 0) / botScores.length).toFixed(1)
            : 0;

        const eventType = isCoordinated && avgBotScore > 40 ? 'coordinado' : 'orgánico';

        // Palabras clave emergentes (no hashtags)
        const wordFreq = {};
        // Usar stopwords importadas estáticamente
        const stopwords = new Set([...stopwordsData.spanish, ...stopwordsData.english]);

        tweetsInPeriod.forEach(t => {
            const words = (t.text || '').toLowerCase()
                .replace(/[^\w\sáéíóúñü]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopwords.has(w) && !w.startsWith('http'));

            words.forEach(w => {
                wordFreq[w] = (wordFreq[w] || 0) + 1;
            });
        });

        const topWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({ word, count }));

        // URLs compartidas
        const urlFreq = {};
        tweetsInPeriod.forEach(t => {
            const urls = (t.text || '').match(/https?:\/\/[^\s]+/g) || [];
            urls.forEach(url => {
                // Limpiar URL
                const cleanUrl = url.replace(/[.,;!?)]+$/, '');
                urlFreq[cleanUrl] = (urlFreq[cleanUrl] || 0) + 1;
            });
        });

        const topUrls = Object.entries(urlFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([url, count]) => ({ url, count }));

        // Menciones destacadas
        const mentionFreq = {};
        tweetsInPeriod.forEach(t => {
            const mentions = t.mentions || [];
            mentions.forEach(m => {
                if (m.username) {
                    mentionFreq[m.username] = (mentionFreq[m.username] || 0) + 1;
                }
            });
        });

        const topMentions = Object.entries(mentionFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([username, count]) => ({ username, count }));

        return {
            // Básicas
            time: peak.time,
            count: peak.count,
            threshold: Math.round(threshold),
            intensity: ((peak.count - mean) / stddev).toFixed(2),

            // Estadísticas avanzadas
            velocity: `+${velocityVsBaseline}%`,
            tweetsPerHour: tweetsPerHour,
            duration: duration,
            reach: reach,
            totalViews: totalViews,
            totalLikes: totalLikes,
            totalRetweets: totalRetweets,
            growthRate: `${growthRate}%`,

            // Usuarios
            topUsers: topUsers,
            uniqueUsers: uniqueUsers,

            // Propagación
            initiator: initiator,
            influencers: influencers,
            timeTopeak: timeToPeak,

            // Patrones
            eventType: eventType,
            isCoordinated: isCoordinated,
            avgBotScore: parseFloat(avgBotScore),

            // Contenido
            trending_hashtags: topHashtags,
            topWords: topWords,
            topUrls: topUrls,
            topMentions: topMentions
        };
    });

    return detectedEvents;
};

/**
 * Calcula estadísticas generales MEJORADAS con datos enriquecidos
 */
const calculateStats = (userStats, allHashtags, tweetTimes, tweets, usersMetadata = {}) => {
    const users = Object.entries(userStats);

    // Helper: Enriquecer usuario con metadata
    const enrichUser = (username, stats) => {
        const metadata = usersMetadata[username] || {};
        const followers = metadata.followers || 0;
        const following = metadata.following || 0;
        const isVerified = metadata.verifiedType === 'Business' || metadata.verifiedType === 'Government';
        const isBlueVerified = metadata.isBlueVerified || false;
        const accountAgeDays = metadata.createdAt ?
            (Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;

        const totalEngagement = stats.likes + stats.views + stats.replies;

        return {
            username,
            name: stats.name,
            followers,
            following,
            verified: isVerified,
            blue_verified: isBlueVerified,
            location: metadata.location || '',
            account_age_days: Math.round(accountAgeDays),
            is_automated: metadata.isAutomated || false,
            // Métricas calculadas
            engagement_per_tweet: stats.tweets > 0 ? totalEngagement / stats.tweets : 0,
            reach_ratio: followers > 0 ? (totalEngagement / followers) : 0,
            follower_following_ratio: following > 0 ? (followers / following) : followers
        };
    };

    // FASE 1: Top por actividad (CON ENRIQUECIMIENTO) - Hasta 50 para paginación
    const topActive = users
        .sort((a, b) => b[1].tweets - a[1].tweets)
        .slice(0, 50)
        .map(([username, stats]) => {
            const enriched = enrichUser(username, stats);
            return {
                username,
                name: stats.name,
                tweets: stats.tweets,
                followers: enriched.followers,
                verified: enriched.verified,
                blue_verified: enriched.blue_verified,
                engagement_per_tweet: Math.round(enriched.engagement_per_tweet),
                account_age_years: Math.round(enriched.account_age_days / 365)
            };
        });

    // FASE 1: Top por engagement (CON ENRIQUECIMIENTO)
    // FASE 2: Top por engagement - Hasta 50 para paginación
    const topEngagement = users
        .sort((a, b) => (b[1].likes + b[1].views + b[1].replies) - (a[1].likes + a[1].views + a[1].replies))
        .slice(0, 50)  // Cambiado de 10 a 50 para paginación
        .map(([username, stats]) => {
            const enriched = enrichUser(username, stats);
            const totalEng = stats.likes + stats.views + stats.replies;
            return {
                username,
                name: stats.name,
                engagement: totalEng,
                likes: stats.likes,
                views: stats.views,
                replies: stats.replies,
                retweets: stats.retweets || 0,
                followers: enriched.followers,
                verified: enriched.verified,
                blue_verified: enriched.blue_verified,
                reach_ratio: enriched.reach_ratio.toFixed(4),
                location: enriched.location
            };
        });

    const hashtagCounts = {};
    allHashtags.forEach(h => hashtagCounts[h] = (hashtagCounts[h] || 0) + 1);
    const topHashtags = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([hashtag, count]) => ({ hashtag, count }));

    const timeDistribution = {};
    const hashtagsByTime = {};
    const tweetsByTime = {};

    tweetTimes.forEach((time, idx) => {
        try {
            const dt = new Date(time.replace('Z', '+00:00'));
            const hour = dt.toISOString().substring(0, 13) + ':00';
            timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;

            // Guardar hashtags por periodo temporal
            if (!hashtagsByTime[hour]) {
                hashtagsByTime[hour] = [];
            }
            const tweetHashtags = tweets[idx]?.tweet?.hashtags || [];
            hashtagsByTime[hour].push(...tweetHashtags);

            // Guardar tweets completos por periodo
            if (!tweetsByTime[hour]) {
                tweetsByTime[hour] = [];
            }
            const tweet = tweets[idx]?.tweet;
            if (tweet) {
                tweetsByTime[hour].push({
                    username: tweet.username,
                    name: tweet.name,
                    text: tweet.text,
                    time_parsed: tweet.time_parsed,
                    likes: tweet.likes || 0,
                    retweets: tweet.retweets || 0,
                    replies: tweet.replies || 0,
                    views: tweet.views || 0,
                    mentions: tweet.mentions || [],
                    hashtags: tweet.hashtags || [],
                    bot_score: tweet.bot_score || 0
                });
            }
        } catch (e) {}
    });

    const temporalActivity = Object.entries(timeDistribution)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([time, count]) => ({ time, count }));

    // Detectar picos de actividad con análisis avanzado
    const detectedEvents = detectActivityPeaks(temporalActivity, hashtagsByTime, tweetsByTime, tweets);

    console.log('[Worker] Eventos detectados:', detectedEvents.length);
    if (detectedEvents.length > 0) {
        console.log('[Worker] Primer evento:', detectedEvents[0]);
    }

    // FASE 2: Calcular Top Influencers por Reach Ponderado
    // FASE 3: Top Influencers - Hasta 50 para paginación
    const topInfluencers = users
        .map(([username, stats]) => {
            const enriched = enrichUser(username, stats);
            const totalEngagement = stats.likes + stats.views + stats.replies;

            // Influence Score = (followers * 0.3) + (engagement * 0.4) + (tweets * 0.1) + (reach_ratio * followers * 0.2)
            const influenceScore =
                (enriched.followers * 0.3) +
                (totalEngagement * 0.4) +
                (stats.tweets * 0.1) +
                (enriched.reach_ratio * enriched.followers * 0.2);

            return {
                username,
                name: stats.name,
                influence_score: Math.round(influenceScore),
                followers: enriched.followers,
                tweets: stats.tweets,
                total_engagement: totalEngagement,
                reach_ratio: enriched.reach_ratio.toFixed(4),
                verified: enriched.verified,
                blue_verified: enriched.blue_verified,
                engagement_per_tweet: Math.round(enriched.engagement_per_tweet)
            };
        })
        .sort((a, b) => b.influence_score - a.influence_score)
        .slice(0, 50);  // Cambiado de 10 a 50 para paginación

    // FASE 2: Detectar Usuarios Sospechosos de Amplificación Artificial
    const suspiciousUsers = users
        .map(([username, stats]) => {
            const enriched = enrichUser(username, stats);
            const totalEngagement = stats.likes + stats.views + stats.replies;

            // Criterios de sospecha:
            const suspicionSignals = [];
            let suspicionScore = 0;

            // 1. Alto engagement con pocos followers (ratio > 10)
            if (enriched.reach_ratio > 10 && enriched.followers < 1000) {
                suspicionSignals.push('high_reach_low_followers');
                suspicionScore += 30;
            }

            // 2. Muchos tweets en poco tiempo (> 50 tweets)
            if (stats.tweets > 50) {
                suspicionSignals.push('excessive_posting');
                suspicionScore += 20;
            }

            // 3. Ratio followers/following muy bajo (< 0.1) o muy alto (> 20)
            if (enriched.follower_following_ratio < 0.1 || enriched.follower_following_ratio > 20) {
                suspicionSignals.push('unusual_follow_ratio');
                suspicionScore += 15;
            }

            // 4. Cuenta muy nueva (< 90 días) con alta actividad
            if (enriched.account_age_days < 90 && stats.tweets > 20) {
                suspicionSignals.push('new_account_high_activity');
                suspicionScore += 25;
            }

            // 5. Usuario marcado como automatizado
            if (enriched.is_automated) {
                suspicionSignals.push('automated_account');
                suspicionScore += 40;
            }

            return {
                username,
                name: stats.name,
                suspicion_score: suspicionScore,
                signals: suspicionSignals,
                followers: enriched.followers,
                following: enriched.following,
                tweets: stats.tweets,
                total_engagement: totalEngagement,
                reach_ratio: enriched.reach_ratio.toFixed(4),
                account_age_days: enriched.account_age_days,
                is_automated: enriched.is_automated,
                verified: enriched.verified
            };
        })
        .filter(user => user.suspicion_score >= 30) // Solo usuarios con score >= 30
        .sort((a, b) => b.suspicion_score - a.suspicion_score)
        .slice(0, 15);

    console.log('[Worker] Top influencers calculados:', topInfluencers.length);
    console.log('[Worker] Usuarios sospechosos detectados:', suspiciousUsers.length);

    return {
        top_active_users: topActive,
        top_engagement_users: topEngagement,
        top_influencers: topInfluencers,
        suspicious_users: suspiciousUsers,
        top_hashtags: topHashtags,
        temporal_activity: temporalActivity,
        detected_events: detectedEvents,
        total_tweets: tweetTimes.length,
        total_users: users.length,
        total_hashtags: Object.keys(hashtagCounts).length
    };
};

/**
 * Calcula el Bot Score para cada nodo
 *
 * Sistema multi-señal que combina 4 indicadores:
 * 1. REGULARIDAD TEMPORAL (40%): Patrones automáticos de posting
 * 2. SIMILITUD DE CONTENIDO (25%): Contenido repetitivo/template
 * 3. PATRONES DE INTERACCIÓN (20%): Diversidad de conexiones
 * 4. CARACTERÍSTICAS DE PERFIL (15%): Métricas sospechosas
 *
 * Score final 0-100:
 * - 0-30: Humano
 * - 30-60: Sospechoso
 * - 60-80: Bot Probable
 * - 80-100: Bot Confirmado
 *
 * @param {Array} nodes - Nodos con métricas calculadas
 * @param {Object} userTweets - Map de username -> array de tweets
 * @returns {Array} - Nodos con bot_score y bot_signals añadidos
 */
const calculateBotScores = (nodes, userTweets) => {
    console.log('[Worker] calculateBotScores llamado con', nodes.length, 'nodos');
    if (nodes.length === 0) return nodes;

    // Función helper para normalizar a 0-1
    const normalize = (value, min, max) => {
        if (max === min) return 0;
        return Math.min(1, Math.max(0, (value - min) / (max - min)));
    };

    // Arrays para almacenar señales
    const temporalScores = [];
    const contentScores = [];
    const interactionScores = [];
    const profileScores = [];

    // Calcular señales para cada nodo
    nodes.forEach((node, i) => {
        const tweets = userTweets[node.id] || [];

        // SEÑAL 1: Regularidad Temporal (40%)
        // Usa coeficiente de variación de intervalos entre tweets
        const temporalScore = calculateTemporalRegularity(tweets);
        temporalScores.push(temporalScore);

        // SEÑAL 2: Similitud de Contenido (25%)
        // Detecta contenido repetitivo usando Jaccard
        const contentScore = calculateContentSimilarity(tweets);
        contentScores.push(contentScore);

        // SEÑAL 3: Patrones de Interacción (20%)
        // Usa entropía de Shannon para diversidad de conexiones
        const interactionScore = calculateInteractionPatterns(node);
        interactionScores.push(interactionScore);

        // SEÑAL 4: Características de Perfil (15%)
        // Ratio engagement/tweets, velocidad de posting
        const profileScore = calculateProfileCharacteristics(node, tweets);
        profileScores.push(profileScore);
    });

    // Normalizar todas las señales
    const maxTemporal = Math.max(...temporalScores);
    const minTemporal = Math.min(...temporalScores);
    const maxContent = Math.max(...contentScores);
    const minContent = Math.min(...contentScores);
    const maxInteraction = Math.max(...interactionScores);
    const minInteraction = Math.min(...interactionScores);
    const maxProfile = Math.max(...profileScores);
    const minProfile = Math.min(...profileScores);

    // Asignar scores a cada nodo
    nodes.forEach((node, i) => {
        const normTemporal = normalize(temporalScores[i], minTemporal, maxTemporal);
        const normContent = normalize(contentScores[i], minContent, maxContent);
        const normInteraction = normalize(interactionScores[i], minInteraction, maxInteraction);
        const normProfile = normalize(profileScores[i], minProfile, maxProfile);

        // Score compuesto (0-100)
        const botScore = (
            normTemporal * 0.40 +
            normContent * 0.25 +
            normInteraction * 0.20 +
            normProfile * 0.15
        ) * 100;

        node.bot_score = botScore;

        // Guardar señales individuales (para desglose)
        node.bot_signals = {
            temporal: normTemporal * 100,
            content: normContent * 100,
            interaction: normInteraction * 100,
            profile: normProfile * 100
        };

        // Categorizar
        if (botScore >= 80) {
            node.bot_category = 'confirmed';
        } else if (botScore >= 60) {
            node.bot_category = 'probable';
        } else if (botScore >= 30) {
            node.bot_category = 'suspicious';
        } else {
            node.bot_category = 'human';
        }
    });

    console.log('[Worker] Bot scores calculados para', nodes.length, 'nodos');
    return nodes;
};

/**
 * Calcula regularidad temporal usando CV de intervalos
 * CV bajo = muy regular = más bot-like
 */
const calculateTemporalRegularity = (tweets) => {
    if (tweets.length < 3) return 0; // Pocos datos

    // Extraer timestamps
    const times = tweets
        .map(t => {
            try {
                if (!t.time) return null;
                const timeStr = typeof t.time === 'string' ? t.time.replace('Z', '+00:00') : t.time;
                return new Date(timeStr).getTime();
            } catch (e) {
                return null;
            }
        })
        .filter(t => t !== null && !isNaN(t))
        .sort((a, b) => a - b);

    if (times.length < 3) return 0;

    // Calcular intervalos entre tweets consecutivos
    const intervals = [];
    for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
    }

    // Calcular media y desviación estándar
    const mean = intervals.reduce((sum, x) => sum + x, 0) / intervals.length;
    const variance = intervals.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Coeficiente de variación (CV = stdDev / mean)
    // CV bajo = intervalos muy regulares = bot
    const cv = mean > 0 ? stdDev / mean : 1;

    // Invertir: CV bajo -> score alto
    // Normalizar CV (típicamente 0-2) a score 0-1
    return Math.max(0, 1 - Math.min(1, cv / 2));
};

/**
 * Calcula similitud de contenido usando Jaccard
 * Alta similitud = contenido repetitivo = bot
 */
const calculateContentSimilarity = (tweets) => {
    if (tweets.length < 3) return 0;

    // Tokenizar textos (palabras únicas)
    const tokenSets = tweets.map(t => {
        const text = (t.text || '').toLowerCase();
        const words = text.match(/\b\w+\b/g) || [];
        return new Set(words.filter(w => w.length > 3)); // Ignorar palabras cortas
    });

    // Calcular similitud promedio entre todos los pares
    let totalSimilarity = 0;
    let pairs = 0;

    for (let i = 0; i < tokenSets.length; i++) {
        for (let j = i + 1; j < tokenSets.length; j++) {
            const set1 = tokenSets[i];
            const set2 = tokenSets[j];

            // Jaccard similarity
            const intersection = new Set([...set1].filter(x => set2.has(x)));
            const union = new Set([...set1, ...set2]);

            if (union.size > 0) {
                totalSimilarity += intersection.size / union.size;
                pairs++;
            }
        }
    }

    // Promedio de similitud (0-1)
    return pairs > 0 ? totalSimilarity / pairs : 0;
};

/**
 * Calcula patrones de interacción usando entropía
 * Baja entropía = poca diversidad = bot
 */
const calculateInteractionPatterns = (node) => {
    // Usar top_connections si existen
    const connections = node.top_connections || [];
    if (connections.length < 2) {
        // Usar degree como proxy
        const degree = node.degree_centrality || 0;
        return degree > 0.5 ? 0 : 0.5; // Alto degree = humano probable
    }

    // Calcular entropía de Shannon de conexiones
    const total = connections.reduce((sum, c) => sum + c.weight, 0);
    if (total === 0) return 0.5;

    let entropy = 0;
    connections.forEach(c => {
        const p = c.weight / total;
        if (p > 0) {
            entropy -= p * Math.log2(p);
        }
    });

    // Normalizar entropía (max = log2(n))
    const maxEntropy = Math.log2(connections.length);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Invertir: baja entropía = alta puntuación bot
    return 1 - normalizedEntropy;
};

/**
 * Calcula características sospechosas de perfil
 */
const calculateProfileCharacteristics = (node, tweets) => {
    let score = 0;
    let factors = 0;

    // Factor 1: Engagement rate muy bajo (spam ignorado)
    if (node.engagement_rate !== undefined) {
        if (node.engagement_rate < 0.1) {
            score += 1;
        }
        factors++;
    }

    // Factor 2: Alta velocidad de posting
    if (tweets.length > 0) {
        const times = tweets
            .map(t => {
                try {
                    if (!t.time) return null;
                    const timeStr = typeof t.time === 'string' ? t.time.replace('Z', '+00:00') : t.time;
                    return new Date(timeStr).getTime();
                } catch (e) {
                    return null;
                }
            })
            .filter(t => t !== null && !isNaN(t))
            .sort((a, b) => a - b);

        if (times.length >= 2) {
            const timeSpan = times[times.length - 1] - times[0];
            const hoursSpan = timeSpan / (1000 * 60 * 60);
            const tweetsPerHour = hoursSpan > 0 ? tweets.length / hoursSpan : 0;

            // Más de 5 tweets/hora es sospechoso
            if (tweetsPerHour > 5) {
                score += 1;
            }
            factors++;
        }
    }

    // Factor 3: Proporción nombre/username (nombres genéricos)
    if (node.label && node.id) {
        const nameLength = node.label.length;
        const usernameLength = node.id.length;
        // Nombres muy cortos o iguales al username
        if (nameLength < 3 || node.label === node.id) {
            score += 0.5;
        }
        factors++;
    }

    return factors > 0 ? score / factors : 0;
};

/**
 * Extrae frecuencias de palabras de los tweets (sin stopwords)
 */
const extractWordFrequencies = (tweets) => {
    console.log('[Worker] extractWordFrequencies recibió', tweets.length, 'tweets');
    if (tweets.length > 0) {
        const ejemplo = tweets[0];
        console.log('[Worker] Ejemplo completo de tweet:', ejemplo);
        console.log('[Worker] Campos disponibles:', Object.keys(ejemplo));

        // Intentar acceder a diferentes estructuras posibles
        if (ejemplo.tweet) {
            console.log('[Worker] ejemplo.tweet existe:', ejemplo.tweet);
            console.log('[Worker] ejemplo.tweet.text:', ejemplo.tweet.text);
            console.log('[Worker] ejemplo.tweet.full_text:', ejemplo.tweet.full_text);
        }
    }

    // Stopwords en español (palabras comunes a ignorar)
    const stopwords = new Set([
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
        'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
        'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
        'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
        'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo',
        'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
        'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
        'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
        'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
        'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
        'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo',
        'decir', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar',
        'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar',
        'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir',
        'recibir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir',
        'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar', 'leer',
        'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír',
        'acabar', 'mil', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
        'diez', 'puede', 'sido', 'hay', 'era', 'fue', 'están', 'tiene', 'hace',
        'son', 'está', 'han', 'sea', 'sus', 'les', 'una', 'del', 'los', 'las',
        'al', 'ante', 'bajo', 'cabe', 'contra', 'durante', 'mediante', 'según',
        'sin', 'so', 'sobre', 'tras', 'versus', 'vía', 'es', 'eres', 'somos',
        'sois', 'he', 'has', 'hemos', 'habéis', 'tengo', 'tienes', 'tenemos',
        'tenéis', 'voy', 'vas', 'vamos', 'vais', 'van', 'rt', 'vía', 'https',
        'http', 'www', 'com', 'twitter', 'tweet'
    ]);

    const wordCount = {};

    tweets.forEach(item => {
        const tweet = item.tweet;
        if (!tweet || (!tweet.full_text && !tweet.text)) return;

        let text = tweet.full_text || tweet.text || '';

        // Limpiar texto
        text = text.toLowerCase();
        // Quitar URLs
        text = text.replace(/https?:\/\/[^\s]+/gi, '');
        // Quitar menciones
        text = text.replace(/@\w+/g, '');
        // Quitar símbolos # de hashtags pero mantener la palabra
        text = text.replace(/#/g, '');
        // Quitar puntuación
        text = text.replace(/[.,;:!?¿¡"'()[\]{}]/g, ' ');
        // Quitar números sueltos
        text = text.replace(/\b\d+\b/g, '');

        // Tokenizar
        const words = text.split(/\s+/).filter(w => w.length >= 3);

        // Contar palabras (excluyendo stopwords)
        words.forEach(word => {
            if (!stopwords.has(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
    });

    // Convertir a array y ordenar por frecuencia
    const frequencies = Object.entries(wordCount)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50); // Top 50 palabras

    return frequencies;
};

/**
 * Calcula Network Motifs (patrones estructurales en el grafo)
 *
 * Límites adaptativos basados en tamaño del grafo para evitar sobrecarga de memoria:
 * - Grafos pequeños (<100 nodos): Sin límites
 * - Grafos medianos (100-500 nodos): Límites moderados
 * - Grafos grandes (>500 nodos): Límites estrictos + sampling
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @param {Object} clustering - Mapa de clustering coefficients (opcional)
 * @returns {Object} - Objeto con conteos de motifs y cohesión
 */
const calculateNetworkMotifs = (nodes, edges, clustering = null) => {
    const n = nodes.length;

    // Límites adaptativos
    let maxTriangles, maxStars, maxChains;
    if (n < 100) {
        maxTriangles = Infinity;
        maxStars = Infinity;
        maxChains = Infinity;
    } else if (n < 500) {
        maxTriangles = 1000;
        maxStars = 500;
        maxChains = 2000;
    } else {
        maxTriangles = 500;
        maxStars = 200;
        maxChains = 1000;
    }

    console.log(`[Worker] Network Motifs: Límites adaptativos para ${n} nodos (T:${maxTriangles}, S:${maxStars}, C:${maxChains})`);

    // Construir mapa de adyacencia
    const adjacency = {};
    nodes.forEach(node => {
        adjacency[node.id] = new Set();
    });

    edges.forEach(edge => {
        adjacency[edge.source].add(edge.target);
        // Para grafo no dirigido, agregar ambas direcciones
        adjacency[edge.target].add(edge.source);
    });

    // 1. CONTAR TRIÁNGULOS
    // Un triángulo es cuando A-B, B-C y C-A están todos conectados
    let triangles = 0;
    const trianglesList = [];
    const nodeIds = nodes.map(n => n.id);

    for (let i = 0; i < nodeIds.length; i++) {
        const a = nodeIds[i];
        const neighborsA = Array.from(adjacency[a]);

        for (let j = 0; j < neighborsA.length; j++) {
            const b = neighborsA[j];
            if (b <= a) continue; // Evitar duplicados

            for (let k = j + 1; k < neighborsA.length; k++) {
                const c = neighborsA[k];
                if (c <= a) continue;

                // Verificar si B y C están conectados
                if (adjacency[b].has(c)) {
                    triangles++;
                    // Solo guardar detalles si no excede límite
                    if (trianglesList.length < maxTriangles) {
                        trianglesList.push({ nodes: [a, b, c] });
                    }
                }
            }
        }
    }

    // 2. CONTAR ESTRELLAS
    // Una estrella es un nodo central con k >= 3 vecinos que no están conectados entre sí
    let stars = 0;
    const starsList = [];

    nodes.forEach(node => {
        const neighbors = Array.from(adjacency[node.id]);
        if (neighbors.length < 3) return; // Necesita al menos 3 vecinos

        // Contar conexiones entre vecinos
        let neighborConnections = 0;
        for (let i = 0; i < neighbors.length; i++) {
            for (let j = i + 1; j < neighbors.length; j++) {
                if (adjacency[neighbors[i]].has(neighbors[j])) {
                    neighborConnections++;
                }
            }
        }

        // Si tiene pocos vecinos conectados entre sí, es una estrella
        const maxPossibleConnections = (neighbors.length * (neighbors.length - 1)) / 2;
        const connectivity = neighborConnections / maxPossibleConnections;
        if (connectivity < 0.3) {
            stars++;
            // Solo guardar detalles si no excede límite
            if (starsList.length < maxStars) {
                starsList.push({
                    center: node.id,
                    satellites: neighbors,
                    degree: neighbors.length,
                    connectivity: Math.round(connectivity * 100)
                });
            }
        }
    });

    // 3. CONTAR CADENAS
    // Una cadena es una secuencia A-B-C donde A y C no están directamente conectados
    let chains = 0;
    const chainsList = [];

    nodes.forEach(nodeB => {
        const neighborsB = Array.from(adjacency[nodeB.id]);
        if (neighborsB.length < 2) return;

        // Para cada par de vecinos de B
        for (let i = 0; i < neighborsB.length; i++) {
            for (let j = i + 1; j < neighborsB.length; j++) {
                const a = neighborsB[i];
                const c = neighborsB[j];

                // Si A y C NO están conectados directamente, es una cadena
                if (!adjacency[a].has(c)) {
                    chains++;
                    // Solo guardar detalles si no excede límite
                    if (chainsList.length < maxChains) {
                        chainsList.push({ nodes: [a, nodeB.id, c] });
                    }
                }
            }
        }
    });

    // 4. CALCULAR COHESIÓN DE RED (0-100%)
    // Fórmula: Cohesión = (factor_triángulos × 40%) + (clustering × 30%) + (densidad × 30%)

    const density = edges.length > 0 ? (2 * edges.length) / (nodes.length * (nodes.length - 1)) : 0;

    // Factor de triángulos normalizado (0-1)
    const maxPossibleTriangles = (nodes.length * (nodes.length - 1) * (nodes.length - 2)) / 6;
    const triangleFactor = maxPossibleTriangles > 0 ? Math.min(triangles / (maxPossibleTriangles * 0.01), 1) : 0;

    // Clustering promedio (ya normalizado 0-1)
    let avgClustering = 0;
    if (clustering) {
        const clusteringValues = Object.values(clustering).filter(v => !isNaN(v));
        avgClustering = clusteringValues.length > 0
            ? clusteringValues.reduce((a, b) => a + b, 0) / clusteringValues.length
            : 0;
    }

    // Cohesión compuesta (0-100)
    const cohesion = ((triangleFactor * 0.4) + (avgClustering * 0.3) + (density * 0.3)) * 100;

    const result = {
        triangles,
        stars,
        chains,
        cohesion: Math.round(cohesion * 10) / 10, // Redondear a 1 decimal
        density: Math.round(density * 10000) / 10000,
        avg_clustering: Math.round(avgClustering * 10000) / 10000,
        // Listas detalladas (con límites adaptativos)
        trianglesList: trianglesList,
        starsList: starsList.sort((a, b) => b.degree - a.degree), // Ordenar por grado
        chainsList: chainsList,
        // Metadata sobre truncamiento
        truncated: {
            triangles: triangles > trianglesList.length,
            stars: stars > starsList.length,
            chains: chains > chainsList.length
        }
    };

    console.log('[Worker] Motifs calculados:', {
        triangles: result.triangles,
        stars: result.stars,
        chains: result.chains,
        cohesion: result.cohesion,
        nodes: nodes.length,
        edges: edges.length,
        truncated: result.truncated
    });

    return result;
};

/**
 * Calcula estadísticas detalladas para cada comunidad
 *
 * @param {Array} nodes - Nodos del grafo con community asignado
 * @param {Array} edges - Aristas del grafo
 * @param {Object} userStats - Estadísticas de usuarios
 * @returns {Object} - { communities: Array, modularity: number, distribution: Object }
 */
const calculateCommunityStatistics = (nodes, edges, userStats, tweets = []) => {
    console.log('[Worker] calculateCommunityStatistics iniciado con', nodes.length, 'nodos');

    // Paleta de colores para comunidades
    const COMMUNITY_COLORS = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085',
        '#27ae60', '#2980b9', '#8e44ad', '#c0392b', '#d35400'
    ];

    // Agrupar nodos por comunidad
    const communityGroups = new Map();
    nodes.forEach(node => {
        const commId = node.community;
        if (!communityGroups.has(commId)) {
            communityGroups.set(commId, []);
        }
        communityGroups.get(commId).push(node);
    });

    // Crear mapa de nodos para búsqueda rápida
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Crear mapa de adyacencia para calcular densidad
    const adjacency = new Map();
    nodes.forEach(node => adjacency.set(node.id, new Set()));
    edges.forEach(edge => {
        if (adjacency.has(edge.source)) adjacency.get(edge.source).add(edge.target);
        if (adjacency.has(edge.target)) adjacency.get(edge.target).add(edge.source);
    });

    const communities = [];
    let totalEdges = edges.length;
    let Q = 0; // Modularidad

    // Procesar cada comunidad
    communityGroups.forEach((communityNodes, commId) => {
        const nodeIds = new Set(communityNodes.map(n => n.id));

        // Calcular estadísticas básicas
        const size = communityNodes.length;
        const total_tweets = communityNodes.reduce((sum, n) => sum + (n.tweets || 0), 0);
        const total_engagement = communityNodes.reduce((sum, n) => sum + (n.engagement || 0), 0);
        const avg_score = communityNodes.reduce((sum, n) => sum + (n.influencer_score || 0), 0) / size;

        // Calcular densidad interna
        let internalEdges = 0;
        edges.forEach(edge => {
            if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
                internalEdges++;
            }
        });

        const maxPossibleEdges = (size * (size - 1)) / 2;
        const density = maxPossibleEdges > 0 ? internalEdges / maxPossibleEdges : 0;

        // Contribución a la modularidad
        const e_ii = totalEdges > 0 ? internalEdges / totalEdges : 0;
        const a_i = communityNodes.reduce((sum, n) => {
            const degree = adjacency.get(n.id)?.size || 0;
            return sum + degree;
        }, 0) / (2 * totalEdges);
        Q += (e_ii - a_i * a_i);

        // Top influencers (ordenar por influencer_score)
        const top_influencers = [...communityNodes]
            .filter(n => n.influencer_score !== undefined)
            .sort((a, b) => (b.influencer_score || 0) - (a.influencer_score || 0))
            .slice(0, 10)
            .map(n => ({
                username: n.id,
                name: n.label || n.id,
                score: n.influencer_score || 0,
                tweets: n.tweets || 0
            }));

        // Top hashtags de la comunidad
        const hashtagCounts = new Map();
        communityNodes.forEach(node => {
            const nodeHashtags = node.top_hashtags || [];
            nodeHashtags.forEach(ht => {
                const tag = ht.hashtag;
                const count = ht.count || 1;
                hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + count);
            });
        });

        const top_hashtags = Array.from(hashtagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([hashtag, count]) => ({ hashtag, count }));

        // Color de la comunidad
        const color = COMMUNITY_COLORS[commId % COMMUNITY_COLORS.length];

        communities.push({
            id: commId,
            size,
            nodes: Array.from(nodeIds),
            color,
            top_hashtags,
            density,
            total_tweets,
            total_engagement,
            avg_score,
            top_influencers
        });
    });

    // Ordenar comunidades por tamaño (de mayor a menor)
    communities.sort((a, b) => b.size - a.size);

    // Calcular distribución de comunidades
    const distribution = {};
    communities.forEach(comm => {
        distribution[comm.id] = comm.size;
    });

    console.log(`[Worker] ${communities.length} comunidades calculadas, Q=${Q.toFixed(4)}`);

    // INTEGRAR ANÁLISIS AVANZADO (Sprint 3A)
    if (tweets && tweets.length > 0) {
        console.log('[Worker] Iniciando análisis avanzado de comunidades...');

        // Ejecutar análisis avanzado para cada comunidad
        communities.forEach(comm => {
            try {
                const advancedAnalysis = analyzeCommunityAdvanced(comm, tweets, nodes, edges);
                comm.sentiment = advancedAnalysis.sentiment;
                comm.vocabulary_uniqueness = advancedAnalysis.vocabulary.totalWords;
                comm.coordination = advancedAnalysis.coordination;
            } catch (err) {
                console.error(`[Worker] Error en análisis avanzado de comunidad ${comm.id}:`, err);
            }
        });

        // Detectar echo chambers comparando vocabularios entre comunidades
        try {
            const echoChamberResults = detectEchoChambers(communities, tweets, nodes);

            // Agregar clasificación de echo chamber a cada comunidad
            echoChamberResults.forEach((result, idx) => {
                if (communities[idx]) {
                    communities[idx].echo_chamber = result;
                }
            });
        } catch (err) {
            console.error('[Worker] Error en detección de echo chambers:', err);
        }

        console.log(`[Worker] Análisis avanzado completado`);
    } else {
        console.log('[Worker] Sin tweets disponibles para análisis avanzado');
    }

    return {
        communities,
        modularity: Q,
        distribution
    };
};

/**
 * DICCIONARIOS DE ANÁLISIS DE SENTIMIENTO
 * Cargados desde JSON externo para facilitar mantenimiento y expansión
 */
import sentimentDictionary from '../../../data/sentiment-dictionary.json';

// Construir diccionario de sentimientos a partir del JSON
const SENTIMENT_DICT = {};
Object.entries(sentimentDictionary.sentiment).forEach(([category, data]) => {
    data.words.forEach(word => {
        SENTIMENT_DICT[word] = data.score;
    });
});

// Construir diccionario de emociones
const EMOTION_DICT = {};
Object.entries(sentimentDictionary.emotions).forEach(([emotion, words]) => {
    words.forEach(word => {
        EMOTION_DICT[word] = emotion;
    });
});

// Lista de palabras tóxicas
const TOXIC_KEYWORDS = sentimentDictionary.toxicity;

/**
 * Analiza sentimiento y toxicidad de un texto
 */
const analyzeSentiment = (text) => {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    let sentimentScore = 0;
    let isToxic = false;
    const emotions = { ira: 0, miedo: 0, felicidad: 0, tristeza: 0, neutral: 0 };

    // Analizar sentimiento por palabras
    words.forEach(word => {
        // Sentimiento (score numérico)
        if (SENTIMENT_DICT[word] !== undefined) {
            sentimentScore += SENTIMENT_DICT[word];
        }

        // Emoción (categoría)
        if (EMOTION_DICT[word]) {
            emotions[EMOTION_DICT[word]]++;
        }
    });

    // Detectar toxicidad
    isToxic = TOXIC_KEYWORDS.some(kw => lowerText.includes(kw));

    // Clasificar emoción dominante
    const emotionEntries = Object.entries(emotions);
    const dominantEmotion = emotionEntries.length > 0
        ? emotionEntries.sort((a, b) => b[1] - a[1])[0][0]
        : 'neutral';

    return {
        score: sentimentScore,
        isToxic,
        emotions,
        dominantEmotion
    };
};

/**
 * Analiza sentimiento de una comunidad completa
 */
const analyzeCommunityAdvanced = (community, allTweets, allNodes, allEdges) => {
    // Filtrar tweets de la comunidad
    const communityTweets = allTweets.filter(item =>
        community.nodes.includes(item.tweet.username)
    );

    if (communityTweets.length === 0) {
        return null;
    }

    // 1. ANÁLISIS DE SENTIMIENTO
    let totalSentiment = 0;
    let toxicCount = 0;
    const emotions = { ira: 0, miedo: 0, felicidad: 0, neutral: 0 };

    communityTweets.forEach(item => {
        const analysis = analyzeSentiment(item.tweet.text || '');
        totalSentiment += analysis.score;
        if (analysis.isToxic) toxicCount++;
        emotions[analysis.dominantEmotion]++;
    });

    const avgSentiment = totalSentiment / communityTweets.length;
    const toxicityRate = toxicCount / communityTweets.length;
    const emotionScores = {};
    Object.entries(emotions).forEach(([emotion, count]) => {
        emotionScores[emotion] = count / communityTweets.length;
    });
    const dominantEmotion = Object.entries(emotions)
        .sort((a, b) => b[1] - a[1])[0][0];

    // Clasificar comunidad por sentimiento
    let sentimentClass;
    if (avgSentiment < -1) {
        sentimentClass = { type: 'REACTIVA_NEGATIVA', icon: '😡', color: '#ef4444' };
    } else if (avgSentiment > 1) {
        sentimentClass = { type: 'POSITIVA', icon: '😊', color: '#22c55e' };
    } else if (toxicityRate > 0.3) {
        sentimentClass = { type: 'TOXICA', icon: '🔥', color: '#dc2626' };
    } else {
        sentimentClass = { type: 'NEUTRAL_ANALITICA', icon: '🤔', color: '#6b7280' };
    }

    // 2. VOCABULARIO ÚNICO (para Echo Chambers)
    const wordFreq = new Map();
    communityTweets.forEach(item => {
        const words = (item.tweet.text || '')
            .toLowerCase()
            .replace(/[^a-záéíóúñü\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3);

        words.forEach(word => {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });
    });

    // 3. COORDINACIÓN TEMPORAL
    const timestamps = communityTweets
        .map(item => new Date(item.tweet.time_parsed).getTime())
        .filter(ts => !isNaN(ts));

    let temporalEntropy = 1; // Default: distribución uniforme
    if (timestamps.length > 1) {
        // Dividir en buckets de 1 hora
        const buckets = new Map();
        timestamps.forEach(ts => {
            const hour = Math.floor(ts / (1000 * 60 * 60));
            buckets.set(hour, (buckets.get(hour) || 0) + 1);
        });

        // Calcular entropía
        const total = timestamps.length;
        let entropy = 0;
        buckets.forEach(count => {
            const p = count / total;
            entropy -= p * Math.log2(p);
        });

        const maxEntropy = Math.log2(Math.max(buckets.size, 1));
        temporalEntropy = maxEntropy > 0 ? entropy / maxEntropy : 1;
    }

    // 4. SIMILITUD DE CONTENIDO (detección de duplicados)
    let duplicateCount = 0;
    const textsNormalized = communityTweets.map(item =>
        (item.tweet.text || '').toLowerCase().replace(/\s+/g, ' ').trim()
    );

    for (let i = 0; i < textsNormalized.length && i < 50; i++) { // Limitar para performance
        for (let j = i + 1; j < textsNormalized.length && j < 50; j++) {
            const similarity = calculateTextSimilarity(textsNormalized[i], textsNormalized[j]);
            if (similarity > 0.8) {
                duplicateCount++;
            }
        }
    }
    const duplicateRate = textsNormalized.length > 1
        ? duplicateCount / Math.min(50, textsNormalized.length)
        : 0;

    // 5. CONCENTRACIÓN DE BOTS
    const botUsers = community.nodes.filter(nodeId => {
        const node = allNodes.find(n => n.id === nodeId);
        return node && node.bot_score > 60;
    }).length;
    const botRate = botUsers / community.nodes.length;

    // 6. SCORE DE COORDINACIÓN
    const coordScore = (
        (1 - temporalEntropy) * 0.3 +
        duplicateRate * 0.4 +
        botRate * 0.2 +
        0.1 // Reservado para futura métrica de hashtags
    );

    let coordClass;
    if (coordScore > 0.7) {
        coordClass = { type: 'ALTAMENTE_COORDINADA', level: 'Crítico', color: '#dc2626' };
    } else if (coordScore > 0.5) {
        coordClass = { type: 'POSIBLEMENTE_COORDINADA', level: 'Alto', color: '#f59e0b' };
    } else if (coordScore > 0.3) {
        coordClass = { type: 'SOSPECHOSA', level: 'Medio', color: '#3b82f6' };
    } else {
        coordClass = { type: 'ORGANICA', level: 'Bajo', color: '#22c55e' };
    }

    return {
        sentiment: {
            avgScore: avgSentiment,
            toxicityRate,
            emotionScores,
            dominantEmotion,
            classification: sentimentClass
        },
        vocabulary: {
            uniqueWords: Array.from(wordFreq.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([word, freq]) => ({ word, freq })),
            totalWords: wordFreq.size
        },
        coordination: {
            score: coordScore,
            temporalSync: 1 - temporalEntropy,
            contentDuplication: duplicateRate,
            botConcentration: botRate,
            classification: coordClass
        }
    };
};

/**
 * Calcula similaridad de texto (Jaccard de n-gramas)
 */
const calculateTextSimilarity = (text1, text2) => {
    const createNGrams = (text, n = 3) => {
        const grams = new Set();
        for (let i = 0; i <= text.length - n; i++) {
            grams.add(text.substring(i, i + n));
        }
        return grams;
    };

    const grams1 = createNGrams(text1);
    const grams2 = createNGrams(text2);

    const intersection = new Set([...grams1].filter(g => grams2.has(g)));
    const union = new Set([...grams1, ...grams2]);

    return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Detecta Echo Chambers comparando vocabulario entre comunidades
 */
const detectEchoChambers = (communities, allTweets, allNodes) => {
    const vocabularies = new Map();

    // Extraer vocabulario de cada comunidad
    communities.forEach(comm => {
        if (!comm.advancedAnalysis || !comm.advancedAnalysis.vocabulary) return;

        const vocabSet = new Set(
            comm.advancedAnalysis.vocabulary.uniqueWords.map(w => w.word)
        );
        vocabularies.set(comm.id, vocabSet);
    });

    // Calcular similaridad entre cada comunidad y las demás
    const echoChamberResults = [];

    communities.forEach(comm => {
        if (!vocabularies.has(comm.id)) return;

        const vocab1 = vocabularies.get(comm.id);
        let totalSimilarity = 0;
        let comparisons = 0;

        vocabularies.forEach((vocab2, otherId) => {
            if (otherId === comm.id) return;

            const intersection = new Set([...vocab1].filter(w => vocab2.has(w)));
            const union = new Set([...vocab1, ...vocab2]);
            const similarity = union.size > 0 ? intersection.size / union.size : 0;

            totalSimilarity += similarity;
            comparisons++;
        });

        const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;

        // Calcular aislamiento de la comunidad (ya lo tenemos en density inversa)
        const isolation = 1 - (comm.density || 0);

        // Clasificar echo chamber
        let echoChamberClass;
        if (isolation > 0.7 && avgSimilarity < 0.3) {
            echoChamberClass = {
                type: 'ECHO_CHAMBER_FUERTE',
                icon: '🔴',
                level: 'Fuerte',
                color: '#dc2626',
                description: 'Comunidad aislada con vocabulario único. Cámara de eco confirmada.'
            };
        } else if (isolation > 0.5 && avgSimilarity < 0.5) {
            echoChamberClass = {
                type: 'ECHO_CHAMBER_MODERADO',
                icon: '🟡',
                level: 'Moderado',
                color: '#f59e0b',
                description: 'Comunidad con tendencia al aislamiento informativo.'
            };
        } else {
            echoChamberClass = {
                type: 'DISCURSO_HETEROGENEO',
                icon: '🟢',
                level: 'Bajo',
                color: '#22c55e',
                description: 'Comunidad con exposición a narrativas diversas.'
            };
        }

        echoChamberResults.push({
            communityId: comm.id,
            isolation,
            contentSimilarity: avgSimilarity,
            classification: echoChamberClass
        });
    });

    return echoChamberResults;
};

/**
 * Analiza URLs compartidas en los tweets
 *
 * Extrae todas las URLs, cuenta frecuencias, identifica quién las comparte,
 * y asocia hashtags relacionados.
 *
 * @param {Array} tweets - Array de tweets
 * @returns {Object} - Análisis detallado de URLs
 */
const analyzeSharedUrls = (tweets) => {
    console.log('[Worker] analyzeSharedUrls iniciado con', tweets.length, 'tweets');

    const urlData = {};

    tweets.forEach(item => {
        const tweet = item.tweet;
        const text = tweet.text || '';
        const username = tweet.username || 'unknown';
        const name = tweet.name || username;
        const hashtags = tweet.hashtags || [];

        // Combinar URLs de dos fuentes:
        // 1. Campo tweet.urls (URLs normalizadas y expandidas del provider)
        // 2. Regex del texto (fallback para URLs no capturadas)
        const urlsFromField = (tweet.urls || [])
            .map(urlObj => {
                // El campo urls puede contener strings directos o objetos {url, expanded_url, display_url}
                if (typeof urlObj === 'string') {
                    return urlObj;
                } else if (typeof urlObj === 'object' && urlObj !== null) {
                    return urlObj.expanded_url || urlObj.url || '';
                }
                return '';
            })
            .filter(url => url && typeof url === 'string' && url.trim().length > 0);
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urlsFromText = text.match(urlRegex) || [];

        // Unir ambas fuentes y eliminar duplicados
        const allUrls = [...new Set([...urlsFromField, ...urlsFromText])];

        allUrls.forEach(rawUrl => {
            // Validación defensiva
            if (!rawUrl || typeof rawUrl !== 'string') return;

            // Limpiar URL (quitar puntuación final)
            const cleanUrl = rawUrl.replace(/[.,;!?)]+$/, '');

            if (!urlData[cleanUrl]) {
                urlData[cleanUrl] = {
                    url: cleanUrl,
                    count: 0,
                    users: new Set(),
                    userDetails: [],
                    hashtags: new Set(),
                    tweets: []
                };
            }

            urlData[cleanUrl].count++;
            urlData[cleanUrl].users.add(username);

            // Guardar detalles del usuario si aún no está
            if (!urlData[cleanUrl].userDetails.find(u => u.username === username)) {
                urlData[cleanUrl].userDetails.push({
                    username: username,
                    name: name,
                    shareCount: 1
                });
            } else {
                const user = urlData[cleanUrl].userDetails.find(u => u.username === username);
                user.shareCount++;
            }

            // Asociar hashtags
            hashtags.forEach(ht => urlData[cleanUrl].hashtags.add(ht));

            // Guardar referencia al tweet
            urlData[cleanUrl].tweets.push({
                username: username,
                text: text.substring(0, 150),
                time: tweet.time_parsed
            });
        });
    });

    // Convertir a array y calcular métricas
    const urlList = Object.values(urlData).map(data => ({
        url: data.url,
        count: data.count,
        uniqueUsers: data.users.size,
        users: data.userDetails.sort((a, b) => b.shareCount - a.shareCount).slice(0, 10),
        hashtags: Array.from(data.hashtags).slice(0, 10),
        hasHashtags: data.hashtags.size > 0,
        tweets: data.tweets,
        // Métricas adicionales
        viralityScore: (data.count * data.users.size) / Math.max(1, data.hashtags.size || 1)
    }));

    // Ordenar por frecuencia
    urlList.sort((a, b) => b.count - a.count);

    console.log('[Worker] URLs analizadas:', urlList.length);
    if (urlList.length > 0) {
        console.log('[Worker] Top URL:', urlList[0].url, '- compartida', urlList[0].count, 'veces');
    }

    return {
        topUrls: urlList.slice(0, 50), // Top 50 URLs
        totalUrls: urlList.length,
        totalShares: urlList.reduce((sum, u) => sum + u.count, 0)
    };
};

/**
 * Listener principal del worker
 */
self.addEventListener('message', (e) => {
    const { type, data } = e.data;

    try {
        if (type === 'process') {
            const result = processTweetsData(data);
            sendResult(result);
        }
    } catch (error) {
        sendError(error);
    }
});
