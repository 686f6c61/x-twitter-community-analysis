import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvironmentConfig {
  rapidApi: {
    key: string;
    host: string;
  };
  twitterApi: {
    key: string;
    host: string;
  };
  server: {
    port: number;
    nodeEnv: string;
    dataDir: string;
  };
  security: {
    corsOrigin: string;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
}

// Validate required environment variables
const requiredEnvVars = ['RAPIDAPI_HOST'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`[Config] ❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('[Config] Please copy server/.env.example to server/.env and fill in the values.');
}

export const config: EnvironmentConfig = {
  rapidApi: {
    key: process.env.RAPIDAPI_KEY || '',
    host: process.env.RAPIDAPI_HOST || 'twitter-api45.p.rapidapi.com',
  },
  twitterApi: {
    key: process.env.TWITTERAPI_KEY || '',
    host: process.env.TWITTERAPI_HOST || 'api.twitterapi.io',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    dataDir: process.env.DATA_DIR || './data',
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

// Log configuration (without showing sensitive data)
console.log('[Config] Environment loaded:');
console.log(`  - RapidAPI Host: ${config.rapidApi.host}`);
console.log(`  - RapidAPI Key: ${config.rapidApi.key ? '✓ Set (hidden)' : '✗ Missing'}`);
console.log(`  - TwitterAPI Host: ${config.twitterApi.host}`);
console.log(`  - TwitterAPI Key: ${config.twitterApi.key ? '✓ Set (hidden)' : '✗ Missing'}`);
console.log(`  - Server Port: ${config.server.port}`);
console.log(`  - Node ENV: ${config.server.nodeEnv}`);
console.log(`  - Data Directory: ${config.server.dataDir}`);
console.log(`  - CORS Origin: ${config.security.corsOrigin}`);
