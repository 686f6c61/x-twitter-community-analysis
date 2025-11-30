import { RapidAPIClient } from './RapidAPIClient.js';
import { TwitterAPIClient } from './TwitterAPIClient.js';
import { FileManager } from '../utils/fileManager.js';
import { DataNormalizer } from './DataNormalizer.js';
import { ProviderFactory } from './ProviderFactory.js';
import { UserEnrichmentService } from './UserEnrichmentService.js';
import { SearchOptions, Tweet, ScrapingJob, ProgressUpdate, LogMessage, ProviderType, NormalizedTweet } from '../types/index.js';
import { randomUUID } from 'crypto';

export class TwitterScraperService {
  private fileManager: FileManager;
  private enrichmentService: UserEnrichmentService;
  private activeJobs: Map<string, ScrapingJob> = new Map();
  private progressCallbacks: Map<string, (update: ProgressUpdate) => void> = new Map();
  private broadcastProgress?: (update: ProgressUpdate) => void;
  private broadcastLog?: (log: LogMessage) => void;

  constructor() {
    this.fileManager = new FileManager();
    this.enrichmentService = new UserEnrichmentService();
  }

  async initialize(): Promise<void> {
    await this.fileManager.initialize();
  }

  setBroadcasters(
    broadcastProgress: (update: ProgressUpdate) => void,
    broadcastLog: (log: LogMessage) => void
  ): void {
    this.broadcastProgress = broadcastProgress;
    this.broadcastLog = broadcastLog;
  }

  private log(jobId: string, level: 'info' | 'success' | 'warning' | 'error', message: string): void {
    const logPrefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : level === 'success' ? '✓' : 'ℹ️';
    console.log(`[Scraper ${jobId.substring(0, 8)}] ${logPrefix} ${message}`);

    if (this.broadcastLog) {
      this.broadcastLog({
        jobId,
        timestamp: new Date().toISOString(),
        level,
        message,
      });
    }
  }

  async startScraping(
    options: SearchOptions,
    onProgress?: (update: ProgressUpdate) => void
  ): Promise<string> {
    const jobId = randomUUID();

    const job: ScrapingJob = {
      jobId,
      status: 'running',
      progress: 0,
      tweetsCollected: 0,
      query: options.query,
      mode: options.mode,
      maxTweets: options.maxTweets ?? 999999, // Sin límite si es undefined/null
      includeReplies: options.includeReplies,
      startedAt: new Date(),
      partialTweets: [], // Initialize empty array for partial data
      searchOptions: options, // Store original options for enrichment
    };

    this.activeJobs.set(jobId, job);
    if (onProgress) {
      this.progressCallbacks.set(jobId, onProgress);
    }

    // Start scraping in background
    this.executeScraping(jobId, options).catch((error) => {
      console.error(`[Scraper] Job ${jobId} failed:`, error);
      job.status = 'error';
      job.error = error.message;
      this.sendProgress(jobId, {
        status: 'error',
        message: `Error: ${error.message}`,
        error: error.message,
      });
    });

    return jobId;
  }

  private async executeScraping(jobId: string, options: SearchOptions): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    // Determinar proveedor a usar
    const provider: ProviderType = options.provider || ProviderFactory.getDefaultProvider() || 'rapidapi';
    const client = ProviderFactory.createClient(provider);

    this.log(jobId, 'info', `Usando proveedor: ${provider}`);

    const allTweets: NormalizedTweet[] = [];
    const seenIds = new Set<string>();
    let cursor: string | undefined = options.cursor;
    let requestCount = 0;

    this.log(jobId, 'info', `Iniciando scraping para: ${options.query}`);
    this.log(jobId, 'info', `Modo: ${options.mode}, Máximo: ${options.maxTweets || 100} tweets`);

    this.sendProgress(jobId, {
      status: 'running',
      message: `Iniciando búsqueda: ${options.query}...`,
    });

    const maxTweets = options.maxTweets ?? 999999;

    while (allTweets.length < maxTweets && job.status === 'running') {
      requestCount++;

      try {
        this.log(jobId, 'info', `Solicitando página ${requestCount}...`);

        const { tweets: rawTweets, cursor: nextCursor } = await client.searchTweets({
          ...options,
          cursor,
        });

        this.log(jobId, 'info', `Recibidos ${rawTweets.length} tweets de la API`);

        // Normalizar tweets al formato unificado
        const normalizedTweets = rawTweets.map(tweet =>
          DataNormalizer.normalizeTweet(tweet, provider)
        );

        // Log tweet IDs for debugging
        console.log(`[Scraper ${jobId.substring(0, 8)}] IDs recibidos:`,
          normalizedTweets.slice(0, 3).map(t => t.tweet.id));
        console.log(`[Scraper ${jobId.substring(0, 8)}] IDs ya vistos (total):`, seenIds.size);

        // Filter duplicates
        const newTweets = normalizedTweets.filter(t => {
          const id = t.tweet.id;
          return id && !seenIds.has(id);
        });
        newTweets.forEach(t => {
          const id = t.tweet.id;
          if (id) seenIds.add(id);
        });

        if (newTweets.length < normalizedTweets.length) {
          this.log(jobId, 'warning', `Descartados ${normalizedTweets.length - newTweets.length} tweets duplicados`);
        }

        // Get replies if requested
        if (options.includeReplies) {
          for (const tweet of newTweets) {
            try {
              const tweetId = tweet.tweet.id;
              if (tweetId) {
                const rawReplies = await client.getTweetReplies(tweetId);
                const normalizedReplies = rawReplies.map(reply =>
                  DataNormalizer.normalizeTweet(reply, provider)
                );
                tweet.replies = normalizedReplies;
                allTweets.push(tweet);
              } else {
                allTweets.push(tweet);
              }
            } catch (e) {
              allTweets.push(tweet);
            }
          }
        } else {
          allTweets.push(...newTweets);
        }

        job.tweetsCollected = allTweets.length;
        job.progress = Math.min(100, Number(((allTweets.length / maxTweets) * 100).toFixed(2)));
        job.cursor = nextCursor;
        job.partialTweets = allTweets; // Store accumulated tweets for partial save

        // Save incrementally every 20 tweets
        if (allTweets.length % 20 === 0) {
          this.log(jobId, 'info', `Guardando progreso: ${allTweets.length} tweets...`);
          await this.fileManager.saveIncremental(jobId, allTweets, nextCursor);
          this.log(jobId, 'success', `Guardado incremental completado`);
        }

        this.log(jobId, 'info', `Total acumulado: ${allTweets.length} tweets`);

        this.sendProgress(jobId, {
          status: 'running',
          message: `Descargados ${allTweets.length}/${maxTweets} tweets (página ${requestCount})`,
          cursor: nextCursor,
        });

        if (!nextCursor || newTweets.length === 0) {
          this.log(jobId, 'warning', 'No hay más páginas disponibles');
          break;
        }

        cursor = nextCursor;

        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        this.log(jobId, 'error', `Error en petición ${requestCount}: ${error.message}`);
        console.error(`[Scraper] Error in request ${requestCount}:`, error.message);

        // Retry logic
        if (requestCount < 3) {
          this.log(jobId, 'warning', `Reintentando en 3 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        } else {
          this.log(jobId, 'error', 'Número máximo de reintentos alcanzado');
          throw error;
        }
      }
    }

    // Fetch full conversations if requested (batch method)
    if (options.includeConversations && allTweets.length > 0) {
      try {
        this.log(jobId, 'info', `Extrayendo conversation_ids de ${allTweets.length} tweets principales...`);

        // Extract unique conversation_ids from main tweets
        const conversationIds = new Set<string>();
        for (const tweet of allTweets) {
          const convId = tweet.tweet.id; // Each tweet's ID is its conversation_id if it's a root tweet
          if (convId) {
            conversationIds.add(convId);
          }
        }

        const convIdsArray = Array.from(conversationIds);
        this.log(jobId, 'info', `Encontrados ${convIdsArray.length} conversation_ids únicos`);

        this.sendProgress(jobId, {
          status: 'running',
          progress: 85,
          message: `Obteniendo conversaciones completas (${convIdsArray.length} threads)...`,
        });

        // Fetch all conversations using batch method
        const conversationTweets = await this.fetchConversationsBatch(jobId, convIdsArray, provider);

        this.log(jobId, 'success', `Obtenidos ${conversationTweets.length} tweets de conversaciones`);

        // Organize replies under their parent tweets
        const conversationMap = new Map<string, NormalizedTweet[]>();
        for (const convTweet of conversationTweets) {
          const convId = convTweet.tweet.id; // TODO: Extract actual conversation_id from tweet metadata
          if (convId) {
            if (!conversationMap.has(convId)) {
              conversationMap.set(convId, []);
            }
            conversationMap.get(convId)!.push(convTweet);
          }
        }

        // Attach replies to main tweets
        for (const mainTweet of allTweets) {
          const convId = mainTweet.tweet.id;
          if (convId && conversationMap.has(convId)) {
            mainTweet.replies = conversationMap.get(convId)!;
          }
        }

        this.sendProgress(jobId, {
          status: 'running',
          progress: 90,
          message: `Conversaciones integradas: ${conversationTweets.length} replies organizadas`,
        });

      } catch (convError: any) {
        this.log(jobId, 'warning', `Error obteniendo conversaciones: ${convError.message}`);
        // Continue despite conversation fetch failure
      }
    }

    // Save final file
    this.log(jobId, 'info', `Guardando archivo final con ${allTweets.length} tweets...`);
    let filename = await this.fileManager.saveFinal(jobId, options.query, allTweets);
    this.log(jobId, 'success', `Archivo guardado: ${filename}`);

    // Enrich users if enabled (default: true for TwitterAPI)
    const shouldEnrich = options.enrichUsers !== false && provider === 'twitterapi';

    if (shouldEnrich) {
      try {
        this.log(jobId, 'info', `Enriqueciendo usuarios...`);
        this.sendProgress(jobId, {
          status: 'running',
          progress: 95,
          message: `Enriqueciendo información de usuarios...`,
        });

        // Load the saved dataset
        const dataset = await this.fileManager.loadDataset(filename);

        // Enrich with user metadata con callback de progreso
        const enrichedDataset = await this.enrichmentService.enrichDataset(
          dataset,
          (processed: number, total: number, percentage: number) => {
            // Actualizar progreso: 95% base + 5% proporcional al enriquecimiento
            const enrichmentProgress = 95 + (percentage * 0.05);
            this.sendProgress(jobId, {
              status: 'running',
              progress: enrichmentProgress,
              message: `Enriqueciendo usuarios: ${processed}/${total} (${percentage}%)`,
            });
            this.log(jobId, 'info', `Enriquecimiento: ${processed}/${total} usuarios (${percentage}%)`);
          }
        );

        // Save enriched dataset (sobrescribe el archivo original)
        filename = await this.fileManager.saveEnrichedDataset(filename, enrichedDataset);

        this.log(jobId, 'success', `Usuarios enriquecidos: ${enrichedDataset.enrichment_info?.users_enriched || 0}`);
      } catch (enrichError: any) {
        this.log(jobId, 'warning', `Error en enriquecimiento: ${enrichError.message}`);
        // Continue despite enrichment failure
      }
    }

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    job.outputFile = filename;

    this.sendProgress(jobId, {
      status: 'completed',
      message: `✓ Completado: ${allTweets.length} tweets guardados en ${filename}`,
    });

    this.log(jobId, 'success', `Scraping completado exitosamente`);
    console.log(`[Scraper] ✓ Job ${jobId} completed: ${allTweets.length} tweets`);
  }

  /**
   * Obtiene conversaciones completas usando batching de conversation_ids
   * M\u00e9todo optimizado: 50 conversation_ids por request
   */
  private async fetchConversationsBatch(
    jobId: string,
    conversationIds: string[],
    provider: ProviderType
  ): Promise<NormalizedTweet[]> {
    const BATCH_SIZE = 50;
    const allConversationTweets: NormalizedTweet[] = [];
    const batches = [];

    // Dividir en batches de 50
    for (let i = 0; i < conversationIds.length; i += BATCH_SIZE) {
      batches.push(conversationIds.slice(i, i + BATCH_SIZE));
    }

    this.log(jobId, 'info', `Obteniendo ${conversationIds.length} conversaciones en ${batches.length} batches`);

    const client = ProviderFactory.createClient(provider);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        // Construir query OR con conversation_ids
        const conversationQuery = batch.map(id => `conversation_id:${id}`).join(' OR ');

        this.log(jobId, 'info', `Batch ${i + 1}/${batches.length}: ${batch.length} conversaciones`);

        // Buscar todos los tweets de estas conversaciones
        const { tweets: rawTweets } = await client.searchTweets({
          query: conversationQuery,
          mode: 'latest',
          maxTweets: 10000, // Alto para capturar todas las replies
          includeReplies: false, // Ya no usamos el m\u00e9todo antiguo
        });

        // Normalizar
        const normalized = rawTweets.map(tweet =>
          DataNormalizer.normalizeTweet(tweet, provider)
        );

        allConversationTweets.push(...normalized);

        this.sendProgress(jobId, {
          status: 'running',
          message: `Conversaciones: ${i + 1}/${batches.length} batches (${allConversationTweets.length} tweets)`,
        });

        // Rate limiting: 1s entre batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        this.log(jobId, 'error', `Error en batch ${i + 1}: ${error.message}`);
        // Continuar con siguiente batch
      }
    }

    this.log(jobId, 'success', `Conversaciones completadas: ${allConversationTweets.length} tweets en total`);
    return allConversationTweets;
  }

  private sendProgress(jobId: string, update: Partial<ProgressUpdate>): void {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    const fullUpdate: ProgressUpdate = {
      jobId,
      status: update.status || job.status,
      progress: update.progress !== undefined ? update.progress : job.progress,
      tweetsCollected: update.tweetsCollected !== undefined ? update.tweetsCollected : job.tweetsCollected,
      message: update.message || '',
      cursor: update.cursor,
      error: update.error,
    };

    // Broadcast via WebSocket
    if (this.broadcastProgress) {
      this.broadcastProgress(fullUpdate);
    }

    // Legacy callback support
    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(fullUpdate);
    }
  }

  getJobStatus(jobId: string): ScrapingJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  async stopJob(jobId: string): Promise<{ success: boolean; filename?: string; tweetsCount?: number }> {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'paused';

      // Save partial tweets if any were collected
      let filename: string | undefined;
      if (job.partialTweets && job.partialTweets.length > 0) {
        this.log(jobId, 'info', `Guardando ${job.partialTweets.length} tweets parciales...`);
        filename = await this.fileManager.saveFinal(jobId, job.query, job.partialTweets);
        job.outputFile = filename;
        this.log(jobId, 'success', `Guardado parcial completado: ${filename}`);
      }

      this.sendProgress(jobId, {
        status: 'paused',
        message: job.partialTweets?.length
          ? `Scraping detenido. ${job.partialTweets.length} tweets guardados.`
          : 'Scraping detenido sin datos',
      });

      return {
        success: true,
        filename,
        tweetsCount: job.partialTweets?.length || 0
      };
    }
    return { success: false };
  }

  async enrichFile(filename: string): Promise<string> {
    this.log(filename, 'info', `Iniciando enriquecimiento de ${filename}...`);

    // Load the saved dataset
    const dataset = await this.fileManager.loadDataset(filename);

    // Enrich with user metadata
    const enrichedDataset = await this.enrichmentService.enrichDataset(
      dataset,
      (processed: number, total: number, percentage: number) => {
        this.log(filename, 'info', `Enriqueciendo usuarios: ${processed}/${total} (${percentage}%)`);
      }
    );

    // Save enriched dataset (sobrescribe el archivo original)
    const enrichedFilename = await this.fileManager.saveEnrichedDataset(filename, enrichedDataset);

    this.log(filename, 'success', `Enriquecimiento completado: ${enrichedDataset.enrichment_info?.users_enriched || 0} usuarios`);

    return enrichedFilename;
  }

  async listDownloads() {
    return this.fileManager.listDownloads();
  }

  async getDownloadPath(filename: string): Promise<string> {
    return this.fileManager.getFilePath(filename);
  }

  async deleteDownload(filename: string): Promise<void> {
    await this.fileManager.deleteFile(filename);
  }
}
