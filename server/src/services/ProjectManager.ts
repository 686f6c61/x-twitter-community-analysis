import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config/environment.js';
import { ProjectMetadata, ProjectQuery, CreateProjectRequest, ProjectStats } from '../types/project.js';
import { NormalizedTweet } from '../types/index.js';

/**
 * Gestor de Proyectos de Monitoreo
 *
 * Maneja la creación, actualización y merge de proyectos de monitoreo continuo
 */
export class ProjectManager {
  private projectsDir: string;
  private datasetsDir: string;

  constructor() {
    this.projectsDir = path.resolve(config.server.dataDir, 'projects');
    this.datasetsDir = path.resolve(config.server.dataDir, 'downloads');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.projectsDir, { recursive: true });
    console.log('[ProjectManager] Projects directory initialized');
  }

  /**
   * Crea un nuevo proyecto de monitoreo
   */
  async createProject(request: CreateProjectRequest): Promise<ProjectMetadata> {
    const projectId = randomUUID();
    const now = new Date().toISOString();

    const metadata: ProjectMetadata = {
      projectId,
      name: request.name,
      description: request.description,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      queries: [
        {
          query: request.initialQuery,
          addedAt: now,
          tweetsCollected: 0,
        },
      ],
      datasetFilename: `project_${projectId}_master.json`,
      totalTweets: 0,
      dateRange: {
        start: request.config.since || now,
        end: now,
      },
      config: {
        mode: request.config.mode,
        includeReplies: request.config.includeReplies,
        enrichUsers: request.config.enrichUsers,
        provider: 'twitterapi',
      },
    };

    await this.saveProjectMetadata(metadata);
    console.log(`[ProjectManager] ✓ Created project: ${request.name} (${projectId})`);

    return metadata;
  }

  /**
   * Obtiene la metadata de un proyecto
   */
  async getProject(projectId: string): Promise<ProjectMetadata | null> {
    try {
      const metadataPath = path.join(this.projectsDir, `${projectId}.json`);
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }

  /**
   * Lista todos los proyectos
   */
  async listProjects(): Promise<ProjectMetadata[]> {
    try {
      const files = await fs.readdir(this.projectsDir);
      const projectFiles = files.filter(f => f.endsWith('.json'));

      const projects: ProjectMetadata[] = [];
      for (const file of projectFiles) {
        const content = await fs.readFile(path.join(this.projectsDir, file), 'utf-8');
        projects.push(JSON.parse(content));
      }

      // Ordenar por fecha de actualización (más reciente primero)
      return projects.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (e) {
      console.error('[ProjectManager] Error listing projects:', e);
      return [];
    }
  }

  /**
   * Añade una nueva query a un proyecto existente
   */
  async addQueryToProject(projectId: string, query: string): Promise<ProjectMetadata> {
    const metadata = await this.getProject(projectId);
    if (!metadata) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Verificar que la query no exista ya
    if (metadata.queries.some(q => q.query === query)) {
      throw new Error(`Query already exists in project: ${query}`);
    }

    const newQuery: ProjectQuery = {
      query,
      addedAt: new Date().toISOString(),
      tweetsCollected: 0,
    };

    metadata.queries.push(newQuery);
    metadata.updatedAt = new Date().toISOString();

    await this.saveProjectMetadata(metadata);
    console.log(`[ProjectManager] ✓ Added query to project ${projectId}: ${query}`);

    return metadata;
  }

  /**
   * Merge de datasets: combina tweets nuevos con el dataset master
   */
  async mergeDatasets(
    projectId: string,
    newTweets: NormalizedTweet[],
    queryIndex: number
  ): Promise<number> {
    const metadata = await this.getProject(projectId);
    if (!metadata) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const masterPath = path.join(this.datasetsDir, metadata.datasetFilename);
    let existingData: any = {
      project_id: projectId,
      project_name: metadata.name,
      queries: metadata.queries.map(q => q.query),
      tweets: [],
    };

    // Leer dataset existente si existe
    try {
      const content = await fs.readFile(masterPath, 'utf-8');
      existingData = JSON.parse(content);
    } catch (e) {
      // Primera vez, dataset no existe aún
      console.log(`[ProjectManager] Creating new master dataset for ${projectId}`);
    }

    // Extraer IDs existentes para deduplicación
    const existingIds = new Set(
      existingData.tweets.map((t: NormalizedTweet) => t.tweet.id).filter(Boolean)
    );

    // Filtrar tweets duplicados
    const uniqueNewTweets = newTweets.filter(t => {
      const id = t.tweet.id;
      if (!id || existingIds.has(id)) return false;
      existingIds.add(id);
      return true;
    });

    console.log(`[ProjectManager] Merging: ${newTweets.length} new, ${uniqueNewTweets.length} unique`);

    // Merge
    existingData.tweets.push(...uniqueNewTweets);
    existingData.total_tweets = existingData.tweets.length;
    existingData.last_update = new Date().toISOString();

    // Guardar dataset actualizado
    await fs.writeFile(masterPath, JSON.stringify(existingData, null, 2), 'utf-8');

    // Actualizar metadata del proyecto
    metadata.totalTweets = existingData.tweets.length;
    metadata.queries[queryIndex].tweetsCollected += uniqueNewTweets.length;
    metadata.queries[queryIndex].lastScrapedAt = new Date().toISOString();

    // Actualizar sinceId con el ID más reciente
    if (uniqueNewTweets.length > 0) {
      const lastTweetId = uniqueNewTweets[0].tweet.id;
      if (lastTweetId) {
        metadata.queries[queryIndex].sinceId = lastTweetId;
      }
    }

    metadata.dateRange.end = new Date().toISOString();
    metadata.updatedAt = new Date().toISOString();
    await this.saveProjectMetadata(metadata);

    console.log(`[ProjectManager] ✓ Merged ${uniqueNewTweets.length} tweets into ${metadata.datasetFilename}`);

    return uniqueNewTweets.length;
  }

  /**
   * Obtiene estadísticas de un proyecto
   */
  async getProjectStats(projectId: string): Promise<ProjectStats | null> {
    const metadata = await this.getProject(projectId);
    if (!metadata) return null;

    const tweetsPerQuery: Record<string, number> = {};
    metadata.queries.forEach(q => {
      tweetsPerQuery[q.query] = q.tweetsCollected;
    });

    return {
      projectId: metadata.projectId,
      totalTweets: metadata.totalTweets,
      totalQueries: metadata.queries.length,
      dateRange: metadata.dateRange,
      lastUpdate: metadata.updatedAt,
      tweetsPerQuery,
    };
  }

  /**
   * Elimina una query de un proyecto
   */
  async removeQueryFromProject(projectId: string, query: string): Promise<ProjectMetadata> {
    const metadata = await this.getProject(projectId);
    if (!metadata) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const queryIndex = metadata.queries.findIndex(q => q.query === query);
    if (queryIndex === -1) {
      throw new Error(`Query not found in project: ${query}`);
    }

    // No permitir eliminar la última query
    if (metadata.queries.length === 1) {
      throw new Error('Cannot remove the last query. Projects must have at least one query.');
    }

    metadata.queries.splice(queryIndex, 1);
    metadata.updatedAt = new Date().toISOString();

    await this.saveProjectMetadata(metadata);
    console.log(`[ProjectManager] ✓ Removed query from project ${projectId}: ${query}`);

    return metadata;
  }

  /**
   * Actualiza el estado de un proyecto
   */
  async updateProjectStatus(
    projectId: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<ProjectMetadata> {
    const metadata = await this.getProject(projectId);
    if (!metadata) {
      throw new Error(`Project not found: ${projectId}`);
    }

    metadata.status = status;
    metadata.updatedAt = new Date().toISOString();
    await this.saveProjectMetadata(metadata);

    console.log(`[ProjectManager] ✓ Updated project ${projectId} status: ${status}`);
    return metadata;
  }

  /**
   * Elimina un proyecto y su dataset
   */
  async deleteProject(projectId: string): Promise<void> {
    const metadata = await this.getProject(projectId);
    if (!metadata) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Eliminar metadata
    const metadataPath = path.join(this.projectsDir, `${projectId}.json`);
    await fs.unlink(metadataPath);

    // Eliminar dataset master
    const datasetPath = path.join(this.datasetsDir, metadata.datasetFilename);
    try {
      await fs.unlink(datasetPath);
    } catch (e) {
      // Dataset no existe, ok
    }

    console.log(`[ProjectManager] ✓ Deleted project: ${metadata.name} (${projectId})`);
  }

  /**
   * Guarda la metadata de un proyecto
   */
  private async saveProjectMetadata(metadata: ProjectMetadata): Promise<void> {
    const metadataPath = path.join(this.projectsDir, `${metadata.projectId}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }
}
