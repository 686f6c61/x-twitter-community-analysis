import { X, Download, TrendingUp, Globe, Rocket, Users, Hash, MessageSquare, Megaphone, Link, Bot, Clock, HelpCircle } from 'lucide-react'
import type { DetectedEvent } from '@/types/graph'
import { InfoButton } from '@/shared/components/InfoButton'
import { useState } from 'react'

interface EventDrillDownModalProps {
  timePoint: { time: string; count: number }
  event: DetectedEvent | null
  onClose: () => void
}

export function EventDrillDownModal({ timePoint, event, onClose }: EventDrillDownModalProps) {
  const [showIntensityTooltip, setShowIntensityTooltip] = useState(false)
  const [showTypeTooltip, setShowTypeTooltip] = useState(false)
  const [showBotScoreTooltip, setShowBotScoreTooltip] = useState(false)

  const handleDownload = () => {
    const data = event || {
      time: timePoint.time,
      count: timePoint.count,
      note: 'Periodo sin actividad inusual'
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evento_${timePoint.time.replace(/:/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '2rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #000',
          paddingBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={24} />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
              Análisis del Periodo: {timePoint.time}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleDownload}
              style={{
                padding: '0.5rem 1rem',
                background: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#333')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#000')}
            >
              <Download size={16} />
              Descargar
            </button>
            <span
              onClick={onClose}
              style={{
                fontSize: '2rem',
                cursor: 'pointer',
                color: '#666',
                lineHeight: 1,
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.5rem'
              }}
            >
              ×
            </span>
          </div>
        </div>

        {/* Content */}
        {!event ? (
          <div style={{ padding: '1rem' }}>
            <div style={{
              background: '#f5f5f5',
              padding: '1.5rem',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                <strong>Tweets:</strong> {timePoint.count}
              </p>
              <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>
                Este periodo presenta actividad normal (sin picos detectados).
              </p>
              <p style={{ margin: '1rem 0 0 0', color: '#999', fontSize: '0.9rem' }}>
                💡 Los picos se detectan cuando la actividad supera media + 1.5σ
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid 2 columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* COLUMNA IZQUIERDA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Estadísticas Básicas */}
                <Card title={<><TrendingUp size={16} /> Estadísticas Básicas</>}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <Stat label="Tweets" value={event.count.toString()} />
                    <Stat
                      label={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          Intensidad
                          <span
                            onMouseEnter={() => setShowIntensityTooltip(true)}
                            onMouseLeave={() => setShowIntensityTooltip(false)}
                            style={{ cursor: 'help', opacity: 0.6, position: 'relative' }}
                          >
                            <HelpCircle size={14} />
                            {showIntensityTooltip && (
                              <div style={{
                                position: 'absolute',
                                left: '20px',
                                top: '-10px',
                                background: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                padding: '0.75rem',
                                width: '300px',
                                fontSize: '0.85rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                lineHeight: 1.5
                              }}>
                                <strong>Intensidad (σ)</strong><br/><br/>
                                Mide cuántas desviaciones estándar por encima de la media está este pico.<br/><br/>
                                <strong>Fórmula:</strong> σ = (valor - media) / desviación_estándar<br/><br/>
                                <strong>Interpretación:</strong><br/>
                                • &lt;1σ: Normal<br/>
                                • 1-2σ: Actividad elevada<br/>
                                • 2-3σ: Pico significativo<br/>
                                • &gt;3σ: Evento excepcional
                              </div>
                            )}
                          </span>
                        </span>
                      }
                      value={`${event.intensity}σ`}
                      valueStyle={{ color: '#d32f2f' }}
                    />
                    <Stat label="Duración" value={`${event.duration}h`} />
                    <Stat label="Velocidad" value={event.velocity} />
                    <Stat label="Usuarios únicos" value={event.uniqueUsers.toString()} />
                  </div>
                </Card>

                {/* Alcance */}
                <Card title={<><Globe size={16} /> Alcance</>}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <Stat label="Views" value={formatNumber(event.totalViews)} />
                    <Stat label="Likes" value={formatNumber(event.totalLikes)} />
                    <Stat label="Retweets" value={formatNumber(event.totalRetweets)} />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #eee',
                      marginTop: '0.5rem'
                    }}>
                      <span>Alcance total:</span>
                      <strong style={{ color: '#000' }}>{formatNumber(event.reach)}</strong>
                    </div>
                  </div>
                </Card>

                {/* Análisis de Propagación */}
                <Card title={<><Rocket size={16} /> Análisis de Propagación</>}>
                  {event.initiator && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: '#000' }}>Nodo Iniciador:</strong>
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.6rem',
                        background: '#f5f5f5',
                        borderRadius: '4px'
                      }}>
                        <strong>@{event.initiator.username}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {event.initiator.name}
                        </div>
                      </div>
                    </div>
                  )}
                  {event.influencers && event.influencers.length > 0 && (
                    <div>
                      <strong style={{ color: '#000' }}>Influencers Clave:</strong>
                      <div style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}>
                        {event.influencers.map((inf, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '0.5rem',
                              background: i === 0 ? '#000' : '#f5f5f5',
                              color: i === 0 ? 'white' : '#333',
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span><strong>@{inf.username}</strong></span>
                            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                              {inf.retweets} RT
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* COLUMNA DERECHA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Tipo de Evento */}
                <Card
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Users size={16} /> Tipo de Evento
                      <span
                        onMouseEnter={() => setShowTypeTooltip(true)}
                        onMouseLeave={() => setShowTypeTooltip(false)}
                        style={{ cursor: 'help', opacity: 0.6, position: 'relative', marginLeft: '0.3rem' }}
                      >
                        <HelpCircle size={14} />
                        {showTypeTooltip && (
                          <div style={{
                            position: 'absolute',
                            left: '20px',
                            top: '-10px',
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            padding: '0.75rem',
                            width: '320px',
                            fontSize: '0.85rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            lineHeight: 1.5
                          }}>
                            <strong>Algoritmo de clasificación:</strong><br/><br/>
                            <strong>Orgánico:</strong><br/>
                            • Múltiples usuarios (&gt;5)<br/>
                            • Actividad distribuida (≤3 tweets/usuario)<br/>
                            • Bot Score promedio &lt;40%<br/><br/>
                            <strong>Coordinado:</strong><br/>
                            • Pocos usuarios concentrados (≤5)<br/>
                            • Alta actividad por usuario (&gt;3 tweets/usuario)<br/>
                            • Bot Score promedio ≥40%<br/><br/>
                            <strong>Fórmula Bot Score:</strong><br/>
                            Combina regularidad temporal (40%), similitud de contenido (25%), patrones de interacción (20%) y características del perfil (15%)
                          </div>
                        )}
                      </span>
                    </span>
                  }
                >
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                      {event.eventType === 'coordinado' ? <Bot size={48} /> : <Clock size={48} />}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {event.eventType === 'coordinado' ? 'Coordinado' : 'Orgánico'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Bot Score promedio: <strong>{event.avgBotScore.toFixed(1)}%</strong>
                    </div>
                  </div>
                </Card>

                {/* Usuarios Más Activos */}
                {event.topUsers && event.topUsers.length > 0 && (
                  <Card title={<><Users size={16} /> Usuarios Más Activos</>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {event.topUsers.map((user, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.6rem',
                            background: i === 0 ? '#000' : '#f5f5f5',
                            color: i === 0 ? 'white' : '#333',
                            borderRadius: '4px'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <strong>@{user.username}</strong>
                            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                              {user.tweets} tweets
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            opacity: 0.7,
                            marginTop: '0.2rem'
                          }}>
                            {user.likes} likes · {user.retweets} RT
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Hashtags Trending */}
                {event.trending_hashtags && event.trending_hashtags.length > 0 && (
                  <Card title={<><Hash size={16} /> Hashtags Trending</>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {event.trending_hashtags.map((tag, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.6rem',
                            background: i === 0 ? '#000' : '#f5f5f5',
                            color: i === 0 ? 'white' : '#333',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span><strong>#{tag.hashtag}</strong></span>
                          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                            {tag.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* FULL WIDTH SECTIONS */}
            {/* Palabras Clave Emergentes */}
            {event.topWords && event.topWords.length > 0 && (
              <Card
                title={<><MessageSquare size={16} /> Palabras Clave Emergentes</>}
                style={{ marginTop: '1.5rem' }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {event.topWords.map((w, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: '#f5f5f5',
                        borderRadius: '16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <strong>{w.word}</strong> <span style={{ color: '#666' }}>({w.count})</span>
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Menciones Destacadas */}
            {event.topMentions && event.topMentions.length > 0 && (
              <Card
                title={<><Megaphone size={16} /> Menciones Destacadas</>}
                style={{ marginTop: '1rem' }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {event.topMentions.map((m, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: '#000',
                        color: 'white',
                        borderRadius: '16px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <strong>@{m.username}</strong> <span style={{ opacity: 0.8 }}>({m.count})</span>
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* URLs Más Compartidas */}
            {event.topUrls && event.topUrls.length > 0 && (
              <Card
                title={<><Link size={16} /> URLs Más Compartidas</>}
                style={{ marginTop: '1rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {event.topUrls.map((u, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.6rem',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <a
                        href={u.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#0066cc',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '80%'
                        }}
                      >
                        {u.url}
                      </a>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>
                        {u.count} veces
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Helper components
function Card({
  title,
  children,
  style = {}
}: {
  title: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: '#fafafa',
        borderRadius: '6px',
        padding: '1rem',
        border: '1px solid #e0e0e0',
        ...style
      }}
    >
      <h4 style={{
        margin: '0 0 1rem 0',
        fontSize: '1rem',
        color: '#000',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function Stat({
  label,
  value,
  valueStyle = {}
}: {
  label: React.ReactNode
  value: string
  valueStyle?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <strong style={valueStyle}>{value}</strong>
    </div>
  )
}
