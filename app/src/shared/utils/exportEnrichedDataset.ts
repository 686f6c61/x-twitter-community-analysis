import { useGraphStore } from '@/lib/store/graphStore'
import type { DataQualityMetrics } from '@/shared/hooks/useDataQualityMetrics'
import type { GraphAnomaliesAnalysis } from '@/shared/hooks/useGraphAnomalies'
import type { TemporalAnalysis } from '@/shared/hooks/useTemporalAnalysis'

export interface EnrichedDataset {
  // Original metadata
  metadata: {
    query: string
    searchType: string
    mode: string
    downloadedAt: string
    exportedAt: string
    totalMainTweets: number
    totalReplies: number
    totalItems: number
    dateRange?: {
      start: string
      end: string
    }
  }

  // Quality metrics
  quality: DataQualityMetrics | null

  // Graph structural analysis
  graphAnalysis: {
    mentions?: GraphAnomaliesAnalysis
    cohashtags?: GraphAnomaliesAnalysis
  }

  // Temporal & engagement analysis
  temporalAnalysis: TemporalAnalysis | null

  // Graph data with computed metrics
  graphs: {
    mentions: {
      nodeCount: number
      edgeCount: number
      nodes: any[]
      edges: any[]
      communities: any[]
    } | null
    cohashtags: {
      nodeCount: number
      edgeCount: number
      nodes: any[]
      edges: any[]
      communities: any[]
    } | null
  }

  // URL analysis
  urlAnalysis: any | null

  // General statistics
  statistics: any | null

  // Academic validation
  academic: {
    version: string
    tool: string
    computedMetrics: string[]
    references: Array<{
      metric: string
      reference: string
    }>
  }
}

/**
 * Creates an enriched dataset export with all computed metrics
 */
export function createEnrichedDataset(
  qualityMetrics: DataQualityMetrics | null,
  mentionsAnomalies: GraphAnomaliesAnalysis | null,
  cohashtagsAnomalies: GraphAnomaliesAnalysis | null,
  temporalAnalysis: TemporalAnalysis | null
): EnrichedDataset {
  const store = useGraphStore.getState()

  const enriched: EnrichedDataset = {
    metadata: {
      query: store.datasetMetadata?.query || 'Unknown',
      searchType: store.datasetMetadata?.searchType || 'Latest',
      mode: store.datasetMetadata?.mode || 'search',
      downloadedAt: store.datasetMetadata?.downloadedAt || new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      totalMainTweets: store.datasetMetadata?.totalMainTweets || 0,
      totalReplies: store.datasetMetadata?.totalReplies || 0,
      totalItems: store.datasetMetadata?.totalItems || 0,
      dateRange: store.datasetMetadata?.dateRange
    },

    quality: qualityMetrics,

    graphAnalysis: {
      mentions: mentionsAnomalies || undefined,
      cohashtags: cohashtagsAnomalies || undefined
    },

    temporalAnalysis,

    graphs: {
      mentions: store.mentions ? {
        nodeCount: store.mentions.nodes.length,
        edgeCount: store.mentions.edges.length,
        nodes: store.mentions.nodes,
        edges: store.mentions.edges,
        communities: [] // TODO: extract communities if available
      } : null,
      cohashtags: store.cohashtags ? {
        nodeCount: store.cohashtags.nodes.length,
        edgeCount: store.cohashtags.edges.length,
        nodes: store.cohashtags.nodes,
        edges: store.cohashtags.edges,
        communities: []
      } : null
    },

    urlAnalysis: store.urlAnalysis,
    statistics: store.statistics,

    academic: {
      version: '0.8.0',
      tool: 'GRAPHS - Graph-based Reddit and Analytics Platform for Hashtag Studies',
      computedMetrics: [
        'Degree Centrality',
        'Betweenness Centrality',
        'Closeness Centrality',
        'Eigenvector Centrality',
        'Community Detection (Louvain)',
        'Graph Density',
        'Engagement Rate',
        'Quality Metrics',
        'Temporal Patterns',
        'URL Virality Score'
      ],
      references: [
        {
          metric: 'Betweenness Centrality',
          reference: 'Brandes, U. (2001). A faster algorithm for betweenness centrality. Journal of Mathematical Sociology, 25(2), 163-177.'
        },
        {
          metric: 'Degree/Closeness/Betweenness',
          reference: 'Freeman, L. C. (1978). Centrality in social networks conceptual clarification. Social Networks, 1(3), 215-239.'
        },
        {
          metric: 'Community Detection',
          reference: 'Blondel, V. D., et al. (2008). Fast unfolding of communities in large networks. Journal of Statistical Mechanics: Theory and Experiment, 2008(10), P10008.'
        },
        {
          metric: 'Graph Metrics',
          reference: 'Newman, M. E. J. (2010). Networks: An Introduction. Oxford University Press.'
        }
      ]
    }
  }

  return enriched
}

/**
 * Triggers download of enriched dataset as JSON file
 */
export function downloadEnrichedDataset(dataset: EnrichedDataset, filename?: string) {
  const json = JSON.stringify(dataset, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || `enriched_dataset_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
