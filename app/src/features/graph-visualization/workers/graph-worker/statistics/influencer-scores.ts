/**
 * Cálculo de Influencer Scores
 *
 * Score compuesto que combina 6 métricas:
 * - PageRank (30%): Autoridad en la red
 * - Eigenvector Centrality (20%): Conexiones con otros nodos influyentes
 * - Betweenness Centrality (15%): Papel como puente/conector
 * - Degree Centrality (10%): Cantidad de conexiones
 * - Engagement Total (15%): Impacto medido en likes/views/replies
 * - Engagement Rate (10%): Calidad sobre cantidad
 */

import type { Node } from '../types/graph.types';

/**
 * Calcula Influencer Scores para todos los nodos
 */
export function calculateInfluencerScores(nodes: Node[]): Node[] {
    console.log('[Worker] calculateInfluencerScores llamado con', nodes.length, 'nodos');
    if (nodes.length === 0) return nodes;

    // Función helper para normalizar valores a rango 0-1
    const normalize = (value: number, min: number, max: number): number => {
        if (max === min) return 0;
        return (value - min) / (max - min);
    };

    // Extraer valores para normalización
    const pageranks = nodes.map(n => n.pagerank || 0);
    const eigenvectors = nodes.map(n => (n as any).eigenvector_centrality || 0);
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
        (node as any).engagement_rate = engagementRates[i];

        // Categorizar
        if (score >= 80) {
            (node as any).influencer_category = 'mega';
        } else if (score >= 60) {
            (node as any).influencer_category = 'macro';
        } else if (score >= 40) {
            (node as any).influencer_category = 'micro';
        } else {
            (node as any).influencer_category = 'nano';
        }
    });

    // Log de verificación
    const scoresCalculados = nodes.filter(n => n.influencer_score !== undefined).length;
    console.log('[Worker] Scores asignados a', scoresCalculados, 'nodos');
    if (nodes.length > 0) {
        console.log('[Worker] Ejemplo:', nodes[0].id, 'score:', nodes[0].influencer_score, 'category:', (nodes[0] as any).influencer_category);
    }

    return nodes;
}
