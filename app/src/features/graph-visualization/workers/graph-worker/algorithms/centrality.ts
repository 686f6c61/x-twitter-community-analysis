/**
 * Algoritmos de cálculo de centralidad para grafos
 */

import type { Node, Edge } from '../types/graph.types';

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
export const calculateDegreeCentrality = (nodes: Node[], edges: Edge[]): Record<string, number> => {
    const degree: Record<string, number> = {};
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
 * Calcula Clustering Coefficient para cada nodo
 *
 * El clustering coefficient mide qué tan conectados están los vecinos de un nodo.
 * Valor alto indica que los vecinos tienden a formar triángulos.
 *
 * @param {Array} nodes - Lista de nodos
 * @param {Array} edges - Lista de aristas
 * @returns {Object} - Mapa de nodeId -> clustering coefficient
 */
export const calculateClusteringCoefficient = (nodes: Node[], edges: Edge[]): Record<string, number> => {
    const clustering: Record<string, number> = {};

    // Crear mapa de adyacencia
    const adjacency: Record<string, Set<string>> = {};
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
export const calculateClosenessCentrality = (nodes: Node[], edges: Edge[]): Record<string, number> => {
    const closeness: Record<string, number> = {};
    const n = nodes.length;

    if (n <= 1) {
        nodes.forEach(node => {
            closeness[node.id] = 0;
        });
        return closeness;
    }

    // Crear mapa de adyacencia (no dirigido para closeness)
    const adjacency: Record<string, string[]> = {};
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
        const distances: Record<string, number> = {};
        const queue = [startNode.id];
        distances[startNode.id] = 0;

        while (queue.length > 0) {
            const current = queue.shift()!;
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
export const calculateEigenvectorCentrality = (nodes: Node[], edges: Edge[], maxIter: number = 100): Record<string, number> => {
    const eigenvector: Record<string, number> = {};

    // Inicializar con 1/n
    nodes.forEach(node => {
        eigenvector[node.id] = 1 / nodes.length;
    });

    // Crear mapa de adyacencia (no dirigido)
    const adjacency: Record<string, string[]> = {};
    nodes.forEach(node => {
        adjacency[node.id] = [];
    });

    edges.forEach(edge => {
        adjacency[edge.source].push(edge.target);
        adjacency[edge.target].push(edge.source);
    });

    // Método de potencias iterativo
    for (let iter = 0; iter < maxIter; iter++) {
        const newEigenvector: Record<string, number> = {};

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
export const calculateBetweennessCentrality = (nodes: Node[], edges: Edge[]): Record<string, number> => {
    const betweenness: Record<string, number> = {};
    const n = nodes.length;

    // Inicializar
    nodes.forEach(node => {
        betweenness[node.id] = 0;
    });

    // Crear mapa de adyacencia (no dirigido)
    const adjacency: Record<string, Set<string>> = {};
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
    let sourceNodes: Node[];
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
        const stack: string[] = [];
        const paths: Record<string, number> = {}; // Número de caminos más cortos desde source
        const distance: Record<string, number> = {}; // Distancia desde source
        const predecessors: Record<string, string[]> = {}; // Predecesores en caminos más cortos
        const delta: Record<string, number> = {}; // Acumulador de dependencias

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
            const v = queue.shift()!;
            stack.push(v);

            adjacency[v].forEach(w => {
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
            });
        }

        // Acumulación - procesar nodos en orden inverso de distancia
        while (stack.length > 0) {
            const w = stack.pop()!;
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
