/**
 * Constructor del grafo de menciones
 */

import type { Node, Edge } from '../types/graph.types';
import { calculateLouvainCommunities } from '../algorithms/community-detection';
import {
    calculateDegreeCentrality,
    calculateClusteringCoefficient,
    calculateBetweennessCentrality,
    calculateClosenessCentrality,
    calculateEigenvectorCentrality
} from '../algorithms/centrality';
import { calculateKCore, calculateCoreNumber, calculateAssortativity } from '../algorithms/core-decomposition';
import { calculatePageRank } from '../algorithms/pagerank';
import { calculateNetworkMotifs } from '../algorithms/network-motifs';
import { calculateInfluencerScores } from '../statistics/influencer-scores';
import { calculateBotScores } from '../analysis/bot-detection';
import { getTopHashtags } from './helpers';

/**
 * Construye el grafo de menciones
 */
export function buildMentionsGraph(
    mentionPairs: Array<[string, string]>,
    userStats: any,
    userTweets: any,
    usersMetadata: any = {},
    sendProgress?: (message: string, progress: number) => void
): any {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const edgeMap: Record<string, number> = {};

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
            ? tweets.sort((a: any, b: any) => b.likes - a.likes)[0]
            : null;

        // Si hay metadata enriquecida, usarla; si no, usar valores por defecto
        const nodeData: Node = {
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
            top_tweet: topTweet,
            bot_score: 0,
            influencer_score: 0
        };

        nodes.push(nodeData);
    });

    // Crear edges
    Object.entries(edgeMap).forEach(([key, weight]) => {
        const [source, target] = key.split('->');
        edges.push({ source, target, weight });
    });

    // Detectar comunidades con Louvain
    sendProgress?.('Detectando comunidades (Louvain)...', 43);
    const louvainResult = calculateLouvainCommunities(nodes, edges);

    // Asignar comunidades a nodos
    nodes.forEach(node => {
        node.community = louvainResult.communities.get(node.id) || 0;
    });

    // Calcular métricas avanzadas
    sendProgress?.('Calculando degree centrality...', 43);
    const degreeCentrality = calculateDegreeCentrality(nodes, edges);

    sendProgress?.('Calculando clustering coefficient...', 45);
    const clustering = calculateClusteringCoefficient(nodes, edges);

    sendProgress?.('Calculando betweenness centrality...', 46);
    const betweenness = calculateBetweennessCentrality(nodes, edges);

    sendProgress?.('Calculando closeness centrality...', 47);
    const closeness = calculateClosenessCentrality(nodes, edges);

    sendProgress?.('Calculando eigenvector centrality...', 52);
    const eigenvector = calculateEigenvectorCentrality(nodes, edges);

    sendProgress?.('Calculando k-core...', 54);
    const kcore = calculateKCore(nodes, edges);

    sendProgress?.('Calculando core number...', 55);
    const coreNumber = calculateCoreNumber(nodes, edges);

    // Debug: Ver distribución de core numbers
    const coreDistribution: Record<number, number> = {};
    Object.values(coreNumber).forEach((core: number) => {
        coreDistribution[core] = (coreDistribution[core] || 0) + 1;
    });
    console.log('[Worker] Core Number distribution:', coreDistribution);

    sendProgress?.('Calculando assortativity...', 56);
    const assortativity = calculateAssortativity(nodes, edges);

    sendProgress?.('Calculando PageRank...', 57);
    const pagerank = calculatePageRank(nodes, edges);

    // Verificar variación en PageRank (menciones)
    const pagerankValues = Object.values(pagerank);
    const prMin = Math.min(...pagerankValues);
    const prMax = Math.max(...pagerankValues);
    const prUnique = new Set(pagerankValues.map(v => v.toFixed(8))).size;

    console.log(`[Worker] PageRank stats: min=${prMin.toFixed(6)}, max=${prMax.toFixed(6)}, unique=${prUnique}/${nodes.length}`);

    // Añadir métricas a los nodos
    nodes.forEach(node => {
        node.pagerank = pagerank[node.id] || 0;
        node.degree_centrality = degreeCentrality[node.id] || 0;
        (node as any).clustering_coefficient = clustering[node.id] || 0;
        node.betweenness_centrality = betweenness[node.id] || 0;
        (node as any).closeness_centrality = closeness[node.id] || 0;
        (node as any).eigenvector_centrality = eigenvector[node.id] || 0;
        (node as any).kcore = kcore[node.id] || 0;
        (node as any).core_number = coreNumber[node.id] || 0;
    });

    // Calcular Influencer Scores
    sendProgress?.('Calculando Influencer Scores...', 58);
    calculateInfluencerScores(nodes);
    console.log('[Worker] Influencer scores calculados para', nodes.length, 'nodos');

    // Calcular Bot Scores
    sendProgress?.('Calculando Bot Scores...', 59);
    calculateBotScores(nodes, userTweets);
    console.log('[Worker] Bot scores calculados para', nodes.length, 'nodos');

    // Calcular Network Motifs
    sendProgress?.('Calculando patrones de red...', 65);
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
}
