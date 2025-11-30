import { Calculator } from 'lucide-react'

interface CostEstimatorProps {
  maxTweets: string
  enrichUsers: boolean
  includeReplies: boolean
}

export function CostEstimator({ maxTweets, enrichUsers, includeReplies }: CostEstimatorProps) {
  const tweets = maxTweets ? parseInt(maxTweets) : 1000 // Default 1K si no especifica

  // Precios TwitterAPI.io convertidos a euros (aproximadamente 1 USD = 0.94 EUR)
  const PRICE_PER_1K_TWEETS = 0.15 * 0.94 // €0.141
  const PRICE_PER_1K_PROFILES = 0.18 * 0.94 // €0.169

  // Estimaciones
  const estimatedUsers = Math.ceil(tweets * 0.3) // ~30% del total de tweets son usuarios únicos (autores + mencionados)

  // Estimación de conversaciones completas (~20 replies por tweet usando batch method)
  const estimatedReplies = includeReplies ? tweets * 20 : 0
  const totalTweets = tweets + estimatedReplies

  // Cálculo de costes
  const tweetsCost = (totalTweets / 1000) * PRICE_PER_1K_TWEETS
  const profilesCost = enrichUsers ? (estimatedUsers / 1000) * PRICE_PER_1K_PROFILES : 0

  const totalCost = tweetsCost + profilesCost

  return (
    <div style={{
      marginTop: '20px',
      padding: '18px',
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '14px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Calculator size={16} style={{ color: '#6b7280' }} />
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151'
        }}>
          Coste estimado de la transacción
        </h4>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: '13px'
      }}>
        {/* Tweets */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0'
        }}>
          <div>
            <div style={{ fontWeight: 500, color: '#1f2937' }}>Tweets principales</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {tweets.toLocaleString()} tweets
            </div>
          </div>
          <div style={{
            fontWeight: 600,
            fontSize: '14px',
            color: '#1f2937'
          }}>
            €{((tweets / 1000) * PRICE_PER_1K_TWEETS).toFixed(4)}
          </div>
        </div>

        {/* Conversaciones completas (si está activado) */}
        {includeReplies && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0'
          }}>
            <div>
              <div style={{ fontWeight: 500, color: '#1f2937' }}>Conversaciones completas</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                ~{estimatedReplies.toLocaleString()} replies (~20 por tweet, batch method)
              </div>
            </div>
            <div style={{
              fontWeight: 600,
              fontSize: '14px',
              color: '#1f2937'
            }}>
              €{((estimatedReplies / 1000) * PRICE_PER_1K_TWEETS).toFixed(4)}
            </div>
          </div>
        )}

        {/* Perfiles (solo si enriquecimiento activado) */}
        {enrichUsers && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0'
          }}>
            <div>
              <div style={{ fontWeight: 500, color: '#1f2937' }}>Perfiles de usuarios</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                ~{estimatedUsers.toLocaleString()} perfiles (autores + mencionados)
              </div>
            </div>
            <div style={{
              fontWeight: 600,
              fontSize: '14px',
              color: '#1f2937'
            }}>
              €{profilesCost.toFixed(4)}
            </div>
          </div>
        )}

        <div style={{
          height: '1px',
          background: '#e5e7eb',
          margin: '4px 0'
        }} />

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          background: 'white',
          borderRadius: '6px',
          marginTop: '4px'
        }}>
          <div style={{
            fontWeight: 600,
            fontSize: '15px',
            color: '#1f2937'
          }}>
            Total estimado
          </div>
          <div style={{
            fontWeight: 700,
            fontSize: '18px',
            color: '#059669'
          }}>
            €{totalCost.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Advertencia de coste si conversaciones activadas */}
      {includeReplies && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚠️</span>
            <span>Coste aumentado: Conversaciones completas activadas</span>
          </div>
          <div style={{ fontSize: '11px' }}>
            Las conversaciones completas pueden multiplicar el coste por {(totalTweets / tweets).toFixed(1)}x.
            Para {tweets.toLocaleString()} tweets principales, se estiman ~{estimatedReplies.toLocaleString()} replies adicionales.
          </div>
        </div>
      )}

      {/* Info adicional */}
      <div style={{
        marginTop: '12px',
        padding: '10px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#6b7280',
        lineHeight: '1.5'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '4px', color: '#374151' }}>
          Precios base (USD → EUR aprox.)
        </div>
        <div>
          Tweets: $0.15/1K (€0.141) | Perfiles: $0.18/1K (€0.169)
        </div>
        <div style={{ marginTop: '6px', opacity: 0.9, fontSize: '10px' }}>
          * Estimación usuarios: ~30% del total (autores + mencionados)<br />
          * Estimación conversaciones: ~20 respuestas promedio por tweet (método batch optimizado)
        </div>
      </div>
    </div>
  )
}
