import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';
import { TwitterScraperService } from './services/TwitterScraperService.js';
import { createScraperRoutes } from './routes/scraper.routes.js';
import projectsRouter from './routes/projects.js';
import { ProgressUpdate, LogMessage } from './types/index.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/scraper' });

// Middleware
app.use(cors({ origin: config.security.corsOrigin, credentials: true }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Initialize services
const scraperService = new TwitterScraperService();

// WebSocket connections
const wsClients = new Map<string, Set<any>>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const jobId = url.searchParams.get('jobId');

  if (!jobId) {
    ws.close(1008, 'Job ID required');
    return;
  }

  console.log(`[WebSocket] Client connected for job ${jobId}`);

  if (!wsClients.has(jobId)) {
    wsClients.set(jobId, new Set());
  }
  wsClients.get(jobId)!.add(ws);

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected from job ${jobId}`);
    wsClients.get(jobId)?.delete(ws);
    if (wsClients.get(jobId)?.size === 0) {
      wsClients.delete(jobId);
    }
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket] Error for job ${jobId}:`, error);
  });
});

// Progress broadcaster
function broadcastProgress(update: ProgressUpdate): void {
  const clients = wsClients.get(update.jobId);
  if (clients) {
    const message = JSON.stringify({ type: 'progress', data: update });
    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}

// Log broadcaster
function broadcastLog(log: LogMessage): void {
  const clients = wsClients.get(log.jobId);
  if (clients) {
    const message = JSON.stringify({ type: 'log', data: log });
    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'graphs-scraper-server',
    version: '0.8.0',
  });
});

app.use('/api/scraper', createScraperRoutes(scraperService, broadcastProgress, broadcastLog));
app.use('/api/projects', projectsRouter);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Startup
async function startServer() {
  try {
    // Initialize services
    await scraperService.initialize();

    // Start server
    server.listen(config.server.port, () => {
      console.log('═══════════════════════════════════════════');
      console.log('  🚀 GRAPHS Scraper Server v0.8.0');
      console.log('═══════════════════════════════════════════');
      console.log(`  ➜ HTTP:      http://localhost:${config.server.port}`);
      console.log(`  ➜ WebSocket: ws://localhost:${config.server.port}/ws/scraper`);
      console.log(`  ➜ Health:    http://localhost:${config.server.port}/health`);
      console.log(`  ➜ ENV:       ${config.server.nodeEnv}`);
      console.log('═══════════════════════════════════════════\n');

      if (!config.rapidApi.key) {
        console.warn('⚠️  WARNING: RAPIDAPI_KEY not set! Set it in server/.env');
      }
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

startServer();
