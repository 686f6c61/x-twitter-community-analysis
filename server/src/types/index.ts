// Provider types
export type ProviderType = 'rapidapi' | 'twitterapi';

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  active: boolean;
}

// Normalized tweet structure (output format for consistency)
export interface NormalizedTweet {
  tweet: {
    id: string;
    username: string;
    name: string;
    text: string;
    timestamp: number;  // Unix timestamp
    time_parsed: string; // ISO 8601
    mentions: Array<{
      id: string;
      username: string;
      name: string;
    }> | null;
    hashtags: string[] | null;
    urls: Array<{
      url: string;
      expanded_url: string;
      display_url: string;
    }> | null;
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    views: number;
    bookmarks: number;
    is_retweet: boolean;
    is_verified: boolean;
    follower_count: number;
    following_count: number;
    profile_pic_url: string;
  };
  replies: NormalizedTweet[];
}

// Tweet structure from RapidAPI (raw format)
export interface Tweet {
  tweet_id: string;
  id?: string; // Alternative field name used by API
  creation_date: string;
  text: string;
  media_url: string[];
  video_url: string | null;
  user: {
    username: string;
    name: string;
    follower_count: number;
    following_count: number;
    favourites_count: number;
    is_verified: boolean;
    profile_pic_url: string;
    profile_banner_url: string;
    joined_date: string;
  };
  language: string;
  favorite_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count: number;
  retweet: boolean;
  views: number;
  bookmark_count: number;
  in_reply_to_user_id: string | null;
}

// Search options
export interface SearchOptions {
  query: string;
  mode: 'latest' | 'top' | 'photos' | 'videos';
  maxTweets?: number;
  includeReplies: boolean; // DEPRECATED: Use includeConversations instead
  includeConversations?: boolean; // Fetch full conversations using batch method
  enrichUsers?: boolean; // Enrich user profiles
  since?: string;  // YYYY-MM-DD
  until?: string;  // YYYY-MM-DD
  cursor?: string;
  provider?: ProviderType; // Selected provider
  filters?: {
    minLikes?: number;
    verifiedOnly?: boolean;
  };
}

// Scraping job status
export interface ScrapingJob {
  jobId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  tweetsCollected: number;
  cursor?: string;
  query: string;
  mode: string;
  maxTweets: number;
  includeReplies: boolean;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  outputFile?: string;
  partialTweets?: NormalizedTweet[]; // Store accumulated tweets during execution
  searchOptions?: SearchOptions; // Store original search options for enrichment
}

// Progress update for WebSocket
export interface ProgressUpdate {
  jobId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  tweetsCollected: number;
  message: string;
  cursor?: string;
  error?: string;
}

// Log message for WebSocket
export interface LogMessage {
  jobId: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// File metadata
export interface DownloadMetadata {
  filename: string;
  query: string;
  tweets: number;
  createdAt: Date;
  size: number;
  status: 'complete' | 'incomplete';
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
