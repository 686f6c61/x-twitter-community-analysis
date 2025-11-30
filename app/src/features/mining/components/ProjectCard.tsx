import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Trash2, Download, Plus, RefreshCw, Calendar, Hash, Terminal, ChevronDown, ChevronUp, Eye, X } from 'lucide-react'
import type { ProjectMetadata } from '@/types/project'
import { projectsApi } from '../services/projectsApi'
import { useGraphStore } from '@/lib/store/graphStore'

interface ProjectCardProps {
  project: ProjectMetadata
  onDelete: () => void
  onUpdateStatus: (status: 'active' | 'paused' | 'completed') => void
  onRefresh: () => void
}

interface ConsoleLine {
  timestamp: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export function ProjectCard({ project, onDelete, onUpdateStatus, onRefresh }: ProjectCardProps) {
  const setGraphData = useGraphStore((state) => state.setGraphData)
  const setRawTweets = useGraphStore((state) => state.setRawTweets)
  const setLoading = useGraphStore((state) => state.setLoading)
  const setActiveTab = useGraphStore((state) => state.setActiveTab)

  const [showAddQuery, setShowAddQuery] = useState(false)
  const [newQuery, setNewQuery] = useState('')
  const [continuing, setContinuing] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLine[]>([])
  const [visualizing, setVisualizing] = useState(false)
  const consoleEndRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date>(new Date())

  const statusColors = {
    active: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    paused: { bg: '#fef3c7', text: '#78350f', border: '#fde68a' },
    completed: { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' }
  }

  const statusLabels = {
    active: 'Activo',
    paused: 'Pausado',
    completed: 'Completado'
  }

  const handleContinue = async () => {
    setContinuing(true)
    try {
      await projectsApi.continueProject(project.projectId, { projectId: project.projectId, maxTweets: 100 })
      alert('Scraping iniciado para todas las queries activas')
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Error continuando proyecto')
    } finally {
      setContinuing(false)
    }
  }

  const handleAddQuery = async () => {
    if (!newQuery.trim()) return

    try {
      await projectsApi.addQuery(project.projectId, { projectId: project.projectId, query: newQuery.trim(), maxTweets: 100 })
      setNewQuery('')
      setShowAddQuery(false)
      alert('Query añadida y scraping iniciado')
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Error añadiendo query')
    }
  }

  const handleRemoveQuery = async (query: string) => {
    if (project.queries.length === 1) {
      alert('No puedes eliminar la única query del proyecto')
      return
    }

    if (!confirm(`¿Eliminar la query "${query}"?`)) return

    try {
      await projectsApi.removeQuery(project.projectId, query)
      alert('Query eliminada')
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Error eliminando query')
    }
  }

  const handleRemoveTermFromQuery = async (query: string, termToRemove: string) => {
    const terms = query.split(' ').filter(t => t.trim())

    if (terms.length === 1) {
      alert('No puedes eliminar el único término. Elimina la query completa en su lugar.')
      return
    }

    const newTerms = terms.filter(t => t !== termToRemove)
    const newQuery = newTerms.join(' ')

    if (!confirm(`¿Eliminar "${termToRemove}" de la query?\n\nNueva query: "${newQuery}"`)) return

    try {
      // Primero eliminar la query antigua
      await projectsApi.removeQuery(project.projectId, query)
      // Luego añadir la nueva query modificada
      await projectsApi.addQuery(project.projectId, {
        projectId: project.projectId,
        query: newQuery,
        maxTweets: 100
      })
      alert('Término eliminado de la query')
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Error modificando query')
    }
  }

  const handleAddTermToQuery = async (query: string, newTerm: string) => {
    if (!newTerm.trim()) return

    const newQuery = `${query} ${newTerm.trim()}`

    try {
      // Eliminar query antigua
      await projectsApi.removeQuery(project.projectId, query)
      // Añadir query modificada
      await projectsApi.addQuery(project.projectId, {
        projectId: project.projectId,
        query: newQuery,
        maxTweets: 100
      })
      alert('Término añadido a la query')
      onRefresh()
    } catch (err: any) {
      alert(err.message || 'Error añadiendo término')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleVisualize = async () => {
    if (!project.datasetFilename) {
      alert('No hay dataset disponible para visualizar')
      return
    }

    setVisualizing(true)
    try {
      setLoading(true)

      // Descargar el JSON del servidor
      const response = await fetch(`http://localhost:3001/api/scraper/download/${project.datasetFilename}`)
      if (!response.ok) {
        throw new Error('Error descargando el archivo del proyecto')
      }

      const data = await response.json()

      // Validar formato
      if (!data.tweets || !Array.isArray(data.tweets)) {
        throw new Error('Formato de archivo inválido. Se esperaba un array de tweets.')
      }

      // Crear worker para procesar los datos
      const worker = new Worker(
        new URL('@/features/graph-visualization/workers/graph.worker.ts', import.meta.url),
        { type: 'module' }
      )

      worker.onmessage = (e) => {
        const message = e.data

        if (message.type === 'complete') {
          // Extraer metadata del dataset
          let dateRange = undefined
          if (data.tweets && data.tweets.length > 0) {
            const timestamps = data.tweets
              .map((t: any) => t.tweet?.time_parsed || t.tweet?.timestamp)
              .filter(Boolean)

            if (timestamps.length > 0) {
              const dates = timestamps.map((ts: any) => new Date(ts))
              const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
              const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

              dateRange = {
                start: minDate.toISOString().split('T')[0],
                end: maxDate.toISOString().split('T')[0]
              }
            }
          }

          const metadata = {
            query: project.queries.map(q => q.query).join(' '),
            searchType: 'Continuous Monitoring',
            mode: 'project',
            downloadedAt: project.createdAt,
            totalMainTweets: project.totalTweets,
            totalReplies: 0,
            totalItems: data.tweets.length,
            dateRange
          }

          // Guardar tweets originales
          setRawTweets(data.tweets || [])

          // Actualizar store con todos los datos
          const result = message.data
          setGraphData({
            mentions: result.mentions,
            cohashtags: result.cohashtags,
            statistics: result.statistics,
            urlAnalysis: result.urlAnalysis,
            fileName: project.datasetFilename,
            datasetMetadata: metadata,
          })

          // Cambiar a tab de grafo
          setActiveTab('graph')

          setTimeout(() => {
            setLoading(false)
            setVisualizing(false)
          }, 300)

          worker.terminate()
        } else if (message.type === 'error') {
          alert(`Error procesando datos: ${message.error}`)
          setLoading(false)
          setVisualizing(false)
          worker.terminate()
        }
      }

      worker.onerror = (e) => {
        const errorMsg = e.message || 'Error desconocido en el procesamiento'
        alert(`Error crítico procesando grafo: ${errorMsg}`)
        setLoading(false)
        setVisualizing(false)
        worker.terminate()
      }

      worker.postMessage({
        type: 'process',
        data: data,
      })

    } catch (err: any) {
      alert(`Error visualizando: ${err.message}`)
      setLoading(false)
      setVisualizing(false)
    }
  }

  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const timestamp = new Date().toLocaleTimeString('es-ES')
    setConsoleLogs(prev => [...prev.slice(-49), { timestamp, type, message }])
  }

  // Polling cada 10 segundos para actualizar el proyecto
  useEffect(() => {
    if (project.status === 'active' && showConsole) {
      addLog('info', '🔄 Monitor iniciado - actualizando cada 10s')

      intervalRef.current = setInterval(async () => {
        try {
          const oldTotal = project.totalTweets
          onRefresh() // Actualizar datos del proyecto

          // Simular logs basados en cambios (esto debería venir del backend en producción)
          const newTotal = project.totalTweets
          if (newTotal > oldTotal) {
            const diff = newTotal - oldTotal
            addLog('success', `✓ +${diff} tweets recolectados (Total: ${newTotal})`)
          }
        } catch (err) {
          addLog('error', '✗ Error actualizando proyecto')
        }
      }, 10000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [project.status, showConsole])

  // Auto-scroll al final de la consola
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLogs])

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.2s',
      cursor: 'default'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111' }}>
            {project.name}
          </h3>
          <div
            style={{
              padding: '4px 10px',
              background: statusColors[project.status].bg,
              border: `1px solid ${statusColors[project.status].border}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: statusColors[project.status].text
            }}
          >
            {statusLabels[project.status]}
          </div>
        </div>
        {project.description && (
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
            {project.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#9ca3af' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {formatDate(project.createdAt)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Hash size={14} />
            {project.totalTweets} tweets
          </div>
        </div>
      </div>

      {/* Queries */}
      <div style={{ padding: '16px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
          Queries ({project.queries.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {project.queries.map((q, idx) => {
            const terms = q.query.split(' ').filter(t => t.trim())
            const [showAddTerm, setShowAddTerm] = useState(false)
            const [newTerm, setNewTerm] = useState('')

            return (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                {/* Terms as tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {terms.map((term, termIdx) => (
                    <div
                      key={termIdx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#374151'
                      }}
                    >
                      <span>{term}</span>
                      <button
                        onClick={() => handleRemoveTermFromQuery(q.query, term)}
                        disabled={terms.length === 1}
                        style={{
                          padding: '2px',
                          background: 'transparent',
                          border: 'none',
                          color: terms.length === 1 ? '#d1d5db' : '#9ca3af',
                          cursor: terms.length === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '3px',
                          opacity: terms.length === 1 ? 0.4 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (terms.length > 1) {
                            e.currentTarget.style.color = '#dc2626'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (terms.length > 1) {
                            e.currentTarget.style.color = '#9ca3af'
                          }
                        }}
                        title={terms.length === 1 ? "No puedes eliminar el único término" : "Eliminar término"}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Add term button */}
                  {!showAddTerm ? (
                    <button
                      onClick={() => setShowAddTerm(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px dashed #d1d5db',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={12} />
                      Añadir término
                    </button>
                  ) : (
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <input
                        type="text"
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        placeholder="nuevo término"
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '12px',
                          width: '120px'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddTermToQuery(q.query, newTerm)
                            setShowAddTerm(false)
                            setNewTerm('')
                          } else if (e.key === 'Escape') {
                            setShowAddTerm(false)
                            setNewTerm('')
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          handleAddTermToQuery(q.query, newTerm)
                          setShowAddTerm(false)
                          setNewTerm('')
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#000',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setShowAddTerm(false)
                          setNewTerm('')
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#f3f4f6',
                          color: '#6b7280',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        ✗
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {q.tweetsCollected} tweets
                    {q.lastScrapedAt && ` · Último: ${formatDate(q.lastScrapedAt)}`}
                  </div>
                  {project.queries.length > 1 && (
                    <button
                      onClick={() => handleRemoveQuery(q.query)}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '11px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9ca3af'
                      }}
                      title="Eliminar query completa"
                    >
                      Eliminar query
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Query Form */}
        {showAddQuery ? (
          <div style={{ marginTop: '12px' }}>
            <input
              type="text"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              placeholder="#nuevotendencia @usuario termino"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '8px'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddQuery()}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAddQuery}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Añadir
              </button>
              <button
                onClick={() => {
                  setShowAddQuery(false)
                  setNewQuery('')
                }}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddQuery(true)}
            disabled={project.status !== 'active'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              marginTop: '12px',
              padding: '8px',
              background: 'white',
              border: '1px dashed #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#6b7280',
              cursor: project.status === 'active' ? 'pointer' : 'not-allowed',
              opacity: project.status === 'active' ? 1 : 0.5,
              justifyContent: 'center'
            }}
          >
            <Plus size={14} />
            Añadir query
          </button>
        )}
      </div>

      {/* Console Section */}
      {project.status === 'active' && (
        <div style={{ borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setShowConsole(!showConsole)}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: showConsole ? '#f9fafb' : 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={16} />
              Monitor en tiempo real
            </div>
            {showConsole ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showConsole && (
            <>
              {/* KPI Summary Bar */}
              <div style={{
                padding: '16px 20px',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px'
              }}>
                {/* Total Tweets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                    TWEETS DESCARGADOS
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>
                    {project.totalTweets.toLocaleString()}
                  </div>
                </div>

                {/* Queries Activas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                    QUERIES ACTIVAS
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>
                    {project.queries.length}
                  </div>
                </div>

                {/* Última Actualización */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                    ÚLTIMA ACTUALIZACIÓN
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                    {project.updatedAt ? new Date(project.updatedAt).toLocaleTimeString('es-ES') : 'N/A'}
                  </div>
                </div>

                {/* Tiempo Activo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                    TIEMPO ACTIVO
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                    {(() => {
                      const now = new Date()
                      const created = new Date(project.createdAt)
                      const diffMs = now.getTime() - created.getTime()
                      const diffMins = Math.floor(diffMs / 60000)
                      const diffHours = Math.floor(diffMins / 60)
                      const diffDays = Math.floor(diffHours / 24)

                      if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
                      if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`
                      return `${diffMins}m`
                    })()}
                  </div>
                </div>
              </div>

              {/* Console Logs */}
              <div style={{
                padding: '12px',
                background: '#1e1e1e',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
                color: '#d4d4d4'
              }}>
                {consoleLogs.length === 0 ? (
                  <div style={{ color: '#6b7280', padding: '8px' }}>
                    Esperando actividad...
                  </div>
                ) : (
                  consoleLogs.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '4px 0',
                        color: log.type === 'success' ? '#22c55e' :
                               log.type === 'error' ? '#ef4444' :
                               log.type === 'warning' ? '#f59e0b' :
                               '#9ca3af'
                      }}
                    >
                      <span style={{ color: '#6b7280' }}>[{log.timestamp}]</span>{' '}
                      {log.message}
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: '8px' }}>
        <button
          onClick={handleContinue}
          disabled={project.status !== 'active' || continuing}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: project.status === 'active' ? '#000' : '#f3f4f6',
            color: project.status === 'active' ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: project.status === 'active' ? 'pointer' : 'not-allowed',
            opacity: continuing ? 0.6 : 1
          }}
        >
          <RefreshCw size={14} />
          {continuing ? 'Actualizando...' : 'Actualizar'}
        </button>

        <button
          onClick={handleVisualize}
          disabled={!project.datasetFilename || project.totalTweets === 0 || visualizing}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: project.totalTweets > 0 ? '#2563eb' : '#f3f4f6',
            color: project.totalTweets > 0 ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: project.totalTweets > 0 ? 'pointer' : 'not-allowed',
            opacity: visualizing ? 0.6 : 1
          }}
          title="Visualizar en grafo"
        >
          <Eye size={14} />
          {visualizing ? 'Cargando...' : 'Visualizar'}
        </button>

        {project.status === 'active' ? (
          <button
            onClick={() => onUpdateStatus('paused')}
            style={{
              padding: '8px 12px',
              background: 'white',
              color: '#78350f',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
            title="Pausar proyecto"
          >
            <Pause size={14} />
          </button>
        ) : (
          <button
            onClick={() => onUpdateStatus('active')}
            style={{
              padding: '8px 12px',
              background: 'white',
              color: '#166534',
              border: '1px solid #86efac',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
            title="Reanudar proyecto"
          >
            <Play size={14} />
          </button>
        )}

        <button
          onClick={onDelete}
          style={{
            padding: '8px 12px',
            background: 'white',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
          title="Eliminar proyecto"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
