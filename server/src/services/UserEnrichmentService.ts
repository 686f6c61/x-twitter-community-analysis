import { TwitterAPIClient } from './TwitterAPIClient.js';

interface UserMetadata {
  followers: number;
  following: number;
  isBlueVerified: boolean;
  verifiedType: string;
  createdAt: string;
  statusesCount: number;
  location: string;
  isAutomated: boolean;
  automatedBy: string | null;
  description: string;
  unavailable: boolean;
  unavailableReason: string | null;
}

interface EnrichmentInfo {
  enriched_at: string;
  users_enriched: number;
  users_failed: number;
  total_users: number;
  time_taken_ms: number;
}

export class UserEnrichmentService {
  private twitterAPI: TwitterAPIClient;

  constructor() {
    this.twitterAPI = new TwitterAPIClient();
  }

  /**
   * Enriquece un dataset con información de usuarios
   * @param dataset - Dataset original con tweets
   * @param onProgress - Callback para reportar progreso
   * @returns Dataset enriquecido con users_metadata
   */
  async enrichDataset(dataset: any, onProgress?: (processed: number, total: number, percentage: number) => void): Promise<any> {
    console.log('[UserEnrichment] 🔄 Iniciando enriquecimiento de usuarios...');
    const startTime = Date.now();

    // 1. Extraer usuarios únicos
    const uniqueUsers = this.extractUniqueUsers(dataset);
    console.log(`[UserEnrichment] 👥 ${uniqueUsers.size} usuarios únicos encontrados`);

    if (uniqueUsers.size === 0) {
      console.log('[UserEnrichment] ⚠️  No hay usuarios para enriquecer');
      return dataset;
    }

    // 2. Obtener info de cada usuario (con rate limiting)
    const usersMetadata: Record<string, UserMetadata | null> = {};
    let processed = 0;
    let failed = 0;

    for (const username of uniqueUsers) {
      try {
        const userInfo = await this.twitterAPI.getUserInfo(username);

        usersMetadata[username] = {
          followers: userInfo.followers || 0,
          following: userInfo.following || 0,
          isBlueVerified: userInfo.isBlueVerified || false,
          verifiedType: userInfo.verifiedType || '',
          createdAt: userInfo.createdAt || '',
          statusesCount: userInfo.statusesCount || 0,
          location: userInfo.location || '',
          isAutomated: userInfo.isAutomated || false,
          automatedBy: userInfo.automatedBy || null,
          description: userInfo.description || '',
          unavailable: userInfo.unavailable || false,
          unavailableReason: userInfo.unavailableReason || null
        };

        processed++;

        // Reportar progreso cada 20 usuarios o al finalizar
        if (processed % 20 === 0 || processed === uniqueUsers.size) {
          const percentage = Math.round(processed / uniqueUsers.size * 100);
          console.log(`[UserEnrichment] 📊 Progreso: ${processed}/${uniqueUsers.size} (${percentage}%)`);

          // Callback de progreso
          if (onProgress) {
            onProgress(processed, uniqueUsers.size, percentage);
          }
        }

        // Rate limiting: 50ms entre requests para no sobrecargar la API
        await this.sleep(50);
      } catch (error: any) {
        console.error(`[UserEnrichment] ❌ Error obteniendo info de ${username}:`, error.message);
        usersMetadata[username] = null; // Marcar como fallido
        failed++;
      }
    }

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    // 3. Crear info de enriquecimiento
    const enrichmentInfo: EnrichmentInfo = {
      enriched_at: new Date().toISOString(),
      users_enriched: processed - failed,
      users_failed: failed,
      total_users: uniqueUsers.size,
      time_taken_ms: timeTaken
    };

    // 4. Añadir metadata al dataset
    const enrichedDataset = {
      ...dataset,
      users_metadata: usersMetadata,
      enrichment_info: enrichmentInfo
    };

    console.log(`[UserEnrichment] ✅ Enriquecimiento completado en ${(timeTaken/1000).toFixed(1)}s`);
    console.log(`[UserEnrichment] ✓ ${enrichmentInfo.users_enriched} usuarios enriquecidos`);
    console.log(`[UserEnrichment] ✗ ${enrichmentInfo.users_failed} usuarios fallidos`);

    return enrichedDataset;
  }

  /**
   * Extrae usuarios únicos de un dataset
   */
  private extractUniqueUsers(dataset: any): Set<string> {
    const users = new Set<string>();

    if (!dataset.tweets || !Array.isArray(dataset.tweets)) {
      return users;
    }

    dataset.tweets.forEach((item: any) => {
      const tweet = item.tweet;

      if (!tweet) return;

      // Usuario autor
      if (tweet.username) {
        users.add(tweet.username);
      }

      // Usuarios mencionados
      if (Array.isArray(tweet.mentions)) {
        tweet.mentions.forEach((mention: any) => {
          if (mention.username) {
            users.add(mention.username);
          }
        });
      }
    });

    return users;
  }

  /**
   * Utilidad para rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica si un dataset ya está enriquecido
   */
  static isEnriched(dataset: any): boolean {
    return dataset.users_metadata && Object.keys(dataset.users_metadata).length > 0;
  }

  /**
   * Obtiene estadísticas del enriquecimiento
   */
  static getEnrichmentStats(dataset: any): EnrichmentInfo | null {
    return dataset.enrichment_info || null;
  }
}
