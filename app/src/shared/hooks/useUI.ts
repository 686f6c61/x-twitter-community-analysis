import { useUIStore } from '@/lib/store/uiStore'

/**
 * Hook para estado de navegación
 */
export function useNavigation() {
  const currentTab = useUIStore((state) => state.currentTab)
  const currentGraphType = useUIStore((state) => state.currentGraphType)
  const setCurrentTab = useUIStore((state) => state.setCurrentTab)
  const setCurrentGraphType = useUIStore((state) => state.setCurrentGraphType)

  return {
    currentTab,
    currentGraphType,
    setCurrentTab,
    setCurrentGraphType,
  }
}

/**
 * Hook para estado de selección
 */
export function useSelection() {
  const selectedNodeId = useUIStore((state) => state.selectedNodeId)
  const selectedCommunity = useUIStore((state) => state.selectedCommunity)
  const setSelectedNode = useUIStore((state) => state.setSelectedNode)
  const setSelectedCommunity = useUIStore((state) => state.setSelectedCommunity)
  const clearSelection = useUIStore((state) => state.clearSelection)

  return {
    selectedNodeId,
    selectedCommunity,
    setSelectedNode,
    setSelectedCommunity,
    clearSelection,
  }
}

/**
 * Hook para filtros
 */
export function useFilters() {
  const influencerCategoryFilter = useUIStore((state) => state.influencerCategoryFilter)
  const botScoreFilter = useUIStore((state) => state.botScoreFilter)
  const searchQuery = useUIStore((state) => state.searchQuery)
  const setInfluencerCategoryFilter = useUIStore((state) => state.setInfluencerCategoryFilter)
  const setBotScoreFilter = useUIStore((state) => state.setBotScoreFilter)
  const setSearchQuery = useUIStore((state) => state.setSearchQuery)
  const clearFilters = useUIStore((state) => state.clearFilters)

  return {
    influencerCategoryFilter,
    botScoreFilter,
    searchQuery,
    setInfluencerCategoryFilter,
    setBotScoreFilter,
    setSearchQuery,
    clearFilters,
  }
}

/**
 * Hook para modales
 */
export function useModals() {
  const isProfileModalOpen = useUIStore((state) => state.isProfileModalOpen)
  const profileModalUserId = useUIStore((state) => state.profileModalUserId)
  const openProfileModal = useUIStore((state) => state.openProfileModal)
  const closeProfileModal = useUIStore((state) => state.closeProfileModal)

  return {
    isProfileModalOpen,
    profileModalUserId,
    openProfileModal,
    closeProfileModal,
  }
}

/**
 * Hook para estado de carga
 */
export function useLoading() {
  const isLoading = useUIStore((state) => state.isLoading)
  const loadingMessage = useUIStore((state) => state.loadingMessage)
  const setLoading = useUIStore((state) => state.setLoading)

  return {
    isLoading,
    loadingMessage,
    setLoading,
  }
}
