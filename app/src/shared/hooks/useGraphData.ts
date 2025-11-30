import { useGraphStore } from '@/lib/store/graphStore'

/**
 * Hook para acceder a los datos del grafo
 */
export function useGraphData() {
  const mentions = useGraphStore((state) => state.mentions)
  const cohashtags = useGraphStore((state) => state.cohashtags)
  const statistics = useGraphStore((state) => state.statistics)
  const urlAnalysis = useGraphStore((state) => state.urlAnalysis)
  const fileName = useGraphStore((state) => state.fileName)
  const hasData = useGraphStore((state) => state.hasData())

  return {
    mentions,
    cohashtags,
    statistics,
    urlAnalysis,
    fileName,
    hasData,
  }
}

/**
 * Hook para modificar los datos del grafo
 */
export function useGraphActions() {
  const setGraphData = useGraphStore((state) => state.setGraphData)
  const setMentions = useGraphStore((state) => state.setMentions)
  const setCohashtags = useGraphStore((state) => state.setCohashtags)
  const setStatistics = useGraphStore((state) => state.setStatistics)
  const setURLAnalysis = useGraphStore((state) => state.setURLAnalysis)
  const clearGraphData = useGraphStore((state) => state.clearGraphData)
  const getNodeById = useGraphStore((state) => state.getNodeById)

  return {
    setGraphData,
    setMentions,
    setCohashtags,
    setStatistics,
    setURLAnalysis,
    clearGraphData,
    getNodeById,
  }
}

/**
 * Hook combinado para datos y acciones
 */
export function useGraph() {
  const data = useGraphData()
  const actions = useGraphActions()

  return {
    ...data,
    ...actions,
  }
}
