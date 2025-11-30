import type { URLData } from '@/types/graph'

interface URLDetailsModalProps {
  urlData: URLData
  onClose: () => void
}

export function URLDetailsModal({ urlData, onClose }: URLDetailsModalProps) {
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
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #000',
          paddingBottom: '1rem'
        }}>
          <div style={{ flex: 1, marginRight: '1rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>
              Análisis de URL
            </h2>
            <a
              href={urlData.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#0066cc',
                fontSize: '0.9rem',
                wordBreak: 'break-all'
              }}
            >
              {urlData.url}
            </a>
          </div>
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
              justifyContent: 'center'
            }}
          >
            ×
          </span>
        </div>

        {/* Métricas (4 columnas) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#000' }}>
              {urlData.count}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              Comparticiones
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#000' }}>
              {urlData.uniqueUsers}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              Usuarios únicos
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#000' }}>
              {urlData.hashtags?.length || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              Hashtags
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#000' }}>
              {urlData.viralityScore.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              Viralidad
            </div>
          </div>
        </div>

        {/* Grid de 2 columnas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem'
        }}>
          {/* Columna izquierda: Usuarios */}
          <div>
            <Card title="Usuarios que compartieron">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {urlData.users.slice(0, 10).map((user, i) => (
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
                    <div>
                      <strong>@{user.username}</strong>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {user.name}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                      {user.shareCount}x
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Columna derecha: Hashtags */}
          <div>
            <Card title="Hashtags asociados">
              {urlData.hashtags && urlData.hashtags.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {urlData.hashtags.map((ht, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: i === 0 ? '#000' : '#f5f5f5',
                        color: i === 0 ? 'white' : '#333',
                        borderRadius: '16px',
                        fontSize: '0.85rem'
                      }}
                    >
                      #{ht}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>
                  Esta URL se compartió sin hashtags
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component
function Card({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#fafafa',
      borderRadius: '6px',
      padding: '1rem',
      border: '1px solid #e0e0e0'
    }}>
      <h4 style={{
        margin: '0 0 1rem 0',
        fontSize: '1rem',
        color: '#000'
      }}>
        {title}
      </h4>
      {children}
    </div>
  )
}
