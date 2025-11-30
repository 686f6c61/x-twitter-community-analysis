/**
 * Constructor del grafo de co-hashtags
 */

import type { Node, Edge } from '../types/graph.types';
import { calculateLouvainCommunities } from '../algorithms/community-detection';
import {
    calculateDegreeCentrality,
    calculateClusteringCoefficient,
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
 * Construye el grafo de co-hashtags
 */
export function buildCohashtagsGraph(
    userHashtags: any,
    userStats: any,
    userTweets: any,
    sendProgress?: (message: string, progress: number) => void
): any {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const users = Object.keys(userHashtags);

    // Crear nodos
    users.forEach(user => {
        const stats = userStats[user] || { tweets: 0, likes: 0, views: 0, replies: 0, name: user, hashtags: [] };
        const tweets = userTweets[user] || [];

        const topTweet = tweets.length > 0
            ? tweets.sort((a: any, b: any) => b.likes - a.likes)[0]
            : null;

        const nodeData: Node = {
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
            top_tweet: topTweet,
            bot_score: 0,
            influencer_score: 0
        };

        nodes.push(nodeData);
    });

    // Crear edges (hashtags en común)
    for (let i = 0; i < users.length; i++) {
        if (i % 10 === 0 && sendProgress) {
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
    sendProgress?.('Detectando comunidades (Louvain)...', 74);
    const louvainResult = calculateLouvainCommunities(nodes, edges);

    // Asignar comunidades a nodos
    nodes.forEach(node => {
        node.community = louvainResult.communities.get(node.id) || 0;
    });

    // Calcular métricas avanzadas
    sendProgress?.('Calculando clustering coefficient...', 75);
    const clustering = calculateClusteringCoefficient(nodes, edges);

    sendProgress?.('Calculando closeness centrality...', 76);
    const closeness = calculateClosenessCentrality(nodes, edges);

    sendProgress?.('Calculando eigenvector centrality...', 77);
    const eigenvector = calculateEigenvectorCentrality(nodes, edges);

    sendProgress?.('Calculando k-core...', 78);
    const kcore = calculateKCore(nodes, edges);

    sendProgress?.('Calculando core number...', 78.5);
    const coreNumber = calculateCoreNumber(nodes, edges);

    sendProgress?.('Calculando assortativity...', 79);
    const assortativity = calculateAssortativity(nodes, edges);

    sendProgress?.('Calculando PageRank...', 79.5);
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

    console.log(`[Worker] PageRank (cohashtags) stats: min=${prMinCH.toFixed(6)}, max=${prMaxCH.toFixed(6)}, unique=${prUniqueCH}/${nodes.length}`);

    // Añadir métricas a los nodos
    nodes.forEach(node => {
        node.pagerank = pagerank[node.id] || 0;
        node.degree_centrality = degreeCentrality[node.id] || 0;
        (node as any).clustering_coefficient = clustering[node.id] || 0;
        (node as any).closeness_centrality = closeness[node.id] || 0;
        node.betweenness_centrality = 0; // No se calcula en cohashtags
        (node as any).eigenvector_centrality = eigenvector[node.id] || 0;
        (node as any).kcore = kcore[node.id] || 0;
        (node as any).core_number = coreNumber[node.id] || 0;
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
}
