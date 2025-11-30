import { useState } from 'react'
import { BarChart3, Info, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, CheckCircle, Star } from 'lucide-react'
import type { GraphNode, GraphEdge } from '@/types/graph'
import { InfoModal } from './InfoModal'

interface DegreeDistributionAnalysisProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  graphType: 'mentions' | 'cohashtags'
}

export function DegreeDistributionAnalysis({ nodes, edges, graphType }: DegreeDistributionAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Calcular distribución de grados
  const degrees = new Map<string, number>()
  edges.forEach(edge => {
    const source = edge.from || edge.source
    const target = edge.to || edge.target
    degrees.set(source, (degrees.get(source) || 0) + 1)
    degrees.set(target, (degrees.get(target) || 0) + 1)
  })

  const degreeValues = Array.from(degrees.values())
  const maxDegree = Math.max(...degreeValues, 0)
  const minDegree = Math.min(...degreeValues.filter(d => d > 0), 0)
  const avgDegree = degreeValues.length > 0 ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length : 0

  // Agrupar en bins para histograma
  const numBins = Math.min(10, Math.ceil(Math.sqrt(degreeValues.length)))
  const binSize = Math.ceil(maxDegree / numBins)
  const bins: { range: string; count: number; percentage: number }[] = []

  for (let i = 0; i < numBins; i++) {
    const min = i * binSize
    const max = (i + 1) * binSize
    const count = degreeValues.filter(d => d >= min && d < max).length
    const percentage = (count / degreeValues.length) * 100

    if (count > 0 || i === 0) {
      bins.push({
        range: i === numBins - 1 ? `${min}+` : `${min}-${max - 1}`,
        count,
        percentage
      })
    }
  }

  // Detectar tipo de distribución
  const median = [...degreeValues].sort((a, b) => a - b)[Math.floor(degreeValues.length / 2)] || 0
  const variance = degreeValues.reduce((sum, d) => sum + Math.pow(d - avgDegree, 2), 0) / degreeValues.length
  const stdDev = Math.sqrt(variance)
  const skewness = degreeValues.reduce((sum, d) => sum + Math.pow((d - avgDegree) / stdDev, 3), 0) / degreeValues.length

  let distributionType = 'Normal'
  let distributionColor = '#3b82f6'
  let distributionDescription = 'Distribución uniforme de conexiones'

  if (skewness > 1.5) {
    distributionType = 'Power-Law (Sin Escala)'
    distributionColor = '#8b5cf6'
    distributionDescription = 'Red con hubs dominantes, típica de redes sociales reales'
  } else if (skewness > 0.5) {
    distributionType = 'Sesgada a la Derecha'
    distributionColor = '#f59e0b'
    distributionDescription = 'Algunos nodos con alta conectividad'
  } else if (Math.abs(median - avgDegree) / avgDegree < 0.1) {
    distributionType = 'Normal/Gaussiana'
    distributionColor = '#10b981'
    distributionDescription = 'Red con conectividad homogénea'
  }

  // Percentiles
  const sortedDegrees = [...degreeValues].sort((a, b) => a - b)
  const p25 = sortedDegrees[Math.floor(sortedDegrees.length * 0.25)] || 0
  const p50 = median
  const p75 = sortedDegrees[Math.floor(sortedDegrees.length * 0.75)] || 0
  const p90 = sortedDegrees[Math.floor(sortedDegrees.length * 0.90)] || 0

  return (
    <>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Distribución de Grados">
        <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#333' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '0', marginBottom: '12px' }}>
            Análisis de Conectividad
          </h4>
          <p>
            La distribución de grados revela cómo se distribuyen las conexiones entre los nodos de la red.
          </p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Degree (Grado)
          </h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>
              El <strong>grado</strong> de un nodo es el número de conexiones (aristas) que posee.
              En grafos dirigidos se distingue entre in-degree (entrantes) y out-degree (salientes).
            </p>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              <strong>Referencia:</strong> Freeman (1978) - Centrality in Social Networks
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Tipos de Distribución
          </h4>
          <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
            <li>
              <strong>Normal/Gaussiana:</strong> La mayoría de nodos tienen grado similar al promedio.
              Típica de redes aleatorias (Erdős–Rényi).
            </li>
            <li>
              <strong>Power-Law (Sin Escala):</strong> Pocos nodos con grado muy alto (hubs) y muchos con grado bajo.
              Característica de redes sociales, Internet, redes de citación (Barabási-Albert, 1999).
            </li>
            <li>
              <strong>Sesgada:</strong> Asimetría hacia valores altos o bajos, indicando concentración de conectividad.
            </li>
          </ul>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Métricas Estadísticas
          </h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
              <li><strong>Promedio:</strong> Media aritmética de todos los grados</li>
              <li><strong>Mediana:</strong> Valor central de la distribución (menos sensible a outliers)</li>
              <li><strong>Desviación Estándar:</strong> Dispersión respecto al promedio</li>
              <li><strong>Percentiles:</strong> División de la distribución en cuartiles (25%, 50%, 75%, 90%)</li>
              <li><strong>Skewness (Asimetría):</strong> &gt;1.5 indica distribución power-law</li>
            </ul>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>
            Interpretación
          </h4>
          <p style={{ fontSize: '13px' }}>
            Una distribución power-law sugiere presencia de <strong>influencers</strong> o nodos clave que actúan
            como conectores principales. Una distribución normal indica una red más igualitaria sin dominancia clara.
          </p>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px', border: '1px solid #999' }}>
            <strong>Referencias académicas:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Barabási & Albert (1999) - Emergence of Scaling in Random Networks</li>
              <li>Newman (2003) - The Structure and Function of Complex Networks</li>
              <li>Freeman (1978) - Centrality in Social Networks</li>
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
            <BarChart3 size={20} />
            <h3 className="chart-title" style={{ margin: 0 }}>Distribución de Grados</h3>
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
              title="Ver información sobre distribución de grados"
            >
              <Info size={14} />
            </button>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        {isExpanded && (
          <div style={{ marginTop: '16px' }}>
            {/* Tipo de distribución */}
            <div style={{
              padding: '16px',
              background: `${distributionColor}15`,
              border: `1px solid ${distributionColor}40`,
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ fontWeight: 600, color: distributionColor, fontSize: '15px', marginBottom: '8px' }}>
                Tipo de Red: {distributionType}
              </div>
              <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.6', marginBottom: '12px' }}>
                {distributionDescription}
              </div>

              {/* Explicación visual según el tipo */}
              {distributionType.includes('Power-Law') && (
                <div style={{ padding: '12px', background: 'white', borderRadius: '6px', fontSize: '12px', lineHeight: '1.5' }}>
                  <strong>¿Qué significa esto?</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                    <li>Hay pocos usuarios muy conectados (influencers/hubs)</li>
                    <li>La mayoría de usuarios tienen pocas conexiones</li>
                    <li>Patrón típico de Twitter, Facebook, Instagram</li>
                    <li>La información fluye a través de los hubs</li>
                  </ul>
                </div>
              )}

              {distributionType === 'Normal/Gaussiana' && (
                <div style={{ padding: '12px', background: 'white', borderRadius: '6px', fontSize: '12px', lineHeight: '1.5' }}>
                  <strong>¿Qué significa esto?</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                    <li>Todos los usuarios tienen conectividad similar</li>
                    <li>No hay influencers dominantes</li>
                    <li>Red más igualitaria y descentralizada</li>
                    <li>La información se distribuye de forma uniforme</li>
                  </ul>
                </div>
              )}

              {distributionType === 'Sesgada a la Derecha' && (
                <div style={{ padding: '12px', background: 'white', borderRadius: '6px', fontSize: '12px', lineHeight: '1.5' }}>
                  <strong>¿Qué significa esto?</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                    <li>Algunos usuarios destacan con más conexiones</li>
                    <li>Hay cierta concentración de influencia</li>
                    <li>Patrón intermedio entre redes centralizadas y descentralizadas</li>
                    <li>Presencia de líderes de opinión moderados</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Estadísticas principales */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                Conexiones por Usuario
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '8px' }}>
                <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Promedio
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {avgDegree.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    conexiones/usuario
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mediana
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {median}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    valor central
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'var(--card-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Variabilidad
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {stdDev.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    dispersión
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {avgDegree < 2 ? (
                  <>
                    <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                    <span>Red poco conectada - la mayoría de usuarios están aislados</span>
                  </>
                ) : avgDegree < 5 ? (
                  <>
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                    <span>Conectividad normal - interacción moderada entre usuarios</span>
                  </>
                ) : (
                  <>
                    <Star size={14} style={{ color: '#3b82f6' }} />
                    <span>Red muy activa - alta interacción entre usuarios</span>
                  </>
                )}
              </div>
            </div>

            {/* Rango y percentiles */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Rango de Grados</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mínimo</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{minDegree}</div>
                </div>
                <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '2px' }} />
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Máximo</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{maxDegree}</div>
                </div>
              </div>
            </div>

            {/* Percentiles */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                Distribución de Usuarios por Conexiones
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', lineHeight: '1.5' }}>
                Estos valores muestran cómo se distribuyen las conexiones entre los usuarios:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>25% usuarios</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>≤{p25}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>conexiones</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>50% usuarios</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>≤{p50}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>conexiones</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>75% usuarios</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>≤{p75}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>conexiones</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>90% usuarios</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>≤{p90}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>conexiones</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', background: '#f9f9f9', padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'start', gap: '6px' }}>
                <Lightbulb size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }} />
                <span>Ejemplo: Si P90 = {p90}, significa que el 90% de usuarios tienen {p90} o menos conexiones</span>
              </div>
            </div>

            {/* Histograma */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                Gráfico de Distribución
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', lineHeight: '1.5' }}>
                Cantidad de usuarios según su número de conexiones:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bins.map((bin, idx) => {
                  const maxCount = Math.max(...bins.map(b => b.count))
                  const widthPercentage = (bin.count / maxCount) * 100

                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {bin.range}
                      </div>
                      <div style={{ flex: 1, background: '#f0f0f0', height: '24px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          width: `${widthPercentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '6px',
                          transition: 'width 0.3s ease'
                        }}>
                          {bin.count > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'white' }}>
                              {bin.count}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ width: '50px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                        {bin.percentage.toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resumen interpretativo */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              border: '1px solid #667eea40',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#333',
              lineHeight: '1.6'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#667eea', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={16} style={{ color: '#667eea' }} />
                <span>Interpretación de estos datos:</span>
              </div>
              <div>
                {distributionType.includes('Power-Law') ? (
                  <>
                    Tu red tiene un patrón típico de redes sociales: <strong>pocos usuarios muy influyentes</strong> y <strong>muchos usuarios con poca actividad</strong>.
                    Esto es normal en Twitter/X - la información tiende a fluir a través de los usuarios más conectados.
                  </>
                ) : distributionType === 'Normal/Gaussiana' ? (
                  <>
                    Tu red tiene una distribución equilibrada donde <strong>la mayoría de usuarios tienen conectividad similar</strong>.
                    Esto sugiere una red más horizontal sin grandes diferencias de influencia.
                  </>
                ) : (
                  <>
                    Tu red muestra <strong>cierta concentración de influencia</strong> pero sin dominancia extrema.
                    Hay algunos usuarios destacados pero la red mantiene cierto equilibrio.
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
