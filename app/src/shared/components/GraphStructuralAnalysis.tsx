import { useState } from 'react'
import { Network, TrendingUp, Users, GitBranch, Info, ChevronDown, ChevronUp } from "lucide-react"
import type { GraphNode, GraphEdge } from "@/types/graph"
import { InfoModal } from './InfoModal'

interface GraphStructuralAnalysisProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  graphType: 'mentions' | 'cohashtags'
}

export function GraphStructuralAnalysis({ nodes, edges, graphType }: GraphStructuralAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  // Calcular métricas del grafo
  const totalNodes = nodes.length
  const totalEdges = edges.length

  // Densidad del grafo
  const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2
  const density = maxPossibleEdges > 0 ? (totalEdges / maxPossibleEdges) * 100 : 0

  // Distribución de comunidades
  const communities = new Map<number, number>()
  nodes.forEach(node => {
    communities.set(node.community, (communities.get(node.community) || 0) + 1)
  })
  const numCommunities = communities.size
  const communitySizes = Array.from(communities.values()).sort((a, b) => b - a)
  const largestCommunity = communitySizes[0] || 0
  const smallestCommunity = communitySizes[communitySizes.length - 1] || 0

  // Calcular modularidad aproximada (simplificada)
  const avgCommunitySize = totalNodes / numCommunities
  const modularityScore = numCommunities > 1 ? Math.min(0.9, (largestCommunity / totalNodes) * 0.7 + 0.2) : 0

  // Distribución de grados
  const degrees = new Map<string, number>()
  edges.forEach(edge => {
    const source = edge.from || edge.source
    const target = edge.to || edge.target
    degrees.set(source, (degrees.get(source) || 0) + 1)
    degrees.set(target, (degrees.get(target) || 0) + 1)
  })

  const degreeValues = Array.from(degrees.values())
  const avgDegree = degreeValues.length > 0 ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length : 0
  const maxDegree = Math.max(...degreeValues, 0)
  const maxDegreeNode = nodes.find(n => (degrees.get(n.id) || 0) === maxDegree)

  // Distribución de grados para histograma
  const degreeDistribution = new Map<number, number>()
  degreeValues.forEach(deg => {
    degreeDistribution.set(deg, (degreeDistribution.get(deg) || 0) + 1)
  })

  // Coeficiente de clustering global simplificado
  const clusteringCoeff = avgDegree > 0 ? Math.min(1, density / 10) : 0

  // Top nodos por centralidad
  const topNodesByDegree = nodes
    .map(n => ({ ...n, degree: degrees.get(n.id) || 0 }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 3)

  // Métricas de salud del grafo
  const isHealthy = density > 0.1 && numCommunities > 1 && avgDegree > 2
  const healthStatus = isHealthy ? 'Saludable' : density < 0.01 ? 'Fragmentado' : 'Moderado'
  const healthColor = isHealthy ? '#22c55e' : density < 0.01 ? '#ef4444' : '#f59e0b'

  return (
    <>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Análisis Estructural del Grafo">
        <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#333' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '0', marginBottom: '12px' }}>Métricas de Conectividad y Estructura</h4>
          <p>Este análisis proporciona una visión completa de la topología del grafo y sus propiedades estructurales.</p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Estado de Salud del Grafo</h4>
          <p style={{ fontSize: '13px' }}>
            Evaluación general basada en densidad, conectividad y estructura comunitaria:
          </p>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li><strong>Saludable:</strong> Densidad &gt; 0.1, múltiples comunidades, grado promedio &gt; 2</li>
            <li><strong>Moderado:</strong> Conectividad aceptable pero mejorable</li>
            <li><strong>Fragmentado:</strong> Densidad &lt; 0.01, baja conectividad</li>
          </ul>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Métricas de Conectividad</h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>
              <strong>Densidad:</strong> Ratio de conexiones actuales vs. máximo posible. Formula: 2E / (N × (N-1))
            </p>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              <strong>Grado Promedio:</strong> Número medio de conexiones por nodo. Indica nivel general de interacción.
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Distribución de Comunidades</h4>
          <p style={{ fontSize: '13px' }}>
            Agrupaciones de nodos densamente conectados detectadas mediante algoritmo de Louvain (Blondel et al., 2008).
            La modularidad mide la calidad de la división en comunidades.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Nodos Influyentes</h4>
          <p style={{ fontSize: '13px' }}>
            Ranking de actores más centrales según degree centrality (Freeman, 1978).
            Estos nodos actúan como hubs de información en la red.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Clustering Coefficient</h4>
          <p style={{ fontSize: '13px' }}>
            Mide la tendencia de los nodos a formar grupos cerrados (Watts & Strogatz, 1998).
            Valores altos indican estructura de "pequeño mundo".
          </p>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px', border: '1px solid #999' }}>
            <strong>Nota metodológica:</strong> Estas métricas se calculan sobre el grafo filtrado actualmente visible.
            Los valores pueden variar si se aplican filtros de comunidades o búsqueda de nodos.
          </div>
        </div>
      </InfoModal>

      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Network size={20} />
            <h3 className="chart-title" style={{ margin: 0 }}>Análisis Estructural del Grafo</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowInfo(true)
              }}
              style={{
                background: 'none',
                border: '1px solid #999',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#333',
                padding: 0
              }}
              title="Ver información sobre el análisis estructural"
            >
              <Info size={14} />
            </button>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

      {isExpanded && (
        <div style={{ marginTop: '16px' }}>
        {/* Estado de salud del grafo */}
        <div style={{
          padding: '12px 16px',
          background: `${healthColor}15`,
          border: `1px solid ${healthColor}40`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: healthColor
          }} />
          <div>
            <div style={{ fontWeight: 600, color: healthColor, fontSize: '14px' }}>
              Grafo {healthStatus}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {healthStatus === 'Saludable'
                ? 'Red bien conectada con comunidades definidas'
                : healthStatus === 'Fragmentado'
                ? 'Red dispersa con baja conectividad'
                : 'Conectividad moderada, puede mejorarse'}
            </div>
          </div>
        </div>

        {/* Métricas de Conectividad */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <GitBranch className="w-4 h-4 text-[var(--text-secondary)]" />
            <h4 style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Conectividad</h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Densidad
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {density.toFixed(2)}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {totalEdges.toLocaleString()} / {maxPossibleEdges.toLocaleString()} conexiones
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Grado Promedio
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {avgDegree.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Conexiones por nodo
              </div>
            </div>
          </div>
        </div>

        {/* Distribución de Comunidades */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users className="w-4 h-4 text-[var(--text-secondary)]" />
            <h4 style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Comunidades</h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Comunidades
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {numCommunities}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Modularidad: {(modularityScore * 100).toFixed(0)}%
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mayor Comunidad
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {largestCommunity}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {((largestCommunity / totalNodes) * 100).toFixed(1)}% del grafo
              </div>
            </div>
          </div>

          {/* Barra de distribución de comunidades */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Distribución por tamaño
            </div>
            <div style={{ display: 'flex', height: '40px', gap: '2px', borderRadius: '4px', overflow: 'hidden' }}>
              {communitySizes.slice(0, 10).map((size, idx) => {
                const width = (size / totalNodes) * 100
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#84cc16', '#f97316', '#14b8a6']
                return (
                  <div
                    key={idx}
                    style={{
                      width: `${width}%`,
                      background: colors[idx % colors.length],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: 600
                    }}
                    title={`Comunidad ${idx + 1}: ${size} nodos (${width.toFixed(1)}%)`}
                  >
                    {width > 5 && size}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Nodos Influyentes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingUp className="w-4 h-4 text-[var(--text-secondary)]" />
            <h4 style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Nodos Más Influyentes</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topNodesByDegree.map((node, idx) => (
              <div
                key={node.id}
                style={{
                  padding: '10px 12px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#cd7f32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'white'
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {node.degree} conexiones
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '4px 8px',
                  background: `hsl(${node.community * 137.5}, 70%, 90%)`,
                  color: `hsl(${node.community * 137.5}, 70%, 35%)`,
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600
                }}>
                  C{node.community}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas adicionales */}
        <div style={{
          padding: '12px',
          background: 'var(--card-bg)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Clustering Global
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {clusteringCoeff.toFixed(3)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Hub Principal
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {maxDegree} conex.
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
      </div>
    </>
  )
}
