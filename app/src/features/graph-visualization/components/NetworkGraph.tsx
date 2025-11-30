import { useEffect, useRef } from 'react'
import { Network } from 'vis-network/standalone'
import type { Data, Options } from 'vis-network/standalone'
import type { Node, Edge } from '@/types/graph'
import type { LayoutType, ColorMode, NodeSizeMetric, EdgeWidthMode } from '../types'

interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

interface NetworkGraphProps {
  data: GraphData
  type: 'mentions' | 'cohashtags'
  layout?: LayoutType
  colorMode?: ColorMode
  nodeSizeMetric?: NodeSizeMetric
  edgeWidthMode?: EdgeWidthMode
  searchQuery?: string
  onNodeClick?: (nodeId: string) => void
  onNodeDoubleClick?: (nodeId: string) => void
}

export function NetworkGraph({
  data,
  type,
  layout = 'forceDirected',
  colorMode = 'community',
  nodeSizeMetric = 'engagement',
  edgeWidthMode = 'uniform',
  searchQuery = '',
  onNodeClick,
  onNodeDoubleClick
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)

  useEffect(() => {
    if (!containerRef.current || !data) return

    console.log('[NetworkGraph] Rendering with layout:', layout, {
      nodesCount: data.nodes?.length,
      edgesCount: data.edges?.length,
      searchQuery,
    })

    try {

    // Calcular tamaño de nodo según métrica seleccionada
    const getNodeSize = (node: Node) => {
      let value = 0
      switch (nodeSizeMetric) {
        case 'engagement':
          value = node.engagement / 10
          break
        case 'tweets':
          value = node.tweets / 2
          break
        case 'degree':
          value = (node.degree_centrality || 0) * 50
          break
      }
      return Math.max(10, Math.min(50, value))
    }

    // Filtrar nodos según búsqueda si hay query (solo para búsqueda de texto)
    let filteredNodes = data.nodes
    let filteredEdges = data.edges

    if (searchQuery && searchQuery.trim() !== '') {
      filteredNodes = data.nodes.filter(node =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Filtrar aristas para que solo conecten nodos visibles
      const visibleNodeIds = new Set(filteredNodes.map(n => n.id))
      filteredEdges = data.edges.filter((edge: any) => {
        const from = edge.from || edge.source
        const to = edge.to || edge.target
        return visibleNodeIds.has(from) && visibleNodeIds.has(to)
      })
    }

    // Preparar datos para vis-network
    const nodes = filteredNodes.map(node => ({
      id: node.id,
      label: node.label,
      title: `${node.label}\nTweets: ${node.tweets}\nEngagement: ${node.engagement}`,
      value: node.tweets,
      group: node.community,
      // Guardar datos originales para layouts personalizados
      originalNode: node,
      // Tamaño basado en métrica seleccionada
      size: getNodeSize(node),
      font: {
        size: Math.max(12, Math.min(20, node.tweets / 2)),
      },
    }))

    // Calcular ancho de arista según peso
    const maxWeight = filteredEdges.length > 0
      ? Math.max(...filteredEdges.map((e: any) => e.weight))
      : 1
    const minWeight = filteredEdges.length > 0
      ? Math.min(...filteredEdges.map((e: any) => e.weight))
      : 1

    const edges = filteredEdges.map((edge: any) => {
      let width = 2 // ancho por defecto

      if (edgeWidthMode === 'weighted' && maxWeight > minWeight) {
        // Normalizar peso a rango 1-8
        const normalized = (edge.weight - minWeight) / (maxWeight - minWeight)
        width = 1 + (normalized * 7)
      }

      return {
        from: edge.from || edge.source,
        to: edge.to || edge.target,
        value: edge.weight,
        width,
        title: `Peso: ${edge.weight}`,
      }
    })

    // Aplicar colores según modo seleccionado
    const communityColors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    ]

    // Función para obtener color según centralidad (gradiente de azul a rojo)
    const getCentralityColor = (centrality: number) => {
      // Interpolar entre azul (#3b82f6) y rojo (#ef4444)
      const r = Math.round(59 + (239 - 59) * centrality)
      const g = Math.round(130 + (68 - 130) * centrality)
      const b = Math.round(246 + (68 - 246) * centrality)
      return `rgb(${r}, ${g}, ${b})`
    }

    // Función para obtener color según engagement (gradiente de verde a amarillo)
    const getEngagementColor = (engagement: number, maxEngagement: number) => {
      const normalized = engagement / maxEngagement
      const r = Math.round(34 + (234 - 34) * normalized)
      const g = Math.round(197 + (179 - 197) * normalized)
      const b = Math.round(94 + (8 - 94) * normalized)
      return `rgb(${r}, ${g}, ${b})`
    }

    const maxEngagement = Math.max(...filteredNodes.map(n => n.engagement))

    nodes.forEach(node => {
      const originalNode = filteredNodes.find(n => n.id === node.id)!
      let backgroundColor = '#999'

      // Aplicar color según modo
      switch (colorMode) {
        case 'community':
          backgroundColor = communityColors[originalNode.community % communityColors.length]
          break
        case 'centrality':
          // Usar eigenvector_centrality o degree_centrality como fallback
          const centrality = originalNode.eigenvector_centrality || originalNode.degree_centrality || 0
          backgroundColor = getCentralityColor(centrality)
          break
        case 'engagement':
          backgroundColor = getEngagementColor(originalNode.engagement, maxEngagement)
          break
      }

      node.color = {
        background: backgroundColor,
        border: '#2B7CE9',
        highlight: {
          background: '#FFA500',
          border: '#FF8C00',
        },
        hover: {
          background: '#D2E5FF',
          border: '#0066cc',
        },
      }
    })

    // Aplicar posiciones SOLO para layouts personalizados (radial, community, bipartite, hierarchical)
    // Layouts automáticos (forceDirected, circular) son manejados por vis-network
    if (layout === 'radial' || layout === 'community' || layout === 'bipartite' || layout === 'hierarchical') {
      applyLayoutPositions(nodes, edges, layout, data.nodes)
    }

    const visData: Data = {
      nodes,
      edges,
    }

    console.log('[NetworkGraph] Nodes to render:', nodes.length, 'Edges:', edges.length)
    console.log('[NetworkGraph] First 5 nodes:', nodes.slice(0, 5).map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y })))

    // Configurar opciones según el layout
    const options: Options = getLayoutOptions(layout, type)

    console.log('[NetworkGraph] Layout options:', JSON.stringify(options.layout, null, 2))

    // Crear red
    networkRef.current = new Network(containerRef.current, visData, options)

    console.log('[NetworkGraph] Network created successfully')

    // Para co-hashtags con force-directed: deshabilitar física después de estabilización
    if (type === 'cohashtags' && layout === 'forceDirected') {
      networkRef.current.once('stabilizationIterationsDone', () => {
        console.log('[NetworkGraph] Co-hashtags graph stabilized, disabling physics')
        networkRef.current?.setOptions({ physics: { enabled: false } })
      })
    }

    // Event listeners
    if (onNodeClick) {
      networkRef.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          onNodeClick(params.nodes[0] as string)
        }
      })
    }

    if (onNodeDoubleClick) {
      networkRef.current.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          onNodeDoubleClick(params.nodes[0] as string)
        }
      })
    }

    } catch (error) {
      console.error('[NetworkGraph] Error rendering graph:', error)
      console.error('[NetworkGraph] Stack:', error.stack)
    }

    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }
    }
  }, [data, type, layout, colorMode, nodeSizeMetric, edgeWidthMode, searchQuery, onNodeClick, onNodeDoubleClick])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

/**
 * Aplica posiciones a los nodos según el layout seleccionado
 */
function applyLayoutPositions(nodes: any[], edges: any[], layout: LayoutType, originalNodes: Node[]) {
  switch (layout) {
    case 'radial':
      applyRadialLayout(nodes, originalNodes)
      break
    case 'community':
      applyCommunityLayout(nodes, originalNodes)
      break
    case 'bipartite':
      applyBipartiteLayout(nodes, edges)
      break
    case 'hierarchical':
      applyHierarchicalLayout(nodes, originalNodes)
      break
    // Para forceDirected y circular, vis-network lo maneja automáticamente
    default:
      break
  }
}

/**
 * Layout Jerárquico: Organiza nodos por niveles según centralidad
 * Los nodos más centrales/importantes arriba, menos importantes abajo
 * Agrupa por comunidades dentro de cada nivel para mantener estructura
 */
function applyHierarchicalLayout(nodes: any[], originalNodes: Node[]) {
  console.log('[Layout] Applying custom Hierarchical layout')

  // Clasificar nodos por centralidad en niveles
  const sortedNodes = nodes.map(node => {
    const originalNode = originalNodes.find(n => n.id === node.id)!
    const centrality = originalNode.eigenvector_centrality || originalNode.degree_centrality || 0
    return { node, centrality, community: originalNode.community }
  }).sort((a, b) => b.centrality - a.centrality)

  // Definir 4 niveles de importancia
  const numLevels = 4
  const levels: any[][] = [[], [], [], []]

  // Top 10%: Nivel 0 (núcleo, más importantes)
  // 10-30%: Nivel 1 (influyentes)
  // 30-70%: Nivel 2 (activos)
  // 70-100%: Nivel 3 (periféricos)
  const thresholds = [0.1, 0.3, 0.7, 1.0]

  sortedNodes.forEach((item, index) => {
    const percentile = index / sortedNodes.length
    let level = 0
    for (let i = 0; i < thresholds.length; i++) {
      if (percentile < thresholds[i]) {
        level = i
        break
      }
    }
    levels[level].push(item)
  })

  // Posicionar cada nivel
  const levelHeight = 350
  const startY = -500

  levels.forEach((levelNodes, levelIndex) => {
    const y = startY + (levelIndex * levelHeight)

    // Agrupar por comunidades dentro del nivel
    const communities = new Map<number, any[]>()
    levelNodes.forEach(item => {
      if (!communities.has(item.community)) {
        communities.set(item.community, [])
      }
      communities.get(item.community)!.push(item.node)
    })

    // Distribuir comunidades horizontalmente
    const numCommunities = communities.size
    const communityWidth = Math.max(2000, numCommunities * 400)
    let communityIndex = 0

    communities.forEach((communityNodes, communityId) => {
      // Centro de esta comunidad en X
      const communityX = -communityWidth / 2 + (communityIndex + 0.5) * (communityWidth / numCommunities)

      // Radio del cluster según tamaño
      const clusterRadius = Math.min(150, 50 + Math.sqrt(communityNodes.length) * 20)

      // Distribuir nodos en círculo dentro de la comunidad
      communityNodes.forEach((node, nodeIndex) => {
        const angle = (nodeIndex / communityNodes.length) * 2 * Math.PI
        node.x = communityX + Math.cos(angle) * clusterRadius
        node.y = y + Math.sin(angle) * clusterRadius
        node.fixed = { x: true, y: true }
        node.level = levelIndex
      })

      communityIndex++
    })
  })

  console.log('[Layout] Hierarchical layout applied:', {
    levels: numLevels,
    levelSizes: levels.map(l => l.length),
    totalNodes: nodes.length
  })
}

/**
 * Layout Radial: Nodos centrales en el centro, periféricos fuera
 * Usa eigenvector_centrality como métrica principal
 */
function applyRadialLayout(nodes: any[], originalNodes: Node[]) {
  console.log('[Layout] Applying Radial layout')

  const maxRadius = 1000
  const minRadius = 100

  nodes.forEach(node => {
    const originalNode = originalNodes.find(n => n.id === node.id)
    if (!originalNode) return

    // Usar eigenvector_centrality o degree_centrality como fallback
    const centrality = originalNode.eigenvector_centrality || originalNode.degree_centrality || 0

    // Invertir: centralidad alta = radio pequeño (cerca del centro)
    const radius = maxRadius - (centrality * (maxRadius - minRadius))

    // Distribuir nodos uniformemente en círculos concéntricos
    const nodeIndex = nodes.indexOf(node)
    const angle = (nodeIndex / nodes.length) * 2 * Math.PI

    node.x = Math.cos(angle) * radius
    node.y = Math.sin(angle) * radius
    node.fixed = { x: true, y: true }
  })
}

/**
 * Layout por Comunidades: Agrupa nodos de la misma comunidad
 */
function applyCommunityLayout(nodes: any[], originalNodes: Node[]) {
  console.log('[Layout] Applying Community layout')

  // Agrupar nodos por comunidad
  const communities = new Map<number, any[]>()
  nodes.forEach(node => {
    const originalNode = originalNodes.find(n => n.id === node.id)
    const community = originalNode?.community || 0

    if (!communities.has(community)) {
      communities.set(community, [])
    }
    communities.get(community)!.push(node)
  })

  const numCommunities = communities.size

  // Si hay pocas comunidades, usar layout en grid
  if (numCommunities <= 4) {
    const cols = Math.ceil(Math.sqrt(numCommunities))
    const spacing = 1200
    let communityIndex = 0

    communities.forEach((communityNodes, communityId) => {
      const row = Math.floor(communityIndex / cols)
      const col = communityIndex % cols
      const communityCenterX = (col - cols / 2) * spacing
      const communityCenterY = (row - 1) * spacing

      // Radio del cluster basado en tamaño de la comunidad
      const communityRadius = Math.min(400, 150 + Math.sqrt(communityNodes.length) * 30)

      communityNodes.forEach((node, index) => {
        const angle = (index / communityNodes.length) * 2 * Math.PI
        node.x = communityCenterX + Math.cos(angle) * communityRadius
        node.y = communityCenterY + Math.sin(angle) * communityRadius
        node.fixed = { x: true, y: true }
      })

      communityIndex++
    })
  } else {
    // Muchas comunidades: distribución circular
    const mainRadius = Math.max(1000, numCommunities * 80)
    let communityIndex = 0

    communities.forEach((communityNodes, communityId) => {
      const communityAngle = (communityIndex / numCommunities) * 2 * Math.PI
      const communityCenterX = Math.cos(communityAngle) * mainRadius
      const communityCenterY = Math.sin(communityAngle) * mainRadius

      // Radio adaptativo según tamaño de comunidad
      const communityRadius = Math.min(350, 120 + Math.sqrt(communityNodes.length) * 25)

      communityNodes.forEach((node, index) => {
        const angle = (index / communityNodes.length) * 2 * Math.PI
        node.x = communityCenterX + Math.cos(angle) * communityRadius
        node.y = communityCenterY + Math.sin(angle) * communityRadius
        node.fixed = { x: true, y: true }
      })

      communityIndex++
    })
  }
}

/**
 * Layout Bipartito: Dos niveles de nodos (útil para co-hashtags)
 * Separa hashtags principales (más conectados) de secundarios
 */
function applyBipartiteLayout(nodes: any[], edges: any[]) {
  console.log('[Layout] Applying Bipartite layout')

  // Calcular grado de cada nodo
  const degrees = new Map<string, number>()
  nodes.forEach(node => degrees.set(node.id, 0))

  edges.forEach(edge => {
    degrees.set(edge.from, (degrees.get(edge.from) || 0) + 1)
    degrees.set(edge.to, (degrees.get(edge.to) || 0) + 1)
  })

  // Separar en dos grupos: top 30% (principales) y resto (secundarios)
  const sortedNodes = [...nodes].sort((a, b) => {
    const degA = degrees.get(a.id) || 0
    const degB = degrees.get(b.id) || 0
    return degB - degA
  })

  const threshold = Math.floor(nodes.length * 0.3)
  const topNodes = sortedNodes.slice(0, threshold)
  const bottomNodes = sortedNodes.slice(threshold)

  // Posicionar nivel superior (principales)
  const topY = -400
  const topSpacing = 1200 / (topNodes.length + 1)
  topNodes.forEach((node, index) => {
    node.x = -600 + topSpacing * (index + 1)
    node.y = topY
    node.fixed = { x: true, y: true }
  })

  // Posicionar nivel inferior (secundarios)
  const bottomY = 400
  const bottomSpacing = 1200 / (bottomNodes.length + 1)
  bottomNodes.forEach((node, index) => {
    node.x = -600 + bottomSpacing * (index + 1)
    node.y = bottomY
    node.fixed = { x: true, y: true }
  })
}

/**
 * Obtiene las opciones de vis-network según el layout
 */
function getLayoutOptions(layout: LayoutType, graphType: 'mentions' | 'cohashtags'): Options {
  const baseOptions: Options = {
    nodes: {
      shape: 'dot',
      borderWidth: 2,
      borderWidthSelected: 4,
      font: {
        color: '#343a40',
        face: 'system-ui, -apple-system, sans-serif',
      },
      scaling: {
        min: 10,
        max: 50,
      },
    },
    edges: {
      width: 2,
      color: {
        color: '#848484',
        highlight: '#0066cc',
        hover: '#0066cc',
      },
      smooth: {
        enabled: true,
        type: 'dynamic',
      },
      arrows: {
        to: {
          enabled: false,
        },
      },
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      navigationButtons: true,
      keyboard: true,
      zoomView: true,
      dragView: true,
    },
  }

  // Configurar layout y física según el tipo
  switch (layout) {
    case 'forceDirected':
      return {
        ...baseOptions,
        physics: graphType === 'cohashtags' ? {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 500,
            updateInterval: 25,
            onlyDynamicEdges: false,
            fit: true,
          },
          barnesHut: {
            gravitationalConstant: -10000,
            centralGravity: 0.5,
            springLength: 120,
            springConstant: 0.02,
            damping: 0.15,
            avoidOverlap: 0.3,
          },
          timestep: 0.35,
        } : {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 200,
            updateInterval: 25,
          },
          barnesHut: {
            gravitationalConstant: -8000,
            centralGravity: 0.3,
            springLength: 150,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0.2,
          },
        },
        layout: {
          improvedLayout: false,
        },
      }

    case 'hierarchical':
      // Layout personalizado con posiciones fijas
      return {
        ...baseOptions,
        physics: {
          enabled: false, // Desactivar física para mantener posiciones fijas
        },
        layout: {
          randomSeed: undefined,
        },
        edges: {
          ...baseOptions.edges,
          smooth: {
            enabled: true,
            type: 'continuous',
          },
        },
      }

    case 'circular':
      return {
        ...baseOptions,
        layout: {
          randomSeed: 42, // Para consistencia
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 100,
          },
          barnesHut: {
            gravitationalConstant: 0,
            centralGravity: 0,
            springLength: 200,
            springConstant: 0.05,
          },
        },
      }

    case 'radial':
    case 'community':
    case 'bipartite':
      // Layouts personalizados con posiciones fijas
      return {
        ...baseOptions,
        physics: {
          enabled: false, // Desactivar física para mantener posiciones fijas
        },
        layout: {
          randomSeed: undefined,
        },
      }

    default:
      return baseOptions
  }
}
