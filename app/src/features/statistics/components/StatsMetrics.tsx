import { useState } from 'react'
import { Network, Link, MessageSquare, Heart, Users, Download, Eye, AlertTriangle } from 'lucide-react'
import type { Statistics } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'
import { useGraphStore } from '@/lib/store/graphStore'

interface StatsMetricsProps {
  stats: Statistics
}

type MetricKey = 'nodes' | 'edges' | 'density' | 'communities' | 'modularity' | 'tweets' | 'engagement'
type GraphType = 'mentions' | 'cohashtags'

export function StatsMetrics({ stats }: StatsMetricsProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null)
  const [selectedGraphInfo, setSelectedGraphInfo] = useState<GraphType | null>(null)
  const rawTweets = useGraphStore((state) => state.rawTweets)

  // Debug: verificar si hay tweets
  console.log('rawTweets en StatsMetrics:', rawTweets ? rawTweets.length : 'null')

  const handleDownloadTweets = () => {
    if (!rawTweets || rawTweets.length === 0) {
      alert('No hay tweets disponibles para descargar')
      return
    }

    // Crear JSON con formato bonito
    const jsonContent = JSON.stringify({ tweets: rawTweets }, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `tweets_${Date.now()}.json`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Mentions graph metrics
  const mentionsMetrics = [
    {
      key: 'nodes' as MetricKey,
      label: 'Nodos',
      value: stats.nodes?.toLocaleString() || '0',
      icon: Network,
    },
    {
      key: 'edges' as MetricKey,
      label: 'Aristas',
      value: stats.edges?.toLocaleString() || '0',
      icon: Link,
    },
    {
      key: 'density' as MetricKey,
      label: 'Densidad',
      value: ((stats.density || 0) * 1000).toFixed(4),
      icon: Network,
    },
    {
      key: 'communities' as MetricKey,
      label: 'Comunidades',
      value: Array.isArray(stats.communities) ? stats.communities.length.toString() : '0',
      icon: Users,
    },
    {
      key: 'modularity' as MetricKey,
      label: 'Modularidad',
      value: (stats.modularity || 0).toFixed(4),
      icon: Network,
    },
  ]

  // Cohashtags graph metrics
  const cohashtagsMetrics = stats.cohashtagsStats ? [
    {
      key: 'nodes' as MetricKey,
      label: 'Nodos',
      value: stats.cohashtagsStats.nodes?.toLocaleString() || '0',
      icon: Network,
    },
    {
      key: 'edges' as MetricKey,
      label: 'Aristas',
      value: stats.cohashtagsStats.edges?.toLocaleString() || '0',
      icon: Link,
    },
    {
      key: 'density' as MetricKey,
      label: 'Densidad',
      value: ((stats.cohashtagsStats.density || 0) * 1000).toFixed(4),
      icon: Network,
    },
    {
      key: 'communities' as MetricKey,
      label: 'Comunidades',
      value: stats.cohashtagsStats.communities?.toString() || '0',
      icon: Users,
    },
    {
      key: 'modularity' as MetricKey,
      label: 'Modularidad',
      value: (stats.cohashtagsStats.modularity || 0).toFixed(4),
      icon: Network,
    },
  ] : []

  // General metrics
  const generalMetrics = [
    {
      key: 'tweets' as MetricKey,
      label: 'Total Tweets',
      value: stats.total_tweets?.toLocaleString() || '0',
      icon: MessageSquare,
    },
    {
      key: 'engagement' as MetricKey,
      label: 'Total Engagement',
      value: stats.total_engagement?.toLocaleString() || '0',
      icon: Heart,
    },
  ]

  const getModalContent = (key: MetricKey) => {
    switch (key) {
      case 'nodes':
        return {
          title: 'Nodos',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>Los <strong>nodos</strong> son los actores individuales de la red. Cada nodo representa un <strong>usuario único</strong>.</p>
            </>
          )
        }
      case 'edges':
        return {
          title: 'Aristas',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>Las <strong>aristas</strong> representan las <strong>relaciones o interacciones</strong> entre usuarios.</p>
            </>
          )
        }
      case 'density':
        return {
          title: 'Densidad',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>La <strong>densidad</strong> mide la proporción de conexiones existentes respecto al máximo posible.</p>
            </>
          )
        }
      case 'communities':
        return {
          title: 'Comunidades',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>Las <strong>comunidades</strong> son grupos densamente conectados detectados por el algoritmo de Louvain.</p>
            </>
          )
        }
      case 'modularity':
        return {
          title: 'Modularidad',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es la modularidad?</h4>
              <p>La <strong>modularidad (Q)</strong> es una métrica fundamental que cuantifica <strong>qué tan bien se divide una red en comunidades</strong>. Mide si los nodos dentro de cada comunidad están más conectados entre sí que con nodos de otras comunidades.</p>

              <h4 style={{ marginBottom: '12px' }}>Cómo se calcula</h4>
              <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', textAlign: 'center', margin: '16px 0', fontSize: '14px' }}>
                Q = (1/2m) × Σ [A<sub>ij</sub> - (k<sub>i</sub> × k<sub>j</sub>)/(2m)] × δ(c<sub>i</sub>, c<sub>j</sub>)
              </p>
              <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
                Donde <em>m</em> es el número de aristas, <em>A<sub>ij</sub></em> indica si existe conexión entre nodos <em>i</em> y <em>j</em>, <em>k<sub>i</sub></em> es el grado (número de conexiones) del nodo <em>i</em>, y <em>δ(c<sub>i</sub>, c<sub>j</sub>)</em> vale 1 si los nodos están en la misma comunidad, 0 si no.
              </p>
              <p style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '12px' }}>
                En términos simples: compara las conexiones <strong>reales dentro de comunidades</strong> con las que se esperarían en una red <strong>aleatoria</strong> donde los nodos se conectan sin formar grupos.
              </p>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Escala e interpretación</h4>
              <p>La modularidad varía entre <strong>-1 y +1</strong>, aunque en redes reales los valores suelen estar entre <strong>0 y 1</strong>:</p>
              <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: 1.8 }}>
                <li><strong>Q {"<"} 0.3:</strong> <span style={{ color: '#dc2626' }}>Comunidades débiles o inexistentes</span> - La red es relativamente homogénea sin estructura modular clara</li>
                <li><strong>0.3 ≤ Q {"<"} 0.5:</strong> <span style={{ color: '#f59e0b' }}>Comunidades moderadas</span> - Estructura modular detectable pero no muy marcada</li>
                <li><strong>0.5 ≤ Q {"<"} 0.7:</strong> <span style={{ color: '#10b981' }}>Comunidades bien definidas</span> - Clara división en grupos con identidad propia</li>
                <li><strong>Q ≥ 0.7:</strong> <span style={{ color: '#3b82f6' }}>Comunidades muy fuertes</span> - La red está altamente modularizada con grupos muy cohesionados y aislados</li>
              </ul>
              <p style={{ fontSize: '13px', color: '#666', marginTop: '12px', background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                <strong>Valores típicos en redes sociales reales:</strong> 0.3 - 0.7. Valores superiores a 0.7 indican comunidades excepcionalmente definidas o alto grado de aislamiento entre grupos (posible fragmentación social o cámaras de eco).
              </p>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>¿Por qué es importante?</h4>
              <ul style={{ marginLeft: '20px', fontSize: '14px', lineHeight: 1.8 }}>
                <li><strong>Validación de comunidades:</strong> Confirma que las comunidades detectadas no son arbitrarias, sino estructuras reales de la red</li>
                <li><strong>Polarización social:</strong> Modularidad alta indica grupos aislados que interactúan poco entre sí (fragmentación, cámaras de eco)</li>
                <li><strong>Calidad del algoritmo:</strong> Permite comparar diferentes métodos de detección de comunidades (Louvain, Girvan-Newman, etc.)</li>
                <li><strong>Análisis político:</strong> En debates políticos, Q alta revela polarización entre bloques ideológicos sin diálogo cruzado</li>
                <li><strong>Detección de campañas:</strong> Comunidades artificiales (bots, campañas coordinadas) suelen tener modularidad extremadamente alta</li>
              </ul>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Ejemplo práctico</h4>
              <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '6px', fontSize: '13px', lineHeight: 1.6, borderLeft: '3px solid #3b82f6' }}>
                <p style={{ margin: '0 0 8px 0' }}><strong>Escenario: Debate sobre política española</strong></p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Modularidad = 0.664</strong> (alta)</p>
                <p style={{ margin: '0' }}>
                  <strong>Interpretación:</strong> La conversación está claramente dividida en comunidades bien definidas. Los usuarios tienden a mencionar principalmente a otros de su mismo grupo, con pocas interacciones entre comunidades. Esto sugiere <strong>polarización</strong>: grupos con posiciones distintas que dialogan poco entre sí, formando posibles "cámaras de eco" donde cada comunidad refuerza sus propias narrativas sin exposición a perspectivas opuestas.
                </p>
              </div>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Limitaciones</h4>
              <ul style={{ marginLeft: '20px', fontSize: '13px', color: '#666', lineHeight: 1.6 }}>
                <li>La modularidad favorece divisiones en comunidades de tamaño similar (resolution limit)</li>
                <li>No detecta comunidades jerárquicas o superpuestas</li>
                <li>Puede dar valores altos incluso en divisiones aleatorias de redes muy dispersas</li>
                <li>No considera la naturaleza de las conexiones (positivas/negativas, fuertes/débiles)</li>
              </ul>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Referencias</h4>
              <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
                • Newman, M. E. (2006). "Modularity and community structure in networks"<br/>
                • Blondel et al. (2008). "Fast unfolding of communities in large networks" (algoritmo de Louvain)<br/>
                • Fortunato, S. (2010). "Community detection in graphs" - Physics Reports
              </p>
            </>
          )
        }
      case 'tweets':
        return {
          title: 'Total Tweets',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué representa?</h4>
              <p>El <strong>total de tweets</strong> en el dataset analizado.</p>
            </>
          )
        }
      case 'engagement':
        return {
          title: 'Total Engagement',
          content: (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es el Total Engagement?</h4>
              <p>El <strong>Total Engagement</strong> es una métrica agregada que mide la <strong>interacción total</strong> generada por el conjunto de tweets en el dataset. Representa el volumen absoluto de respuestas de la audiencia.</p>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Fórmula de Cálculo</h4>
              <p style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
                Total Engagement = Σ (Likes + Views + Replies)
              </p>
              <p style={{ fontSize: '14px' }}>
                Se suman todas las interacciones de todos los tweets del dataset:
              </p>
              <ul style={{ marginLeft: '20px', lineHeight: 1.8, fontSize: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Heart size={16} style={{ color: '#ef4444' }} />
                  <span><strong>Likes:</strong> Número total de "me gusta" recibidos</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Eye size={16} style={{ color: '#3b82f6' }} />
                  <span><strong>Views:</strong> Número total de visualizaciones (impresiones)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={16} style={{ color: '#10b981' }} />
                  <span><strong>Replies:</strong> Número total de respuestas recibidas</span>
                </li>
              </ul>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Ejemplo de Cálculo</h4>
              <p style={{ fontSize: '13px', color: '#666', background: '#f0f9ff', padding: '12px', borderRadius: '6px' }}>
                <strong>Dataset con 100 tweets:</strong><br/>
                • Tweet 1: 10 likes + 100 views + 2 replies = 112 engagement<br/>
                • Tweet 2: 5 likes + 50 views + 1 reply = 56 engagement<br/>
                • ... (resto de tweets)<br/>
                • <strong>Total Engagement = 112 + 56 + ... = 4,183</strong>
              </p>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>¿Qué significa mi número?</h4>
              <p style={{ fontSize: '14px' }}>El engagement total depende fuertemente del <strong>tamaño del dataset</strong> y del <strong>alcance de los tweets</strong>.</p>

              <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', marginBottom: '16px', marginTop: '16px' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600, color: '#1e40af' }}>Tu Dataset</h5>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Total de tweets:</strong> {stats.total_tweets?.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Total engagement:</strong> {stats.total_engagement?.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '14px' }}>
                  <strong>Engagement promedio por tweet:</strong> {stats.total_tweets && stats.total_engagement ? Math.round(stats.total_engagement / stats.total_tweets).toLocaleString() : '0'} interacciones
                </div>
              </div>

              <div style={{ background: '#fffbf0', padding: '12px', borderRadius: '6px', marginBottom: '12px', borderLeft: '3px solid #f59e0b' }}>
                <strong>Escala de referencia para tu dataset ({
                  (stats.total_tweets || 0) <= 100 ? 'pequeño' :
                  (stats.total_tweets || 0) <= 1000 ? 'mediano' :
                  'grande'
                }):</strong>
                <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6, marginTop: '8px', marginBottom: 0 }}>
                  {(stats.total_tweets || 0) <= 100 ? (
                    <>
                      <li><strong>Bajo:</strong> &lt; 500 engagement</li>
                      <li><strong>Moderado:</strong> 500 - 2,000</li>
                      <li><strong>Alto:</strong> &gt; 2,000</li>
                    </>
                  ) : (stats.total_tweets || 0) <= 1000 ? (
                    <>
                      <li><strong>Bajo:</strong> &lt; 5,000 engagement</li>
                      <li><strong>Moderado:</strong> 5,000 - 50,000</li>
                      <li><strong>Alto:</strong> &gt; 50,000</li>
                    </>
                  ) : (
                    <>
                      <li><strong>Bajo:</strong> &lt; 100,000 engagement</li>
                      <li><strong>Moderado:</strong> 100,000 - 1,000,000</li>
                      <li><strong>Alto:</strong> &gt; 1,000,000</li>
                    </>
                  )}
                </ul>
                <p style={{ fontSize: '13px', marginTop: '12px', marginBottom: 0, fontWeight: 500 }}>
                  Tu nivel: <strong style={{ color:
                    (stats.total_tweets || 0) <= 100 ?
                      ((stats.total_engagement || 0) < 500 ? '#ef4444' : (stats.total_engagement || 0) < 2000 ? '#f59e0b' : '#10b981') :
                    (stats.total_tweets || 0) <= 1000 ?
                      ((stats.total_engagement || 0) < 5000 ? '#ef4444' : (stats.total_engagement || 0) < 50000 ? '#f59e0b' : '#10b981') :
                      ((stats.total_engagement || 0) < 100000 ? '#ef4444' : (stats.total_engagement || 0) < 1000000 ? '#f59e0b' : '#10b981')
                  }}>
                    {(stats.total_tweets || 0) <= 100 ?
                      ((stats.total_engagement || 0) < 500 ? 'Bajo' : (stats.total_engagement || 0) < 2000 ? 'Moderado' : 'Alto') :
                    (stats.total_tweets || 0) <= 1000 ?
                      ((stats.total_engagement || 0) < 5000 ? 'Bajo' : (stats.total_engagement || 0) < 50000 ? 'Moderado' : 'Alto') :
                      ((stats.total_engagement || 0) < 100000 ? 'Bajo' : (stats.total_engagement || 0) < 1000000 ? 'Moderado' : 'Alto')
                    }
                  </strong>
                </p>
              </div>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Fundamento Académico</h4>
              <p style={{ fontSize: '14px' }}>
                El <strong>Total Engagement</strong> como métrica surge de la literatura sobre <strong>Social Media Analytics</strong> y <strong>Digital Marketing Research</strong>:
              </p>
              <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.8 }}>
                <li><strong>Engagement como proxy de influencia:</strong> Kaplan & Haenlein (2010) establecen que las métricas de interacción en redes sociales reflejan el nivel de atención y compromiso de la audiencia</li>
                <li><strong>Métricas de visibilidad vs. interacción:</strong> Hoffman & Fodor (2010) distinguen entre <em>reach</em> (views) y <em>engagement</em> (likes, replies) como indicadores complementarios de efectividad comunicativa</li>
                <li><strong>Agregación de métricas:</strong> Peters et al. (2013) proponen sumar diferentes tipos de interacciones para obtener una métrica unificada de respuesta de la audiencia</li>
              </ul>

              <p style={{ fontSize: '13px', color: '#666', background: '#f9fafb', padding: '10px', borderRadius: '6px', marginTop: '12px' }}>
                <strong>Referencias:</strong><br/>
                • Kaplan, A. M., & Haenlein, M. (2010). Users of the world, unite! The challenges and opportunities of Social Media. <em>Business Horizons</em>, 53(1), 59-68.<br/>
                • Hoffman, D. L., & Fodor, M. (2010). Can you measure the ROI of your social media marketing? <em>MIT Sloan Management Review</em>, 52(1), 41-49.<br/>
                • Peters, K., et al. (2013). Social Media Metrics — A Framework and Guidelines for Managing Social Media. <em>Journal of Interactive Marketing</em>, 27(4), 281-298.
              </p>

              <h4 style={{ marginBottom: '12px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                Limitaciones de la Métrica
              </h4>
              <div style={{ fontSize: '13px', color: '#666', background: '#fff5f5', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                <strong>Advertencias importantes:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '8px', marginBottom: 0 }}>
                  <li><strong>No distingue calidad:</strong> Un view cuenta igual que un like, pero tienen diferentes niveles de compromiso</li>
                  <li><strong>Depende del tamaño:</strong> Más tweets = más engagement, no necesariamente mejor contenido</li>
                  <li><strong>Sesgo temporal:</strong> Tweets antiguos acumulan más engagement que recientes</li>
                  <li><strong>Views inflacionadas:</strong> Las vistas incluyen impresiones pasivas (scrolling sin interacción)</li>
                  <li><strong>Sin normalización:</strong> No considera followers, alcance potencial, ni temporalidad</li>
                </ul>
              </div>

              <h4 style={{ marginBottom: '12px', marginTop: '20px' }}>Métricas Complementarias Recomendadas</h4>
              <p style={{ fontSize: '14px' }}>Para una evaluación más completa, considera también:</p>
              <ul style={{ marginLeft: '20px', fontSize: '13px', lineHeight: 1.6 }}>
                <li><strong>Engagement Rate:</strong> (Total Engagement / Total Views) × 100 — mide el % de conversión de vistas a interacciones</li>
                <li><strong>Engagement por Tweet:</strong> Total Engagement / Número de Tweets — promedio de interacciones</li>
                <li><strong>Distribución del Engagement:</strong> ¿El engagement está concentrado en pocos tweets virales o distribuido uniformemente?</li>
                <li><strong>Likes/Views Ratio:</strong> Mide el compromiso real vs. impresiones pasivas</li>
              </ul>
            </>
          )
        }
      default:
        return { title: '', content: null }
    }
  }

  const currentModal = selectedMetric ? getModalContent(selectedMetric) : { title: '', content: null }

  const renderMetricCard = (metric: typeof mentionsMetrics[0]) => {
    const Icon = metric.icon
    const isTweetsCard = metric.key === 'tweets'

    return (
      <div key={metric.label} className="stat-card" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isTweetsCard && rawTweets && rawTweets.length > 0 && (
            <button
              onClick={handleDownloadTweets}
              style={{
                background: '#333',
                color: 'white',
                border: 'none',
                padding: '6px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#000'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#333'}
              title="Descargar tweets"
            >
              <Download size={14} />
            </button>
          )}
          <InfoButton onClick={() => setSelectedMetric(metric.key)} />
        </div>
        <div className="stat-icon">
          <Icon />
        </div>
        <div className="stat-content">
          <div className="stat-label">{metric.label}</div>
          <div className="stat-value">{metric.value}</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* General Metrics */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {generalMetrics.map(renderMetricCard)}
        </div>
      </div>

      {/* Graph Metrics Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: stats.cohashtagsStats ? '1fr 1fr' : '1fr', gap: '30px' }}>
        {/* Mentions Graph */}
        <div>
          <h3 style={{
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#1f2937',
            borderBottom: '2px solid #3b82f6',
            paddingBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Grafo de Menciones
            <InfoButton onClick={() => setSelectedGraphInfo('mentions')} />
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            {mentionsMetrics.map(renderMetricCard)}
          </div>
        </div>

        {/* Cohashtags Graph */}
        {stats.cohashtagsStats && cohashtagsMetrics.length > 0 && (
          <div>
            <h3 style={{
              marginTop: 0,
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1f2937',
              borderBottom: '2px solid #10b981',
              paddingBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Grafo de Co-hashtags
              <InfoButton onClick={() => setSelectedGraphInfo('cohashtags')} />
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              {cohashtagsMetrics.map(renderMetricCard)}
            </div>
          </div>
        )}
      </div>

      <InfoModal
        isOpen={selectedMetric !== null}
        onClose={() => setSelectedMetric(null)}
        title={currentModal.title}
      >
        {currentModal.content}
      </InfoModal>

      <InfoModal
        isOpen={selectedGraphInfo !== null}
        onClose={() => setSelectedGraphInfo(null)}
        title={selectedGraphInfo === 'mentions' ? 'Grafo de Menciones' : 'Grafo de Co-hashtags'}
      >
        {selectedGraphInfo === 'mentions' ? (
          <>
            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es el Grafo de Menciones?</h4>
            <p>El <strong>Grafo de Menciones</strong> es una red que representa las interacciones directas entre usuarios de Twitter/X a través de menciones (@usuario). Cada nodo es un usuario y cada arista (conexión) indica que un usuario mencionó a otro en un tweet.</p>

            <h4 style={{ marginBottom: '12px' }}>Construcción del grafo</h4>
            <p>Para cada tweet del dataset:</p>
            <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>Extracción de menciones:</strong> Se identifican todos los @usuario presentes en el texto del tweet</li>
              <li><strong>Creación de nodos:</strong> Cada usuario único (autor del tweet y mencionados) se convierte en un nodo</li>
              <li><strong>Creación de aristas:</strong> Se crea una conexión dirigida del autor hacia cada usuario mencionado</li>
              <li><strong>Peso de las aristas:</strong> Si un usuario menciona a otro múltiples veces, el peso de la arista aumenta</li>
            </ol>

            <h4 style={{ marginBottom: '12px' }}>¿Qué revela este grafo?</h4>
            <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>Conversaciones directas:</strong> Muestra quién habla con quién, revelando diálogos, debates y ataques personales</li>
              <li><strong>Líderes de opinión:</strong> Usuarios altamente mencionados son figuras centrales en la conversación</li>
              <li><strong>Estructura de poder:</strong> Identifica quiénes son las voces más escuchadas vs. quiénes solo escuchan</li>
              <li><strong>Polarización:</strong> Comunidades separadas pueden indicar grupos que no dialogan entre sí (cámaras de eco)</li>
              <li><strong>Campañas de acoso:</strong> Patrones de menciones masivas hacia un usuario pueden revelar ataques coordinados</li>
            </ul>

            <h4 style={{ marginBottom: '12px' }}>Métricas clave</h4>
            <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>Nodos:</strong> Total de usuarios participantes en la conversación</li>
              <li><strong>Aristas:</strong> Total de interacciones directas (menciones)</li>
              <li><strong>Densidad:</strong> Qué tan conectados están los usuarios entre sí</li>
              <li><strong>Comunidades:</strong> Grupos de usuarios que interactúan principalmente entre ellos</li>
              <li><strong>Modularidad:</strong> Qué tan separadas están las comunidades (valores altos = alta fragmentación)</li>
            </ul>

            <h4 style={{ marginBottom: '12px' }}>Aplicaciones</h4>
            <p>Este tipo de grafo es fundamental para:</p>
            <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
              <li>Análisis de polarización política</li>
              <li>Detección de influencers y líderes de opinión</li>
              <li>Identificación de campañas de desinformación</li>
              <li>Mapeo de debates públicos y controversias</li>
              <li>Estudio de dinámicas de poder en redes sociales</li>
            </ul>
          </>
        ) : (
          <>
            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué es el Grafo de Co-hashtags?</h4>
            <p>El <strong>Grafo de Co-hashtags</strong> es una red que representa la relación temática entre hashtags. Dos hashtags están conectados cuando aparecen juntos en el mismo tweet. Este grafo revela la estructura conceptual y narrativa de la conversación.</p>

            <h4 style={{ marginBottom: '12px' }}>Construcción del grafo</h4>
            <p>Para cada tweet del dataset:</p>
            <ol style={{ marginLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>Extracción de hashtags:</strong> Se identifican todos los #hashtag presentes en el tweet</li>
              <li><strong>Creación de nodos:</strong> Cada hashtag único se convierte en un nodo</li>
              <li><strong>Creación de aristas:</strong> Se crea una conexión no-dirigida entre todos los pares de hashtags que coexisten en el mismo tweet</li>
              <li><strong>Peso de las aristas:</strong> Si dos hashtags aparecen juntos en múltiples tweets, el peso de la conexión aumenta</li>
            </ol>

            <h4 style={{ marginBottom: '12px' }}>¿Qué revela este grafo?</h4>
            <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>Temas relacionados:</strong> Hashtags conectados indican temas que se discuten en conjunto</li>
              <li><strong>Narrativas:</strong> Clusters de hashtags muestran marcos discursivos o "frames" de interpretación</li>
              <li><strong>Campañas coordinadas:</strong> Hashtags artificialmente asociados revelan estrategias de comunicación</li>
              <li><strong>Evolución temática:</strong> Nuevas conexiones muestran cómo emergen nuevos temas en la conversación</li>
              <li><strong>Segmentación ideológica:</strong> Comunidades de hashtags pueden revelar "burbujas" informativas diferentes</li>
            </ul>

            <h4 style={{ marginBottom: '12px' }}>Métricas clave</h4>
            <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
              <li><strong>Nodos:</strong> Total de hashtags únicos en la conversación</li>
              <li><strong>Aristas:</strong> Total de co-ocurrencias entre hashtags</li>
              <li><strong>Densidad:</strong> Qué tan interconectados están los temas</li>
              <li><strong>Comunidades:</strong> Clusters temáticos o narrativas diferenciadas</li>
              <li><strong>Modularidad:</strong> Qué tan separadas están las narrativas (valores bajos = temas mezclados, valores altos = narrativas aisladas)</li>
            </ul>

            <h4 style={{ marginBottom: '12px' }}>Diferencia con el Grafo de Menciones</h4>
            <p style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
              <strong>Grafo de Menciones:</strong> Red de <em>personas</em> (quién habla con quién)<br/>
              <strong>Grafo de Co-hashtags:</strong> Red de <em>temas</em> (qué temas se relacionan entre sí)
            </p>

            <h4 style={{ marginBottom: '12px' }}>Aplicaciones</h4>
            <p>Este tipo de grafo es fundamental para:</p>
            <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
              <li>Análisis de agenda temática y framing mediático</li>
              <li>Detección de narrativas y contra-narrativas</li>
              <li>Identificación de campañas de hashtag coordinadas</li>
              <li>Mapeo de ecosistemas conceptuales</li>
              <li>Estudio de polarización temática vs. polarización social</li>
            </ul>

            <h4 style={{ marginBottom: '12px' }}>Análisis conjunto</h4>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Comparar ambos grafos es muy revelador: una alta modularidad en menciones (grupos aislados) con baja modularidad en co-hashtags (temas mezclados) sugiere que aunque las personas no dialogan entre sí, sí hablan de temas similares. La combinación inversa indica fragmentación total tanto social como temática.
            </p>
          </>
        )}
      </InfoModal>
    </>
  )
}
