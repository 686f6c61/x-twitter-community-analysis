/**
 * Algoritmo de PageRank ponderado
 */

import type { Node, Edge } from '../types/graph.types';

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
export const calculatePageRank = (
    nodes: Node[],
    edges: Edge[],
    dampingFactor: number = 0.85,
    maxIterations: number = 100,
    tolerance: number = 1e-6
): Record<string, number> => {
    const n = nodes.length;
    if (n === 0) return {};

    const pagerank: Record<string, number> = {};
    const newPagerank: Record<string, number> = {};

    // Calcular peso de cada nodo basado en métricas reales
    const nodeWeight: Record<string, number> = {};
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
    const inlinks: Record<string, Array<{ nodeId: string; weight: number }>> = {}; // Quién apunta a cada nodo (con pesos)
    const outDegree: Record<string, number> = {}; // Suma de pesos salientes
    const outWeightSum: Record<string, number> = {}; // Suma total de pesos de salida

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
