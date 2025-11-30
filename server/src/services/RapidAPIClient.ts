import axios, { AxiosInstance } from 'axios';
import { config } from '../config/environment.js';
import { Tweet, SearchOptions } from '../types/index.js';

export class RapidAPIClient {
  private client: AxiosInstance;
  private baseURL = `https://${config.rapidApi.host}`;

  constructor() {
    if (!config.rapidApi.key) {
      console.warn('[RapidAPIClient] ⚠️  RAPIDAPI_KEY not set - scraping will fail until configured');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-RapidAPI-Key': config.rapidApi.key,
        'X-RapidAPI-Host': config.rapidApi.host,
      },
      timeout: 30000,
    });

    // Interceptor para logging seguro (sin exponer API key)
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[RapidAPI] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(`[RapidAPI] Error ${error.response.status}: ${error.response.statusText}`);
          console.error(`[RapidAPI] ${JSON.stringify(error.response.data)}`);
        } else {
          console.error(`[RapidAPI] Network error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  async searchTweets(options: SearchOptions): Promise<{ tweets: Tweet[]; cursor?: string }> {
    try {
      const params: any = {
        query: options.query,
        section: options.mode,
        // NOTE: Don't send 'count' parameter - Python version doesn't use it
        // and it might cause the API to return duplicates
      };

      if (options.cursor) {
        params.cursor = options.cursor;
        console.log(`[RapidAPI] Using cursor: ${options.cursor.substring(0, 50)}...`);
      } else {
        console.log('[RapidAPI] No cursor (first page)');
      }

      if (options.since) {
        params.since = options.since;
      }

      if (options.until) {
        params.until = options.until;
      }

      const response = await this.client.get('/v1/search/tweets', { params });

      // Log response structure for debugging
      console.log('[RapidAPI] Response keys:', Object.keys(response.data));
      console.log('[RapidAPI] Response structure:', JSON.stringify(response.data, null, 2).substring(0, 500));

      // Try different response structures based on API documentation
      let tweets = [];
      let cursor = undefined;

      if (response.data.tweets) {
        // Direct tweets array
        tweets = response.data.tweets;
        cursor = response.data.cursor;
      } else if (response.data.data && response.data.data.tweets) {
        // Nested data.tweets
        tweets = response.data.data.tweets;
        cursor = response.data.data.cursor;
      } else if (response.data.timeline) {
        // Legacy timeline structure
        tweets = response.data.timeline;
        cursor = response.data.next_cursor;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        tweets = response.data;
      }

      console.log(`[RapidAPI] Extracted ${tweets.length} tweets, cursor: ${cursor ? 'present' : 'none'}`);

      return {
        tweets,
        cursor,
      };
    } catch (error: any) {
      throw new Error(`Failed to search tweets: ${error.message}`);
    }
  }

  async getTweetReplies(tweetId: string): Promise<Tweet[]> {
    try {
      // Documentación oficial: GET /v1/tweets/:tweetID/replies
      const response = await this.client.get(`/v1/tweets/${tweetId}/replies`);

      // La API devuelve un array de tweets directamente o en data.tweets
      const tweets = response.data.tweets || response.data || [];
      return Array.isArray(tweets) ? tweets : [];
    } catch (error: any) {
      console.error(`[RapidAPI] Failed to get replies for tweet ${tweetId}: ${error.message}`);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.searchTweets({ query: 'test', mode: 'latest', maxTweets: 1, includeReplies: false });
      return true;
    } catch (error) {
      return false;
    }
  }
}
