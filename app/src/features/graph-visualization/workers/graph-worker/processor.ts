/**
 * Procesador principal de tweets
 * Orquesta la construcción de grafos y el cálculo de todas las estadísticas
 */

import { buildMentionsGraph } from './graph-builders/mentions-graph';
import { buildCohashtagsGraph } from './graph-builders/cohashtags-graph';
import { calculateStats } from './statistics/general-stats';
import { extractWordFrequencies } from './analysis/text-processing';
import { analyzeSharedUrls } from './analysis/url-analysis';
import { calculateCommunityStatistics } from './statistics/community-stats';
import { calculateUserStatistics } from './statistics/user-stats';

/**
 * Procesa el JSON de tweets y construye estructuras de datos
 */
export function processTweetsData(
    data: any,
    sendProgress?: (message: string, progress: number) => void
): any {
    console.time('[Worker] Total processing time');
    sendProgress?.('Extrayendo datos de tweets...', 10);

    const tweets = data.tweets || [];
    const usersMetadata = data.users_metadata || {}; // Metadata enriquecida de usuarios (users_metadata = enriched_users)
    const enrichmentInfo = data.enrichment_info || null;

    // Log si hay enriquecimiento
    if (enrichmentInfo) {
        console.log(`[Worker] 📊 Dataset enriquecido: ${enrichmentInfo.users_enriched}/${enrichmentInfo.total_users} usuarios`);
    }

    const userStats: any = {};
    const mentionPairs: Array<[string, string]> = [];
    const userHashtags: Record<string, Record<string, number>> = {};
    const allHashtags: string[] = [];
    const tweetTimes: string[] = [];
    const userTweets: Record<string, any[]> = {};

    tweets.forEach((item: any, index: number) => {
        // Progreso cada 100 tweets
        if (index % 100 === 0 && sendProgress) {
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
        hashtags.forEach((tag: string) => {
            allHashtags.push(tag);
            userStats[username].hashtags.push(tag);
            userHashtags[username][tag] = (userHashtags[username][tag] || 0) + 1;
        });

        // Menciones
        const mentions = tweet.mentions || [];
        mentions.forEach((mention: any) => {
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
    sendProgress?.('Construyendo grafo de menciones...', 40);
    const mentionsGraph = buildMentionsGraph(mentionPairs, userStats, userTweets, usersMetadata, sendProgress);
    console.timeEnd('[Worker] Build mentions graph');

    console.time('[Worker] Build cohashtags graph');
    sendProgress?.('Construyendo grafo de co-hashtags...', 60);
    const cohashtagsGraph = buildCohashtagsGraph(userHashtags, userStats, userTweets, sendProgress);
    console.timeEnd('[Worker] Build cohashtags graph');

    console.time('[Worker] Calculate statistics');
    sendProgress?.('Calculando estadísticas...', 80);
    const statistics = calculateStats(userStats, allHashtags, tweetTimes, tweets, usersMetadata);
    console.timeEnd('[Worker] Calculate statistics');

    console.time('[Worker] Extract word frequencies');
    sendProgress?.('Analizando frecuencias de palabras...', 90);
    const wordFrequencies = extractWordFrequencies(tweets);
    console.timeEnd('[Worker] Extract word frequencies');

    console.time('[Worker] Analyze URLs');
    sendProgress?.('Analizando URLs compartidas...', 95);
    const urlAnalysis = analyzeSharedUrls(tweets);
    console.timeEnd('[Worker] Analyze URLs');

    sendProgress?.('Finalizando...', 98);

    // Calcular datos detallados de comunidades
    sendProgress?.('Calculando estadísticas de comunidades...', 85);
    const communitiesData = calculateCommunityStatistics(mentionsGraph.nodes, mentionsGraph.edges, userStats, tweets);

    // Calcular estadísticas de usuarios si hay users_metadata (enriched users)
    // Pasar solo usuarios que son AUTORES de tweets (no solo mencionados)
    const authorUsernames = new Set(Object.keys(userStats));
    const userStatistics = calculateUserStatistics(usersMetadata, authorUsernames);

    // Enriquecer statistics con datos de los grafos y análisis adicionales
    const enrichedStatistics = {
        ...statistics,
        // Mentions graph stats
        nodes: mentionsGraph.nodes.length,
        edges: mentionsGraph.edges.length,
        density: mentionsGraph.edges.length / (mentionsGraph.nodes.length * (mentionsGraph.nodes.length - 1) || 1),
        avg_degree: mentionsGraph.edges.length * 2 / (mentionsGraph.nodes.length || 1),
        word_frequencies: wordFrequencies,
        total_engagement: statistics.top_engagement_users.reduce((sum: number, u: any) => sum + u.engagement, 0),
        avg_engagement: statistics.top_engagement_users.length > 0
            ? statistics.top_engagement_users.reduce((sum: number, u: any) => sum + u.engagement, 0) / statistics.top_engagement_users.length
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
}
