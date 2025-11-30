import { useState } from 'react'
import type { Statistics } from '@/types/graph'
import type { DatasetMetadata } from '@/lib/store/graphStore'
import { InfoModal } from '@/shared/components/InfoModal'
import { InfoButton } from '@/shared/components/InfoButton'
import { ColumnInfoTooltip } from '@/shared/components/ColumnInfoTooltip'
import { ExternalLink } from 'lucide-react'
import { useGraphStore } from '@/lib/store/graphStore'

interface SuspiciousUsersProps {
  stats: Statistics
}

const SIGNAL_LABELS: Record<string, string> = {
  high_reach_low_followers: 'Alto reach / Pocos followers',
  excessive_posting: 'Posting excesivo',
  unusual_follow_ratio: 'Ratio follow anómalo',
  new_account_high_activity: 'Cuenta nueva / Alta actividad',
  automated_account: 'Cuenta automatizada'
}

const SIGNAL_COLORS: Record<string, string> = {
  high_reach_low_followers: '#ef4444',
  excessive_posting: '#f59e0b',
  unusual_follow_ratio: '#3b82f6',
  new_account_high_activity: '#8b5cf6',
  automated_account: '#dc2626'
}

export function SuspiciousUsers({ stats }: SuspiciousUsersProps) {
  const [showInfo, setShowInfo] = useState(false)
  const datasetMetadata = useGraphStore((state) => state.datasetMetadata)

  if (!stats.suspicious_users || stats.suspicious_users.length === 0) {
    return null
  }

  // Construir URL de búsqueda avanzada con parámetros del scraping
  const buildTwitterSearchURL = (username: string) => {
    if (!datasetMetadata?.query) {
      return `https://twitter.com/${username}`
    }

    // Buscar tweets DEL usuario (from:) sobre el tema
    let searchQuery = `${datasetMetadata.query} from:${username}`

    if (datasetMetadata.dateRange?.start) {
      searchQuery += ` since:${datasetMetadata.dateRange.start}`
    }
    // Nota: No agregar 'until' porque Twitter no lo soporta bien en enlaces directos

    const encodedQuery = encodeURIComponent(searchQuery)
    const mode = datasetMetadata.mode === 'top' ? 'top' : 'live'

    return `https://twitter.com/search?q=${encodedQuery}&f=${mode}`
  }

  const getSuspicionLevel = (score: number) => {
    if (score >= 80) return { label: 'Crítico', color: '#dc2626' }
    if (score >= 60) return { label: 'Alto', color: '#ef4444' }
    if (score >= 40) return { label: 'Medio', color: '#f59e0b' }
    return { label: 'Bajo', color: '#3b82f6' }
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

  return (
    <>
      <div className="chart-card">
        <h3 className="chart-title">
          Usuarios Sospechosos de Amplificación Artificial
          <InfoButton onClick={() => setShowInfo(true)} />
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Usuario</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                  Nivel
                  <ColumnInfoTooltip title="Nivel de Sospecha">
                    <strong>Bajo (30-39):</strong> 1 señal leve<br/>
                    <strong>Medio (40-59):</strong> 2 señales o 1 fuerte<br/>
                    <strong>Alto (60-79):</strong> 3+ señales<br/>
                    <strong>Crítico (80+):</strong> 4+ señales o automatizado
                  </ColumnInfoTooltip>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  Score
                  <ColumnInfoTooltip title="Suspicion Score">
                    Puntuación agregada (0-130+) basada en 5 señales de detección:<br/><br/>
                    • Alto reach/pocos followers (+30)<br/>
                    • Posting excesivo (+20)<br/>
                    • Ratio follow anómalo (+15)<br/>
                    • Cuenta nueva/alta actividad (+25)<br/>
                    • Cuenta automatizada (+40)
                  </ColumnInfoTooltip>
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                  Señales
                  <ColumnInfoTooltip title="Señales Detectadas">
                    Patrones anómalos detectados por el algoritmo multi-señal. Cada badge representa un comportamiento sospechoso específico.
                  </ColumnInfoTooltip>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Followers</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  Following
                  <ColumnInfoTooltip title="Following">
                    Número de cuentas que el usuario sigue. Útil para calcular ratio followers/following.
                  </ColumnInfoTooltip>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>Tweets</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  Reach Ratio
                  <ColumnInfoTooltip title="Reach Ratio">
                    Engagement / Followers. Valores muy altos (&gt;10) con pocos followers pueden indicar amplificación artificial.
                  </ColumnInfoTooltip>
                </th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                  Age (days)
                  <ColumnInfoTooltip title="Antigüedad (días)">
                    Días desde que se creó la cuenta. Cuentas muy nuevas (&lt;90 días) con alta actividad son sospechosas.
                  </ColumnInfoTooltip>
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>Ver tweets</th>
              </tr>
            </thead>
            <tbody>
              {stats.suspicious_users.map((user, idx) => {
                const level = getSuspicionLevel(user.suspicion_score)
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <a
                          href={`https://twitter.com/${user.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1f2937', textDecoration: 'none', fontWeight: 500 }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                        >
                          {user.name}
                        </a>
                        {user.verified && <span style={{ color: '#1d9bf0', fontSize: '16px' }} title="Verified">✓</span>}
                        {user.is_automated && (
                          <span style={{
                            fontSize: '16px',
                            color: '#dc2626'
                          }} title="Automated Account">🤖</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: level.color,
                        color: 'white'
                      }}>
                        {level.label}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: level.color
                    }}>
                      {user.suspicion_score}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {user.signals.map((signal, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              background: SIGNAL_COLORS[signal] || '#6b7280',
                              color: 'white',
                              whiteSpace: 'nowrap'
                            }}
                            title={SIGNAL_LABELS[signal] || signal}
                          >
                            {SIGNAL_LABELS[signal] || signal}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {user.followers.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {user.following.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {user.tweets.toLocaleString()}
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
                      {user.account_age_days}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px' }}>
                      <a
                        href={buildTwitterSearchURL(user.username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          borderRadius: '6px',
                          color: '#6b7280',
                          transition: 'all 0.2s',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                          e.currentTarget.style.color = '#3b82f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#6b7280'
                        }}
                        title={datasetMetadata?.query ? `Buscar tweets de ${user.name} con "${datasetMetadata.query}"` : `Ver tweets de ${user.name}`}
                      >
                        <ExternalLink size={16} />
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Usuarios Sospechosos de Amplificación Artificial"
      >
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>¿Qué mide esta métrica?</h4>
        <p>
          Esta tabla identifica usuarios cuyas métricas presentan <strong>anomalías estadísticas</strong> que pueden indicar
          comportamientos de amplificación artificial, coordinación inauténtica o actividad automatizada (bots).
        </p>
        <p>
          El sistema aplica un <strong>algoritmo de detección multi-señal</strong> que evalúa 5 indicadores independientes
          y asigna un <strong>Suspicion Score</strong> agregado (0-130+).
        </p>

        <h4 style={{ marginBottom: '12px' }}>Señales de detección</h4>
        <p>Cada señal detecta un patrón anómalo específico:</p>

        <div style={{ marginBottom: '16px' }}>
          <div style={{
            padding: '12px',
            background: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#ef4444' }}>🔴 Alto reach / Pocos followers (+30 pts)</strong>
            <p style={{ margin: '8px 0 0', fontSize: '13px', lineHeight: 1.6 }}>
              Reach ratio &gt; 10 con menos de 1000 followers. Indica engagement desproporcionado que puede ser resultado
              de amplificación artificial o compra de interacciones. Usuario genera más interacción que su audiencia natural permitiría.
            </p>
          </div>

          <div style={{
            padding: '12px',
            background: '#fffbeb',
            borderLeft: '4px solid #f59e0b',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#f59e0b' }}>🟡 Posting excesivo (+20 pts)</strong>
            <p style={{ margin: '8px 0 0', fontSize: '13px', lineHeight: 1.6 }}>
              Más de 50 tweets en el dataset analizado. Frecuencia de publicación anormalmente alta que puede indicar
              automatización o coordinación. Humanos promedio no sostienen este volumen sin asistencia.
            </p>
          </div>

          <div style={{
            padding: '12px',
            background: '#eff6ff',
            borderLeft: '4px solid #3b82f6',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#3b82f6' }}>🔵 Ratio follow anómalo (+15 pts)</strong>
            <p style={{ margin: '8px 0 0', fontSize: '13px', lineHeight: 1.6 }}>
              Ratio followers/following &lt; 0.1 o &gt; 20. Patrones extremos pueden indicar: (1) bots que siguen masivamente
              sin recibir follow-backs, o (2) cuentas falsas con followers comprados pero sin actividad social orgánica.
            </p>
          </div>

          <div style={{
            padding: '12px',
            background: '#f5f3ff',
            borderLeft: '4px solid #8b5cf6',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#8b5cf6' }}>🟣 Cuenta nueva / Alta actividad (+25 pts)</strong>
            <p style={{ margin: '8px 0 0', fontSize: '13px', lineHeight: 1.6 }}>
              Cuenta con menos de 90 días de antigüedad pero más de 20 tweets en el dataset. Puede indicar cuenta creada
              específicamente para una campaña o evento, sin historial orgánico previo.
            </p>
          </div>

          <div style={{
            padding: '12px',
            background: '#fef2f2',
            borderLeft: '4px solid #dc2626',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#dc2626' }}>🔴 Cuenta automatizada (+40 pts)</strong>
            <p style={{ margin: '8px 0 0', fontSize: '13px', lineHeight: 1.6 }}>
              Usuario marcado como automatizado por Twitter API (campo `isAutomated`). Esta es la señal más confiable
              ya que proviene de la plataforma misma. Incluye bots oficiales y cuentas de servicios automatizados.
            </p>
          </div>
        </div>

        <h4 style={{ marginBottom: '12px' }}>Niveles de sospecha</h4>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li><strong style={{ color: '#3b82f6' }}>Bajo (30-39):</strong> 1 señal leve. Requiere observación pero puede ser legítimo.</li>
          <li><strong style={{ color: '#f59e0b' }}>Medio (40-59):</strong> 2 señales o 1 señal fuerte. Probable comportamiento anómalo.</li>
          <li><strong style={{ color: '#ef4444' }}>Alto (60-79):</strong> 3+ señales. Muy probable amplificación artificial.</li>
          <li><strong style={{ color: '#dc2626' }}>Crítico (80+):</strong> 4+ señales o cuenta automatizada. Casi certeza de bot o coordinación.</li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Interpretación académica</h4>
        <p>Este análisis es fundamental para:</p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
          <li>
            <strong>Validación de métricas:</strong> Engagement artificialmente inflado distorsiona el análisis de influencia.
            Identificar estos usuarios permite limpiar métricas para obtener resultados más precisos.
          </li>
          <li>
            <strong>Detección de campañas coordinadas:</strong> Múltiples usuarios sospechosos con patrones similares
            pueden indicar operaciones de astroturfing o campañas de desinformación.
          </li>
          <li>
            <strong>Análisis de polarización:</strong> Bots suelen ser utilizados para amplificar narrativas extremas
            y crear sensación de consenso artificial.
          </li>
          <li>
            <strong>Integridad de datos:</strong> Documentar la presencia de bots es crucial para reportes académicos,
            permite contextualizar los hallazgos y establecer limitaciones metodológicas.
          </li>
        </ul>

        <h4 style={{ marginBottom: '12px' }}>Consideraciones metodológicas</h4>
        <p style={{ background: '#fffbf0', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #f59e0b', fontSize: '13px' }}>
          <strong>Importante:</strong> Esta métrica identifica <strong>comportamientos sospechosos</strong>, no confirma con certeza
          que una cuenta sea un bot. Factores legítimos pueden disparar alertas:
        </p>
        <ul style={{ marginLeft: '20px', lineHeight: 1.8, fontSize: '13px' }}>
          <li>Activistas en eventos urgentes pueden tener posting excesivo temporal</li>
          <li>Cuentas nuevas de periodistas cubriendo breaking news</li>
          <li>Micro-influencers con audiencias pequeñas pero muy comprometidas</li>
          <li>Cuentas institucionales legítimas que publican frecuentemente</li>
        </ul>
        <p style={{ fontSize: '13px', marginTop: '12px' }}>
          Se recomienda <strong>inspección manual</strong> de usuarios con scores altos antes de conclusiones definitivas,
          complementando con análisis de contenido, patrones temporales y conexiones de red.
        </p>
      </InfoModal>
    </>
  )
}
