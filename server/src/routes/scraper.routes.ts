import { Router, Request, Response } from 'express';
import { TwitterScraperService } from '../services/TwitterScraperService.js';
import { ProviderFactory } from '../services/ProviderFactory.js';
import { SearchOptions, ProgressUpdate, LogMessage } from '../types/index.js';

export function createScraperRoutes(
  scraperService: TwitterScraperService,
  broadcastProgress: (update: ProgressUpdate) => void,
  broadcastLog: (log: LogMessage) => void
): Router {
  const router = Router();

  // Set broadcasters in service
  scraperService.setBroadcasters(broadcastProgress, broadcastLog);

  // GET /api/scraper/providers - Lista proveedores disponibles
  router.get('/providers', (req: Request, res: Response) => {
    try {
      const providers = ProviderFactory.getAvailableProviders();
      const defaultProvider = ProviderFactory.getDefaultProvider();

      res.json({
        providers,
        default: defaultProvider,
      });
    } catch (error: any) {
      console.error('[API] Error fetching providers:', error);
      res.status(500).json({ error: 'Failed to fetch providers', message: error.message });
    }
  });

  // POST /api/scraper/start
  router.post('/start', async (req: Request, res: Response) => {
    try {
      const options: SearchOptions = req.body;

      // Validate
      if (!options.query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const jobId = await scraperService.startScraping(options);

      res.json({ jobId, status: 'started' });
    } catch (error: any) {
      console.error('[API] Error starting scraper:', error);
      res.status(500).json({ error: 'Failed to start scraping', message: error.message });
    }
  });

  // GET /api/scraper/status/:jobId
  router.get('/status/:jobId', (req: Request, res: Response) => {
    const { jobId } = req.params;
    const status = scraperService.getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  });

  // POST /api/scraper/stop/:jobId
  router.post('/stop/:jobId', async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const result = await scraperService.stopJob(jobId);

    if (!result.success) {
      return res.status(404).json({ error: 'Job not found or already stopped' });
    }

    res.json({
      status: 'stopped',
      filename: result.filename,
      tweetsCount: result.tweetsCount
    });
  });

  // GET /api/scraper/downloads
  router.get('/downloads', async (req: Request, res: Response) => {
    try {
      const downloads = await scraperService.listDownloads();
      res.json(downloads);
    } catch (error: any) {
      console.error('[API] Error listing downloads:', error);
      res.status(500).json({ error: 'Failed to list downloads', message: error.message });
    }
  });

  // GET /api/scraper/download/:filename
  router.get('/download/:filename', async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = await scraperService.getDownloadPath(filename);
      res.download(filePath, filename);
    } catch (error: any) {
      console.error('[API] Error downloading file:', error);
      res.status(500).json({ error: 'Failed to download file', message: error.message });
    }
  });

  // DELETE /api/scraper/download/:filename
  router.delete('/download/:filename', async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      await scraperService.deleteDownload(filename);
      res.json({ status: 'deleted', filename });
    } catch (error: any) {
      console.error('[API] Error deleting file:', error);
      res.status(500).json({ error: 'Failed to delete file', message: error.message });
    }
  });

  // POST /api/scraper/enrich/:filename
  router.post('/enrich/:filename', async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const enrichedFilename = await scraperService.enrichFile(filename);
      res.json({
        status: 'enriched',
        filename: enrichedFilename
      });
    } catch (error: any) {
      console.error('[API] Error enriching file:', error);
      res.status(500).json({ error: 'Failed to enrich file', message: error.message });
    }
  });

  return router;
}
