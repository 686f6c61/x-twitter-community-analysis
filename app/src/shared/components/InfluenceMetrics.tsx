import { useState } from 'react'
import { TrendingUp, Info, ChevronDown, ChevronUp, Crown, Star, Zap } from 'lucide-react'
import type { GraphNode, GraphEdge } from '@/types/graph'
import { InfoModal } from './InfoModal'

interface InfluenceMetricsProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  graphType: 'mentions' | 'cohashtags'
}

export function InfluenceMetrics({ nodes, edges, graphType }: InfluenceMetricsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Calcular métricas de influencia
  const degrees = new Map<string, number>()
  edges.forEach(edge => {
    const source = edge.from || edge.source
    const target = edge.to || edge.target
    degrees.set(source, (degrees.get(source) || 0) + 1)
    degrees.set(target, (degrees.get(target) || 0) + 1)
  })

  // Top influencers por degree
  const topByDegree = nodes
    .map(n => ({ ...n, degree: degrees.get(n.id) || 0 }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5)

  // Top influencers por betweenness (ya calculado en los nodos)
  const topByBetweenness = [...nodes]
    .sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0))
    .slice(0, 5)

  // Top influencers por closeness (ya calculado en los nodos)
  const topByCloseness = [...nodes]
    .sort((a, b) => (b.closeness || 0) - (a.closeness || 0))
    .slice(0, 5)

  // Top influencers por eigenvector (ya calculado en los nodos)
  const topByEigenvector = [...nodes]
    .sort((a, b) => (b.eigenvector || 0) - (a.eigenvector || 0))
    .slice(0, 5)

  // Calcular métricas agregadas
  const avgDegree = nodes.reduce((sum, n) => sum + (degrees.get(n.id) || 0), 0) / nodes.length
  const avgBetweenness = nodes.reduce((sum, n) => sum + (n.betweenness || 0), 0) / nodes.length
  const avgCloseness = nodes.reduce((sum, n) => sum + (n.closeness || 0), 0) / nodes.length
  const avgEigenvector = nodes.reduce((sum, n) => sum + (n.eigenvector || 0), 0) / nodes.length

  // Concentración de influencia (% de influencia en top 10%)
  const top10Percent = Math.ceil(nodes.length * 0.1)
  const totalDegree = Array.from(degrees.values()).reduce((a, b) => a + b, 0)
  const top10Degree = topByDegree.slice(0, top10Percent).reduce((sum, n) => sum + n.degree, 0)
  const influenceConcentration = (top10Degree / totalDegree) * 100

  let concentrationLevel = 'Baja'
  let concentrationColor = '#10b981'
  let concentrationDescription = 'Influencia distribuida equitativamente'

  if (influenceConcentration > 50) {
    concentrationLevel = 'Muy Alta'
    concentrationColor = '#ef4444'
    concentrationDescription = 'Pocos actores dominan la red'
  } else if (influenceConcentration > 30) {
    concentrationLevel = 'Alta'
    concentrationColor = '#f59e0b'
    concentrationDescription = 'Influencia concentrada en hubs'
  } else if (influenceConcentration > 20) {
    concentrationLevel = 'Moderada'
    concentrationColor = '#3b82f6'
    concentrationDescription = 'Balance entre hubs y nodos regulares'
  }

  return (
    <>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Métricas de Influencia">
        <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#333' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '0', marginBottom: '12px' }}>
            Medidas de Centralidad e Influencia
          </h4>
          <p>
            Las métricas de centralidad identifican los nodos más importantes según diferentes criterios de influencia.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Degree Centrality (Centralidad de Grado)
          </h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Número de conexiones directas de un nodo. Identifica actores con mayor alcance inmediato.
            </p>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              <strong>Fórmula:</strong> C<sub>D</sub>(v) = deg(v)
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              <strong>Referencia:</strong> Freeman (1978)
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Betweenness Centrality (Intermediación)
          </h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Frecuencia con que un nodo aparece en los caminos más cortos entre otros nodos.
              Identifica <strong>brokers</strong> o conectores entre diferentes grupos.
            </p>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              <strong>Fórmula:</strong> C<sub>B</sub>(v) = Σ(σ<sub>st</sub>(v) / σ<sub>st</sub>)
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              <strong>Referencia:</strong> Freeman (1977), Brandes (2001)
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Closeness Centrality (Cercanía)
          </h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Inversa de la distancia promedio a todos los demás nodos. Identifica nodos con acceso rápido
              a toda la red, ideales para difusión de información.
            </p>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              <strong>Fórmula:</strong> C<sub>C</sub>(v) = (N-1) / Σd(v,u)
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              <strong>Referencia:</strong> Freeman (1978)
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Eigenvector Centrality (Centralidad de Vector Propio)
          </h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Influencia basada en la calidad de las conexiones, no solo la cantidad.
              Un nodo es influyente si está conectado a otros nodos influyentes.
              Base del algoritmo PageRank de Google.
            </p>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              <strong>Fórmula:</strong> x<sub>v</sub> = (1/λ) Σ A<sub>v,t</sub> x<sub>t</sub>
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              <strong>Referencia:</strong> Bonacich (1987), Page et al. (1999)
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Concentración de Influencia
          </h4>
          <p style={{ fontSize: '13px' }}>
            Porcentaje de influencia total (grado) concentrada en el top 10% de nodos.
            Valores altos (&gt;50%) indican redes dominadas por pocos actores clave.
          </p>

          <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '16px', marginBottom: '12px' }}>
            Interpretación Práctica
          </h4>
          <ul style={{ marginTop: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li><strong>Degree alto:</strong> Actores populares, muchas menciones/interacciones</li>
            <li><strong>Betweenness alto:</strong> Puentes entre comunidades, difusores de información</li>
            <li><strong>Closeness alto:</strong> Posición privilegiada para acceso rápido a toda la red</li>
            <li><strong>Eigenvector alto:</strong> Conectados a otros influencers, líderes de opinión</li>
          </ul>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px', border: '1px solid #999' }}>
            <strong>Referencias académicas:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Freeman (1978) - Centrality in Social Networks: Conceptual Clarification</li>
              <li>Brandes (2001) - A Faster Algorithm for Betweenness Centrality</li>
              <li>Bonacich (1987) - Power and Centrality: A Family of Measures</li>
              <li>Page et al. (1999) - The PageRank Citation Ranking</li>
            </ul>
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
            <TrendingUp size={20} />
            <h3 className="chart-title" style={{ margin: 0 }}>Métricas de Influencia</h3>
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
              title="Ver información sobre métricas de influencia"
            >
              <Info size={14} />
            </button>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        {isExpanded && (
          <div style={{ marginTop: '16px' }}>
            {/* Concentración de influencia */}
            <div style={{
              padding: '12px 16px',
              background: `${concentrationColor}15`,
              border: `1px solid ${concentrationColor}40`,
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ fontWeight: 600, color: concentrationColor, fontSize: '14px', marginBottom: '4px' }}>
                Concentración de Influencia: {concentrationLevel}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {concentrationDescription}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: concentrationColor }}>
                {influenceConcentration.toFixed(1)}% en top 10% de nodos
              </div>
            </div>

            {/* Promedios de centralidad */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Promedios de Centralidad</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ padding: '10px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Degree
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {avgDegree.toFixed(1)}
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Betweenness
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {avgBetweenness.toFixed(3)}
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Closeness
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {avgCloseness.toFixed(3)}
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Eigenvector
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {avgEigenvector.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Top 3 por Degree */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Crown size={16} style={{ color: '#fbbf24' }} />
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Top 3 por Degree (Popularidad)</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {topByDegree.slice(0, 3).map((node, idx) => (
                  <div key={node.id} style={{
                    padding: '8px 10px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#cd7f32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'white'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{node.label}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {node.degree} conex.
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 3 por Betweenness */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Star size={16} style={{ color: '#8b5cf6' }} />
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Top 3 por Betweenness (Brokers)</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {topByBetweenness.slice(0, 3).map((node, idx) => (
                  <div key={node.id} style={{
                    padding: '8px 10px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#cd7f32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'white'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{node.label}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {(node.betweenness || 0).toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 3 por Eigenvector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={16} style={{ color: '#3b82f6' }} />
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Top 3 por Eigenvector (Líderes de Opinión)</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {topByEigenvector.slice(0, 3).map((node, idx) => (
                  <div key={node.id} style={{
                    padding: '8px 10px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#cd7f32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'white'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{node.label}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {(node.eigenvector || 0).toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nota académica */}
            <div style={{
              marginTop: '16px',
              padding: '10px',
              background: '#f5f5f5',
              border: '1px solid #999',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#333',
              lineHeight: '1.5'
            }}>
              <strong>Nota metodológica:</strong> Las métricas de centralidad fueron calculadas usando algoritmos estándar
              (Freeman 1978, Brandes 2001). Los rankings pueden variar según filtros aplicados al grafo.
            </div>
          </div>
        )}
      </div>
    </>
  )
}
