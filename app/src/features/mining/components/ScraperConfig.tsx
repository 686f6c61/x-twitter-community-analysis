import { Play, Square, Info } from 'lucide-react'
import { QueryTagsInput } from "./QueryTagsInput"

interface ScraperConfigProps {
  queryTags: string[]
  onQueryTagsChange: (tags: string[]) => void
  queryOperator?: 'AND' | 'OR'
  onQueryOperatorChange?: (value: 'AND' | 'OR') => void
  mode: 'latest' | 'top'
  onModeChange: (value: 'latest' | 'top') => void
  maxTweets: string
  onMaxTweetsChange: (value: string) => void
  untilDate: string
  onUntilDateChange: (value: string) => void
  sinceDate: string
  onSinceDateChange: (value: string) => void
  minLikes: string
  onMinLikesChange: (value: string) => void
  includeReplies: boolean
  onIncludeRepliesChange: (value: boolean) => void
  enrichUsers: boolean
  onEnrichUsersChange: (value: boolean) => void
  verifiedOnly: boolean
  onVerifiedOnlyChange: (value: boolean) => void
  disabled?: boolean
  onStart: () => void
  onStop: () => void
  isRunning: boolean
}

export function ScraperConfig(props: ScraperConfigProps) {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '18px',
        fontWeight: 600,
        color: '#1f2937'
      }}>
        Configuración de Búsqueda
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <QueryTagsInput
          tags={props.queryTags}
          onTagsChange={props.onQueryTagsChange}
          disabled={props.disabled}
        />

        {/* Operador lógico AND/OR */}
        {props.queryTags.length > 1 && props.onQueryOperatorChange && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Operador lógico
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => props.onQueryOperatorChange?.('OR')}
                disabled={props.disabled}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: (props.queryOperator || 'OR') === 'OR' ? '#000' : 'white',
                  color: (props.queryOperator || 'OR') === 'OR' ? '#fff' : '#374151',
                  border: (props.queryOperator || 'OR') === 'OR' ? '2px solid #000' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: props.disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>OR (cualquiera)</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Tweets que contengan <strong>al menos uno</strong> de los términos
                </div>
              </button>
              <button
                onClick={() => props.onQueryOperatorChange?.('AND')}
                disabled={props.disabled}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: props.queryOperator === 'AND' ? '#000' : 'white',
                  color: props.queryOperator === 'AND' ? '#fff' : '#374151',
                  border: props.queryOperator === 'AND' ? '2px solid #000' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: props.disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>AND (todos)</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Tweets que contengan <strong>todos</strong> los términos
                </div>
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Modo
            </label>
            <select
              value={props.mode}
              onChange={(e) => props.onModeChange(e.target.value as any)}
              disabled={props.disabled}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                color: '#111',
                cursor: props.disabled ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="latest">Latest (Recientes)</option>
              <option value="top">Top (Populares)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Máximo tweets
            </label>
            <input
              type="number"
              value={props.maxTweets}
              onChange={(e) => props.onMaxTweetsChange(e.target.value)}
              placeholder="Sin límite"
              disabled={props.disabled}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                color: '#111'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Hasta (fecha)
            </label>
            <input
              type="date"
              value={props.untilDate}
              onChange={(e) => props.onUntilDateChange(e.target.value)}
              disabled={props.disabled}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                color: '#111'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Desde (opcional)
            </label>
            <input
              type="date"
              value={props.sinceDate}
              onChange={(e) => props.onSinceDateChange(e.target.value)}
              disabled={props.disabled}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                color: '#111'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Mínimo likes
            </label>
            <input
              type="number"
              value={props.minLikes}
              onChange={(e) => props.onMinLikesChange(e.target.value)}
              placeholder="Sin filtro"
              disabled={props.disabled}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white',
                color: '#111'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={props.includeReplies}
              onChange={(e) => props.onIncludeRepliesChange(e.target.checked)}
              disabled={props.disabled}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Incluir conversaciones completas
              <span
                title="Obtiene todas las respuestas de cada tweet usando búsquedas batch optimizadas (conversation_id). Más eficiente que el método individual."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'help'
                }}
              >
                <Info size={14} style={{ color: '#6b7280' }} />
              </span>
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={props.enrichUsers}
              onChange={(e) => props.onEnrichUsersChange(e.target.checked)}
              disabled={props.disabled}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Enriquecer usuarios
              <span
                title="Enriquecer dataset con información detallada de usuarios (seguidores, verificación, ubicación, etc.)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'help'
                }}
              >
                <Info size={14} style={{ color: '#6b7280' }} />
              </span>
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={props.verifiedOnly}
              onChange={(e) => props.onVerifiedOnlyChange(e.target.checked)}
              disabled={props.disabled}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            Solo verificados
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          {!props.isRunning ? (
            <button
              onClick={props.onStart}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#000',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Play size={16} />
              Iniciar Scraping
            </button>
          ) : (
            <button
              onClick={props.onStop}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'white',
                color: '#dc2626',
                border: '1px solid #dc2626',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <Square size={16} />
              Detener
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
