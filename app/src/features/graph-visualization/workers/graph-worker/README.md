# Graph Worker - Arquitectura Modular

Esta carpeta contiene la refactorización modular del `graph.worker.ts` original (3,353 líneas).

## Estructura

```
graph-worker/
├── algorithms/          # Algoritmos de análisis de grafos
│   ├── centrality.ts           ✅ Completo - Degree, Betweenness, Closeness, Eigenvector, Clustering
│   ├── pagerank.ts             ✅ Completo - PageRank ponderado con métricas de usuario
│   ├── core-decomposition.ts  ✅ Completo - K-core, Core Number, Assortativity
│   ├── community-detection.ts ✅ Completo - Louvain, Echo Chambers
│   └── network-motifs.ts       ✅ Completo - Triángulos, Estrellas, Cadenas, Cohesión
│
├── analysis/            # Análisis de contenido
│   ├── sentiment.ts            🚧 Stub - Análisis de sentimiento (PENDIENTE extraer)
│   ├── bot-detection.ts        🚧 Stub - Detección de bots (PENDIENTE extraer)
│   ├── text-processing.ts     🚧 Stub - Procesamiento de texto (PENDIENTE extraer)
│   └── url-analysis.ts         🚧 Stub - Análisis de URLs (PENDIENTE extraer)
│
├── graph-builders/      # Constructores de grafos
│   ├── mentions-graph.ts       🚧 Stub - Grafo de menciones (PENDIENTE extraer)
│   ├── cohashtags-graph.ts     🚧 Stub - Grafo de co-hashtags (PENDIENTE extraer)
│   └── helpers.ts              ✅ Completo - Funciones auxiliares
│
├── statistics/          # Estadísticas y métricas
│   ├── user-stats.ts           ✅ Completo - Estadísticas de usuarios enriquecidos
│   ├── activity-peaks.ts       🚧 Stub - Detección de picos (PENDIENTE extraer)
│   ├── general-stats.ts        🚧 Stub - Estadísticas generales (PENDIENTE extraer)
│   └── community-stats.ts      🚧 Completo - Estadísticas de comunidades
│
├── scores/              # Cálculos de scores
│   └── influencer-score.ts     ✅ Completo - Score de influencia multi-métrica
│
├── utils/               # Utilidades
│   ├── math-utils.ts           ✅ Completo - Funciones matemáticas
│   ├── graph-utils.ts          ✅ Completo - Construcción de grafos
│   └── time-utils.ts           ✅ Completo - Manejo de fechas
│
├── types/               # Tipos TypeScript
│   ├── graph.types.ts          ✅ Completo - Node, Edge, Graph, Community
│   └── metrics.types.ts        ✅ Completo - Métricas y estadísticas
│
├── processor.ts         🚧 Stub - Procesador principal (PENDIENTE extraer)
├── index.ts             ✅ Entry point con re-exports
└── README.md            📄 Este archivo
```

## Estado de la Migración

### ✅ Completado (55%)
- **Algoritmos core**: Centralidad, PageRank, K-core, Louvain, Network Motifs
- **Utilidades**: Math, Graph, Time
- **Tipos**: Definiciones completas de TypeScript
- **Scores**: Influencer Score
- **Estadísticas**: User Stats, Community Stats

### 🚧 Pendiente (45%)
- **Análisis**: Sentiment, Bot Detection, Text Processing, URL Analysis
- **Graph Builders**: Mentions Graph, Cohashtags Graph (funciones largas ~200 líneas c/u)
- **Statistics**: Activity Peaks, General Stats (funciones largas ~240 líneas)
- **Processor**: Función principal processTweetsData

## Uso Actual

**IMPORTANTE**: El worker original `graph.worker.ts` sigue funcionando normalmente. Esta refactorización es **opt-in** y no rompe el código existente.

Los módulos completados (✅) pueden ser importados y usados independientemente:

```typescript
import { calculatePageRank } from './graph-worker/algorithms/pagerank';
import { calculateInfluencerScores } from './graph-worker/scores/influencer-score';
import { normalize, mean } from './graph-worker/utils/math-utils';
```

Los módulos stub (🚧) delegan al worker original por ahora.

## Próximos Pasos

1. **Extraer módulos de análisis**: Bot detection (~200 líneas), Sentiment (~150 líneas)
2. **Extraer graph builders**: buildMentionsGraph (~170 líneas), buildCohashtagsGraph (~150 líneas)
3. **Extraer statistics**: detectActivityPeaks (~240 líneas), calculateStats (~250 líneas)
4. **Migrar processor.ts**: Función processTweetsData completa (~180 líneas)
5. **Testing**: Verificar que las métricas calculadas son idénticas
6. **Deprecar worker original**: Una vez que todo esté migrado y probado

## Beneficios

✨ **Mantenibilidad**: Código organizado en módulos pequeños y enfocados
🧪 **Testeable**: Cada algoritmo se puede probar independientemente
📚 **Documentación**: Cada función tiene su propósito claro
🚀 **Performance**: Misma performance, mejor organización
♻️ **Reusabilidad**: Algoritmos reutilizables en otros contextos
