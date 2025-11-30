/**
 * API client for Twitter scraper backend
 * Exports: SearchOptions, ScrapingJob, ProgressUpdate, DownloadedFile, scraperAPI
 */

const API_BASE_URL = 'http://localhost:3001/api/scraper';

export type ProviderType = 'rapidapi' | 'twitterapi';

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  active: boolean;
}

export interface SearchOptions {
  query: string;
  mode: 'latest' | 'top';
  maxTweets?: number;
  includeReplies: boolean; // DEPRECATED: Use includeConversations instead
  includeConversations?: boolean; // Fetch full conversations using batch method
  enrichUsers?: boolean; // Enriquecer con metadata de usuarios (TwitterAPI.io)
  since?: string;
  until?: string;
  provider?: ProviderType;
  filters?: {
    minLikes?: number;
    verifiedOnly?: boolean;
  };
}

export interface ScrapingJob {
  jobId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  tweetsCollected: number;
  query?: string;
  mode?: string;
  maxTweets?: number;
  cursor?: string;
  error?: string;
  outputFile?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ProgressUpdate {
  jobId: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  tweetsCollected: number;
  message: string;
  error?: string;
}

export interface DownloadedFile {
  filename: string;
  query: string;
  tweets: number;
  createdAt: string;
  size: number;
  status: 'complete' | 'in_progress';
}

class ScraperAPI {
  async getProviders(): Promise<{ providers: ProviderConfig[]; default: ProviderType | null }> {
    const response = await fetch(`${API_BASE_URL}/providers`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch providers');
    }
    return response.json();
  }

  async startScraping(options: SearchOptions): Promise<{ jobId: string; status: string }> {
    const response = await fetch(`${API_BASE_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start scraping');
    }

    return response.json();
  }

  async getJobStatus(jobId: string): Promise<ScrapingJob> {
    const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get job status');
    }
    return response.json();
  }

  async stopJob(jobId: string): Promise<{ status: string; filename?: string; tweetsCount?: number }> {
    const response = await fetch(`${API_BASE_URL}/stop/${jobId}`, { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop job');
    }
    return response.json();
  }

  async enrichFile(filename: string): Promise<{ status: string; filename: string }> {
    const response = await fetch(`${API_BASE_URL}/enrich/${filename}`, { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to enrich file');
    }
    return response.json();
  }

  async listDownloads(): Promise<DownloadedFile[]> {
    const response = await fetch(`${API_BASE_URL}/downloads`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list downloads');
    }
    return response.json();
  }

  connectWebSocket(jobId: string, onUpdate: (data: any) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:3001/ws/scraper?jobId=${jobId}`);

    ws.onopen = () => console.log(`[WebSocket] Connected for job ${jobId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    };
    ws.onerror = (error) => console.error('[WebSocket] Error:', error);
    ws.onclose = () => console.log('[WebSocket] Disconnected');

    return ws;
  }

  async downloadFile(filename: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/download/${filename}`);
    if (!response.ok) throw new Error('Failed to download file');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async deleteFile(filename: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/download/${filename}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete file');
    }
  }
}

export const scraperAPI = new ScraperAPI();
