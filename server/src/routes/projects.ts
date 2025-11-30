import { Router } from 'express';
import { ProjectManager } from '../services/ProjectManager.js';
import { TwitterScraperService } from '../services/TwitterScraperService.js';
import { CreateProjectRequest, AddQueryToProjectRequest, ContinueProjectRequest } from '../types/project.js';

const router = Router();
const projectManager = new ProjectManager();
const scraperService = new TwitterScraperService();

// Inicializar servicios
await projectManager.initialize();
await scraperService.initialize();

/**
 * GET /api/projects
 * Lista todos los proyectos
 */
router.get('/', async (req, res) => {
  try {
    const projects = await projectManager.listProjects();
    res.json({ projects });
  } catch (error: any) {
    console.error('[Projects API] Error listing projects:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:projectId
 * Obtiene un proyecto específico con sus estadísticas
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await projectManager.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const stats = await projectManager.getProjectStats(projectId);
    res.json({ project, stats });
  } catch (error: any) {
    console.error('[Projects API] Error getting project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/create
 * Crea un nuevo proyecto y realiza el scraping inicial
 */
router.post('/create', async (req, res) => {
  try {
    const request: CreateProjectRequest = req.body;

    // Validaciones
    if (!request.name || !request.initialQuery) {
      return res.status(400).json({ error: 'Missing required fields: name, initialQuery' });
    }

    console.log(`[Projects API] Creating project: ${request.name}`);

    // Crear proyecto
    const project = await projectManager.createProject(request);

    // Iniciar scraping inicial en background
    const jobId = await scraperService.startScraping({
      query: request.initialQuery,
      mode: request.config.mode,
      maxTweets: request.config.maxTweets || 100,
      includeReplies: request.config.includeReplies,
      enrichUsers: request.config.enrichUsers,
      since: request.config.since,
      until: request.config.until,
      provider: 'twitterapi',
    });

    // Monitorear el job y hacer merge cuando complete
    monitorJobAndMerge(jobId, project.projectId, 0);

    console.log(`[Projects API] ✓ Project created: ${project.projectId}, scraping job: ${jobId}`);

    res.json({
      project,
      jobId,
      message: 'Project created, initial scraping started',
    });
  } catch (error: any) {
    console.error('[Projects API] Error creating project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:projectId/add-query
 * Añade una nueva query a un proyecto existente
 */
router.post('/:projectId/add-query', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { query, maxTweets }: AddQueryToProjectRequest = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing required field: query' });
    }

    const project = await projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`[Projects API] Adding query to project ${projectId}: ${query}`);

    // Añadir query a la metadata
    const updatedProject = await projectManager.addQueryToProject(projectId, query);
    const queryIndex = updatedProject.queries.length - 1; // Nueva query está al final

    // Iniciar scraping de la nueva query
    const jobId = await scraperService.startScraping({
      query,
      mode: project.config.mode,
      maxTweets: maxTweets || 100,
      includeReplies: project.config.includeReplies,
      enrichUsers: project.config.enrichUsers,
      provider: project.config.provider || 'twitterapi',
    });

    // Monitorear el job y hacer merge cuando complete
    monitorJobAndMerge(jobId, projectId, queryIndex);

    console.log(`[Projects API] ✓ Query added, scraping job: ${jobId}`);

    res.json({
      project: updatedProject,
      jobId,
      message: 'Query added, scraping started',
    });
  } catch (error: any) {
    console.error('[Projects API] Error adding query:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/projects/:projectId/remove-query
 * Elimina una query de un proyecto existente
 */
router.delete('/:projectId/remove-query', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing required field: query' });
    }

    const project = await projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`[Projects API] Removing query from project ${projectId}: ${query}`);

    // Eliminar query de la metadata
    const updatedProject = await projectManager.removeQueryFromProject(projectId, query);

    console.log(`[Projects API] ✓ Query removed`);

    res.json({
      project: updatedProject,
      message: 'Query removed successfully',
    });
  } catch (error: any) {
    console.error('[Projects API] Error removing query:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:projectId/continue
 * Continúa el scraping de un proyecto (actualiza con tweets nuevos)
 */
router.post('/:projectId/continue', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { maxTweets }: ContinueProjectRequest = req.body;

    const project = await projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'active') {
      return res.status(400).json({ error: 'Project is not active' });
    }

    console.log(`[Projects API] Continuing project ${projectId}`);

    // Scraping de todas las queries activas - ahora con merge automático
    const jobs = [];
    for (let i = 0; i < project.queries.length; i++) {
      const query = project.queries[i];
      const jobId = await scraperService.startScraping({
        query: query.query,
        mode: project.config.mode,
        maxTweets: maxTweets || 50,
        includeReplies: project.config.includeReplies,
        enrichUsers: project.config.enrichUsers,
        provider: project.config.provider || 'twitterapi',
        // TODO: Usar sinceId para obtener solo tweets nuevos
        // since_id: query.sinceId,
      });

      // Guardar referencia del job al proyecto para merge automático
      jobs.push({ query: query.query, jobId, queryIndex: i });

      // Monitorear el job y hacer merge cuando complete
      monitorJobAndMerge(jobId, projectId, i);
    }

    console.log(`[Projects API] ✓ Started ${jobs.length} scraping jobs`);

    res.json({
      project,
      jobs,
      message: `Continuing scraping for ${jobs.length} queries`,
    });
  } catch (error: any) {
    console.error('[Projects API] Error continuing project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Función auxiliar para monitorear un job y hacer merge cuando complete
 */
async function monitorJobAndMerge(jobId: string, projectId: string, queryIndex: number) {
  const checkInterval = setInterval(async () => {
    try {
      const jobStatus = scraperService.getJobStatus(jobId);

      if (jobStatus?.status === 'completed' && jobStatus.outputFile) {
        clearInterval(checkInterval);

        console.log(`[Projects API] Job ${jobId} completed, merging to project ${projectId}...`);

        // Cargar tweets del archivo generado
        const { FileManager } = await import('../utils/fileManager.js');
        const fileManager = new FileManager();
        await fileManager.initialize();
        const dataset = await fileManager.loadDataset(jobStatus.outputFile);

        // Hacer merge con el proyecto
        const mergedCount = await projectManager.mergeDatasets(projectId, dataset.tweets, queryIndex);
        console.log(`[Projects API] ✓ Merged ${mergedCount} new tweets to project ${projectId}`);

      } else if (jobStatus?.status === 'error') {
        clearInterval(checkInterval);
        console.error(`[Projects API] Job ${jobId} failed, skipping merge`);
      }
    } catch (err) {
      console.error(`[Projects API] Error monitoring job ${jobId}:`, err);
    }
  }, 2000); // Check every 2 seconds
}

/**
 * PATCH /api/projects/:projectId/status
 * Actualiza el estado de un proyecto
 */
router.patch('/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedProject = await projectManager.updateProjectStatus(projectId, status);
    console.log(`[Projects API] ✓ Updated project ${projectId} status: ${status}`);

    res.json({ project: updatedProject });
  } catch (error: any) {
    console.error('[Projects API] Error updating status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Elimina un proyecto
 */
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    await projectManager.deleteProject(projectId);
    console.log(`[Projects API] ✓ Deleted project ${projectId}`);

    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('[Projects API] Error deleting project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:projectId/stats
 * Obtiene estadísticas detalladas de un proyecto
 */
router.get('/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;
    const stats = await projectManager.getProjectStats(projectId);

    if (!stats) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ stats });
  } catch (error: any) {
    console.error('[Projects API] Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/:projectId/sync-from-file
 * Sincroniza el contador de tweets desde un archivo existente (útil para migración)
 */
router.post('/:projectId/sync-from-file', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Missing required field: filename' });
    }

    console.log(`[Projects API] Syncing project ${projectId} from file ${filename}`);

    // Cargar archivo existente
    const { FileManager } = await import('../utils/fileManager.js');
    const fileManager = new FileManager();
    await fileManager.initialize();
    const dataset = await fileManager.loadDataset(filename);

    // Hacer merge con el proyecto (queryIndex 0 por defecto)
    const mergedCount = await projectManager.mergeDatasets(projectId, dataset.tweets, 0);

    console.log(`[Projects API] ✓ Synced ${mergedCount} tweets to project ${projectId}`);

    res.json({
      success: true,
      mergedCount,
      totalTweets: dataset.tweets.length,
      message: `Synced ${mergedCount} tweets successfully`,
    });
  } catch (error: any) {
    console.error('[Projects API] Error syncing from file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
