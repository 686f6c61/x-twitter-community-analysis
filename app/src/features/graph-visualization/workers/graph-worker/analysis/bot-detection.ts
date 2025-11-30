/**
 * Detección de bots
 */

import type { Node } from '../types/graph.types';

/**
 * Calcula regularidad temporal usando CV de intervalos
 * CV bajo = muy regular = más bot-like
 */
const calculateTemporalRegularity = (tweets: any[]): number => {
    if (tweets.length < 3) return 0; // Pocos datos

    // Extraer timestamps
    const times = tweets
        .map(t => {
            try {
                if (!t.time) return null;
                const timeStr = typeof t.time === 'string' ? t.time.replace('Z', '+00:00') : t.time;
                return new Date(timeStr).getTime();
            } catch (e) {
                return null;
            }
        })
        .filter(t => t !== null && !isNaN(t))
        .sort((a, b) => a - b);

    if (times.length < 3) return 0;

    // Calcular intervalos entre tweets consecutivos
    const intervals = [];
    for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
    }

    // Calcular media y desviación estándar
    const mean = intervals.reduce((sum, x) => sum + x, 0) / intervals.length;
    const variance = intervals.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Coeficiente de variación (CV = stdDev / mean)
    // CV bajo = intervalos muy regulares = bot
    const cv = mean > 0 ? stdDev / mean : 1;

    // Invertir: CV bajo -> score alto
    // Normalizar CV (típicamente 0-2) a score 0-1
    return Math.max(0, 1 - Math.min(1, cv / 2));
};

/**
 * Calcula similitud de contenido usando Jaccard
 * Alta similitud = contenido repetitivo = bot
 */
const calculateContentSimilarity = (tweets: any[]): number => {
    if (tweets.length < 3) return 0;

    // Tokenizar textos (palabras únicas)
    const tokenSets = tweets.map(t => {
        const text = (t.text || '').toLowerCase();
        const words = text.match(/\b\w+\b/g) || [];
        return new Set(words.filter(w => w.length > 3)); // Ignorar palabras cortas
    });

    // Calcular similitud promedio entre todos los pares
    let totalSimilarity = 0;
    let pairs = 0;

    for (let i = 0; i < tokenSets.length; i++) {
        for (let j = i + 1; j < tokenSets.length; j++) {
            const set1 = tokenSets[i];
            const set2 = tokenSets[j];

            // Jaccard similarity
            const intersection = new Set([...set1].filter(x => set2.has(x)));
            const union = new Set([...set1, ...set2]);

            if (union.size > 0) {
                totalSimilarity += intersection.size / union.size;
                pairs++;
            }
        }
    }

    // Promedio de similitud (0-1)
    return pairs > 0 ? totalSimilarity / pairs : 0;
};

/**
 * Calcula patrones de interacción usando entropía
 * Baja entropía = poca diversidad = bot
 */
const calculateInteractionPatterns = (node: any): number => {
    // Usar top_connections si existen
    const connections = node.top_connections || [];
    if (connections.length < 2) {
        // Usar degree como proxy
        const degree = node.degree_centrality || 0;
        return degree > 0.5 ? 0 : 0.5; // Alto degree = humano probable
    }

    // Calcular entropía de Shannon de conexiones
    const total = connections.reduce((sum: number, c: any) => sum + c.weight, 0);
    if (total === 0) return 0.5;

    let entropy = 0;
    connections.forEach((c: any) => {
        const p = c.weight / total;
        if (p > 0) {
            entropy -= p * Math.log2(p);
        }
    });

    // Normalizar entropía (max = log2(n))
    const maxEntropy = Math.log2(connections.length);
    const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

    // Invertir: baja entropía = alta puntuación bot
    return 1 - normalizedEntropy;
};

/**
 * Calcula características sospechosas de perfil
 */
const calculateProfileCharacteristics = (node: any, tweets: any[]): number => {
    let score = 0;
    let factors = 0;

    // Factor 1: Engagement rate muy bajo (spam ignorado)
    if (node.engagement_rate !== undefined) {
        if (node.engagement_rate < 0.1) {
            score += 1;
        }
        factors++;
    }

    // Factor 2: Alta velocidad de posting
    if (tweets.length > 0) {
        const times = tweets
            .map(t => {
                try {
                    if (!t.time) return null;
                    const timeStr = typeof t.time === 'string' ? t.time.replace('Z', '+00:00') : t.time;
                    return new Date(timeStr).getTime();
                } catch (e) {
                    return null;
                }
            })
            .filter(t => t !== null && !isNaN(t))
            .sort((a, b) => a - b);

        if (times.length >= 2) {
            const timeSpan = times[times.length - 1] - times[0];
            const hoursSpan = timeSpan / (1000 * 60 * 60);
            const tweetsPerHour = hoursSpan > 0 ? tweets.length / hoursSpan : 0;

            // Más de 5 tweets/hora es sospechoso
            if (tweetsPerHour > 5) {
                score += 1;
            }
            factors++;
        }
    }

    // Factor 3: Proporción nombre/username (nombres genéricos)
    if (node.label && node.id) {
        const nameLength = node.label.length;
        const usernameLength = node.id.length;
        // Nombres muy cortos o iguales al username
        if (nameLength < 3 || node.label === node.id) {
            score += 0.5;
        }
        factors++;
    }

    return factors > 0 ? score / factors : 0;
};

/**
 * Calcula el Bot Score para cada nodo
 *
 * Sistema multi-señal que combina 4 indicadores:
 * 1. REGULARIDAD TEMPORAL (40%): Patrones automáticos de posting
 * 2. SIMILITUD DE CONTENIDO (25%): Contenido repetitivo/template
 * 3. PATRONES DE INTERACCIÓN (20%): Diversidad de conexiones
 * 4. CARACTERÍSTICAS DE PERFIL (15%): Engagement, velocidad, metadata
 *
 * @param nodes - Array de nodos
 * @param userTweets - Mapa de tweets por usuario
 * @returns Nodos con bot_score calculado
 */
export function calculateBotScores(nodes: Node[], userTweets: any): Node[] {
    console.log('[Worker] calculateBotScores llamado con', nodes.length, 'nodos');
    if (nodes.length === 0) return nodes;

    // Función helper para normalizar a 0-1
    const normalize = (value: number, min: number, max: number): number => {
        if (max === min) return 0;
        return Math.min(1, Math.max(0, (value - min) / (max - min)));
    };

    // Arrays para almacenar señales
    const temporalScores: number[] = [];
    const contentScores: number[] = [];
    const interactionScores: number[] = [];
    const profileScores: number[] = [];

    // Calcular señales para cada nodo
    nodes.forEach((node, i) => {
        const tweets = userTweets[node.id] || [];

        // SEÑAL 1: Regularidad Temporal (40%)
        // Usa coeficiente de variación de intervalos entre tweets
        const temporalScore = calculateTemporalRegularity(tweets);
        temporalScores.push(temporalScore);

        // SEÑAL 2: Similitud de Contenido (25%)
        // Detecta contenido repetitivo usando Jaccard
        const contentScore = calculateContentSimilarity(tweets);
        contentScores.push(contentScore);

        // SEÑAL 3: Patrones de Interacción (20%)
        // Usa entropía de Shannon para diversidad de conexiones
        const interactionScore = calculateInteractionPatterns(node);
        interactionScores.push(interactionScore);

        // SEÑAL 4: Características de Perfil (15%)
        // Ratio engagement/tweets, velocidad de posting
        const profileScore = calculateProfileCharacteristics(node, tweets);
        profileScores.push(profileScore);
    });

    // Normalizar todas las señales
    const maxTemporal = Math.max(...temporalScores);
    const minTemporal = Math.min(...temporalScores);
    const maxContent = Math.max(...contentScores);
    const minContent = Math.min(...contentScores);
    const maxInteraction = Math.max(...interactionScores);
    const minInteraction = Math.min(...interactionScores);
    const maxProfile = Math.max(...profileScores);
    const minProfile = Math.min(...profileScores);

    // Asignar scores a cada nodo
    nodes.forEach((node, i) => {
        const normTemporal = normalize(temporalScores[i], minTemporal, maxTemporal);
        const normContent = normalize(contentScores[i], minContent, maxContent);
        const normInteraction = normalize(interactionScores[i], minInteraction, maxInteraction);
        const normProfile = normalize(profileScores[i], minProfile, maxProfile);

        // Score compuesto (0-100)
        const botScore = (
            normTemporal * 0.40 +
            normContent * 0.25 +
            normInteraction * 0.20 +
            normProfile * 0.15
        ) * 100;

        node.bot_score = botScore;

        // Guardar señales individuales (para desglose)
        (node as any).bot_signals = {
            temporal: normTemporal * 100,
            content: normContent * 100,
            interaction: normInteraction * 100,
            profile: normProfile * 100
        };

        // Categorizar
        if (botScore >= 80) {
            (node as any).bot_category = 'confirmed';
        } else if (botScore >= 60) {
            (node as any).bot_category = 'probable';
        } else if (botScore >= 30) {
            (node as any).bot_category = 'suspicious';
        } else {
            (node as any).bot_category = 'human';
        }
    });

    console.log('[Worker] Bot scores calculados para', nodes.length, 'nodos');
    return nodes;
}
