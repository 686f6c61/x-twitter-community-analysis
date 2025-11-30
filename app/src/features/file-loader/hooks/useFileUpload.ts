import { useState } from 'react'
import { useGraphStore } from '@/lib/store/graphStore'

export function useFileUpload() {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const setGraphData = useGraphStore((state) => state.setGraphData)
  const setRawTweets = useGraphStore((state) => state.setRawTweets)
  const setGlobalLoading = useGraphStore((state) => state.setLoading)
  const setActiveTab = useGraphStore((state) => state.setActiveTab)

  const uploadFile = async (file: File) => {
    setIsLoading(true)
    setGlobalLoading(true)
    setActiveTab('graph')
    setError(null)
    setProgress(0)
    setFileName(file.name)

    try {
      // Leer archivo
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.tweets || !Array.isArray(data.tweets)) {
        throw new Error('Formato de archivo inválido. Se esperaba un array de tweets.')
      }

      setProgress(20)

      // Crear worker
      const worker = new Worker(
        new URL('../../graph-visualization/workers/graph.worker.ts', import.meta.url),
        { type: 'module' }
      )

      // Configurar listeners del worker
      worker.onmessage = (e) => {
        const message = e.data

        if (message.type === 'progress') {
          // Actualizar progreso (30-90%)
          const workerProgress = Math.min(90, 30 + message.progress * 0.6)
          setProgress(workerProgress)
        } else if (message.type === 'complete') {
          // Extraer metadata del dataset
          const metadata: any = {
            query: data.query || 'Desconocido',
            searchType: data.search_type || 'Latest',
            mode: data.mode || 'search',
            downloadedAt: data.downloaded_at || new Date().toISOString(),
            totalMainTweets: data.total_main_tweets || 0,
            totalReplies: data.total_replies || 0,
            totalItems: data.total_items || 0,
          }

          // Calcular rango de fechas de los tweets
          if (data.tweets && data.tweets.length > 0) {
            const timestamps = data.tweets
              .map((t: any) => t.tweet?.timestamp)
              .filter((ts: any) => ts)
              .sort((a: number, b: number) => a - b)

            if (timestamps.length > 0) {
              metadata.dateRange = {
                start: new Date(timestamps[0] * 1000).toISOString(),
                end: new Date(timestamps[timestamps.length - 1] * 1000).toISOString()
              }
            }
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
            fileName: file.name,
            datasetMetadata: metadata,
          })

          setProgress(100)
          setIsLoading(false)
          // No llamamos a setGlobalLoading(false) aquí porque setGraphData ya lo hace
          worker.terminate()
        } else if (message.type === 'error') {
          setError(`Error en worker: ${message.error}`)
          setIsLoading(false)
          setGlobalLoading(false)
          worker.terminate()
        }
      }

      worker.onerror = (e) => {
        setError(`Error en worker: ${e.message}`)
        setIsLoading(false)
        setGlobalLoading(false)
        worker.terminate()
      }

      // Enviar datos al worker con el formato correcto
      worker.postMessage({
        type: 'process',
        data: data,
      })

      setProgress(30)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el archivo'
      setError(message)
      setIsLoading(false)
      setGlobalLoading(false)
      setProgress(0)
    }
  }

  const uploadFromServer = async (filename: string) => {
    setIsLoading(true)
    setGlobalLoading(true)
    setActiveTab('graph')
    setError(null)
    setProgress(0)
    setFileName(filename)

    try {
      // Descargar el JSON del servidor
      const response = await fetch(`http://localhost:3001/api/scraper/download/${filename}`)
      if (!response.ok) {
        throw new Error('Error descargando el archivo del servidor')
      }

      const data = await response.json()

      if (!data.tweets || !Array.isArray(data.tweets)) {
        throw new Error('Formato de archivo inválido. Se esperaba un array de tweets.')
      }

      setProgress(20)

      // Crear worker
      const worker = new Worker(
        new URL('../../graph-visualization/workers/graph.worker.ts', import.meta.url),
        { type: 'module' }
      )

      // Configurar listeners del worker
      worker.onmessage = (e) => {
        const message = e.data

        if (message.type === 'progress') {
          // Actualizar progreso (30-90%)
          const workerProgress = Math.min(90, 30 + message.progress * 0.6)
          setProgress(workerProgress)
        } else if (message.type === 'complete') {
          // Extraer metadata del dataset
          const metadata: any = {
            query: data.query || 'Desconocido',
            searchType: data.search_type || 'Latest',
            mode: data.mode || 'search',
            downloadedAt: data.downloaded_at || new Date().toISOString(),
            totalMainTweets: data.total_main_tweets || 0,
            totalReplies: data.total_replies || 0,
            totalItems: data.total_items || 0,
          }

          // Calcular rango de fechas de los tweets
          if (data.tweets && data.tweets.length > 0) {
            const timestamps = data.tweets
              .map((t: any) => t.tweet?.timestamp)
              .filter((ts: any) => ts)
              .sort((a: number, b: number) => a - b)

            if (timestamps.length > 0) {
              metadata.dateRange = {
                start: new Date(timestamps[0] * 1000).toISOString(),
                end: new Date(timestamps[timestamps.length - 1] * 1000).toISOString()
              }
            }
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
            fileName: filename,
            datasetMetadata: metadata,
          })

          setProgress(100)
          setIsLoading(false)
          // No llamamos a setGlobalLoading(false) aquí porque setGraphData ya lo hace
          worker.terminate()
        } else if (message.type === 'error') {
          setError(`Error en worker: ${message.error}`)
          setIsLoading(false)
          setGlobalLoading(false)
          worker.terminate()
        }
      }

      worker.onerror = (e) => {
        setError(`Error en worker: ${e.message}`)
        setIsLoading(false)
        setGlobalLoading(false)
        worker.terminate()
      }

      // Enviar datos al worker con el formato correcto
      worker.postMessage({
        type: 'process',
        data: data,
      })

      setProgress(30)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar el archivo'
      setError(message)
      setIsLoading(false)
      setGlobalLoading(false)
      setProgress(0)
    }
  }

  const clearFile = () => {
    setProgress(0)
    setIsLoading(false)
    setError(null)
    setFileName(null)
  }

  return {
    uploadFile,
    uploadFromServer,
    clearFile,
    progress,
    isLoading,
    error,
    fileName,
  }
}
