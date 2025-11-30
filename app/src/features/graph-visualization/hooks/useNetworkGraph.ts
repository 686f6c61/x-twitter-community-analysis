import { useState } from 'react'

export type LayoutType = 'forceDirected' | 'hierarchical' | 'circular' | 'radial' | 'community' | 'bipartite'

interface NetworkGraphConfig {
  layoutType: LayoutType
  showLabels: boolean
  showEdges: boolean
  physicsEnabled: boolean
  minNodeSize: number
  maxNodeSize: number
}

const defaultConfig: NetworkGraphConfig = {
  layoutType: 'forceDirected',
  showLabels: true,
  showEdges: true,
  physicsEnabled: true,
  minNodeSize: 10,
  maxNodeSize: 50,
}

export function useNetworkGraph() {
  const [config, setConfig] = useState<NetworkGraphConfig>(defaultConfig)

  const setLayoutType = (layout: LayoutType) => {
    setConfig(prev => ({ ...prev, layoutType: layout }))
  }

  const toggleLabels = () => {
    setConfig(prev => ({ ...prev, showLabels: !prev.showLabels }))
  }

  const toggleEdges = () => {
    setConfig(prev => ({ ...prev, showEdges: !prev.showEdges }))
  }

  const togglePhysics = () => {
    setConfig(prev => ({ ...prev, physicsEnabled: !prev.physicsEnabled }))
  }

  const setNodeSizeRange = (min: number, max: number) => {
    setConfig(prev => ({ ...prev, minNodeSize: min, maxNodeSize: max }))
  }

  const resetConfig = () => {
    setConfig(defaultConfig)
  }

  return {
    config,
    setLayoutType,
    toggleLabels,
    toggleEdges,
    togglePhysics,
    setNodeSizeRange,
    resetConfig,
  }
}
