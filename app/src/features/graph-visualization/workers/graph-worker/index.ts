/**
 * Web Worker para procesamiento de grafos en background
 * Arquitectura modular - Punto de entrada principal
 *
 * Este worker ejecuta el procesamiento pesado de grafos en un hilo separado,
 * evitando que la interfaz se congele durante el análisis de datasets grandes.
 *
 * Operaciones que realiza:
 * - Procesamiento de JSON de tweets
 * - Construcción de grafos de menciones y co-hashtags
 * - Cálculo de estadísticas y métricas de red
 * - Detección de bots y análisis de sentimiento
 *
 * Versión: 0.9.0 (Arquitectura Modular)
 * Autor: 686f6c61
 * Licencia: MIT
 */

import { processTweetsData } from './processor';

// Mensajes del worker
const sendProgress = (message: string, progress: number) => {
    self.postMessage({
        type: 'progress',
        message: message,
        progress: progress
    });
};

const sendError = (error: Error | string) => {
    self.postMessage({
        type: 'error',
        error: typeof error === 'string' ? error : error.message
    });
};

const sendResult = (data: any) => {
    self.postMessage({
        type: 'complete',
        data: data
    });
};

// Listener principal del worker
self.addEventListener('message', (event) => {
    try {
        console.log('[Worker] Mensaje recibido:', event.data);

        // El mensaje puede venir en dos formatos:
        // 1. {type: 'process', data: {...}} - formato del hook useGraphData
        // 2. {...} - formato directo
        const messageData = event.data?.type === 'process' ? event.data.data : event.data;

        // Validar que hay datos de entrada
        if (!messageData || !messageData.tweets) {
            console.error('[Worker] Datos recibidos:', messageData);
            throw new Error('No se proporcionaron datos de tweets válidos');
        }

        console.log(`[Worker] Procesando ${messageData.tweets.length} tweets`);

        // Procesar datos usando el nuevo procesador modular
        const result = processTweetsData(messageData, sendProgress);

        // Enviar resultado
        sendResult(result);

    } catch (error) {
        console.error('[Worker] Error:', error);
        sendError(error as Error);
    }
});

// Re-exportar tipos
export * from './types/graph.types';
export * from './types/metrics.types';

// Re-exportar utilidades
export * from './utils/math-utils';
export * from './utils/graph-utils';
export * from './utils/time-utils';

// Re-exportar algoritmos
export * from './algorithms/centrality';
export * from './algorithms/pagerank';
export * from './algorithms/core-decomposition';
export * from './algorithms/community-detection';
export * from './algorithms/network-motifs';

// Re-exportar análisis
export * from './analysis/bot-detection';
export * from './analysis/sentiment';
export * from './analysis/text-processing';
export * from './analysis/url-analysis';

// Re-exportar estadísticas
export * from './statistics/general-stats';
export * from './statistics/activity-peaks';
export * from './statistics/influencer-scores';
export * from './statistics/user-stats';
export * from './statistics/community-stats';

// Re-exportar constructores de grafos
export * from './graph-builders/mentions-graph';
export * from './graph-builders/cohashtags-graph';

// Re-exportar procesador principal
export * from './processor';
