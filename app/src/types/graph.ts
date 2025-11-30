export interface Node {
  id: string
  label: string
  tweets: number
  engagement: number
  community: number
  betweenness: number
  closeness: number
  degree: number
  // Métricas de centralidad calculadas por el worker
  degree_centrality?: number
  betweenness_centrality?: number
  closeness_centrality?: number
  eigenvector_centrality?: number
  kcore?: number
  core_number?: number
  influencer_score?: number
  influencer_category?: string
  bot_score?: number
  bot_category?: string
}

export interface Edge {
  from: string
  to: string
  weight: number
}

export interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

export type MentionsGraph = GraphData
export type CohashtagsGraph = GraphData

export interface CommunitySentiment {
  avgScore: number
  toxicityRate: number
  emotionScores: {
    ira: number
    miedo: number
    felicidad: number
    tristeza: number
    neutral: number
  }
  dominantEmotion: string
  classification: {
    type: 'REACTIVA_NEGATIVA' | 'POSITIVA' | 'TOXICA' | 'NEUTRAL_ANALITICA'
    icon: string
    color: string
  }
}

export interface CommunityCoordination {
  score: number
  temporalSync: number
  contentDuplication: number
  botConcentration: number
  classification: {
    type: 'COORDINADA' | 'ORGANICA'
    level: string
    color: string
  }
}

export interface EchoChamberClassification {
  isolation: number
  contentSimilarity: number
  classification: {
    type: 'ECHO_CHAMBER_FUERTE' | 'ECHO_CHAMBER_MODERADO' | 'DISCURSO_HETEROGENEO'
    description: string
  }
}

export interface Community {
  id: number
  size: number
  nodes: string[]
  color: string
  top_hashtags: Array<{ hashtag: string; count: number }>
  density?: number
  total_tweets?: number
  total_engagement?: number
  avg_score?: number
  top_influencers?: Array<{
    username: string
    name: string
    score: number
    tweets: number
  }>
  // Sprint 3A: Análisis avanzado
  sentiment?: CommunitySentiment
  vocabulary_uniqueness?: number
  coordination?: CommunityCoordination
  echo_chamber?: EchoChamberClassification
}

export interface DetectedEvent {
  time: string
  count: number
  threshold?: number
  intensity: number
  velocity: string
  tweetsPerHour?: number
  duration: number
  reach: number
  totalViews: number
  totalLikes: number
  totalRetweets: number
  growthRate?: string
  topUsers: Array<{
    username: string
    name?: string
    tweets: number
    likes: number
    retweets: number
  }>
  uniqueUsers: number
  initiator?: {
    username: string
    name: string
    time?: string
  }
  influencers?: Array<{
    username: string
    name?: string
    retweets: number
  }>
  timeToPeak?: string
  eventType: string
  isCoordinated?: boolean
  avgBotScore: number
  trending_hashtags: Array<{
    hashtag: string
    count: number
  }>
  topWords: Array<{
    word: string
    count: number
  }>
  topUrls: Array<{
    url: string
    count: number
  }>
  topMentions: Array<{
    username: string
    count: number
  }>
}

export interface GraphStats {
  nodes: number
  edges: number
  density: number
  communities: number
  modularity: number
}

export interface UserStatistics {
  // Agregados generales
  total_unique_users: number
  total_enriched_users: number
  avg_followers: number
  avg_following: number
  avg_account_age_days: number
  median_followers: number

  // Distribuciones
  verified_distribution: {
    verified: number
    unverified: number
    blue_verified: number
  }

  bot_distribution: {
    likely_bot: number
    human: number
  }

  follower_buckets: {
    '0-100': number
    '100-1K': number
    '1K-10K': number
    '10K-100K': number
    '100K+': number
  }

  account_age_buckets: {
    '< 1 month': number
    '1-6 months': number
    '6-12 months': number
    '1-5 years': number
    '5+ years': number
  }

  location_distribution: Array<{
    location: string
    count: number
  }>

  // Top usuarios
  top_users_by_followers: Array<{
    username: string
    followers: number
    following: number
    verified: boolean
    blue_verified: boolean
    location: string
    description: string
  }>

  top_users_by_activity: Array<{
    username: string
    statusesCount: number
    followers: number
    verified: boolean
  }>

  suspected_bots: Array<{
    username: string
    isAutomated: boolean
    automatedBy: string | null
    followers: number
  }>
}

export interface Statistics {
  // Mentions graph stats
  nodes: number
  edges: number
  density: number
  avg_degree: number
  avg_betweenness: number
  avg_closeness: number
  reciprocity: number
  transitivity: number
  communities: Community[]
  modularity: number

  // Cohashtags graph stats
  cohashtagsStats?: GraphStats

  // General stats
  total_tweets?: number
  total_engagement?: number
  avg_engagement?: number
  community_distribution?: Record<string, number>
  top_active_users: Array<{
    username: string
    name: string
    tweets: number
    followers: number
    verified: boolean
    blue_verified: boolean
    engagement_per_tweet: number
    account_age_years: number
  }>
  top_engagement_users: Array<{
    username: string
    name: string
    engagement: number
    likes: number
    retweets: number
    views: number
    replies: number
    followers: number
    verified: boolean
    blue_verified: boolean
    reach_ratio: string
    location: string
  }>
  top_influencers?: Array<{
    username: string
    name: string
    influence_score: number
    followers: number
    tweets: number
    total_engagement: number
    reach_ratio: string
    verified: boolean
    blue_verified: boolean
    engagement_per_tweet: number
  }>
  suspicious_users?: Array<{
    username: string
    name: string
    suspicion_score: number
    signals: string[]
    followers: number
    following: number
    tweets: number
    total_engagement: number
    reach_ratio: string
    account_age_days: number
    is_automated: boolean
    verified: boolean
  }>
  top_hashtags: Array<{
    hashtag: string
    count: number
  }>
  temporal_activity: Array<{
    time: string
    count: number
  }>
  detected_events: DetectedEvent[]
  word_frequencies: Array<{
    word: string
    frequency: number
  }>
  triangles: number
  stars: number
  chains: number
  cohesion: number
  trianglesList?: Array<{ nodes: string[] }>
  starsList?: Array<{ center: string; satellites: string[]; degree: number; connectivity: number }>
  chainsList?: Array<{ nodes: string[] }>

  // User statistics (from enriched_users)
  user_statistics?: UserStatistics
}

export interface URLData {
  url: string
  count: number
  uniqueUsers: number
  hashtags: string[]
  hasHashtags: boolean
  viralityScore: number
  users: Array<{
    username: string
    name: string
    shareCount: number
  }>
}

export interface URLAnalysis {
  totalUrls: number
  totalShares: number
  topUrls?: URLData[]
  shared_urls?: Array<{
    url: string
    count: number
  }>
}
