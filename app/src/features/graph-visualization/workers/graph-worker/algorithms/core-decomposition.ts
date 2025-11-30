/**
 * Algoritmos de k-core decomposition y assortativity
 */

import type { Node, Edge } from '../types/graph.types';

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
export const calculateKCore = (nodes: Node[], edges: Edge[]): Record<string, number> => {
    const kcore: Record<string, number> = {};

    // Crear mapa de adyacencia (no dirigido)
    const adjacency: Record<string, Set<string>> = {};
    const degree: Record<string, number> = {};

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
    const removed = new Set<string>();
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
        const toRemove: string[] = [];
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
export const calculateCoreNumber = (nodes: Node[], edges: Edge[]): Record<string, number> => {
    const coreNumber: Record<string, number> = {};
    const adjacency: Record<string, Set<string>> = {};
    const degree: Record<string, number> = {};

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
    const processed = new Set<string>();
    let currentCore = 0;

    while (processed.size < nodes.length) {
        // Encontrar el nodo no procesado con menor grado
        let minDegree = Infinity;
        let minNode: string | null = null;

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
export const calculateAssortativity = (nodes: Node[], edges: Edge[]): number => {
    if (edges.length === 0) return 0;

    // Calcular grados
    const degree: Record<string, number> = {};
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
