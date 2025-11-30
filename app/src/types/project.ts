export interface ProjectQuery {
  query: string;
  addedAt: string;
  tweetsCollected: number;
  lastScrapedAt?: string;
  sinceId?: string;
}

export interface ProjectMetadata {
  projectId: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
  queries: ProjectQuery[];
  datasetFilename: string;
  totalTweets: number;
  dateRange: {
    start: string;
    end: string;
  };
  config: {
    mode: 'latest' | 'top' | 'photos' | 'videos';
    includeReplies: boolean;
    enrichUsers: boolean;
    provider: 'twitterapi' | 'rapidapi';
    autoUpdate?: {
      enabled: boolean;
      intervalHours: number;
      lastRun?: string;
    };
  };
}

export interface ProjectStats {
  projectId: string;
  totalTweets: number;
  totalQueries: number;
  dateRange: {
    start: string;
    end: string;
  };
  lastUpdate: string;
  tweetsPerQuery: Record<string, number>;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  initialQuery: string;
  config: {
    mode: 'latest' | 'top' | 'photos' | 'videos';
    maxTweets?: number;
    includeReplies: boolean;
    enrichUsers: boolean;
    since?: string;
    until?: string;
  };
}

export interface AddQueryToProjectRequest {
  projectId: string;
  query: string;
  maxTweets?: number;
}

export interface ContinueProjectRequest {
  projectId: string;
  maxTweets?: number;
}
