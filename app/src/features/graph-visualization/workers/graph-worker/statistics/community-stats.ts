/**
 * Estadísticas de comunidades
 */

import type { Node, Edge } from '../types/graph.types';

/**
 * Calcula estadísticas detalladas para cada comunidad
 *
 * @param nodes - Nodos del grafo con community asignado
 * @param edges - Aristas del grafo
 * @param userStats - Estadísticas de usuarios
 * @param tweets - Array de tweets
 * @returns Objeto con estadísticas de comunidades
 */
export function calculateCommunityStatistics(
    nodes: Node[],
    edges: Edge[],
    userStats: any,
    tweets: any[] = []
): any {
    console.log('[Worker] calculateCommunityStatistics iniciado con', nodes.length, 'nodos');

    // Paleta de colores para comunidades
    const COMMUNITY_COLORS = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085',
        '#27ae60', '#2980b9', '#8e44ad', '#c0392b', '#d35400'
    ];

    // Agrupar nodos por comunidad
    const communitiesMap = new Map<number, Node[]>();
    nodes.forEach(node => {
        if (node.community !== undefined) {
            if (!communitiesMap.has(node.community)) {
                communitiesMap.set(node.community, []);
            }
            communitiesMap.get(node.community)!.push(node);
        }
    });

    const communities: any[] = [];
    const distribution: any = {};

    communitiesMap.forEach((members, communityId) => {
        // Calcular densidad interna
        let internalEdges = 0;
        let externalEdges = 0;

        edges.forEach(edge => {
            const sourceInCommunity = members.some(n => n.id === edge.source);
            const targetInCommunity = members.some(n => n.id === edge.target);

            if (sourceInCommunity && targetInCommunity) {
                internalEdges++;
            } else if (sourceInCommunity || targetInCommunity) {
                externalEdges++;
            }
        });

        const maxInternalEdges = (members.length * (members.length - 1)) / 2;
        const density = maxInternalEdges > 0 ? internalEdges / maxInternalEdges : 0;

        // Top usuarios por PageRank
        const topUsers = members
            .sort((a, b) => (b.pagerank || 0) - (a.pagerank || 0))
            .slice(0, 5)
            .map(n => ({
                username: n.id,
                label: n.label,
                pagerank: n.pagerank || 0
            }));

        communities.push({
            id: communityId,
            label: `Comunidad ${communityId + 1}`,
            size: members.length,
            color: COMMUNITY_COLORS[communityId % COMMUNITY_COLORS.length],
            internal_edges: internalEdges,
            external_edges: externalEdges,
            density: Math.round(density * 1000) / 1000,
            top_users: topUsers
        });

        distribution[communityId] = members.length;
    });

    // Calcular modularidad simplificada
    const modularity = 0; // Placeholder

    return {
        communities: communities.sort((a, b) => b.size - a.size),
        modularity,
        distribution
    };
}
