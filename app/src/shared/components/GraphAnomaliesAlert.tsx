import { useState } from 'react'
import { AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useGraphAnomalies } from '@/shared/hooks/useGraphAnomalies'
import { InfoModal } from './InfoModal'

interface GraphAnomaliesAlertProps {
  graphType: 'mentions' | 'cohashtags'
}

export function GraphAnomaliesAlert({ graphType }: GraphAnomaliesAlertProps) {
  const analysis = useGraphAnomalies(graphType)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  if (!analysis) return null

  const { anomalies, graphHealth, metrics } = analysis

  // If graph is healthy and no anomalies, show success message
  if (graphHealth === 'healthy' && anomalies.length === 0) {
    return (
      <>
        <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Análisis Estructural del Grafo">
          <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#333' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '0', marginBottom: '12px' }}>Métricas Estructurales</h4>
            <p>El análisis estructural evalúa la topología del grafo mediante las siguientes métricas:</p>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Densidad del Grafo</h4>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
              <strong>Density = 2E / (N × (N-1))</strong>
              <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
                Donde E = número de aristas, N = número de nodos. Valores entre 0 (grafo vacío) y 1 (grafo completo).
              </p>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Grado Promedio</h4>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
              <strong>Avg Degree = 2E / N</strong>
              <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
                Promedio de conexiones por nodo. Valores bajos (&lt;2) indican fragmentación.
              </p>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Detección de Comunidades</h4>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
              <strong>Algoritmo de Louvain</strong>
              <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
                Optimiza la modularidad del grafo agrupando nodos en comunidades densamente conectadas.
                Referencia: Blondel et al., 2008
              </p>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Componente Gigante</h4>
            <p style={{ fontSize: '13px' }}>
              Porcentaje de nodos en el componente conexo más grande. Valores bajos (&lt;50%) indican fragmentación significativa.
            </p>

            <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '16px', marginBottom: '12px' }}>Anomalías Detectadas</h4>
            <ul style={{ marginTop: 0, paddingLeft: '20px', fontSize: '13px' }}>
              <li><strong>Densidad muy baja:</strong> &lt;0.01 (grafo disperso)</li>
              <li><strong>Densidad muy alta:</strong> &gt;0.5 (posible inflación artificial)</li>
              <li><strong>Alta fragmentación:</strong> &gt;20% nodos aislados</li>
              <li><strong>Pocas comunidades:</strong> &lt;2 comunidades (estructura trivial)</li>
              <li><strong>Exceso de comunidades:</strong> &gt;30% de nodos son comunidades</li>
              <li><strong>Topología estrella:</strong> Un nodo con grado &gt;5× promedio</li>
              <li><strong>Componente gigante pequeño:</strong> &lt;50% de nodos conectados</li>
            </ul>

            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px', border: '1px solid #999' }}>
              <strong>Nota académica:</strong> Estas métricas están basadas en teoría de grafos y análisis de redes sociales.
              Las anomalías son indicadores estructurales y deben interpretarse según el contexto del fenómeno estudiado.
            </div>
          </div>
        </InfoModal>

        <div className="chart-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} />
              <h3 className="chart-title" style={{ margin: 0 }}>Análisis Estructural del Grafo</h3>
            </div>
            <button
              onClick={() => setShowInfo(true)}
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
              title="Ver información sobre el análisis"
            >
              <Info size={14} />
            </button>
          </div>

        <div style={{
          padding: '12px',
          background: '#f5f5f5',
          border: '1px solid #999',
          borderRadius: '6px',
          display: 'flex',
          gap: '12px',
          alignItems: 'start'
        }}>
          <CheckCircle size={18} style={{ color: '#333', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '4px' }}>
              Grafo saludable
            </div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
              No se detectaron anomalías estructurales significativas. El grafo presenta características adecuadas para análisis de redes.
            </div>
          </div>
        </div>

        {/* Metrics summary */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f5f5f5',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#333',
          border: '1px solid #ddd'
        }}>
          <strong>Métricas estructurales:</strong>
          <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
            <li>Densidad: {(metrics.density * 100).toFixed(3)}%</li>
            <li>Grado promedio: {metrics.avgDegree.toFixed(2)}</li>
            <li>Comunidades detectadas: {metrics.communities}</li>
            <li>Componente gigante: {metrics.giantComponentPercentage.toFixed(1)}% de nodos</li>
            <li>Nodos aislados: {metrics.isolatedNodesPercentage.toFixed(1)}%</li>
          </ul>
        </div>
        </div>
      </>
    )
  }

  // Show anomalies if detected
  return (
    <>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} title="Análisis Estructural del Grafo">
        <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#333' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '0', marginBottom: '12px' }}>Métricas Estructurales</h4>
          <p>El análisis estructural evalúa la topología del grafo mediante las siguientes métricas:</p>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Densidad del Grafo</h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <strong>Density = 2E / (N × (N-1))</strong>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              Donde E = número de aristas, N = número de nodos. Valores entre 0 (grafo vacío) y 1 (grafo completo).
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Grado Promedio</h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <strong>Avg Degree = 2E / N</strong>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              Promedio de conexiones por nodo. Valores bajos (&lt;2) indican fragmentación.
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Detección de Comunidades</h4>
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #ddd' }}>
            <strong>Algoritmo de Louvain</strong>
            <p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
              Optimiza la modularidad del grafo agrupando nodos en comunidades densamente conectadas.
              Referencia: Blondel et al., 2008
            </p>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Componente Gigante</h4>
          <p style={{ fontSize: '13px' }}>
            Porcentaje de nodos en el componente conexo más grande. Valores bajos (&lt;50%) indican fragmentación significativa.
          </p>

          <h4 style={{ fontSize: '15px', fontWeight: '600', marginTop: '16px', marginBottom: '12px' }}>Anomalías Detectadas</h4>
          <ul style={{ marginTop: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li><strong>Densidad muy baja:</strong> &lt;0.01 (grafo disperso)</li>
            <li><strong>Densidad muy alta:</strong> &gt;0.5 (posible inflación artificial)</li>
            <li><strong>Alta fragmentación:</strong> &gt;20% nodos aislados</li>
            <li><strong>Pocas comunidades:</strong> &lt;2 comunidades (estructura trivial)</li>
            <li><strong>Exceso de comunidades:</strong> &gt;30% de nodos son comunidades</li>
            <li><strong>Topología estrella:</strong> Un nodo con grado &gt;5× promedio</li>
            <li><strong>Componente gigante pequeño:</strong> &lt;50% de nodos conectados</li>
          </ul>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px', border: '1px solid #999' }}>
            <strong>Nota académica:</strong> Estas métricas están basadas en teoría de grafos y análisis de redes sociales.
            Las anomalías son indicadores estructurales y deben interpretarse según el contexto del fenómeno estudiado.
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
            <AlertCircle size={20} />
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
              title="Ver información sobre el análisis"
            >
              <Info size={14} />
            </button>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

      {isExpanded && (
        <div style={{ marginTop: '16px' }}>

      {/* Health status */}
      <div style={{
        padding: '12px',
        background: graphHealth === 'critical' ? '#e0e0e0' : '#ebebeb',
        border: `1px solid ${graphHealth === 'critical' ? '#666' : '#999'}`,
        borderRadius: '6px',
        marginBottom: '12px',
        display: 'flex',
        gap: '12px',
        alignItems: 'start'
      }}>
        <AlertCircle size={18} style={{ color: '#333', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '4px' }}>
            Estado del grafo: {graphHealth === 'critical' ? 'Crítico' : graphHealth === 'warning' ? 'Advertencia' : 'Saludable'}
          </div>
          <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
            {graphHealth === 'critical'
              ? 'Se detectaron múltiples anomalías estructurales. El grafo puede tener limitaciones significativas para análisis de redes.'
              : 'Se detectaron algunas anomalías estructurales. Revisar antes de realizar análisis avanzados.'}
          </div>
        </div>
      </div>

      {/* Individual anomalies */}
      {anomalies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {anomalies.map((anomaly, index) => {
            const bg = anomaly.type === 'critical' ? '#e0e0e0' :
                      anomaly.type === 'warning' ? '#ebebeb' : '#f5f5f5'
            const border = anomaly.type === 'critical' ? '#666' :
                          anomaly.type === 'warning' ? '#999' : '#ccc'

            const Icon = anomaly.type === 'critical' ? AlertCircle :
                        anomaly.type === 'warning' ? AlertCircle : Info

            return (
              <div
                key={index}
                style={{
                  padding: '12px',
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'start'
                }}
              >
                <Icon size={18} style={{ color: '#333', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#333', marginBottom: '4px' }}>
                    {anomaly.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                    {anomaly.message}
                  </div>
                  {anomaly.metric !== undefined && anomaly.threshold !== undefined && (
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                      Valor detectado: {anomaly.metric.toFixed(2)} | Umbral: {anomaly.threshold.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Metrics summary */}
      <div style={{
        padding: '12px',
        background: '#f5f5f5',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#333',
        border: '1px solid #ddd'
      }}>
        <strong>Métricas estructurales del grafo:</strong>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px',
          marginTop: '8px'
        }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Densidad</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{(metrics.density * 100).toFixed(3)}%</div>
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Grado promedio</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{metrics.avgDegree.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Grado máximo</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{metrics.maxDegree}</div>
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Comunidades</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{metrics.communities}</div>
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Nodos aislados</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{metrics.isolatedNodesPercentage.toFixed(1)}%</div>
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Componente gigante</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{metrics.giantComponentPercentage.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Academic note */}
      <div style={{
        marginTop: '12px',
        padding: '10px',
        background: '#f5f5f5',
        border: '1px solid #999',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#333',
        lineHeight: '1.5'
      }}>
        <strong>Nota académica:</strong> Estas anomalías son indicadores estructurales, no necesariamente problemas.
        Dependiendo del fenómeno estudiado, ciertas topologías (estrella, fragmentada, etc.) pueden ser esperadas y significativas.
      </div>
        </div>
      )}
      </div>
    </>
  )
}
