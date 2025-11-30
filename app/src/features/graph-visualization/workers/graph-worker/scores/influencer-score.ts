/**
 * Cálculo de Influencer Score
 */

import type { Node } from '../types/graph.types';
import { normalize } from '../utils/math-utils';

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
export const calculateInfluencerScores = (nodes: Node[]): Node[] => {
    console.log('[Worker] calculateInfluencerScores llamado con', nodes.length, 'nodos');
    if (nodes.length === 0) return nodes;

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
};
