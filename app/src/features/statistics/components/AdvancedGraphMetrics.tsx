import { useState } from 'react'
import { TrendingUp, Network, GitBranch, Info } from 'lucide-react'
import type { Node } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'

interface AdvancedGraphMetricsProps {
  graphNodes?: Node[]
}

export function AdvancedGraphMetrics({ graphNodes }: AdvancedGraphMetricsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  if (!graphNodes || graphNodes.length === 0) {
    return (
      <div style={{
        padding: '24px',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          Métricas Avanzadas de Grafo
        </h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Visita primero la página "Grafo" para calcular las métricas avanzadas.
        </p>
      </div>
    )
  }

  // Calcular estadísticas de Core Number
  const nodesWithCore = graphNodes.filter(n => typeof n.core_number === 'number')
  const coreNumbers = nodesWithCore.map(n => n.core_number!).filter(c => c > 0)
  const maxCore = coreNumbers.length > 0 ? Math.max(...coreNumbers) : 0
  const avgCore = coreNumbers.length > 0 ? coreNumbers.reduce((a, b) => a + b, 0) / coreNumbers.length : 0

  // Distribución de k-cores
  const coreDistribution: Record<number, number> = {}
  nodesWithCore.forEach(n => {
    const core = n.core_number!
    coreDistribution[core] = (coreDistribution[core] || 0) + 1
  })

  // Top usuarios por Core Number
  const topByCore = [...nodesWithCore]
    .sort((a, b) => (b.core_number! || 0) - (a.core_number! || 0))
    .slice(0, 10)

  // Calcular estadísticas de PageRank
  const nodesWithPageRank = graphNodes.filter(n => typeof n.eigenvector_centrality === 'number')
  const pageRanks = nodesWithPageRank.map(n => n.eigenvector_centrality!).filter(p => p > 0)
  const maxPageRank = pageRanks.length > 0 ? Math.max(...pageRanks) : 0
  const avgPageRank = pageRanks.length > 0 ? pageRanks.reduce((a, b) => a + b, 0) / pageRanks.length : 0

  // Top usuarios por PageRank
  const topByPageRank = [...nodesWithPageRank]
    .sort((a, b) => (b.eigenvector_centrality! || 0) - (a.eigenvector_centrality! || 0))
    .slice(0, 10)

  // Calcular estadísticas de Betweenness Centrality
  const nodesWithBetweenness = graphNodes.filter(n => typeof n.betweenness_centrality === 'number')
  const betweennesses = nodesWithBetweenness.map(n => n.betweenness_centrality!).filter(b => b > 0)
  const maxBetweenness = betweennesses.length > 0 ? Math.max(...betweennesses) : 0
  const avgBetweenness = betweennesses.length > 0 ? betweennesses.reduce((a, b) => a + b, 0) / betweennesses.length : 0

  // Top usuarios por Betweenness
  const topByBetweenness = [...nodesWithBetweenness]
    .sort((a, b) => (b.betweenness_centrality! || 0) - (a.betweenness_centrality! || 0))
    .slice(0, 10)

  return (
    <>
      <div style={{
        padding: '24px',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Métricas Avanzadas de Grafo
          </h3>
          <button
            onClick={() => setSelectedMetric('general')}
            style={{
              padding: '6px 12px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Info size={14} />
            Info General
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Core Number */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Network size={24} />
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Core Number (K-Core)</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                  Cohesión estructural del grafo
                </p>
              </div>
              <button
                onClick={() => setSelectedMetric('core')}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Info size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{maxCore}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Máximo K-Core</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{avgCore.toFixed(2)}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Promedio</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{nodesWithCore.length}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Nodos analizados</div>
              </div>
            </div>
          </div>

          {/* PageRank */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <TrendingUp size={24} />
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>PageRank</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                  Importancia global en la red
                </p>
              </div>
              <button
                onClick={() => setSelectedMetric('pagerank')}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Info size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{maxPageRank.toFixed(4)}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Máximo</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{avgPageRank.toFixed(4)}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Promedio</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{nodesWithPageRank.length}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Nodos analizados</div>
              </div>
            </div>
          </div>

          {/* Betweenness Centrality */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <GitBranch size={24} />
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Betweenness Centrality</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                  Control de flujo de información
                </p>
              </div>
              <button
                onClick={() => setSelectedMetric('betweenness')}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Info size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{maxBetweenness.toFixed(2)}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Máximo</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{avgBetweenness.toFixed(2)}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Promedio</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{nodesWithBetweenness.length}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Nodos analizados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top usuarios por cada métrica */}
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* Top por Core Number */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              Top 10 por Core Number
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topByCore.map((node, idx) => (
                <div
                  key={node.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: idx < 3 ? '#f9fafb' : 'transparent',
                    borderRadius: '8px',
                    border: idx < 3 ? '1px solid #e5e7eb' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#f97316' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: idx < 3 ? 'white' : '#6b7280'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>@{node.label}</span>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#667eea',
                    padding: '4px 8px',
                    background: '#ede9fe',
                    borderRadius: '6px'
                  }}>
                    {node.core_number}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top por PageRank */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              Top 10 por PageRank
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topByPageRank.map((node, idx) => (
                <div
                  key={node.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: idx < 3 ? '#fef2f2' : 'transparent',
                    borderRadius: '8px',
                    border: idx < 3 ? '1px solid #fecaca' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#f97316' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: idx < 3 ? 'white' : '#6b7280'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>@{node.label}</span>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#f5576c',
                    padding: '4px 8px',
                    background: '#fce7f3',
                    borderRadius: '6px'
                  }}>
                    {node.eigenvector_centrality!.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top por Betweenness */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              Top 10 por Betweenness
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topByBetweenness.map((node, idx) => (
                <div
                  key={node.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: idx < 3 ? '#ecfeff' : 'transparent',
                    borderRadius: '8px',
                    border: idx < 3 ? '1px solid #a5f3fc' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#f97316' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: idx < 3 ? 'white' : '#6b7280'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>@{node.label}</span>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#0891b2',
                    padding: '4px 8px',
                    background: '#cffafe',
                    borderRadius: '6px'
                  }}>
                    {node.betweenness_centrality!.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modales informativos */}
      <InfoModal
        isOpen={selectedMetric === 'general'}
        onClose={() => setSelectedMetric(null)}
        title="Métricas Avanzadas de Grafo"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>¿Qué son?</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              Las métricas avanzadas de grafo son algoritmos matemáticos que analizan la estructura de la red para identificar
              usuarios clave, patrones de influencia y cohesión estructural.
            </p>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Aplicaciones</h4>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <li><strong>Core Number:</strong> Identificar el núcleo más cohesionado de la red</li>
              <li><strong>PageRank:</strong> Detectar usuarios con mayor influencia global</li>
              <li><strong>Betweenness:</strong> Encontrar usuarios que controlan el flujo de información</li>
            </ul>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Referencias Académicas</h4>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#6b7280', fontSize: '13px', lineHeight: '1.6' }}>
              <li>Batagelj, V., & Zaversnik, M. (2003). An O(m) algorithm for cores decomposition of networks.</li>
              <li>Page, L., et al. (1999). The PageRank citation ranking: Bringing order to the web.</li>
              <li>Freeman, L. C. (1977). A set of measures of centrality based on betweenness.</li>
            </ul>
          </section>
        </div>
      </InfoModal>

      <InfoModal
        isOpen={selectedMetric === 'core'}
        onClose={() => setSelectedMetric(null)}
        title="Core Number (K-Core Decomposition)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Definición</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              El <strong>Core Number</strong> (o k-core) de un nodo es el subgrafo maximal en el que cada nodo tiene al menos k conexiones.
              Identifica el núcleo más densamente conectado de la red.
            </p>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Interpretación</h4>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <li><strong>K-Core alto:</strong> Usuarios en el núcleo cohesionado de la conversación</li>
              <li><strong>K-Core bajo:</strong> Usuarios periféricos con pocas conexiones</li>
              <li><strong>Máximo k-core:</strong> Indica la máxima cohesión estructural de la red</li>
            </ul>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Aplicaciones en ARS</h4>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <li>Identificar comunidades cohesionadas</li>
              <li>Detectar el "inner circle" de influenciadores</li>
              <li>Analizar la robustez estructural de la red</li>
            </ul>
          </section>
        </div>
      </InfoModal>

      <InfoModal
        isOpen={selectedMetric === 'pagerank'}
        onClose={() => setSelectedMetric(null)}
        title="PageRank"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Definición</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>PageRank</strong> es un algoritmo que mide la importancia de un nodo basándose en la cantidad y calidad de sus conexiones.
              Un nodo es importante si está conectado a otros nodos importantes.
            </p>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Interpretación</h4>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <li><strong>PageRank alto:</strong> Usuario con influencia global en la red</li>
              <li><strong>PageRank bajo:</strong> Usuario con influencia local o nula</li>
              <li><strong>Distribución:</strong> Redes con alta concentración indican centralización del poder</li>
            </ul>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Diferencia con grado</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              A diferencia del grado (número de conexiones), PageRank considera la <strong>calidad</strong> de las conexiones.
              Un usuario mencionado por influencers tendrá mayor PageRank que uno mencionado por usuarios periféricos.
            </p>
          </section>
        </div>
      </InfoModal>

      <InfoModal
        isOpen={selectedMetric === 'betweenness'}
        onClose={() => setSelectedMetric(null)}
        title="Betweenness Centrality"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Definición</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <strong>Betweenness Centrality</strong> mide cuántas veces un nodo actúa como puente en el camino más corto entre otros dos nodos.
              Identifica usuarios que controlan el flujo de información.
            </p>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Interpretación</h4>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <li><strong>Betweenness alto:</strong> Usuario "puente" entre comunidades o grupos</li>
              <li><strong>Betweenness bajo:</strong> Usuario dentro de una comunidad cerrada</li>
              <li><strong>Gatekeepers:</strong> Usuarios con alto betweenness controlan qué información pasa entre grupos</li>
            </ul>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Aplicaciones</h4>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
              <li>Identificar "brokers" de información</li>
              <li>Detectar usuarios que conectan comunidades polarizadas</li>
              <li>Analizar vulnerabilidades: eliminar usuarios con alto betweenness fragmenta la red</li>
            </ul>
          </section>

          <section>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Nota técnica</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', lineHeight: '1.6', fontStyle: 'italic' }}>
              En redes grandes (&gt;1000 nodos), se usa <strong>sampling</strong> para calcular betweenness de forma eficiente,
              analizando una muestra representativa de caminos más cortos.
            </p>
          </section>
        </div>
      </InfoModal>
    </>
  )
}
