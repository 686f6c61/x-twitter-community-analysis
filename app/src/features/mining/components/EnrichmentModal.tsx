import { X } from 'lucide-react'

interface EnrichmentModalProps {
  isOpen: boolean
  tweetsCount: number
  onEnrich: () => void
  onSaveWithoutEnrich: () => void
  onDiscard: () => void
  onClose: () => void
}

export function EnrichmentModal({
  isOpen,
  tweetsCount,
  onEnrich,
  onSaveWithoutEnrich,
  onDiscard,
  onClose
}: EnrichmentModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111' }}>
            Scraping Detenido
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: '0 0 24px 0', color: '#4b5563', fontSize: '15px', lineHeight: '1.6' }}>
          Se han descargado <strong>{tweetsCount} tweets</strong>. ¿Deseas enriquecer el dataset con información
          detallada de usuarios (seguidores, verificación, ubicación, etc.)?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={onEnrich}
            style={{
              padding: '12px 20px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Sí, enriquecer usuarios
          </button>

          <button
            onClick={onSaveWithoutEnrich}
            style={{
              padding: '12px 20px',
              background: 'white',
              color: '#374151',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb'
              e.currentTarget.style.borderColor = '#9ca3af'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
          >
            No, guardar sin enriquecer
          </button>

          <button
            onClick={onDiscard}
            style={{
              padding: '12px 20px',
              background: 'white',
              color: '#dc2626',
              border: '2px solid #dc2626',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
            }}
          >
            Descartar datos
          </button>
        </div>

        <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
          <strong>Nota:</strong> El enriquecimiento puede tomar varios minutos dependiendo del número de usuarios únicos.
        </p>
      </div>
    </div>
  )
}
