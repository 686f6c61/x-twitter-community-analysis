/**
 * Algoritmos de detección de comunidades
 */

import type { Node, Edge } from '../types/graph.types';

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
export const calculateLouvainCommunities = (nodes: Node[], edges: Edge[]): {
    communities: Map<string, number>;
    modularity: number;
    sizes: number[];
} => {
    if (nodes.length === 0) {
        return { communities: new Map(), modularity: 0, sizes: [] };
    }

    // Construir mapa de adyacencia
    const adjacency = new Map<string, Map<string, number>>();
    const nodeSet = new Set(nodes.map(n => n.id));

    Array.from(nodeSet).forEach(id => adjacency.set(id, new Map()));

    edges.forEach(edge => {
        const weight = edge.weight || 1;
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Map());
        if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Map());
        adjacency.get(edge.source)!.set(edge.target, weight);
        adjacency.get(edge.target)!.set(edge.source, weight);
    });

    // Calcular grados
    const degree = new Map<string, number>();
    Array.from(nodeSet).forEach(id => {
        let sum = 0;
        adjacency.get(id)!.forEach(w => sum += w);
        degree.set(id, sum);
    });

    const m = edges.reduce((sum, e) => sum + (e.weight || 1), 0);
    if (m === 0) {
        const firstNode = Array.from(nodeSet)[0];
        const map = new Map();
        map.set(firstNode, 0);
        return { communities: map, modularity: 0, sizes: [nodeSet.size] };
    }

    // Union-Find para componentes conectados
    const parent = new Map<string, string>();
    const rank = new Map<string, number>();

    Array.from(nodeSet).forEach(id => {
        parent.set(id, id);
        rank.set(id, 0);
    });

    const find = (x: string): string => {
        if (parent.get(x) !== x) {
            parent.set(x, find(parent.get(x)!));
        }
        return parent.get(x)!;
    };

    const union = (x: string, y: string): void => {
        const rootX = find(x);
        const rootY = find(y);

        if (rootX === rootY) return;

        if (rank.get(rootX)! < rank.get(rootY)!) {
            parent.set(rootX, rootY);
        } else if (rank.get(rootX)! > rank.get(rootY)!) {
            parent.set(rootY, rootX);
        } else {
            parent.set(rootY, rootX);
            rank.set(rootX, rank.get(rootX)! + 1);
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
    const communities = new Map<string, number>();
    const communityGroups = new Map<string, string[]>();

    Array.from(nodeSet).forEach(id => {
        const root = find(id);
        if (!communityGroups.has(root)) {
            communityGroups.set(root, []);
        }
        communityGroups.get(root)!.push(id);
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
 * Detecta echo chambers basándose en comunidades
 *
 * @param {Array} nodes - Nodos con community asignada
 * @param {Array} edges - Aristas del grafo
 * @param {Array} tweets - Tweets para análisis de sentimiento
 * @returns {Array} - Lista de echo chambers detectadas
 */
export const detectEchoChambers = (nodes: Node[], edges: Edge[], tweets: any[]): any[] => {
    // Agrupar nodos por comunidad
    const communities = new Map<number, string[]>();
    nodes.forEach(node => {
        if (node.community !== undefined) {
            if (!communities.has(node.community)) {
                communities.set(node.community, []);
            }
            communities.get(node.community)!.push(node.id);
        }
    });

    const echoChambers: any[] = [];

    communities.forEach((members, communityId) => {
        if (members.length < 5) return; // Ignorar comunidades muy pequeñas

        // Calcular densidad interna
        let internalEdges = 0;
        let externalEdges = 0;

        edges.forEach(edge => {
            const sourceInCommunity = members.includes(edge.source);
            const targetInCommunity = members.includes(edge.target);

            if (sourceInCommunity && targetInCommunity) {
                internalEdges++;
            } else if (sourceInCommunity || targetInCommunity) {
                externalEdges++;
            }
        });

        const maxInternalEdges = (members.length * (members.length - 1)) / 2;
        const density = maxInternalEdges > 0 ? internalEdges / maxInternalEdges : 0;

        // Calcular isolation score
        const totalEdges = internalEdges + externalEdges;
        const isolationScore = totalEdges > 0 ? internalEdges / totalEdges : 0;

        // Solo considerar echo chamber si tiene alta densidad y aislamiento
        if (density > 0.3 && isolationScore > 0.7) {
            // Top usuarios por PageRank
            const communityNodes = nodes.filter(n => n.community === communityId);
            const topUsers = communityNodes
                .sort((a, b) => (b.pagerank || 0) - (a.pagerank || 0))
                .slice(0, 5)
                .map(n => n.id);

            echoChambers.push({
                community_id: communityId,
                size: members.length,
                density: Math.round(density * 1000) / 1000,
                internal_edges: internalEdges,
                external_edges: externalEdges,
                isolation_score: Math.round(isolationScore * 1000) / 1000,
                sentiment_homogeneity: 0, // Placeholder
                avg_sentiment: 0, // Placeholder
                top_users: topUsers
            });
        }
    });

    console.log(`[Worker] Detectadas ${echoChambers.length} echo chambers`);
    return echoChambers;
};
