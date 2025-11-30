/**
 * Cálculo de network motifs (triángulos, estrellas, cadenas)
 */

import type { Node, Edge, NetworkMotifs } from '../types/graph.types';

/**
 * Calcula Network Motifs del grafo
 *
 * Identifica y cuenta patrones estructurales importantes:
 * - Triángulos: A-B, B-C, C-A (alta cohesión local)
 * - Estrellas: Hub con múltiples conexiones (influencers/coordinadores)
 * - Cadenas: A-B-C sin A-C (información de paso)
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @param {Object} clustering - Mapa de clustering coefficients (opcional)
 * @returns {Object} - Objeto con conteos de motifs y cohesión
 */
export const calculateNetworkMotifs = (
    nodes: Node[],
    edges: Edge[],
    clustering: Record<string, number> | null = null
): NetworkMotifs & {
    density: number;
    avg_clustering: number;
    trianglesList: any[];
    starsList: any[];
    chainsList: any[];
    truncated: any
} => {
    const n = nodes.length;

    // Límites adaptativos
    let maxTriangles: number, maxStars: number, maxChains: number;
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
    const adjacency: Record<string, Set<string>> = {};
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
    const trianglesList: any[] = [];
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
    const starsList: any[] = [];

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
    const chainsList: any[] = [];

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
