import { useState, useMemo, useEffect, useRef } from 'react'
import { useGraphStore } from '@/lib/store/graphStore'
import type { Node } from '@/types/graph'
import { Chart, registerables } from 'chart.js'
import { calculateInfluenceMetrics } from '@/lib/utils/influenceMetrics'

Chart.register(...registerables)

interface InfluencerNode extends Node {
  influence_score: number
  influence_category: string
  pagerank?: number
  engagement?: number
  engagement_rate?: number
  top_tweet?: {
    text: string
    likes: number
    views: number
    replies: number
    url?: string
  }
}

const COMMUNITY_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
]

const formatNumber = (num?: number) => {
  if (!num && num !== 0) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function InfluencersPage() {
  const mentions = useGraphStore((state) => state.mentions)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [communityFilter, setCommunityFilter] = useState('all')
  const [displayLimit, setDisplayLimit] = useState(20)
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerNode | null>(null)
  const [showChartInfo, setShowChartInfo] = useState(false)
  const [showPageRankChartInfo, setShowPageRankChartInfo] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const pageRankChartRef = useRef<HTMLCanvasElement>(null)
  const pageRankChartInstance = useRef<Chart | null>(null)

  // Get all influencers - FORZAR CÁLCULO AQUÍ
  const allInfluencers = useMemo(() => {
    if (!mentions?.nodes || mentions.nodes.length === 0) return []

    console.log('[InfluencersPage] FORZANDO recálculo de influence metrics')
    console.log('[InfluencersPage] Sample node ANTES:', mentions.nodes[0])

    // FORZAR recálculo de métricas SIEMPRE
    const nodesWithInfluence = calculateInfluenceMetrics(mentions.nodes)

    console.log(`[InfluencersPage] Nodos con métricas: ${nodesWithInfluence.length}`)
    console.log('[InfluencersPage] Sample node DESPUÉS:', nodesWithInfluence[0])
    console.log(`[InfluencersPage] Primer nodo: score=${nodesWithInfluence[0]?.influence_score}, category=${nodesWithInfluence[0]?.influence_category}`)

    // Convertir a InfluencerNode y ordenar
    const influencers = nodesWithInfluence
      .filter((node): node is InfluencerNode =>
        node.influence_score !== undefined &&
        node.influence_category !== undefined
      )
      .sort((a, b) => b.influence_score - a.influence_score)

    return influencers
  }, [mentions])

  // Filter influencers
  const filteredInfluencers = useMemo(() => {
    let result = [...allInfluencers]
    if (categoryFilter !== 'all') {
      result = result.filter(n => n.influence_category === categoryFilter)
    }
    if (communityFilter !== 'all') {
      const commId = parseInt(communityFilter)
      result = result.filter(n => n.community === commId)
    }
    return result
  }, [allInfluencers, categoryFilter, communityFilter])

  const displayedInfluencers = filteredInfluencers.slice(0, displayLimit)
  const hasMore = displayLimit < filteredInfluencers.length

  const availableCommunities = useMemo(() => {
    if (!mentions?.nodes) return []
    return [...new Set(mentions.nodes.map(n => n.community))].sort((a, b) => a - b)
  }, [mentions])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mega': return '#ef4444'
      case 'macro': return '#f97316'
      case 'micro': return '#3b82f6'
      case 'nano': return '#6b7280'
      default: return '#9ca3af'
    }
  }

  const selectedRank = selectedInfluencer
    ? allInfluencers.findIndex(o => o.id === selectedInfluencer.id) + 1
    : 0

  // Create scatter chart
  useEffect(() => {
    if (!chartRef.current || filteredInfluencers.length === 0) return

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Group by category
    const categoriesData: Record<string, { x: number; y: number; label: string }[]> = {
      mega: [],
      macro: [],
      micro: [],
      nano: []
    }

    filteredInfluencers.forEach(influencer => {
      const category = influencer.influence_category
      // Alcance = degree_centrality × 100000 + engagement
      const degree = (influencer.degree_centrality || 0)
      const engagement = (influencer.engagement || 0)
      const reach = (degree * 100000) + engagement + 1
      if (categoriesData[category]) {
        categoriesData[category].push({
          x: influencer.influence_score,
          y: reach,
          label: influencer.id
        })
      }
    })

    const datasets = Object.entries(categoriesData).map(([category, data]) => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      data,
      backgroundColor: getCategoryColor(category),
      borderColor: '#000000',
      borderWidth: 1,
      pointRadius: 6,
      pointHoverRadius: 8
    }))

    chartInstance.current = new Chart(chartRef.current, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const point = context.raw
                return `@${point.label}: Score ${point.x.toFixed(1)}, Engagement ${formatNumber(point.y)}`
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Score de Influencia',
              font: { weight: 'bold' }
            },
            suggestedMin: 0,
            suggestedMax: 100
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'Alcance (Degree × 100k + Engagement)',
              font: { weight: 'bold' }
            },
            ticks: {
              callback: function(value: any) {
                return formatNumber(value)
              }
            }
          }
        }
      }
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [filteredInfluencers])

  // Chart: Score vs PageRank
  useEffect(() => {
    if (!pageRankChartRef.current || filteredInfluencers.length === 0) return

    const ctx = pageRankChartRef.current.getContext('2d')
    if (!ctx) return

    // Destroy previous chart
    if (pageRankChartInstance.current) {
      pageRankChartInstance.current.destroy()
    }

    // Group by category
    const categoriesData: Record<string, { x: number; y: number; label: string }[]> = {
      mega: [],
      macro: [],
      micro: [],
      nano: []
    }

    filteredInfluencers.forEach(influencer => {
      const category = influencer.influence_category
      const pagerank = ((influencer as any).pagerank || 0) * 100 // Convertir a porcentaje
      if (categoriesData[category]) {
        categoriesData[category].push({
          x: influencer.influence_score,
          y: pagerank,
          label: influencer.id
        })
      }
    })

    const datasets = Object.entries(categoriesData).map(([category, data]) => ({
      label: category.charAt(0).toUpperCase() + category.slice(1),
      data,
      backgroundColor: getCategoryColor(category),
      borderColor: '#000000',
      borderWidth: 1,
      pointRadius: 6,
      pointHoverRadius: 8
    }))

    pageRankChartInstance.current = new Chart(pageRankChartRef.current, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const point = context.raw
                return `@${point.label}: Score ${point.x.toFixed(1)}, PageRank ${point.y.toFixed(3)}%`
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Score de Influencia',
              font: { weight: 'bold' }
            },
            suggestedMin: 0,
            suggestedMax: 100
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: 'PageRank (%)',
              font: { weight: 'bold' }
            },
            ticks: {
              callback: function(value: any) {
                return value.toFixed(3) + '%'
              }
            }
          }
        }
      }
    })

    return () => {
      if (pageRankChartInstance.current) {
        pageRankChartInstance.current.destroy()
      }
    }
  }, [filteredInfluencers])

  // Solo mostrar mensaje si NO HAY NINGÚN NODO cargado
  if (!mentions?.nodes || mentions.nodes.length === 0) {
    return (
      <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
        <h2 style={{ marginBottom: '10px' }}>Usuarios Destacados</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Carga un archivo JSON con datos de grafo para ver los usuarios destacados</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Usuarios Destacados
        </h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid #666',
            backgroundColor: 'transparent',
            color: '#666',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#666'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#666'
          }}
        >
          i
        </button>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Identificación y análisis de usuarios con mayor capacidad de influencia en la red
      </p>

      {/* Info Panel */}
      {showInfo && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
            ¿Qué son los Usuarios Destacados?
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px', color: '#666' }}>
            Los <strong>usuarios destacados</strong> o influencers son aquellos nodos en la red que presentan un alto
            impacto medido mediante métricas de centralidad, engagement y alcance. Su importancia radica en su capacidad
            para difundir información, moldear opiniones y movilizar comunidades.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px', color: '#666' }}>
            <strong>Importancia académica:</strong> Según la teoría de difusión de innovaciones (Rogers, 2003) y los estudios
            de centralidad en redes (Freeman, 1978), estos actores clave son fundamentales para entender la propagación viral
            de información, formación de opinión pública y dinámicas de influencia social. El concepto de "líder de opinión"
            (Lazarsfeld & Katz, 1955) identifica a individuos que ejercen influencia desproporcionada en sus redes.
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px', color: '#666' }}>
            <strong>Aplicaciones prácticas:</strong> Marketing de influencers, identificación de líderes de opinión,
            análisis de campañas virales, segmentación de audiencias, detección de desinformación, y estrategias de
            comunicación política.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
            Categorías de Influencers
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
              <strong style={{ color: '#ef4444' }}>Mega:</strong> <span style={{ fontSize: '13px', color: '#666' }}>Score {'>'} 75 - Influencers de alto impacto</span>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', borderLeft: '3px solid #f97316' }}>
              <strong style={{ color: '#f97316' }}>Macro:</strong> <span style={{ fontSize: '13px', color: '#666' }}>Score 50-75 - Influencia considerable</span>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
              <strong style={{ color: '#3b82f6' }}>Micro:</strong> <span style={{ fontSize: '13px', color: '#666' }}>Score 25-50 - Influencia moderada</span>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', borderLeft: '3px solid #6b7280' }}>
              <strong style={{ color: '#6b7280' }}>Nano:</strong> <span style={{ fontSize: '13px', color: '#666' }}>Score {'<'} 25 - Influencia emergente</span>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
            Métricas y Cálculos
          </h4>
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#666' }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>Score de Influencia:</strong> Métrica compuesta (0-100) que integra:
              <br />
              • 50% Degree Centrality normalizado (número de conexiones)
              <br />
              • 30% Engagement normalizado (likes + views + replies)
              <br />
              • 15% PageRank normalizado (importancia estructural)
              <br />
              • 5% Betweenness normalizado (papel de puente)
              <br />
              <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                Los valores se normalizan a [0-100] para permitir comparación entre métricas de diferentes escalas.
                Si no hay variación en los datos, se usa un ranking basado en valores absolutos.
              </span>
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>Alcance:</strong> Métrica combinada que refleja el potencial de impacto:
              <br />
              <code style={{ backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'inline-block', marginTop: '4px' }}>
                Alcance = (Degree Centrality × 100,000) + Engagement + 1
              </code>
              <br />
              <span style={{ fontSize: '12px', color: '#999' }}>
                Combina la posición estructural en la red (degree) con la interacción real (engagement).
                Valores más altos indican mayor autoridad en la red.
              </span>
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>Engagement:</strong> Suma de todas las interacciones recibidas (likes + views + replies).
              <br />
              <code style={{ backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'inline-block', marginTop: '4px' }}>
                Engagement = Likes + Views + Replies
              </code>
              <br />
              <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                Refleja el impacto cuantitativo y la resonancia del contenido publicado por el usuario.
              </span>
            </p>
            <p>
              <strong>PageRank:</strong> Recalculado desde cero en el frontend usando el algoritmo clásico:
              <br />
              <code style={{ backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', display: 'inline-block', marginTop: '4px' }}>
                PR(u) = (1-d)/N + d × Σ(PR(v) / L(v))
              </code>
              <br />
              <span style={{ fontSize: '12px', color: '#999' }}>
                donde d=0.85, N=número de nodos, v son nodos que apuntan a u, L(v) sus enlaces salientes.
                Se ejecutan 10 iteraciones usando top_connections del grafo.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid var(--border-primary)'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setDisplayLimit(20)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              minWidth: '180px'
            }}
          >
            <option value="all">Todas las categorías</option>
            <option value="mega">Mega</option>
            <option value="macro">Macro</option>
            <option value="micro">Micro</option>
            <option value="nano">Nano</option>
          </select>

          <select
            value={communityFilter}
            onChange={(e) => {
              setCommunityFilter(e.target.value)
              setDisplayLimit(20)
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              minWidth: '180px'
            }}
          >
            <option value="all">Todas las comunidades</option>
            {availableCommunities.map(c => (
              <option key={c} value={c}>Comunidad {c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        marginBottom: '20px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: 600 }}>#</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: 600 }}>Usuario</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#666', fontWeight: 600 }}>Score</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: 600 }}>Categoría</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#666', fontWeight: 600 }}>PageRank</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#666', fontWeight: 600 }}>Alcance</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#666', fontWeight: 600 }}>Engagement</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#666', fontWeight: 600 }}>Comunidad</th>
            </tr>
          </thead>
          <tbody>
            {displayedInfluencers.map((influencer, index) => {
              const communityColor = COMMUNITY_COLORS[influencer.community % COMMUNITY_COLORS.length]
              return (
                <tr
                  key={influencer.id}
                  onClick={() => setSelectedInfluencer(influencer)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: '#666' }}>{index + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>@{influencer.id}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                    {influencer.influence_score.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      backgroundColor: getCategoryColor(influencer.influence_category),
                      color: 'white'
                    }}>
                      {influencer.influence_category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 500 }}>
                    {(((influencer as any).pagerank || 0) * 100).toFixed(3)}%
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {formatNumber(Math.round((influencer.degree_centrality || 0) * 100000 + (influencer.engagement || 0) + 1))}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {formatNumber(influencer.engagement || 0)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: communityColor
                      }} />
                      <span>{influencer.community}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Load More */}
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
            Mostrando {displayedInfluencers.length} de {filteredInfluencers.length} influencers
          </p>
          {hasMore && (
            <button
              onClick={() => setDisplayLimit(prev => prev + 20)}
              style={{
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #d0d0d0',
                padding: '10px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
                e.currentTarget.style.borderColor = '#a0a0a0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#d0d0d0'
              }}
            >
              Mostrar 20 más
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Distribución Score vs Engagement
          </h3>
          <button
            onClick={() => setShowChartInfo(!showChartInfo)}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid #666',
              backgroundColor: 'transparent',
              color: '#666',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#666'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#666'
            }}
          >
            i
          </button>
        </div>

        {showChartInfo && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '16px',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#666'
          }}>
            <p style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#333' }}>Interpretación del Gráfico de Dispersión:</strong>
            </p>
            <p style={{ marginBottom: '10px' }}>
              Este scatter plot visualiza la relación bivariada entre el <strong>Score de Influencia</strong> (eje X)
              y el <strong>Engagement Total</strong> (eje Y), revelando patrones de influencia en la red.
            </p>
            <p style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#333' }}>Por qué es importante:</strong>
            </p>
            <p style={{ marginBottom: '10px' }}>
              • <strong>Detección de anomalías:</strong> Puntos alejados de la tendencia principal indican usuarios
              con comportamiento excepcional (muy alto engagement con score moderado, o viceversa)
              <br />
              • <strong>Segmentación visual:</strong> Los colores por categoría permiten identificar si el engagement
              escala proporcionalmente con el score de influencia o si existen discontinuidades
              <br />
              • <strong>Validación de métricas:</strong> Una correlación positiva fuerte valida que el Score de Influencia
              captura efectivamente el impacto real medido por engagement
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong style={{ color: '#333' }}>Aplicaciones:</strong> Identificación de micro-influencers (alto engagement,
              score moderado), detección de cuentas infladas (score alto, bajo engagement), y priorización de
              colaboraciones basada en efectividad real.
            </p>
          </div>
        )}

        <div style={{ height: '500px' }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Score vs PageRank Chart */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: 0 }}>
            Influencia vs PageRank
          </h3>
          <button
            onClick={() => setShowPageRankChartInfo(!showPageRankChartInfo)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid #3b82f6',
              backgroundColor: 'white',
              color: '#3b82f6',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            i
          </button>
        </div>

        {showPageRankChartInfo && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#1e40af'
          }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>Score de Influencia:</strong> Métrica compuesta (0-100) que integra:
              <br />
              • 50% Degree Centrality (conexiones)
              <br />
              • 30% Engagement (likes + views + replies)
              <br />
              • 15% PageRank (importancia estructural)
              <br />
              • 5% Betweenness (papel de puente)
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>PageRank:</strong> Algoritmo de Google que mide la importancia de un nodo en la red.
              <br />
              • Calcula la probabilidad de llegar a un nodo siguiendo enlaces aleatorios
              <br />
              • Valores más altos = mayor autoridad e influencia estructural
              <br />
              • No depende solo del número de conexiones, sino de la calidad
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>Interpretación:</strong>
              <br />
              • <strong>Correlación positiva:</strong> El score compuesto refleja bien la importancia estructural
              <br />
              • <strong>Alto PageRank, score bajo:</strong> Usuario influyente por conexiones, no por engagement
              <br />
              • <strong>Bajo PageRank, score alto:</strong> Usuario con alto engagement pero poca centralidad en la red
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong style={{ color: '#333' }}>Aplicaciones:</strong> Identificar líderes de opinión estructurales,
              detectar hubs de información, y entender cómo fluye la influencia en la red más allá del engagement directo.
            </p>
          </div>
        )}

        <div style={{ height: '500px' }}>
          <canvas ref={pageRankChartRef}></canvas>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedInfluencer && (
        <>
          <div
            onClick={() => setSelectedInfluencer(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1001,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>@{selectedInfluencer.id}</h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  backgroundColor: getCategoryColor(selectedInfluencer.influence_category),
                  color: 'white'
                }}>
                  {selectedInfluencer.influence_category}
                </span>
              </div>
              <button
                onClick={() => setSelectedInfluencer(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            {/* Score */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Score de Influencia</div>
              <div style={{ fontSize: '48px', fontWeight: 700, margin: '8px 0' }}>
                {selectedInfluencer.influence_score.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Ranking: #{selectedRank} de {allInfluencers.length}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Métricas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>PageRank</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {((selectedInfluencer.pagerank || 0) * 100).toFixed(2)}%
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Engagement</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {formatNumber(selectedInfluencer.engagement || 0)}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Tasa Eng.</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {(selectedInfluencer.engagement_rate || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Comunidad</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {selectedInfluencer.community}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Tweet */}
            {selectedInfluencer.top_tweet && (
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Tweet Destacado</h4>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <p style={{ lineHeight: '1.5', marginBottom: '12px' }}>
                    {selectedInfluencer.top_tweet.text.substring(0, 200)}
                    {selectedInfluencer.top_tweet.text.length > 200 && '...'}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                    <span>❤ {formatNumber(selectedInfluencer.top_tweet.likes)}</span>
                    <span>👁 {formatNumber(selectedInfluencer.top_tweet.views)}</span>
                    <span>💬 {formatNumber(selectedInfluencer.top_tweet.replies)}</span>
                  </div>
                  {selectedInfluencer.top_tweet.url && (
                    <a
                      href={selectedInfluencer.top_tweet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '13px' }}
                    >
                      Ver tweet →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
