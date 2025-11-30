import { useState } from 'react'
import { X, Plus, Hash, AtSign, Type, Info } from 'lucide-react'

interface QueryTagsInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
}

// Detecta el tipo de tag
const getTagType = (tag: string): 'hashtag' | 'user' | 'text' => {
  if (tag.startsWith('#')) return 'hashtag'
  if (tag.startsWith('@')) return 'user'
  return 'text'
}

// Estilo y configuración por tipo
const tagStyles = {
  hashtag: {
    bg: '#dbeafe',
    border: '#93c5fd',
    color: '#1e40af',
    icon: Hash
  },
  user: {
    bg: '#fce7f3',
    border: '#f9a8d4',
    color: '#9f1239',
    icon: AtSign
  },
  text: {
    bg: '#f3f4f6',
    border: '#d1d5db',
    color: '#374151',
    icon: Type
  }
}

export function QueryTagsInput({ tags, onTagsChange, disabled }: QueryTagsInputProps) {
  const [currentInput, setCurrentInput] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const addTag = () => {
    const trimmed = currentInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed])
      setCurrentInput('')
    }
  }

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
          Términos de búsqueda *
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            padding: 0,
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6'
            e.currentTarget.style.borderColor = '#9ca3af'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.borderColor = '#d1d5db'
          }}
        >
          <Info size={12} style={{ color: '#6b7280' }} />
        </button>
      </div>

      {/* Popup de ayuda */}
      {showHelp && (
        <div style={{
          position: 'absolute',
          top: '32px',
          left: 0,
          zIndex: 1000,
          width: '500px',
          maxWidth: '90vw',
          padding: '16px',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          fontSize: '13px',
          color: '#374151',
          lineHeight: '1.6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
              Sistema de búsqueda inteligente
            </h4>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: '#6b7280'
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>Tipos de términos:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                <Hash size={14} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>#hashtag</strong> - Busca tweets con hashtags específicos
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Ejemplo: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>#javascript</code>, <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>#AI</code>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                <AtSign size={14} style={{ color: '#ec4899', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>@usuario</strong> - Busca tweets que mencionen a usuarios
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Ejemplo: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>@elonmusk</code>, <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>@openai</code>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                <Type size={14} style={{ color: '#6b7280', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>palabra</strong> - Busca tweets con términos libres
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Ejemplo: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>programming</code>, <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>machine learning</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontWeight: 600, marginBottom: '6px', color: '#1f2937' }}>Casos de uso:</div>
            <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '12px', color: '#6b7280' }}>
              <li style={{ marginBottom: '4px' }}>
                <strong>Tema específico:</strong> <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>#javascript framework comparison</code>
              </li>
              <li style={{ marginBottom: '4px' }}>
                <strong>Conversación de usuario:</strong> <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>@elonmusk #Tesla</code>
              </li>
              <li style={{ marginBottom: '4px' }}>
                <strong>Múltiples usuarios:</strong> <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>@openai @anthropicai AI safety</code>
              </li>
              <li style={{ marginBottom: '4px' }}>
                <strong>Tendencia mixta:</strong> <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>#bitcoin @cz_binance price prediction</code>
              </li>
            </ul>
          </div>

          <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
            <strong style={{ color: '#374151' }}>💡 Consejo:</strong> Puedes mezclar libremente hashtags, usuarios y términos libres en una misma búsqueda para resultados más precisos.
          </div>
        </div>
      )}

      {/* Backdrop para cerrar el popup */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
      <div style={{
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        padding: '4px 6px',
        minHeight: '32px',
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
        background: 'white',
        width: '450px'
      }}>
        {tags.map((tag) => {
          const type = getTagType(tag)
          const style = tagStyles[type]
          const Icon = style.icon

          return (
            <div
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '6px',
                fontSize: '13px',
                color: style.color,
                fontWeight: 500
              }}
            >
              <Icon size={12} style={{ flexShrink: 0 }} />
              {tag}
              <X
                size={14}
                onClick={() => !disabled && removeTag(tag)}
                style={{
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 0.6,
                  transition: 'opacity 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => !disabled && (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => !disabled && (e.currentTarget.style.opacity = '0.6')}
              />
            </div>
          )
        })}
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "#javascript @elonmusk AI" : "+"}
          disabled={disabled}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '2px 4px',
            fontSize: '14px',
            background: 'transparent',
            color: '#111',
            minWidth: '120px'
          }}
        />
        <button
          onClick={addTag}
          disabled={!currentInput.trim() || disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: (!currentInput.trim() || disabled) ? 'not-allowed' : 'pointer',
            color: '#6b7280',
            opacity: (!currentInput.trim() || disabled) ? 0.5 : 1,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !disabled && currentInput.trim() && (e.currentTarget.style.background = '#f3f4f6')}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Plus size={12} />
        </button>
      </div>
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        margin: '8px 0 0 0',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Hash size={12} style={{ color: '#3b82f6' }} />
          <span><strong>#hashtag</strong> para hashtags</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AtSign size={12} style={{ color: '#ec4899' }} />
          <span><strong>@usuario</strong> para usuarios</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Type size={12} style={{ color: '#6b7280' }} />
          <span><strong>palabra</strong> para términos libres</span>
        </div>
      </div>
      <p style={{
        fontSize: '11px',
        color: '#9ca3af',
        margin: '6px 0 0 0',
        fontStyle: 'italic'
      }}>
        Presiona Enter, Tab o coma para añadir. Puedes mezclar tipos.
      </p>
    </div>
  )
}
