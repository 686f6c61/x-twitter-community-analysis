/**
 * Tipos para métricas y estadísticas
 */

export interface CentralityMetrics {
  degree: Record<string, number>;
  betweenness: Record<string, number>;
  closeness: Record<string, number>;
  eigenvector: Record<string, number>;
  pagerank: Record<string, number>;
  clustering: Record<string, number>;
}

export interface GraphMetricsOptions {
  calculateCentrality?: boolean;
  calculateCommunities?: boolean;
  calculateMotifs?: boolean;
  samplingThreshold?: number;
}

export interface UserStats {
  tweets: number;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  name: string;
  hashtags: string[];
  follower_count: number;
}

export interface TweetData {
  text: string;
  url: string;
  likes: number;
  time: string;
}

export interface BotScore {
  score: number;
  reasons: string[];
  isBot: boolean;
}

export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  compound: number;
  dominant: 'positive' | 'negative' | 'neutral';
}

export interface ActivityPeak {
  time: number;
  count: number;
  hour?: number;
  date?: string;
}

export interface WordFrequency {
  word: string;
  count: number;
}

export interface UrlAnalysis {
  total_urls: number;
  unique_urls: number;
  top_domains: Array<{ domain: string; count: number }>;
  top_urls: Array<{ url: string; count: number; users: string[] }>;
  url_sharing_matrix: any;
}
