import axios, { AxiosInstance } from 'axios';
import { config } from '../config/environment.js';
import { SearchOptions } from '../types/index.js';

/**
 * Cliente para TwitterAPI.io
 * Documentación: https://docs.twitterapi.io/introduction
 *
 * Endpoints principales:
 * - POST /twitter/tweet/advanced_search - Búsqueda avanzada de tweets
 * - POST /twitter/tweet/replies - Obtener respuestas de un tweet
 */
export class TwitterAPIClient {
  private client: AxiosInstance;
  private baseURL = `https://${config.twitterApi.host}`;

  constructor() {
    if (!config.twitterApi.key) {
      console.warn('[TwitterAPIClient] ⚠️  TWITTERAPI_KEY not set - scraping will fail until configured');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-API-Key': config.twitterApi.key,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptor para logging seguro
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[TwitterAPI] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(`[TwitterAPI] Error ${error.response.status}: ${error.response.statusText}`);
          console.error(`[TwitterAPI] ${JSON.stringify(error.response.data)}`);
        } else {
          console.error(`[TwitterAPI] Network error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Busca tweets usando el endpoint de búsqueda avanzada
   * Endpoint: GET /twitter/tweet/advanced_search
   *
   * @param options - Opciones de búsqueda
   * @returns { tweets: any[], cursor?: string }
   */
  async searchTweets(options: SearchOptions): Promise<{ tweets: any[]; cursor?: string }> {
    try {
      // Construir query según las opciones
      let query = options.query;

      // Agregar filtros de fecha si existen
      if (options.since) {
        query += ` since:${options.since}`;
      }
      if (options.until) {
        query += ` until:${options.until}`;
      }

      // Filtro de likes mínimos
      if (options.filters?.minLikes) {
        query += ` min_faves:${options.filters.minLikes}`;
      }

      // Filtro de usuarios verificados
      if (options.filters?.verifiedOnly) {
        query += ` filter:verified`;
      }

      const params: any = {
        query: query,
        queryType: this.mapModeToQueryType(options.mode),
        cursor: options.cursor || '', // Cursor vacío para primera página
      };

      console.log(`[TwitterAPI] Query completo: "${query}"`);
      if (options.cursor) {
        console.log(`[TwitterAPI] Using cursor: ${options.cursor.substring(0, 50)}...`);
      } else {
        console.log('[TwitterAPI] No cursor (first page)');
      }

      const response = await this.client.get('/twitter/tweet/advanced_search', { params });

      console.log('[TwitterAPI] Response keys:', Object.keys(response.data));

      // Estructura según docs:
      // {
      //   "tweets": [...],
      //   "has_next_page": true,
      //   "next_cursor": "..."
      // }
      const tweets = response.data.tweets || [];
      const cursor = response.data.has_next_page ? response.data.next_cursor : undefined;

      console.log(`[TwitterAPI] Extracted ${tweets.length} tweets, has_next_page: ${response.data.has_next_page}`);

      return {
        tweets,
        cursor,
      };
    } catch (error: any) {
      throw new Error(`Failed to search tweets: ${error.message}`);
    }
  }

  /**
   * Obtiene las respuestas de un tweet
   * Endpoint: GET /twitter/tweet/replies
   *
   * @param tweetId - ID del tweet
   * @param maxReplies - Número máximo de respuestas a obtener (0 = todas)
   * @returns Array de tweets (respuestas)
   */
  async getTweetReplies(tweetId: string, maxReplies: number = 0): Promise<any[]> {
    try {
      const allReplies: any[] = [];
      let cursor = '';
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await this.client.get('/twitter/tweet/replies', {
          params: {
            tweetId: tweetId,
            cursor: cursor || undefined, // Primera página: cursor vacío o undefined
          }
        });

        // Estructura esperada: { "replies": [...], "has_next_page": bool, "next_cursor": string }
        const replies = response.data.replies || [];
        hasNextPage = response.data.has_next_page || false;
        const nextCursor = response.data.next_cursor || '';

        allReplies.push(...replies);

        console.log(`[TwitterAPI] Fetched ${replies.length} replies for tweet ${tweetId} (total: ${allReplies.length})`);

        // Si tenemos un límite y lo hemos alcanzado, parar
        if (maxReplies > 0 && allReplies.length >= maxReplies) {
          console.log(`[TwitterAPI] Reached max replies limit (${maxReplies})`);
          break;
        }

        // Si no hay más páginas, parar
        if (!hasNextPage || !nextCursor) {
          console.log(`[TwitterAPI] No more replies pages available`);
          break;
        }

        cursor = nextCursor;

        // Rate limiting: 500ms entre requests de replies
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`[TwitterAPI] Total replies fetched for tweet ${tweetId}: ${allReplies.length}`);

      // Si hay límite, recortar
      if (maxReplies > 0 && allReplies.length > maxReplies) {
        return allReplies.slice(0, maxReplies);
      }

      return allReplies;
    } catch (error: any) {
      console.error(`[TwitterAPI] Failed to get replies for tweet ${tweetId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Mapea el modo de búsqueda a queryType de TwitterAPI.io
   * - latest → 'Latest' (tweets más recientes)
   * - top → 'Top' (tweets más populares)
   * Según docs: queryType puede ser "Latest" o "Top"
   */
  private mapModeToQueryType(mode: string): string {
    switch (mode) {
      case 'top':
        return 'Top';
      case 'latest':
      case 'photos':
      case 'videos':
      default:
        return 'Latest';
    }
  }

  /**
   * Obtiene información de un usuario por su username
   * Endpoint: GET /twitter/user/info
   *
   * @param username - Nombre de usuario (sin @)
   * @returns Información del usuario
   */
  async getUserInfo(username: string): Promise<any> {
    try {
      const response = await this.client.get('/twitter/user/info', {
        params: {
          userName: username
        }
      });

      // Estructura esperada: { "data": {...}, "status": "success", "msg": "..." }
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.msg || 'Failed to get user info');
    } catch (error: any) {
      // Si el usuario no existe o está suspendido, devolver info básica
      if (error.response?.status === 404 || error.response?.data?.data?.unavailable) {
        console.warn(`[TwitterAPI] User ${username} is unavailable or not found`);
        return {
          userName: username,
          unavailable: true,
          unavailableReason: error.response?.data?.data?.unavailableReason || 'not_found',
          followers: 0,
          following: 0,
          isBlueVerified: false,
          verifiedType: '',
          createdAt: '',
          statusesCount: 0,
          location: '',
          isAutomated: false,
          automatedBy: null,
          description: ''
        };
      }

      throw new Error(`Failed to get user info for ${username}: ${error.message}`);
    }
  }

  /**
   * Prueba la conexión con la API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.searchTweets({
        query: 'test',
        mode: 'latest',
        maxTweets: 1,
        includeReplies: false
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
