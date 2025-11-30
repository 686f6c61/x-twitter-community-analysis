import { NormalizedTweet, ProviderType } from '../types/index.js';

/**
 * DataNormalizer - Unifica el formato de datos de diferentes proveedores de APIs
 *
 * Este normalizador es crítico para mantener compatibilidad con el worker de procesamiento.
 * Todas las APIs devuelven estructuras diferentes, pero el worker espera un formato unificado.
 */
export class DataNormalizer {
  /**
   * Normaliza un tweet desde cualquier proveedor al formato unificado
   */
  static normalizeTweet(rawTweet: any, provider: ProviderType): NormalizedTweet {
    switch (provider) {
      case 'rapidapi':
        return this.normalizeRapidAPI(rawTweet);
      case 'twitterapi':
        return this.normalizeTwitterAPI(rawTweet);
      default:
        throw new Error(`Provider desconocido: ${provider}`);
    }
  }

  /**
   * Normaliza datos desde RapidAPI (formato actual)
   * Estructura: { tweet: { ... }, replies: [...] }
   */
  private static normalizeRapidAPI(rawTweet: any): NormalizedTweet {
    const tweet = rawTweet.tweet || rawTweet;

    return {
      tweet: {
        id: tweet.id || tweet.tweet_id || '',
        username: tweet.username || '',
        name: tweet.name || '',
        text: tweet.text || '',
        timestamp: tweet.timestamp || 0,
        time_parsed: tweet.time_parsed || new Date(tweet.timestamp * 1000).toISOString(),
        mentions: this.normalizeMentionsRapidAPI(tweet.mentions),
        hashtags: this.normalizeHashtagsRapidAPI(tweet.hashtags),
        urls: this.normalizeUrlsRapidAPI(tweet.urls),
        likes: tweet.likes || 0,
        retweets: tweet.retweets || 0,
        replies: typeof tweet.replies === 'number' ? tweet.replies : 0,
        quotes: tweet.quotes || 0,
        views: tweet.views || 0,
        bookmarks: tweet.bookmarks || 0,
        is_retweet: tweet.is_retweet || false,
        is_verified: tweet.is_verified || false,
        follower_count: tweet.follower_count || 0,
        following_count: tweet.following_count || 0,
        profile_pic_url: tweet.profile_pic_url || '',
      },
      replies: Array.isArray(rawTweet.replies)
        ? rawTweet.replies.map((reply: any) => this.normalizeRapidAPI(reply))
        : []
    };
  }

  /**
   * Normaliza datos desde TwitterAPI.io
   * Estructura: { author: {...}, createdAt: "...", entities: {...}, ... }
   */
  private static normalizeTwitterAPI(rawTweet: any): NormalizedTweet {
    const timestamp = this.parseTwitterAPIDate(rawTweet.createdAt || rawTweet.created_at);
    const timeParsed = new Date(timestamp * 1000).toISOString();

    return {
      tweet: {
        id: rawTweet.id_str || rawTweet.id || '',
        username: rawTweet.author?.userName || rawTweet.user?.screen_name || '',
        name: rawTweet.author?.name || rawTweet.user?.name || '',
        text: rawTweet.text || rawTweet.full_text || '',
        timestamp,
        time_parsed: timeParsed,
        mentions: this.extractMentions(rawTweet.entities?.user_mentions || []),
        hashtags: this.extractHashtags(rawTweet.entities?.hashtags || []),
        urls: this.extractUrls(rawTweet.entities?.urls || []),
        likes: rawTweet.likeCount || rawTweet.favorite_count || 0,
        retweets: rawTweet.retweetCount || rawTweet.retweet_count || 0,
        replies: rawTweet.replyCount || rawTweet.reply_count || 0,
        quotes: rawTweet.quoteCount || rawTweet.quote_count || 0,
        views: rawTweet.viewCount || rawTweet.views || 0,
        bookmarks: rawTweet.bookmarkCount || rawTweet.bookmark_count || 0,
        is_retweet: rawTweet.isRetweet || rawTweet.retweeted || false,
        is_verified: rawTweet.author?.isVerified || rawTweet.user?.verified || false,
        follower_count: rawTweet.author?.followers || rawTweet.user?.followers_count || 0,
        following_count: rawTweet.author?.following || rawTweet.user?.friends_count || 0,
        profile_pic_url: rawTweet.author?.avatar || rawTweet.user?.profile_image_url_https || '',
      },
      replies: (rawTweet.replies || []).map((reply: any) => this.normalizeTwitterAPI(reply))
    };
  }

  /**
   * Parsea fechas de TwitterAPI.io al formato Unix timestamp
   * Formato entrada: "Tue Dec 10 07:00:30 +0000 2024"
   * Formato salida: 1733815230 (Unix timestamp)
   */
  private static parseTwitterAPIDate(dateString: string): number {
    if (!dateString) {
      console.warn('[DataNormalizer] Fecha vacía recibida');
      return 0;
    }

    // Si ya es un timestamp numérico, validar rango
    if (typeof dateString === 'number') {
      // Timestamps válidos: entre 2000-01-01 y 2100-01-01
      if (dateString >= 946684800 && dateString <= 4102444800) {
        return dateString;
      }
      console.warn(`[DataNormalizer] Timestamp numérico fuera de rango: ${dateString}`);
      return 0;
    }

    // Si es string con solo números, convertir y validar
    if (/^\d+$/.test(dateString)) {
      const timestamp = parseInt(dateString);
      if (timestamp >= 946684800 && timestamp <= 4102444800) {
        return timestamp;
      }
      console.warn(`[DataNormalizer] Timestamp string fuera de rango: ${dateString}`);
      return 0;
    }

    // Parsear formato Twitter: "Tue Dec 10 07:00:30 +0000 2024"
    try {
      const date = new Date(dateString);

      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        console.error(`[DataNormalizer] Fecha inválida: ${dateString}`);
        return 0;
      }

      const timestamp = Math.floor(date.getTime() / 1000);

      // Validar rango razonable
      if (timestamp < 946684800 || timestamp > 4102444800) {
        console.warn(`[DataNormalizer] Fecha fuera de rango razonable: ${dateString} -> ${timestamp}`);
        return 0;
      }

      return timestamp;
    } catch (error) {
      console.error(`[DataNormalizer] Error parseando fecha: ${dateString}`, error);
      return 0;
    }
  }

  /**
   * Normaliza menciones desde RapidAPI
   */
  private static normalizeMentionsRapidAPI(mentions: any): Array<{ id: string; username: string; name: string }> | null {
    if (!mentions || !Array.isArray(mentions) || mentions.length === 0) return null;

    return mentions.map(m => ({
      id: m.id || '',
      username: m.username || '',
      name: m.name || ''
    }));
  }

  /**
   * Extrae menciones desde TwitterAPI.io entities
   * Formato entrada: [{ id_str: "...", screen_name: "...", name: "..." }]
   */
  private static extractMentions(userMentions: any[]): Array<{ id: string; username: string; name: string }> | null {
    if (!userMentions || !Array.isArray(userMentions) || userMentions.length === 0) return null;

    return userMentions.map(mention => ({
      id: mention.id_str || mention.id || '',
      username: mention.screen_name || '',
      name: mention.name || ''
    }));
  }

  /**
   * Normaliza hashtags desde RapidAPI
   */
  private static normalizeHashtagsRapidAPI(hashtags: any): string[] | null {
    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) return null;
    return hashtags.map(h => typeof h === 'string' ? h : h.text || h.hashtag || '').filter(Boolean);
  }

  /**
   * Extrae hashtags desde TwitterAPI.io entities
   * Formato entrada: [{ text: "hashtag" }]
   */
  private static extractHashtags(hashtags: any[]): string[] | null {
    if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0) return null;

    return hashtags
      .map(tag => tag.text || '')
      .filter(text => text.length > 0);
  }

  /**
   * Normaliza URLs desde RapidAPI
   */
  private static normalizeUrlsRapidAPI(urls: any): Array<{ url: string; expanded_url: string; display_url: string }> | null {
    if (!urls || !Array.isArray(urls) || urls.length === 0) return null;

    return urls.map(u => ({
      url: u.url || '',
      expanded_url: u.expanded_url || u.url || '',
      display_url: u.display_url || u.url || ''
    }));
  }

  /**
   * Extrae URLs desde TwitterAPI.io entities
   * Formato entrada: [{ url: "t.co/...", expanded_url: "...", display_url: "..." }]
   */
  private static extractUrls(urls: any[]): Array<{ url: string; expanded_url: string; display_url: string }> | null {
    if (!urls || !Array.isArray(urls) || urls.length === 0) return null;

    return urls.map(urlObj => ({
      url: urlObj.url || '',
      expanded_url: urlObj.expanded_url || urlObj.url || '',
      display_url: urlObj.display_url || urlObj.url || ''
    }));
  }

  /**
   * Normaliza un dataset completo (query result + metadata)
   */
  static normalizeDataset(data: any, provider: ProviderType): any {
    return {
      query: data.query || '',
      search_type: data.search_type || data.searchType || 'text',
      mode: data.mode || 'latest',
      downloaded_at: data.downloaded_at || data.downloadedAt || new Date().toISOString(),
      total_main_tweets: data.total_main_tweets || data.totalMainTweets || (data.tweets?.length || 0),
      total_replies: data.total_replies || data.totalReplies || 0,
      total_items: data.total_items || data.totalItems || (data.tweets?.length || 0),
      tweets: (data.tweets || []).map((tweet: any) => this.normalizeTweet(tweet, provider)),
      metadata: data.metadata || {}
    };
  }
}
