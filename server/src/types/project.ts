/**
 * Sistema de Proyectos de Monitoreo
 *
 * Permite monitorear tendencias en tiempo real con:
 * - Scraping continuo desde una fecha inicial
 * - Añadir nuevas queries dinámicamente
 * - Dataset acumulativo sin duplicados
 * - Histórico de queries y evolución
 */

export interface ProjectQuery {
  query: string;
  addedAt: string; // ISO timestamp
  tweetsCollected: number;
  lastScrapedAt?: string;
  sinceId?: string; // Último tweet ID para continuar
}

export interface ProjectMetadata {
  projectId: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;

  // Queries
  queries: ProjectQuery[];

  // Dataset info
  datasetFilename: string; // Archivo master acumulativo
  totalTweets: number;

  // Rango temporal
  dateRange: {
    start: string;
    end: string;
  };

  // Configuración de scraping
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
