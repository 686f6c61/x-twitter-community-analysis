import { useState } from 'react'
import { Info } from 'lucide-react'
import type { Node } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'

interface CentralityMetricsProps {
  nodes: Node[]
}

type CentralityType = 'degree' | 'betweenness' | 'closeness' | 'eigenvector' | 'kcore' | 'core_number'

interface MetricInfo {
  title: string
  description: string
  propertyKey: keyof Node
  formatValue: (value: number) => string
}

const METRIC_INFO: Record<CentralityType, MetricInfo> = {
  degree: {
    title: 'Degree Centrality',
    description: 'Mide cuántas conexiones directas tiene un nodo. Usuarios con alto degree son muy activos en mencionar o ser mencionados.',
    propertyKey: 'degree_centrality',
    formatValue: (value: number) => value.toFixed(4)
  },
  betweenness: {
    title: 'Betweenness Centrality',
    description: 'Mide cuántas veces un nodo actúa como puente entre otros. Usuarios con alto betweenness son conectores clave entre comunidades.',
    propertyKey: 'betweenness_centrality',
    formatValue: (value: number) => value.toFixed(4)
  },
  closeness: {
    title: 'Closeness Centrality',
    description: 'Mide qué tan cerca está un nodo de todos los demás. Usuarios con alto closeness pueden difundir información rápidamente.',
    propertyKey: 'closeness_centrality',
    formatValue: (value: number) => value.toFixed(4)
  },
  eigenvector: {
    title: 'Eigenvector Centrality',
    description: 'Mide la influencia basada en la calidad de las conexiones. Usuarios conectados a otros influyentes tienen mayor eigenvector.',
    propertyKey: 'eigenvector_centrality',
    formatValue: (value: number) => value.toFixed(4)
  },
  kcore: {
    title: 'K-Core',
    description: 'Mide la cohesión del nodo en la red. Un nodo con k-core = n pertenece a un subgrafo donde todos tienen al menos n conexiones.',
    propertyKey: 'kcore',
    formatValue: (value: number) => value.toString()
  },
  core_number: {
    title: 'Core Number',
    description: 'Shell index del nodo. Indica el k-shell más alto al que pertenece. Versión más granular que k-core para diferenciar nodos.',
    propertyKey: 'core_number',
    formatValue: (value: number) => value.toString()
  }
}

export function CentralityMetrics({ nodes }: CentralityMetricsProps) {
  // Determinar qué métricas están disponibles
  const availableMetrics = (['degree', 'betweenness', 'closeness', 'eigenvector', 'kcore', 'core_number'] as CentralityType[]).filter(
    metricType => {
      const propertyKey = METRIC_INFO[metricType].propertyKey
      return nodes.some(node => {
        const value = node[propertyKey]
        return value !== undefined && value !== null && value > 0
      })
    }
  )

  const [activeTab, setActiveTab] = useState<CentralityType>(availableMetrics[0] || 'degree')
  const [showInfo, setShowInfo] = useState(false)

  const getTopNodes = (metricType: CentralityType, limit: number = 10): Node[] => {
    const metric = METRIC_INFO[metricType]
    const propertyKey = metric.propertyKey

    return [...nodes]
      .filter(node => {
        const value = node[propertyKey]
        return value !== undefined && value !== null && value > 0
      })
      .sort((a, b) => {
        const aValue = a[propertyKey] as number
        const bValue = b[propertyKey] as number

        // Ordenar por la métrica principal
        if (bValue !== aValue) {
          return bValue - aValue
        }

        // Si son iguales, usar degree_centrality como criterio secundario
        const aDegree = a.degree_centrality || 0
        const bDegree = b.degree_centrality || 0
        return bDegree - aDegree
      })
      .slice(0, limit)
  }

  const topNodes = getTopNodes(activeTab)
  const maxValue = topNodes.length > 0 ? (topNodes[0][METRIC_INFO[activeTab].propertyKey] as number) : 1

  // Si no hay métricas disponibles, mostrar mensaje
  if (availableMetrics.length === 0) {
    return (
      <div className="centrality-panel">
        <div className="centrality-header">
          <h3 className="centrality-title">Métricas de Centralidad</h3>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No hay métricas de centralidad disponibles
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="centrality-panel">
        <div className="centrality-header">
          <h3 className="centrality-title">Métricas de Centralidad</h3>
          <button
            className="info-button"
            onClick={() => setShowInfo(true)}
            title="Información sobre centralidad"
          >
            <Info />
          </button>
        </div>

        {/* Tabs - solo mostrar métricas disponibles */}
        <div className="centrality-tabs">
          {availableMetrics.includes('degree') && (
            <button
              className={`centrality-tab ${activeTab === 'degree' ? 'active' : ''}`}
              onClick={() => setActiveTab('degree')}
            >
              Degree
            </button>
          )}
          {availableMetrics.includes('betweenness') && (
            <button
              className={`centrality-tab ${activeTab === 'betweenness' ? 'active' : ''}`}
              onClick={() => setActiveTab('betweenness')}
            >
              Betweenness
            </button>
          )}
          {availableMetrics.includes('closeness') && (
            <button
              className={`centrality-tab ${activeTab === 'closeness' ? 'active' : ''}`}
              onClick={() => setActiveTab('closeness')}
            >
              Closeness
            </button>
          )}
          {availableMetrics.includes('eigenvector') && (
            <button
              className={`centrality-tab ${activeTab === 'eigenvector' ? 'active' : ''}`}
              onClick={() => setActiveTab('eigenvector')}
            >
              Eigenvector
            </button>
          )}
          {availableMetrics.includes('kcore') && (
            <button
              className={`centrality-tab ${activeTab === 'kcore' ? 'active' : ''}`}
              onClick={() => setActiveTab('kcore')}
            >
              K-Core
            </button>
          )}
          {availableMetrics.includes('core_number') && (
            <button
              className={`centrality-tab ${activeTab === 'core_number' ? 'active' : ''}`}
              onClick={() => setActiveTab('core_number')}
            >
              Core Number
            </button>
          )}
        </div>

        {/* Content */}
        <div className="centrality-content">
          <div className="centrality-section-header">
            <h4>{METRIC_INFO[activeTab].title}</h4>
            <span className="node-count">Top {topNodes.length}</span>
          </div>

          {topNodes.length === 0 ? (
            <div className="centrality-empty">
              <p>No hay datos disponibles para esta métrica</p>
            </div>
          ) : (
            <div className="centrality-list">
              {topNodes.map((node, index) => {
                const value = node[METRIC_INFO[activeTab].propertyKey] as number
                const percentage = (value / maxValue) * 100

                return (
                  <div key={node.id} className="centrality-item">
                    <div className="centrality-rank">#{index + 1}</div>
                    <div className="centrality-user-info">
                      <div className="centrality-username">@{node.id}</div>
                      <div className="centrality-name">{node.label}</div>
                    </div>
                    <div className="centrality-metric">
                      <div className="centrality-value">
                        {METRIC_INFO[activeTab].formatValue(value)}
                      </div>
                      <div className="centrality-bar-container">
                        <div
                          className="centrality-bar-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Métricas de Centralidad"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.6' }}>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Las <strong>métricas de centralidad</strong> identifican los nodos más importantes de la red según diferentes criterios.
              Todas las métricas están <strong>normalizadas entre 0 y 1</strong>, donde valores cercanos a 1 indican mayor centralidad.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px', color: '#1f2937' }}>
              🔗 Degree Centrality
            </h4>
            <p style={{ marginBottom: '12px' }}>{METRIC_INFO.degree.description}</p>

            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
              <strong>Cálculo:</strong> Número de conexiones / (Total de nodos - 1)
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Interpretación de valores:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li><strong>0.0 - 0.2:</strong> Nodo periférico, pocas conexiones</li>
                <li><strong>0.2 - 0.5:</strong> Nodo con actividad moderada</li>
                <li><strong>0.5 - 0.8:</strong> Nodo muy activo, hub local</li>
                <li><strong>0.8 - 1.0:</strong> Superhub, conectado a casi todos</li>
              </ul>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>Uso práctico:</strong> Identificar usuarios muy activos en menciones, cuentas que generan mucha conversación directa.
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px', color: '#1f2937' }}>
              🌉 Betweenness Centrality
            </h4>
            <p style={{ marginBottom: '12px' }}>{METRIC_INFO.betweenness.description}</p>

            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
              <strong>Algoritmo:</strong> Brandes (2001) - Cuenta cuántos caminos más cortos pasan por cada nodo
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Interpretación de valores:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li><strong>0.0 - 0.1:</strong> No actúa como intermediario</li>
                <li><strong>0.1 - 0.3:</strong> Puente local entre grupos pequeños</li>
                <li><strong>0.3 - 0.6:</strong> Conector importante entre comunidades</li>
                <li><strong>0.6 - 1.0:</strong> Broker crítico, único puente entre comunidades grandes</li>
              </ul>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>Uso práctico:</strong> Identificar mediadores, cuentas que conectan diferentes burbujas ideológicas o comunidades.
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px', color: '#1f2937' }}>
              📡 Closeness Centrality
            </h4>
            <p style={{ marginBottom: '12px' }}>{METRIC_INFO.closeness.description}</p>

            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
              <strong>Cálculo:</strong> (Total nodos - 1) / Suma de distancias a todos los demás nodos
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Interpretación de valores:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li><strong>0.0 - 0.2:</strong> Nodo aislado o en periferia de la red</li>
                <li><strong>0.2 - 0.4:</strong> Distancia moderada del centro</li>
                <li><strong>0.4 - 0.7:</strong> Bien posicionado para difundir información</li>
                <li><strong>0.7 - 1.0:</strong> Centro absoluto, alcanza a todos rápidamente</li>
              </ul>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>Uso práctico:</strong> Identificar cuentas estratégicas para viralizar contenido, usuarios centrales en la red.
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px', color: '#1f2937' }}>
              ⭐ Eigenvector Centrality
            </h4>
            <p style={{ marginBottom: '12px' }}>{METRIC_INFO.eigenvector.description}</p>

            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
              <strong>Algoritmo:</strong> Power Iteration - La centralidad de un nodo es proporcional a la suma de centralidades de sus vecinos
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Interpretación de valores:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li><strong>0.0 - 0.2:</strong> Conectado a nodos poco influyentes</li>
                <li><strong>0.2 - 0.5:</strong> Influencia moderada en la red</li>
                <li><strong>0.5 - 0.8:</strong> Alta influencia, conectado a nodos importantes</li>
                <li><strong>0.8 - 1.0:</strong> Máxima influencia, parte del núcleo elite de la red</li>
              </ul>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>Uso práctico:</strong> Identificar verdaderos influencers (no solo por cantidad sino por calidad de conexiones), élites de poder en la red.
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px', color: '#1f2937' }}>
              🔰 K-Core
            </h4>
            <p style={{ marginBottom: '12px' }}>{METRIC_INFO.kcore.description}</p>

            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
              <strong>Algoritmo:</strong> K-Core Decomposition - Remueve iterativamente nodos con grado menor a k hasta que todos los restantes tienen grado ≥ k
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Interpretación de valores:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li><strong>k = 1-2:</strong> Nodo periférico, pocas conexiones mutuas</li>
                <li><strong>k = 3-5:</strong> Parte de grupos moderadamente cohesionados</li>
                <li><strong>k = 6-10:</strong> Núcleo cohesivo, parte de comunidades densas</li>
                <li><strong>k &gt; 10:</strong> Núcleo central, parte del corazón de la red</li>
              </ul>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>Uso práctico:</strong> Identificar núcleos cohesivos de la red, usuarios que forman el "corazón" de comunidades densamente conectadas.
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '16px', color: '#1f2937' }}>
              🎯 Core Number (Shell Index)
            </h4>
            <p style={{ marginBottom: '12px' }}>{METRIC_INFO.core_number.description}</p>

            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '8px' }}>
              <strong>Algoritmo:</strong> Shell Decomposition (Batagelj-Zaversnik, 2003) - Procesa nodos por orden de grado, asignando cada nodo al k-shell más alto al que pertenece
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Diferencia con K-Core:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li>K-Core: Valor binario (pertenece o no a un k-core específico)</li>
                <li>Core Number: Valor gradual que diferencia mejor entre nodos</li>
                <li>Core Number provee mayor granularidad y ranking más preciso</li>
              </ul>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Interpretación de valores:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
                <li><strong>core = 1-2:</strong> Periferia, conexiones débiles</li>
                <li><strong>core = 3-5:</strong> Capa intermedia de la red</li>
                <li><strong>core = 6-10:</strong> Núcleo denso, alta cohesión local</li>
                <li><strong>core &gt; 10:</strong> Corazón de la red, máxima densidad estructural</li>
              </ul>
            </div>

            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
              <strong>Uso práctico:</strong> Ranking fino de usuarios por posición estructural en la red. Útil cuando K-Core no diferencia suficiente (todos tienen el mismo valor).
            </div>

            <div style={{ background: '#e8f4f8', padding: '12px', borderRadius: '6px', marginTop: '12px', fontSize: '13px' }}>
              <strong>📚 Referencia:</strong> Batagelj, V., & Zaversnik, M. (2003). An O(m) algorithm for cores decomposition of networks. arXiv preprint cs/0310049.
            </div>
          </div>

          <div style={{ background: '#fff8e1', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #fbbf24' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '8px', marginTop: 0, fontSize: '14px' }}>
              💡 Comparando las Métricas
            </h4>
            <ul style={{ marginBottom: 0, paddingLeft: '20px', fontSize: '13px' }}>
              <li><strong>Degree alto + Betweenness bajo:</strong> Hub aislado, muchas conexiones en su burbuja</li>
              <li><strong>Degree bajo + Betweenness alto:</strong> Puente estratégico entre comunidades</li>
              <li><strong>Closeness alto + Degree bajo:</strong> Bien posicionado sin ser protagonista</li>
              <li><strong>Eigenvector alto + Degree bajo:</strong> Conectado a pocos pero muy influyentes</li>
              <li><strong>K-Core alto + Degree moderado:</strong> Núcleo cohesivo, conexiones densas y recíprocas</li>
              <li><strong>Core Number alto:</strong> Posición estructural privilegiada, parte del núcleo más denso</li>
            </ul>
          </div>
        </div>
      </InfoModal>
    </>
  )
}
