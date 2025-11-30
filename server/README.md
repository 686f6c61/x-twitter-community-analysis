# GRAPHS Scraper Server

Backend API para scraping de Twitter usando RapidAPI.

## Setup

### 1. Instalar dependencias

```bash
cd server
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `server/.env` y añadir tu API key de RapidAPI:

```env
RAPIDAPI_KEY=tu_api_key_aqui
RAPIDAPI_HOST=twitter-api45.p.rapidapi.com
```

**Obtener API Key:**
1. Ir a https://rapidapi.com/hub
2. Buscar "Twitter API v2"
3. Suscribirse (hay plan gratuito)
4. Copiar API Key y pegarla en `.env`

### 3. Iniciar servidor

```bash
npm run dev      # Desarrollo (con hot reload)
npm run build    # Compilar TypeScript
npm start        # Producción
```

El servidor arrancará en http://localhost:3001

## API Endpoints

### POST /api/scraper/start
Iniciar scraping de tweets

**Body:**
```json
{
  "query": "#RealBetis",
  "mode": "latest",
  "maxTweets": 1000,
  "includeReplies": true,
  "since": "2025-01-01",
  "until": "2025-12-31",
  "filters": {
    "minLikes": 10,
    "verifiedOnly": false
  }
}
```

**Response:**
```json
{
  "jobId": "abc-123-def",
  "status": "started"
}
```

### GET /api/scraper/status/:jobId
Obtener estado de un job

**Response:**
```json
{
  "jobId": "abc-123-def",
  "status": "running",
  "progress": 45,
  "tweetsCollected": 450,
  "cursor": "xyz..."
}
```

### POST /api/scraper/stop/:jobId
Detener un job en ejecución

### GET /api/scraper/downloads
Listar archivos descargados

**Response:**
```json
[
  {
    "filename": "RealBetis_2025-01-08.json",
    "query": "#RealBetis",
    "tweets": 1523,
    "createdAt": "2025-01-08T12:00:00Z",
    "size": 2048576,
    "status": "complete"
  }
]
```

## WebSocket

Para recibir progreso en tiempo real:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws/scraper?jobId=abc-123-def');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(update);
  // {
  //   jobId: "abc-123-def",
  //   status: "running",
  //   progress: 45,
  //   tweetsCollected: 450,
  //   message: "Descargados 450/1000 tweets..."
  // }
};
```

## Estructura

```
server/
├── src/
│   ├── config/
│   │   └── environment.ts      # Configuración y variables de entorno
│   ├── routes/
│   │   └── scraper.routes.ts   # Endpoints REST
│   ├── services/
│   │   ├── RapidAPIClient.ts   # Cliente de RapidAPI
│   │   └── TwitterScraperService.ts  # Lógica principal
│   ├── utils/
│   │   └── fileManager.ts      # Gestión de archivos JSON
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── server.ts               # Servidor Express + WebSocket
├── data/
│   ├── downloads/              # JSONs finales
│   └── temp/                   # Archivos incompletos
├── .env                        # Variables de entorno (NO commitear)
├── .env.example                # Template de variables
├── package.json
└── tsconfig.json
```

## Seguridad

- ✅ API keys NUNCA se exponen al cliente
- ✅ CORS configurado para origen específico
- ✅ Rate limiting activado
- ✅ Variables de entorno en `.env` (gitignored)
- ✅ Validación de inputs
- ✅ Logs sanitizados (sin API keys)

## Características

- ✅ Scraping incremental (guarda cada 50 tweets)
- ✅ Reanudar descargas interrumpidas
- ✅ Filtros post-descarga (minLikes, verified)
- ✅ Detección de duplicados
- ✅ Rate limiting automático
- ✅ Progreso en tiempo real (WebSocket)
- ✅ Manejo de errores robusto
- ✅ TypeScript completo

## Troubleshooting

### Error: RAPIDAPI_KEY not set
Configurar la API key en `server/.env`

### Error: Rate limit exceeded
Esperar unos minutos o upgraar plan de RapidAPI

### Puerto 3001 en uso
Cambiar `PORT` en `server/.env`

## Próximas mejoras

- [ ] Soporte para TwitterAPI.io (segunda fuente)
- [ ] Export a CSV
- [ ] Sistema de colas para múltiples jobs
- [ ] Caché de resultados
- [ ] Modo monitor (polling continuo)
