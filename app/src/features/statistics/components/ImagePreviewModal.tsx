import { X } from 'lucide-react'

interface ImagePreviewModalProps {
  imageUrl: string
  onClose: () => void
}

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
          }}
        >
          <X size={20} color="white" />
        </button>

        {/* Imagen */}
        <img
          src={imageUrl}
          alt="Preview"
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const errorDiv = document.createElement('div')
            errorDiv.style.cssText = 'padding: 40px; text-align: center; color: #666;'
            errorDiv.textContent = 'Error al cargar la imagen'
            e.currentTarget.parentElement?.appendChild(errorDiv)
          }}
        />
      </div>
    </div>
  )
}
