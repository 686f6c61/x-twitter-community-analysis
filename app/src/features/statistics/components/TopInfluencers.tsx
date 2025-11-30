import { useState } from 'react'
import type { Statistics } from '@/types/graph'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'
import { Download } from 'lucide-react'

interface TopInfluencersProps {
  stats: Statistics
}

export function TopInfluencers({ stats }: TopInfluencersProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [showInfluenceScoreInfo, setShowInfluenceScoreInfo] = useState(false)
  const [showFollowersInfo, setShowFollowersInfo] = useState(false)
  const [showTotalEngagementInfo, setShowTotalEngagementInfo] = useState(false)
  const [showReachRatioInfo, setShowReachRatioInfo] = useState(false)
  const [showEngPerTweetInfo, setShowEngPerTweetInfo] = useState(false)
  const [influencersPage, setInfluencersPage] = useState(0)

  const itemsPerPage = 10
  const maxPages = 5 // Máximo 50 usuarios

  if (!stats.top_influencers || stats.top_influencers.length === 0) {
    return null
  }

  // Función para obtener color según reach ratio
  const getReachRatioColor = (reachRatio: string) => {
    const ratio = parseFloat(reachRatio)
    if (isNaN(ratio)) return { bg: '#f9fafb', text: '#374151' }
    if (ratio < 0.01) return { bg: '#f9fafb', text: '#6b7280' }
    if (ratio < 0.10) return { bg: '#f0fdf4', text: '#15803d' }
    if (ratio < 1.00) return { bg: '#fef3c7', text: '#b45309' }
    if (ratio < 5.00) return { bg: '#dbeafe', text: '#1e40af' }
    return { bg: '#fee2e2', text: '#b91c1c' }
  }

  // CSV download handler
  const handleDownloadInfluencers = () => {
    if (!stats.top_influencers || stats.top_influencers.length === 0) {
      alert('No hay datos de influencers disponibles')
      return
    }

    const csvRows = []
    csvRows.push(['username', 'influence_score', 'followers', 'tweets', 'total_engagement', 'reach_ratio', 'engagement_per_tweet'].join(','))

    const allUsers = stats.top_influencers.slice(0, 50)
    allUsers.forEach(user => {
      csvRows.push([
        user.username || user.name || '',
        user.influence_score || 0,
        user.followers || 0,
        user.tweets || 0,
        user.total_engagement || 0,
        user.reach_ratio || '0.0000',
        user.engagement_per_tweet || 0
      ].join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `top_influencers_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Paginación
  const allInfluencers = stats.top_influencers || []
  const totalInfluencersPages = Math.min(Math.ceil(allInfluencers.length / itemsPerPage), maxPages)
  const paginatedInfluencers = allInfluencers.slice(
    influencersPage * itemsPerPage,
    (influencersPage + 1) * itemsPerPage
  )
  const influencersStartIndex = influencersPage * itemsPerPage

  return (
    <>
      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="chart-title" style={{ margin: 0 }}>
            Top Influencers por Reach Ponderado
            <InfoButton onClick={() => setShowInfo(true)} />
          </h3>
          <button
            onClick={handleDownloadInfluencers}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1f2937'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#333'}
          >
            <Download size={16} />
            Descargar CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Usuario</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Influence Score
                    <InfoButton onClick={() => setShowInfluenceScoreInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Followers
                    <InfoButton onClick={() => setShowFollowersInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Tweets</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Total Engagement
                    <InfoButton onClick={() => setShowTotalEngagementInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Reach Ratio
                    <InfoButton onClick={() => setShowReachRatioInfo(true)} />
                  </div>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    Eng/Tweet
                    <InfoButton onClick={() => setShowEngPerTweetInfo(true)} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedInfluencers.map((user, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <a
                        href={`https://twitter.com/${user.username || user.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1f2937', textDecoration: 'none', fontWeight: 500 }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                      >
                        {user.name}
                      </a>
                      {user.verified && <span style={{ color: '#1d9bf0', fontSize: '16px' }} title="Verified">✓</span>}
                      {user.blue_verified && <span style={{ color: '#1d9bf0', fontSize: '16px' }} title="Blue Verified">🔵</span>}
                    </div>
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    background: `linear-gradient(90deg, rgba(16, 185, 129, 0.1) ${Math.min(100, user.influence_score / 1000)}%, transparent ${Math.min(100, user.influence_score / 1000)}%)`
                  }}>
                    {user.influence_score.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.followers.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.tweets.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.total_engagement.toLocaleString()}
                  </td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'right',
                    background: getReachRatioColor(user.reach_ratio).bg,
                    color: getReachRatioColor(user.reach_ratio).text,
                    fontWeight: 600
                  }}>
                    {user.reach_ratio}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {user.engagement_per_tweet.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {allInfluencers.length > itemsPerPage && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setInfluencersPage(Math.max(0, influencersPage - 1))}
              disabled={influencersPage === 0}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: influencersPage === 0 ? '#f9fafb' : 'white',
                color: influencersPage === 0 ? '#9ca3af' : '#374151',
                cursor: influencersPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (influencersPage > 0) e.currentTarget.style.background = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                if (influencersPage > 0) e.currentTarget.style.background = 'white'
              }}
            >
              ← Anterior
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                Mostrando {influencersStartIndex + 1}-{Math.min(influencersStartIndex + itemsPerPage, allInfluencers.length)} de {Math.min(allInfluencers.length, maxPages * itemsPerPage)}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>•</span>
              <span style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>
                Página {influencersPage + 1} de {totalInfluencersPages}
              </span>
            </div>

            <button
              onClick={() => setInfluencersPage(Math.min(totalInfluencersPages - 1, influencersPage + 1))}
              disabled={influencersPage === totalInfluencersPages - 1}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: influencersPage === totalInfluencersPages - 1 ? '#f9fafb' : 'white',
                color: influencersPage === totalInfluencersPages - 1 ? '#9ca3af' : '#374151',
                cursor: influencersPage === totalInfluencersPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (influencersPage < totalInfluencersPages - 1) e.currentTarget.style.background = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                if (influencersPage < totalInfluencersPages - 1) e.currentTarget.style.background = 'white'
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Top Influencers por Reach Ponderado"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide esta métrica?</h4>
        <p>
          El <strong>Influence Score</strong> es una métrica compuesta que identifica a los usuarios con mayor capacidad de influencia real en la red,
          combinando múltiples dimensiones: audiencia (followers), impacto (engagement), actividad (tweets) y eficiencia (reach ratio).
        </p>
        <p>
          A diferencia del engagement puro, esta métrica <strong>pondera el alcance potencial</strong> de cada usuario, favoreciendo a aquellos
          que no solo generan interacción, sino que además tienen una audiencia significativa.
        </p>

        <h4 style={{ marginBottom: '12px' }}>Fórmula del Influence Score</h4>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', fontSize: '14px', margin: '16px 0' }}>
          <strong>Influence Score</strong> = (followers × 0.3) + (engagement × 0.4) + (tweets × 0.1) + (reach_ratio × followers × 0.2)
        </p>

        <h4 style={{ marginBottom: '12px' }}>Componentes del Score</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>
            <strong>Followers (30%):</strong> Base de la audiencia potencial. Un usuario con más followers tiene mayor capacidad de difusión.
          </li>
          <li>
            <strong>Engagement (40%):</strong> Impacto real medido por likes + views + replies. Es el componente más importante porque
            refleja la interacción efectiva que genera el contenido.
          </li>
          <li>
            <strong>Tweets (10%):</strong> Nivel de actividad. Usuarios más activos tienen más oportunidades de influir, aunque con menor peso
            para no penalizar a influencers selectivos.
          </li>
          <li>
            <strong>Reach Ratio × Followers (20%):</strong> Eficiencia de alcance ponderada por audiencia. Usuarios que generan alto engagement
            relativo a su base de followers, multiplicado por esa base para capturar el alcance absoluto.
          </li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
        <p>Esta métrica identifica diferentes tipos de influencers:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>
            <strong>Macro-influencers:</strong> Alto score por gran cantidad de followers y engagement absoluto alto,
            aunque su reach ratio puede ser bajo.
          </li>
          <li>
            <strong>Micro-influencers:</strong> Score moderado-alto por excelente reach ratio que compensa una base de followers menor.
            Son muy eficientes generando engagement.
          </li>
          <li>
            <strong>Influencers selectivos:</strong> Pocos tweets pero cada uno genera alto impacto. El score captura su capacidad
            de influencia a pesar de baja frecuencia.
          </li>
          <li>
            <strong>Activistas digitales:</strong> Balance entre actividad, engagement y audiencia. Presencia constante con impacto sostenido.
          </li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Campos de la tabla</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Influence Score:</strong> Métrica compuesta final (0-∞). Mayor valor = mayor influencia potencial.</li>
          <li><strong>Followers:</strong> Tamaño de la audiencia potencial del usuario.</li>
          <li><strong>Tweets:</strong> Número de publicaciones en el dataset analizado.</li>
          <li><strong>Total Engagement:</strong> Suma de likes, views y replies de todos los tweets del usuario.</li>
          <li><strong>Reach Ratio:</strong> Engagement / Followers. Mide eficiencia: ¿qué porcentaje de su audiencia interactúa?</li>
          <li><strong>Eng/Tweet:</strong> Engagement promedio por tweet. Indica el impacto promedio de cada publicación.</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Aplicaciones en análisis de redes</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>Identificación de líderes de opinión:</strong> Los top influencers son candidatos clave para análisis de narrativas y marcos discursivos.</li>
          <li><strong>Estrategias de comunicación:</strong> Permite identificar a qué usuarios dirigir mensajes para maximizar difusión.</li>
          <li><strong>Análisis de polarización:</strong> Comparar influencers de diferentes comunidades ayuda a entender dinámicas de echo chambers.</li>
          <li><strong>Detección de campañas:</strong> Cambios súbitos en influence score pueden indicar coordinación o amplificación artificial.</li>
        </ul>
      </InfoModal>

      {/* Modales individuales por columna */}
      <InfoModal
        isOpen={showInfluenceScoreInfo}
        onClose={() => setShowInfluenceScoreInfo(false)}
        title="Influence Score"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Métrica compuesta que combina <strong>audiencia, impacto y eficiencia</strong> para identificar influencers reales en la red.</p>

        <h4 style={{ marginBottom: '12px' }}>Fórmula de cálculo</h4>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', fontSize: '14px', margin: '16px 0' }}>
          Score = (followers × 0.3) + (engagement × 0.4) + (tweets × 0.1) + (reach_ratio × followers × 0.2)
        </p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
        <p>Mayor score indica mayor capacidad de influencia en la red. El componente más importante es el engagement (40%), seguido de la audiencia (30%) y la eficiencia de alcance ponderada (20%).</p>
      </InfoModal>

      <InfoModal
        isOpen={showFollowersInfo}
        onClose={() => setShowFollowersInfo(false)}
        title="Followers (Seguidores)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Tamaño de la audiencia potencial del usuario. Base para calcular alcance y difusión.</p>

        <h4 style={{ marginBottom: '12px' }}>Importancia</h4>
        <p>Un alto número de followers amplifica el impacto potencial de cada tweet, aunque no garantiza interacción efectiva.</p>
      </InfoModal>

      <InfoModal
        isOpen={showTotalEngagementInfo}
        onClose={() => setShowTotalEngagementInfo(false)}
        title="Total Engagement"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Suma de Likes + Views + Replies de todos los tweets del usuario en el dataset.</p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
        <p>Refleja el <strong>impacto total acumulativo</strong> del usuario en la conversación. Alto engagement indica que el contenido genera interacción significativa.</p>
      </InfoModal>

      <InfoModal
        isOpen={showReachRatioInfo}
        onClose={() => setShowReachRatioInfo(false)}
        title="Reach Ratio"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Engagement / Followers. Mide <strong>eficiencia</strong>: ¿qué porcentaje de la audiencia interactúa con el contenido?</p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong>&lt; 0.10:</strong> Normal para cuentas grandes (medios, instituciones)</li>
          <li><strong>0.10 - 1.00:</strong> Audiencia mediana con buena interacción</li>
          <li><strong>1.00 - 5.00:</strong> Viralización - contenido trasciende audiencia base</li>
          <li><strong>&gt; 5.00:</strong> Anómalo - puede indicar amplificación artificial</li>
        </ul>
      </InfoModal>

      <InfoModal
        isOpen={showEngPerTweetInfo}
        onClose={() => setShowEngPerTweetInfo(false)}
        title="Eng/Tweet (Engagement por Tweet)"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide?</h4>
        <p>Engagement promedio por tweet. Indica la <strong>calidad promedio</strong> del contenido publicado.</p>

        <h4 style={{ marginBottom: '12px' }}>Fórmula</h4>
        <p style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', fontSize: '14px', margin: '16px 0' }}>
          Eng/Tweet = Total Engagement / Número de Tweets
        </p>

        <h4 style={{ marginBottom: '12px' }}>Interpretación</h4>
        <p>Permite comparar la <strong>calidad del contenido</strong> independientemente del volumen de publicación. Un valor alto indica que cada tweet genera consistentemente alta interacción.</p>
      </InfoModal>
    </>
  )
}
