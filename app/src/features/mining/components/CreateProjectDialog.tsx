import { useState } from 'react'
import { X, Info } from 'lucide-react'
import { projectsApi } from '../services/projectsApi'
import { QueryTagsInput } from './QueryTagsInput'

interface CreateProjectDialogProps {
  onClose: () => void
  onCreated: () => void
}

export function CreateProjectDialog({ onClose, onCreated }: CreateProjectDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [queryTags, setQueryTags] = useState<string[]>([])
  const [mode, setMode] = useState<'latest' | 'top' | 'photos' | 'videos'>('latest')
  const [maxTweets, setMaxTweets] = useState('100')
  const [includeReplies, setIncludeReplies] = useState(false)
  const [enrichUsers, setEnrichUsers] = useState(true)
  const [sinceDate, setSinceDate] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('El nombre es obligatorio')
      return
    }

    if (queryTags.length === 0) {
      alert('Añade al menos un término de búsqueda')
      return
    }

    setCreating(true)
    try {
      const query = queryTags.join(' ')
      await projectsApi.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        initialQuery: query,
        config: {
          mode,
          maxTweets: maxTweets ? parseInt(maxTweets) : undefined,
          includeReplies,
          enrichUsers,
          since: sinceDate || undefined
        }
      })
      onCreated()
    } catch (err: any) {
      alert(err.message || 'Error creando proyecto')
      setCreating(false)
    }
  }

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
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Nuevo Proyecto de Monitoreo</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Info Banner */}
          <div style={{
            padding: '14px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#374151',
            lineHeight: '1.5'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Info size={16} style={{ color: '#6b7280', flexShrink: 0, marginTop: '2px' }} />
              <div>
                El proyecto iniciará scraping desde la fecha indicada y podrás añadir nuevas queries dinámicamente.
                Todos los datos se acumularán en un único dataset sin duplicados.
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Nombre del proyecto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Elecciones 2024"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#111'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Monitoreo de tendencias políticas durante el proceso electoral"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#111',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Initial Query */}
          <div>
            <QueryTagsInput
              tags={queryTags}
              onTagsChange={setQueryTags}
            />
          </div>

          {/* Config Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Modo
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#111'
                }}
              >
                <option value="latest">Latest (Recientes)</option>
                <option value="top">Top (Populares)</option>
                <option value="photos">Photos</option>
                <option value="videos">Videos</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Tweets iniciales
              </label>
              <input
                type="number"
                value={maxTweets}
                onChange={(e) => setMaxTweets(e.target.value)}
                placeholder="100"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#111'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Desde (fecha inicial)
              </label>
              <input
                type="date"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#111'
                }}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeReplies}
                onChange={(e) => setIncludeReplies(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Incluir respuestas
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enrichUsers}
                onChange={(e) => setEnrichUsers(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Enriquecer usuarios (recomendado)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={creating}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.6 : 1
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: '10px 20px',
              background: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.6 : 1
            }}
          >
            {creating ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </div>
      </div>
    </div>
  )
}
