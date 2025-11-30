/**
 * Utilidades para construcción y manipulación de grafos
 */

export interface AdjacencyMap {
  [nodeId: string]: Set<string>;
}

export interface WeightedAdjacencyMap {
  [nodeId: string]: Map<string, number>;
}

/**
 * Construye un mapa de adyacencia no dirigido desde nodos y aristas
 */
export function buildAdjacencyMap(nodes: any[], edges: any[]): AdjacencyMap {
  const adjacency: AdjacencyMap = {};

  nodes.forEach(node => {
    adjacency[node.id] = new Set();
  });

  edges.forEach(edge => {
    if (adjacency[edge.source]) {
      adjacency[edge.source].add(edge.target);
    }
    if (adjacency[edge.target]) {
      adjacency[edge.target].add(edge.source);
    }
  });

  return adjacency;
}

/**
 * Construye un mapa de adyacencia ponderado
 */
export function buildWeightedAdjacencyMap(nodes: any[], edges: any[]): WeightedAdjacencyMap {
  const adjacency: WeightedAdjacencyMap = {};

  nodes.forEach(node => {
    adjacency[node.id] = new Map();
  });

  edges.forEach(edge => {
    const weight = edge.weight || 1;
    if (!adjacency[edge.source]) adjacency[edge.source] = new Map();
    if (!adjacency[edge.target]) adjacency[edge.target] = new Map();

    adjacency[edge.source].set(edge.target, weight);
    adjacency[edge.target].set(edge.source, weight);
  });

  return adjacency;
}

/**
 * Obtiene los vecinos de un nodo
 */
export function getNeighbors(nodeId: string, adjacency: AdjacencyMap): string[] {
  return Array.from(adjacency[nodeId] || []);
}

/**
 * Calcula el grado de cada nodo
 */
export function calculateDegrees(nodes: any[], edges: any[]): Record<string, number> {
  const degree: Record<string, number> = {};

  nodes.forEach(node => {
    degree[node.id] = 0;
  });

  edges.forEach(edge => {
    degree[edge.source] = (degree[edge.source] || 0) + 1;
    degree[edge.target] = (degree[edge.target] || 0) + 1;
  });

  return degree;
}
