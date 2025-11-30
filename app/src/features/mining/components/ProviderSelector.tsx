import type { ProviderType, ProviderConfig } from '../services/scraperApi'

interface ProviderSelectorProps {
  providers: ProviderConfig[]
  selectedProvider: ProviderType
  onProviderChange: (provider: ProviderType) => void
  disabled?: boolean
}

export function ProviderSelector({
  providers,
  selectedProvider,
  onProviderChange,
  disabled = false,
}: ProviderSelectorProps) {
  if (providers.length === 0) {
    return (
      <div style={{
        padding: '16px',
        background: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        color: '#991b1b',
        fontSize: '14px'
      }}>
        <strong>⚠️ No hay proveedores configurados</strong>
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#b91c1c' }}>
          Configura al menos una API key en el archivo <code>server/.env</code>
        </p>
      </div>
    )
  }

  // Si solo hay un proveedor, mostrarlo de forma informativa
  if (providers.length === 1) {
    return (
      <div style={{
        padding: '14px 16px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        width: 'fit-content'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#10b981',
          boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)'
        }} />
        <span style={{ color: '#6b7280' }}>
          Proveedor activo
        </span>
      </div>
    )
  }

  // Múltiples proveedores: mostrar selector
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '16px',
        fontSize: '16px',
        fontWeight: 600,
        color: '#1f2937'
      }}>
        Proveedor de datos
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: providers.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.type

          return (
            <button
              key={provider.type}
              onClick={() => onProviderChange(provider.type)}
              disabled={disabled}
              style={{
                padding: '16px',
                background: isSelected ? '#f9fafb' : 'white',
                border: isSelected ? '2px solid #1f2937' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                opacity: disabled ? 0.6 : 1,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isSelected) {
                  e.currentTarget.style.borderColor = '#9ca3af'
                  e.currentTarget.style.background = '#f9fafb'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.background = 'white'
                }
              }}
            >
              {/* Radio button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid #1f2937' : '2px solid #d1d5db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isSelected && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#1f2937'
                    }} />
                  )}
                </div>

                <div style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#1f2937'
                }}>
                  {provider.name}
                </div>
              </div>

              {/* Badge "SELECCIONADO" */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '2px 8px',
                  background: '#1f2937',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'white',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Seleccionado
                </div>
              )}

              {/* Indicador de estado */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: provider.active ? '#10b981' : '#ef4444'
                }} />
                <span>{provider.active ? 'Activo' : 'Inactivo'}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
