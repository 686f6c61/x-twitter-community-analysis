import { useMemo } from 'react'
import { useGraphStore } from '@/lib/store/graphStore'

export interface TemporalPattern {
  type: 'spike' | 'trend' | 'periodic' | 'anomaly'
  timestamp: number
  value: number
  description: string
}

export interface HourlyDistribution {
  hour: number
  count: number
  avgEngagement: number
}

export interface EngagementMetrics {
  avgRate: number
  medianRate: number
  topPerformers: Array<{
    id: string
    username: string
    engagementRate: number
    totalEngagement: number
    views: number
  }>
  lowPerformers: Array<{
    id: string
    username: string
    engagementRate: number
    totalEngagement: number
    views: number
  }>
}

export interface TemporalAnalysis {
  // Temporal patterns
  patterns: TemporalPattern[]
  peakHours: number[]
  quietHours: number[]
  hourlyDistribution: HourlyDistribution[]

  // Engagement analysis
  engagementMetrics: EngagementMetrics

  // Overall statistics
  totalPeriodDays: number
  avgTweetsPerDay: number
  peakDay: { date: string; count: number } | null
}

export function useTemporalAnalysis(): TemporalAnalysis | null {
  const datasetMetadata = useGraphStore((state) => state.datasetMetadata)
  const mentions = useGraphStore((state) => state.mentions)

  return useMemo(() => {
    if (!datasetMetadata || !mentions || !mentions.nodes) return null

    const nodes = mentions.nodes

    // Calculate engagement rates for each node
    const nodesWithEngagement = nodes.map(node => {
      const totalEngagement = (node.likes || 0) + (node.retweets || 0) + (node.replies || 0)
      const views = node.views || 0
      const engagementRate = views > 0 ? totalEngagement / views : 0

      return {
        id: node.id,
        username: node.username || node.id,
        engagementRate,
        totalEngagement,
        views,
        timestamp: node.timestamp
      }
    }).filter(n => n.views > 0) // Only nodes with views

    // Sort by engagement rate
    const sortedByEngagement = [...nodesWithEngagement].sort((a, b) => b.engagementRate - a.engagementRate)

    // Top and low performers
    const topPerformers = sortedByEngagement.slice(0, 10)
    const lowPerformers = sortedByEngagement.slice(-10).reverse()

    // Calculate engagement metrics
    const rates = nodesWithEngagement.map(n => n.engagementRate)
    const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
    const sortedRates = [...rates].sort((a, b) => a - b)
    const medianRate = sortedRates.length > 0 ? sortedRates[Math.floor(sortedRates.length / 2)] : 0

    const engagementMetrics: EngagementMetrics = {
      avgRate,
      medianRate,
      topPerformers,
      lowPerformers
    }

    // Temporal analysis (if dateRange is available)
    let totalPeriodDays = 0
    let avgTweetsPerDay = 0
    let peakDay: { date: string; count: number } | null = null
    const hourlyDistribution: HourlyDistribution[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      avgEngagement: 0
    }))
    const patterns: TemporalPattern[] = []

    if (datasetMetadata.dateRange) {
      const start = new Date(datasetMetadata.dateRange.start)
      const end = new Date(datasetMetadata.dateRange.end)
      totalPeriodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      avgTweetsPerDay = totalPeriodDays > 0 ? datasetMetadata.totalItems / totalPeriodDays : 0

      // Analyze hourly distribution (if timestamps are available)
      const dailyCounts = new Map<string, number>()

      nodes.forEach(node => {
        if (node.timestamp) {
          const date = new Date(node.timestamp * 1000)
          const hour = date.getHours()
          const dayKey = date.toISOString().split('T')[0]

          // Update hourly distribution
          hourlyDistribution[hour].count++
          const engagement = (node.likes || 0) + (node.retweets || 0) + (node.replies || 0)
          hourlyDistribution[hour].avgEngagement += engagement

          // Track daily counts
          dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1)
        }
      })

      // Calculate average engagement per hour
      hourlyDistribution.forEach(h => {
        if (h.count > 0) {
          h.avgEngagement = h.avgEngagement / h.count
        }
      })

      // Find peak hours (top 3 hours with most activity)
      const sortedHours = [...hourlyDistribution].sort((a, b) => b.count - a.count)
      const peakHours = sortedHours.slice(0, 3).map(h => h.hour)

      // Find quiet hours (bottom 3 hours with least activity)
      const quietHours = sortedHours.slice(-3).map(h => h.hour).reverse()

      // Find peak day
      if (dailyCounts.size > 0) {
        let maxCount = 0
        let maxDate = ''
        dailyCounts.forEach((count, date) => {
          if (count > maxCount) {
            maxCount = count
            maxDate = date
          }
        })
        peakDay = { date: maxDate, count: maxCount }
      }

      // Detect spikes (days with >2x average)
      const avgDailyCount = datasetMetadata.totalItems / dailyCounts.size
      dailyCounts.forEach((count, date) => {
        if (count > avgDailyCount * 2) {
          patterns.push({
            type: 'spike',
            timestamp: new Date(date).getTime() / 1000,
            value: count,
            description: `Pico de actividad: ${count} tweets (${(count / avgDailyCount).toFixed(1)}x el promedio)`
          })
        }
      })

      return {
        patterns,
        peakHours,
        quietHours,
        hourlyDistribution,
        engagementMetrics,
        totalPeriodDays,
        avgTweetsPerDay,
        peakDay
      }
    }

    // If no temporal data, return only engagement metrics
    return {
      patterns: [],
      peakHours: [],
      quietHours: [],
      hourlyDistribution,
      engagementMetrics,
      totalPeriodDays: 0,
      avgTweetsPerDay: 0,
      peakDay: null
    }
  }, [datasetMetadata, mentions])
}
