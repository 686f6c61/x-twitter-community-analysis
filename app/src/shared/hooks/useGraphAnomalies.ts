import { useMemo } from 'react'
import { useGraphStore } from '@/lib/store/graphStore'

export interface GraphAnomaly {
  type: 'warning' | 'info' | 'critical'
  category: 'structure' | 'community' | 'density' | 'distribution'
  title: string
  message: string
  metric?: number
  threshold?: number
}

export interface GraphAnomaliesAnalysis {
  anomalies: GraphAnomaly[]
  graphHealth: 'healthy' | 'warning' | 'critical'
  metrics: {
    density: number
    avgDegree: number
    maxDegree: number
    communities: number
    isolatedNodes: number
    isolatedNodesPercentage: number
    giantComponentSize: number
    giantComponentPercentage: number
  }
}

export function useGraphAnomalies(graphType: 'mentions' | 'cohashtags'): GraphAnomaliesAnalysis | null {
  const mentions = useGraphStore((state) => state.mentions)
  const cohashtags = useGraphStore((state) => state.cohashtags)

  return useMemo(() => {
    const graph = graphType === 'mentions' ? mentions : cohashtags
    if (!graph || !graph.nodes || !graph.edges) return null

    const nodes = graph.nodes
    const edges = graph.edges
    const n = nodes.length
    const m = edges.length

    // Calculate basic metrics
    const density = n > 1 ? (2 * m) / (n * (n - 1)) : 0
    const avgDegree = n > 0 ? (2 * m) / n : 0

    // Calculate degree distribution
    const degrees = new Map<string, number>()
    edges.forEach((edge: any) => {
      const source = edge.from || edge.source
      const target = edge.to || edge.target
      degrees.set(source, (degrees.get(source) || 0) + 1)
      degrees.set(target, (degrees.get(target) || 0) + 1)
    })

    const maxDegree = Math.max(...Array.from(degrees.values()), 0)
    const isolatedNodes = nodes.filter(node => !degrees.has(node.id)).length
    const isolatedNodesPercentage = n > 0 ? (isolatedNodes / n) * 100 : 0

    // Count communities
    const communities = new Set(nodes.map(node => node.community)).size

    // Estimate giant component (simplified: connected nodes)
    const connectedNodes = new Set<string>()
    edges.forEach((edge: any) => {
      connectedNodes.add(edge.from || edge.source)
      connectedNodes.add(edge.to || edge.target)
    })
    const giantComponentSize = connectedNodes.size
    const giantComponentPercentage = n > 0 ? (giantComponentSize / n) * 100 : 0

    const metrics = {
      density,
      avgDegree,
      maxDegree,
      communities,
      isolatedNodes,
      isolatedNodesPercentage,
      giantComponentSize,
      giantComponentPercentage
    }

    // Detect anomalies
    const anomalies: GraphAnomaly[] = []

    // 1. Very low density (sparse graph)
    if (density < 0.01 && n > 50) {
      anomalies.push({
        type: 'warning',
        category: 'density',
        title: 'Grafo muy disperso',
        message: `La densidad del grafo es muy baja (${(density * 100).toFixed(3)}%). Esto puede indicar una red fragmentada con pocas conexiones entre nodos.`,
        metric: density,
        threshold: 0.01
      })
    }

    // 2. Very high density (complete or near-complete graph)
    if (density > 0.5 && n > 10) {
      anomalies.push({
        type: 'info',
        category: 'density',
        title: 'Grafo muy denso',
        message: `La densidad del grafo es muy alta (${(density * 100).toFixed(1)}%). Esto puede indicar una muestra muy conectada o un dataset pequeño.`,
        metric: density,
        threshold: 0.5
      })
    }

    // 3. High percentage of isolated nodes
    if (isolatedNodesPercentage > 20) {
      anomalies.push({
        type: 'warning',
        category: 'structure',
        title: 'Alta proporción de nodos aislados',
        message: `${isolatedNodesPercentage.toFixed(1)}% de los nodos están completamente aislados (sin conexiones). Esto fragmenta el grafo y limita el análisis de red.`,
        metric: isolatedNodesPercentage,
        threshold: 20
      })
    }

    // 4. Very few communities detected
    if (communities < 2 && n > 20) {
      anomalies.push({
        type: 'info',
        category: 'community',
        title: 'Pocas comunidades detectadas',
        message: `Solo se detectaron ${communities} comunidad(es). El grafo puede ser muy homogéneo o el algoritmo de detección necesita ajustes.`,
        metric: communities,
        threshold: 2
      })
    }

    // 5. Too many communities (over-fragmentation)
    if (communities > n * 0.3 && n > 20) {
      anomalies.push({
        type: 'warning',
        category: 'community',
        title: 'Fragmentación excesiva',
        message: `Se detectaron ${communities} comunidades para ${n} nodos. El grafo está muy fragmentado, lo que puede dificultar el análisis estructural.`,
        metric: communities,
        threshold: n * 0.3
      })
    }

    // 6. Small giant component (fragmented network)
    if (giantComponentPercentage < 50 && n > 30) {
      anomalies.push({
        type: 'warning',
        category: 'structure',
        title: 'Componente gigante pequeño',
        message: `Solo el ${giantComponentPercentage.toFixed(1)}% de los nodos están conectados en el componente principal. La red está muy fragmentada.`,
        metric: giantComponentPercentage,
        threshold: 50
      })
    }

    // 7. Star topology detection (hub dominance)
    const degreeVariance = calculateVariance(Array.from(degrees.values()))
    if (maxDegree > avgDegree * 5 && n > 20) {
      anomalies.push({
        type: 'info',
        category: 'distribution',
        title: 'Topología de estrella detectada',
        message: `Existe un nodo hub con ${maxDegree} conexiones (${(maxDegree / avgDegree).toFixed(1)}x el promedio). El grafo tiene una estructura de estrella con un nodo central dominante.`,
        metric: maxDegree,
        threshold: avgDegree * 5
      })
    }

    // 8. Very low average degree
    if (avgDegree < 2 && n > 20) {
      anomalies.push({
        type: 'warning',
        category: 'structure',
        title: 'Grado promedio muy bajo',
        message: `El grado promedio es ${avgDegree.toFixed(2)}. Los nodos tienen muy pocas conexiones, lo que indica una red poco cohesiva.`,
        metric: avgDegree,
        threshold: 2
      })
    }

    // Determine overall graph health
    let graphHealth: 'healthy' | 'warning' | 'critical'
    const warningCount = anomalies.filter(a => a.type === 'warning').length
    const criticalCount = anomalies.filter(a => a.type === 'critical').length

    if (criticalCount > 0 || warningCount >= 3) {
      graphHealth = 'critical'
    } else if (warningCount > 0) {
      graphHealth = 'warning'
    } else {
      graphHealth = 'healthy'
    }

    return {
      anomalies,
      graphHealth,
      metrics
    }
  }, [graphType, mentions, cohashtags])
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map(value => Math.pow(value - mean, 2))
  return squareDiffs.reduce((a, b) => a + b, 0) / values.length
}
