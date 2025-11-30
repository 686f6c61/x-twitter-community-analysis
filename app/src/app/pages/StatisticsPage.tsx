import { useGraphStore } from '@/lib/store/graphStore'
import { StatsMetrics } from '@/features/statistics/components/StatsMetrics'
import { TopUsersCharts } from '@/features/statistics/components/TopUsersCharts'
import { HashtagsAndTimeline } from '@/features/statistics/components/HashtagsAndTimeline'
import { WordCloudInteractive } from '@/features/statistics/components/WordCloudInteractive'
import { URLsTable } from '@/features/statistics/components/URLsTable'
import { NetworkMetrics } from '@/features/statistics/components/NetworkMetrics'
import { Communities } from '@/features/statistics/components/Communities'
import { UserStatistics } from '@/features/statistics/components/UserStatistics'
import { TopInfluencers } from '@/features/statistics/components/TopInfluencers'
import { SuspiciousUsers } from '@/features/statistics/components/SuspiciousUsers'
import { CommunityMetrics } from '@/features/statistics/components/CommunityMetrics'
import { GraphsAnalyticsHeader } from '@/features/statistics/components/GraphsAnalyticsHeader'
import { AdvancedGraphMetrics } from '@/features/statistics/components/AdvancedGraphMetrics'

export function StatisticsPage() {
  const { statistics, urlAnalysis, mentions, datasetMetadata } = useGraphStore()

  if (!statistics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <p style={{ color: '#999', fontSize: '16px' }}>Carga un archivo JSON para ver las estadísticas</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Community Metrics */}
      <CommunityMetrics />

      <StatsMetrics stats={statistics} />

      {/* User Statistics - mostrar si hay datos de usuarios enriquecidos */}
      {statistics.user_statistics && (
        <UserStatistics userStats={statistics.user_statistics} />
      )}

      <TopUsersCharts stats={statistics} metadata={datasetMetadata} />

      {/* Top Influencers - mostrar si hay datos enriquecidos */}
      <TopInfluencers stats={statistics} />

      {/* Suspicious Users - mostrar si hay datos enriquecidos */}
      <SuspiciousUsers stats={statistics} />

      <HashtagsAndTimeline stats={statistics} />

      {/* GRAPHS Analytics */}
      <GraphsAnalyticsHeader />

      {/* Advanced Graph Metrics - mostrar si hay nodos con métricas calculadas */}
      <AdvancedGraphMetrics graphNodes={mentions?.nodes} />

      <Communities stats={statistics} graphNodes={mentions?.nodes} />
      <WordCloudInteractive stats={statistics} />
      {urlAnalysis && <URLsTable urlAnalysis={urlAnalysis} />}
      <NetworkMetrics stats={statistics} />
    </div>
  )
}
