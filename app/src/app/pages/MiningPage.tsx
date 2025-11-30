import { useState, useEffect, useRef } from 'react'
import { scraperAPI } from "@/features/mining/services/scraperApi"
import type { SearchOptions, ScrapingJob, ProgressUpdate, DownloadedFile, ProviderType, ProviderConfig } from "@/features/mining/services/scraperApi"
import { ScraperConfig } from "@/features/mining/components/ScraperConfig"
import { ScraperProgress } from "@/features/mining/components/ScraperProgress"
import { DownloadsList } from "@/features/mining/components/DownloadsList"
import { ScraperConsole } from "@/features/mining/components/ScraperConsole"
import { ProviderSelector } from "@/features/mining/components/ProviderSelector"
import { useGraphStore } from '@/lib/store/graphStore'

interface LogMessage {
  jobId: string
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export function MiningPage() {
  const setGraphData = useGraphStore((state) => state.setGraphData)
  const setLoading = useGraphStore((state) => state.setLoading)
  const setActiveTab = useGraphStore((state) => state.setActiveTab)

  const [queryTags, setQueryTags] = useState<string[]>([])
  const [mode, setMode] = useState<'latest' | 'top' | 'photos' | 'videos'>('latest')
  const [maxTweets, setMaxTweets] = useState('')
  const [includeReplies, setIncludeReplies] = useState(true)
  const [enrichUsers, setEnrichUsers] = useState(true) // Enriquecimiento de usuarios activado por defecto
  const [untilDate, setUntilDate] = useState('')
  const [sinceDate, setSinceDate] = useState('')
  const [minLikes, setMinLikes] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const [currentJob, setCurrentJob] = useState<ScrapingJob | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [downloads, setDownloads] = useState<DownloadedFile[]>([])
  const [loadingDownloads, setLoadingDownloads] = useState(false)
  const [logs, setLogs] = useState<LogMessage[]>([])

  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('twitterapi')
  const [loadingProviders, setLoadingProviders] = useState(true)

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    loadDownloads()
    loadProviders()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const loadProviders = async () => {
    setLoadingProviders(true)
    try {
      const { providers: availableProviders, default: defaultProvider } = await scraperAPI.getProviders()
      setProviders(availableProviders)
      if (defaultProvider) {
        setSelectedProvider(defaultProvider)
      }
    } catch (err) {
      console.error('Error loading providers:', err)
    } finally {
      setLoadingProviders(false)
    }
  }

  const loadDownloads = async () => {
    setLoadingDownloads(true)
    try {
      const files = await scraperAPI.listDownloads()
      setDownloads(files)
    } catch (err) {
      console.error('Error loading downloads:', err)
    } finally {
      setLoadingDownloads(false)
    }
  }

  const startScraping = async () => {
    if (queryTags.length === 0) {
      setError('Debes añadir al menos un término de búsqueda')
      return
    }

    setError(null)
    setIsRunning(true)
    setProgress(0)
    setStatusMessage('Iniciando scraping...')
    setLogs([])

    try {
      // Los tags ya vienen con su formato correcto (#, @, o texto libre)
      const combinedQuery = queryTags.join(' ')

      const options: SearchOptions = {
        query: combinedQuery,
        mode,
        maxTweets: maxTweets ? parseInt(maxTweets) : undefined,
        includeReplies,
        enrichUsers, // Añadir opción de enriquecimiento
        since: sinceDate || undefined,
        until: untilDate || undefined,
        provider: selectedProvider,
        filters: {
          minLikes: minLikes ? parseInt(minLikes) : undefined,
          verifiedOnly: verifiedOnly || undefined,
        },
      }

      const { jobId } = await scraperAPI.startScraping(options)
      wsRef.current = scraperAPI.connectWebSocket(jobId, handleProgressUpdate)

      const pollInterval = setInterval(async () => {
        try {
          const job = await scraperAPI.getJobStatus(jobId)
          setCurrentJob(job)

          if (job.status === 'completed' || job.status === 'error') {
            clearInterval(pollInterval)
            setIsRunning(false)

            if (job.status === 'completed') {
              setStatusMessage(`✓ Completado: ${job.tweetsCollected} tweets`)
              loadDownloads()
            } else if (job.error) {
              setError(job.error)
            }

            if (wsRef.current) wsRef.current.close()
          }
        } catch (err) {
          console.error('Error polling:', err)
        }
      }, 10000)
    } catch (err: any) {
      setError(err.message)
      setIsRunning(false)
    }
  }

  const stopScraping = async () => {
    if (!currentJob) return

    try {
      await scraperAPI.stopJob(currentJob.jobId)
      setIsRunning(false)
      setStatusMessage('Scraping detenido')
      if (wsRef.current) wsRef.current.close()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleProgressUpdate = (data: any) => {
    if (data.type === 'progress') {
      const update = data.data as ProgressUpdate
      setProgress(update.progress)
      setStatusMessage(update.message)

      if (update.status === 'error' && update.error) {
        setError(update.error)
        setIsRunning(false)
      }
    } else if (data.type === 'log') {
      const log = data.data as LogMessage
      setLogs(prev => [...prev, log])
    }
  }

  const downloadFile = async (filename: string) => {
    try {
      await scraperAPI.downloadFile(filename)
    } catch (err: any) {
      setError(`Error descargando: ${err.message}`)
    }
  }

  const deleteFile = async (filename: string) => {
    try {
      await scraperAPI.deleteFile(filename)
      await loadDownloads()
    } catch (err: any) {
      setError(`Error eliminando: ${err.message}`)
    }
  }

  const visualizeFile = async (filename: string) => {
    try {
      setError(null)
      setLoading(true)
      console.log('Cargando archivo:', filename)

      // Descargar el JSON del servidor
      const response = await fetch(`http://localhost:3001/api/scraper/download/${filename}`)
      if (!response.ok) {
        throw new Error('Error descargando el archivo')
      }

      const data = await response.json()
      console.log('Archivo cargado:', data)

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
          console.log('[MiningPage] Worker completado, isLoading debería estar en true')

          // Extraer metadata del dataset
          const metadata = {
            query: data.query || 'Desconocido',
            searchType: data.search_type || 'Latest',
            mode: data.mode || 'search',
            downloadedAt: data.metadata?.created_at || new Date().toISOString(),
            totalMainTweets: data.metadata?.total_tweets || data.tweets.length,
            totalReplies: 0,
            totalItems: data.tweets.length,
          }

          // Actualizar store con todos los datos
          const result = message.data
          console.log('[MiningPage] Actualizando graphData...')
          setGraphData({
            mentions: result.mentions,
            cohashtags: result.cohashtags,
            statistics: result.statistics,
            urlAnalysis: result.urlAnalysis,
            fileName: filename,
            datasetMetadata: metadata,
          })

          console.log('[MiningPage] Cambiando a tab graph...')
          // Cambiar a tab de grafo PRIMERO (mientras sigue el loading)
          setActiveTab('graph')

          console.log('[MiningPage] Esperando 300ms antes de quitar loading...')
          // Quitar loading DESPUÉS para que el usuario vea el spinner durante el cambio de tab
          setTimeout(() => {
            console.log('[MiningPage] Quitando loading')
            setLoading(false)
          }, 300)

          worker.terminate()
        } else if (message.type === 'error') {
          setError(`Error procesando datos: ${message.error}`)
          setLoading(false)
          worker.terminate()
        }
      }

      worker.onerror = (e) => {
        const errorMsg = e.message || 'Error desconocido en el procesamiento'
        console.error('[MiningPage] Worker error:', e)
        setError(`Error crítico procesando grafo: ${errorMsg}. Verifica que el archivo JSON tenga el formato correcto.`)
        setLoading(false)
        worker.terminate()
      }

      worker.postMessage({
        type: 'process',
        data: data,
      })

    } catch (err: any) {
      console.error('Error visualizando:', err)
      setError(`Error visualizando: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {!loadingProviders && (
        <ProviderSelector
          providers={providers}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          disabled={isRunning}
        />
      )}

      <ScraperConfig
        queryTags={queryTags}
        onQueryTagsChange={setQueryTags}
        mode={mode}
        onModeChange={setMode}
        maxTweets={maxTweets}
        onMaxTweetsChange={setMaxTweets}
        untilDate={untilDate}
        onUntilDateChange={setUntilDate}
        sinceDate={sinceDate}
        onSinceDateChange={setSinceDate}
        minLikes={minLikes}
        onMinLikesChange={setMinLikes}
        includeReplies={includeReplies}
        onIncludeRepliesChange={setIncludeReplies}
        enrichUsers={enrichUsers}
        onEnrichUsersChange={setEnrichUsers}
        verifiedOnly={verifiedOnly}
        onVerifiedOnlyChange={setVerifiedOnly}
        disabled={isRunning}
        onStart={startScraping}
        onStop={stopScraping}
        isRunning={isRunning}
      />

      {(isRunning || currentJob) && (
        <ScraperProgress
          isRunning={isRunning}
          job={currentJob}
          progress={progress}
          message={statusMessage}
        />
      )}

      {(isRunning || logs.length > 0) && (
        <ScraperConsole logs={logs} isRunning={isRunning} />
      )}

      {error && (
        <div style={{
          padding: '16px',
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <DownloadsList
        downloads={downloads}
        loading={loadingDownloads}
        onRefresh={loadDownloads}
        onDownload={downloadFile}
        onDelete={deleteFile}
        onVisualize={visualizeFile}
      />
    </div>
  )
}
