import { useMemo } from 'react'
import { useGraphStore } from '@/lib/store/graphStore'

export interface DataQualityMetrics {
  // Engagement metrics
  tweetsWithoutEngagement: number
  tweetsWithoutEngagementPercentage: number
  tweetsWithLowEngagement: number // < 5 interactions
  tweetsWithLowEngagementPercentage: number

  // Content quality
  tweetsWithoutHashtags: number
  tweetsWithoutHashtagsPercentage: number
  tweetsWithoutUrls: number
  tweetsWithoutUrlsPercentage: number

  // User isolation
  usersWithoutMentions: number
  usersWithoutMentionsPercentage: number
  usersWithSingleTweet: number
  usersWithSingleTweetPercentage: number

  // Engagement rate
  avgEngagementRate: number // (likes + retweets + replies) / views
  medianEngagementRate: number

  // Overall quality score
  qualityScore: number // 0-100
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor'

  // Total counts
  totalTweets: number
  totalUsers: number
}

export function useDataQualityMetrics(): DataQualityMetrics | null {
  const datasetMetadata = useGraphStore((state) => state.datasetMetadata)
  const mentions = useGraphStore((state) => state.mentions)

  return useMemo(() => {
    if (!datasetMetadata) return null

    // Get raw tweets from store if available
    // For now, we'll calculate from graph nodes
    const nodes = mentions?.nodes || []
    const totalTweets = datasetMetadata.totalItems || 0
    const totalUsers = nodes.length

    // Calculate engagement metrics from nodes
    let tweetsWithoutEngagement = 0
    let tweetsWithLowEngagement = 0
    let usersWithoutMentions = 0
    let usersWithSingleTweet = 0
    const engagementRates: number[] = []

    nodes.forEach(node => {
      // Count users without mentions (isolated)
      if (!node.mentions || node.mentions === 0) {
        usersWithoutMentions++
      }

      // Count users with single tweet (low activity)
      if (node.total_tweets === 1) {
        usersWithSingleTweet++
      }

      // Calculate engagement from node metrics
      const engagement = (node.likes || 0) + (node.retweets || 0) + (node.replies || 0)
      const views = node.views || 0

      if (engagement === 0) {
        tweetsWithoutEngagement++
      } else if (engagement < 5) {
        tweetsWithLowEngagement++
      }

      // Calculate engagement rate
      if (views > 0) {
        engagementRates.push(engagement / views)
      }
    })

    // Calculate percentages
    const tweetsWithoutEngagementPercentage = totalUsers > 0
      ? (tweetsWithoutEngagement / totalUsers) * 100
      : 0
    const tweetsWithLowEngagementPercentage = totalUsers > 0
      ? (tweetsWithLowEngagement / totalUsers) * 100
      : 0
    const usersWithoutMentionsPercentage = totalUsers > 0
      ? (usersWithoutMentions / totalUsers) * 100
      : 0
    const usersWithSingleTweetPercentage = totalUsers > 0
      ? (usersWithSingleTweet / totalUsers) * 100
      : 0

    // Calculate engagement rate statistics
    const avgEngagementRate = engagementRates.length > 0
      ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
      : 0

    const sortedRates = [...engagementRates].sort((a, b) => a - b)
    const medianEngagementRate = sortedRates.length > 0
      ? sortedRates[Math.floor(sortedRates.length / 2)]
      : 0

    // Calculate quality score (0-100)
    // Lower percentages of problems = higher quality
    const qualityScore = Math.round(
      100 - (
        (tweetsWithoutEngagementPercentage * 0.3) +
        (tweetsWithLowEngagementPercentage * 0.2) +
        (usersWithoutMentionsPercentage * 0.25) +
        (usersWithSingleTweetPercentage * 0.25)
      )
    )

    // Determine quality level
    let qualityLevel: 'excellent' | 'good' | 'fair' | 'poor'
    if (qualityScore >= 80) qualityLevel = 'excellent'
    else if (qualityScore >= 60) qualityLevel = 'good'
    else if (qualityScore >= 40) qualityLevel = 'fair'
    else qualityLevel = 'poor'

    return {
      tweetsWithoutEngagement,
      tweetsWithoutEngagementPercentage,
      tweetsWithLowEngagement,
      tweetsWithLowEngagementPercentage,

      // Content quality - not available from current data structure
      tweetsWithoutHashtags: 0,
      tweetsWithoutHashtagsPercentage: 0,
      tweetsWithoutUrls: 0,
      tweetsWithoutUrlsPercentage: 0,

      usersWithoutMentions,
      usersWithoutMentionsPercentage,
      usersWithSingleTweet,
      usersWithSingleTweetPercentage,

      avgEngagementRate,
      medianEngagementRate,

      qualityScore,
      qualityLevel,

      totalTweets,
      totalUsers,
    }
  }, [datasetMetadata, mentions])
}
