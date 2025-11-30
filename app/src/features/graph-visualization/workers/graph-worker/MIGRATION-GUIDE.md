# Guía de Migración - Graph Worker Modular

## Estado Actual

El worker original (`graph.worker.ts`) **sigue funcionando normalmente**. Esta refactorización es completamente **opt-in** y no rompe ningún código existente.

## Qué está COMPLETO (55%)

### ✅ Algoritmos de Grafos
Todos los algoritmos core están completamente extraídos y funcionando:

```typescript
// Importar algoritmos individuales
import { calculateDegreeCentrality } from './graph-worker/algorithms/centrality';
import { calculatePageRank } from './graph-worker/algorithms/pagerank';
import { calculateLouvainCommunities } from './graph-worker/algorithms/community-detection';
import { calculateNetworkMotifs } from './graph-worker/algorithms/network-motifs';
import { calculateKCore } from './graph-worker/algorithms/core-decomposition';
```

### ✅ Utilidades
```typescript
import { normalize, mean, stddev } from './graph-worker/utils/math-utils';
import { buildAdjacencyMap } from './graph-worker/utils/graph-utils';
import { extractTimestamps } from './graph-worker/utils/time-utils';
```

### ✅ Tipos TypeScript
```typescript
import type { Node, Edge, Graph } from './graph-worker/types/graph.types';
import type { CentralityMetrics } from './graph-worker/types/metrics.types';
```

## Qué está PENDIENTE (45%)

Los siguientes módulos tienen stubs/placeholders y necesitan ser extraídos del worker original:

### 🚧 Análisis de Contenido
- `analysis/bot-detection.ts` - calculateBotScores (~200 líneas)
- `analysis/sentiment.ts` - analyzeSentiment (~150 líneas)
- `analysis/text-processing.ts` - extractWordFrequencies (~80 líneas)
- `analysis/url-analysis.ts` - analyzeSharedUrls (~100 líneas)

### 🚧 Graph Builders
- `graph-builders/mentions-graph.ts` - buildMentionsGraph (~170 líneas)
- `graph-builders/cohashtags-graph.ts` - buildCohashtagsGraph (~150 líneas)

### 🚧 Estadísticas
- `statistics/general-stats.ts` - calculateStats (~250 líneas)
- `statistics/activity-peaks.ts` - detectActivityPeaks (~240 líneas)

### 🚧 Processor Core
- `processor.ts` - processTweetsData (~180 líneas)

## Cómo Completar la Migración

### Paso 1: Extraer Bot Detection
```bash
# Leer líneas 2189-2450 del worker original
# Copiar función calculateBotScores completa
# Incluir todas las subfunciones internas:
#   - calculateTemporalRegularity
#   - calculateContentSimilarity
#   - calculateInteractionPatterns
#   - calculateProfileCharacteristics
```

### Paso 2: Extraer Sentiment Analysis
```bash
# Leer líneas ~2900-3100 del worker original
# Copiar:
#   - SENTIMENT_DICT
#   - EMOTION_DICT
#   - TOXIC_KEYWORDS
#   - analyzeSentiment
#   - analyzeCommunityAdvanced
```

### Paso 3: Extraer Graph Builders
```bash
# buildMentionsGraph: líneas 551-720
# buildCohashtagsGraph: líneas 725-877
# IMPORTANTE: Mantener lógica EXACTA incluyendo:
#   - Llamadas a sendProgress
#   - Cálculos de métricas
#   - Construcción de network_stats
```

### Paso 4: Extraer Statistics
```bash
# calculateStats: líneas 1931-2168
# detectActivityPeaks: líneas 1686-1926
# extractWordFrequencies: líneas 2455-2538
# analyzeSharedUrls: líneas 3234-3337
```

### Paso 5: Extraer Processor
```bash
# processTweetsData: líneas 220-393
# Esta es la función ORQUESTADORA principal
# Debe importar todos los demás módulos
```

## Advertencias Importantes

### ⚠️ NO Modificar el Worker Original Todavía
El worker original debe seguir funcionando mientras se completa la migración.

### ⚠️ Mantener Lógica EXACTA
Al extraer funciones, copiar el código EXACTAMENTE como está. No optimizar ni modificar durante la extracción.

### ⚠️ Imports Correctos
Cada módulo nuevo debe importar sus dependencias:
```typescript
import type { Node, Edge } from '../types/graph.types';
import { normalize } from '../utils/math-utils';
```

### ⚠️ Funciones sendProgress
Los stubs actuales NO incluyen `sendProgress()`. Al extraer, decidir:
- Opción A: Eliminar sendProgress (hacer funciones puras)
- Opción B: Aceptar callback como parámetro
- Opción C: Usar event emitter

## Testing

Una vez completada la extracción:

1. **Prueba unitaria de cada algoritmo**
```typescript
import { calculatePageRank } from './graph-worker/algorithms/pagerank';

test('PageRank converge correctamente', () => {
  const nodes = [/* ... */];
  const edges = [/* ... */];
  const result = calculatePageRank(nodes, edges);
  expect(result).toBeDefined();
});
```

2. **Comparación con worker original**
Ejecutar mismo dataset en ambas versiones y comparar resultados.

3. **Performance benchmarks**
Verificar que la modularización no afecta performance.

## Migración Incremental

### Fase 1: COMPLETADA ✅
- Algoritmos core
- Utilidades
- Tipos
- Scores básicos

### Fase 2: EN PROGRESO 🚧
- Análisis de contenido
- Graph builders
- Estadísticas avanzadas

### Fase 3: PENDIENTE
- Processor completo
- Event listener del worker
- Testing completo

### Fase 4: PENDIENTE
- Deprecar worker original
- Actualizar imports en todo el proyecto
- Documentación de API

## Beneficios al Completar

Una vez terminada la migración:

✨ **Código más limpio**: 3,353 líneas → 24 módulos de ~50-200 líneas
📚 **Mejor documentación**: Cada función con propósito claro
🧪 **Testeable**: Tests unitarios por algoritmo
🚀 **Mantenible**: Cambios aislados, sin efectos secundarios
♻️ **Reutilizable**: Algoritmos usables en otros contextos

## Contacto

Si tienes preguntas sobre la migración, consultar:
- README.md en graph-worker/
- Código original en graph.worker.ts
- Documentación de algoritmos en cada archivo
