import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/environment.js';
import { NormalizedTweet, DownloadMetadata } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileManager {
  private dataDir: string;
  private downloadsDir: string;
  private tempDir: string;

  constructor() {
    this.dataDir = path.resolve(config.server.dataDir);
    this.downloadsDir = path.join(this.dataDir, 'downloads');
    this.tempDir = path.join(this.dataDir, 'temp');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.downloadsDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
    console.log('[FileManager] Data directories initialized');
  }

  async saveIncremental(jobId: string, tweets: NormalizedTweet[], cursor?: string): Promise<void> {
    const filename = `${jobId}_incomplete.json`;
    const filepath = path.join(this.tempDir, filename);

    const data = {
      jobId,
      tweets,
      cursor,
      lastUpdate: new Date().toISOString(),
      tweetsCount: tweets.length,
    };

    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[FileManager] Saved ${tweets.length} tweets incrementally to ${filename}`);
  }

  async saveFinal(jobId: string, query: string, tweets: NormalizedTweet[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const sanitizedQuery = query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `${sanitizedQuery}_${timestamp}.json`;
    const filepath = path.join(this.downloadsDir, filename);

    // Los tweets ya están en formato normalizado { tweet: {...}, replies: [] }
    const data = {
      query,
      search_type: 'text',
      mode: 'latest',
      downloaded_at: new Date().toISOString(),
      total_main_tweets: tweets.length,
      tweets: tweets,
    };

    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[FileManager] ✓ Saved final file: ${filename}`);

    // Delete temp file
    const tempFile = path.join(this.tempDir, `${jobId}_incomplete.json`);
    try {
      await fs.unlink(tempFile);
    } catch (e) {
      // Ignore if doesn't exist
    }

    return filename;
  }

  async loadIncomplete(jobId: string): Promise<{ tweets: NormalizedTweet[]; cursor?: string } | null> {
    const filename = `${jobId}_incomplete.json`;
    const filepath = path.join(this.tempDir, filename);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);
      return { tweets: data.tweets, cursor: data.cursor };
    } catch (e) {
      return null;
    }
  }

  async listDownloads(): Promise<DownloadMetadata[]> {
    try {
      const files = await fs.readdir(this.downloadsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const metadata: DownloadMetadata[] = [];

      for (const file of jsonFiles) {
        const filepath = path.join(this.downloadsDir, file);
        const stats = await fs.stat(filepath);
        const content = await fs.readFile(filepath, 'utf-8');
        const data = JSON.parse(content);

        // Detectar si es un archivo de proyecto (project_*_master.json)
        let queryDisplay: string;
        if (file.startsWith('project_') && file.endsWith('_master.json')) {
          // Es un proyecto - usar project_name y queries
          queryDisplay = data.project_name || 'Project';
          if (data.queries && Array.isArray(data.queries)) {
            const queryTerms = data.queries.join(', ');
            queryDisplay = `[Proyecto] ${data.project_name || 'Sin nombre'} (${queryTerms})`;
          }
        } else {
          // Es un scraping directo - usar query normal
          queryDisplay = data.query || 'Unknown';
        }

        metadata.push({
          filename: file,
          query: queryDisplay,
          tweets: data.tweets?.length || 0,
          createdAt: new Date(stats.mtime),
          size: stats.size,
          status: 'complete',
        });
      }

      return metadata.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (e) {
      console.error('[FileManager] Error listing downloads:', e);
      return [];
    }
  }

  async getFilePath(filename: string): Promise<string> {
    const filepath = path.join(this.downloadsDir, filename);
    try {
      await fs.access(filepath);
      return filepath;
    } catch (e) {
      throw new Error(`File not found: ${filename}`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    const filepath = path.join(this.downloadsDir, filename);
    try {
      await fs.unlink(filepath);
      console.log(`[FileManager] ✓ Deleted ${filename}`);
    } catch (e) {
      console.error(`[FileManager] Error deleting ${filename}:`, e);
      throw new Error(`Failed to delete file: ${filename}`);
    }
  }

  async deleteDownload(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.downloadsDir, filename);
      await fs.unlink(filepath);
      console.log(`[FileManager] Deleted ${filename}`);
      return true;
    } catch (e) {
      console.error(`[FileManager] Error deleting ${filename}:`, e);
      return false;
    }
  }

  async loadDataset(filename: string): Promise<any> {
    const filepath = path.join(this.downloadsDir, filename);
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error(`[FileManager] Error loading dataset ${filename}:`, e);
      throw new Error(`Failed to load dataset: ${filename}`);
    }
  }

  async saveEnrichedDataset(originalFilename: string, enrichedData: any): Promise<string> {
    // Sobrescribir el archivo original con los datos enriquecidos
    const filepath = path.join(this.downloadsDir, originalFilename);

    await fs.writeFile(filepath, JSON.stringify(enrichedData, null, 2), 'utf-8');
    console.log(`[FileManager] ✓ Saved enriched dataset (replaced): ${originalFilename}`);

    return originalFilename;
  }
}
