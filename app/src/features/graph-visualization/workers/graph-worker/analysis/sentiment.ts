/**
 * Análisis de sentimiento
 */

/**
 * DICCIONARIOS DE ANÁLISIS DE SENTIMIENTO
 * Cargados desde JSON externo para facilitar mantenimiento y expansión
 */
import sentimentDictionary from '../../../../../data/sentiment-dictionary.json';

// Construir diccionario de sentimientos a partir del JSON
export const SENTIMENT_DICT: Record<string, number> = {};
Object.entries(sentimentDictionary.sentiment).forEach(([category, data]: [string, any]) => {
    data.words.forEach((word: string) => {
        SENTIMENT_DICT[word] = data.score;
    });
});

// Construir diccionario de emociones
export const EMOTION_DICT: Record<string, string> = {};
Object.entries(sentimentDictionary.emotions).forEach(([emotion, words]: [string, any]) => {
    words.forEach((word: string) => {
        EMOTION_DICT[word] = emotion;
    });
});

// Lista de palabras tóxicas
export const TOXIC_KEYWORDS: string[] = sentimentDictionary.toxicity;

/**
 * Analiza sentimiento y toxicidad de un texto
 */
export function analyzeSentiment(text: string): any {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    let sentimentScore = 0;
    let isToxic = false;
    const emotions: Record<string, number> = { ira: 0, miedo: 0, felicidad: 0, tristeza: 0, neutral: 0 };

    // Analizar sentimiento por palabras
    words.forEach(word => {
        // Sentimiento (score numérico)
        if (SENTIMENT_DICT[word] !== undefined) {
            sentimentScore += SENTIMENT_DICT[word];
        }

        // Emoción (categoría)
        if (EMOTION_DICT[word]) {
            emotions[EMOTION_DICT[word]]++;
        }
    });

    // Detectar toxicidad
    isToxic = TOXIC_KEYWORDS.some(kw => lowerText.includes(kw));

    // Clasificar emoción dominante
    const emotionEntries = Object.entries(emotions);
    const dominantEmotion = emotionEntries.length > 0
        ? emotionEntries.sort((a, b) => b[1] - a[1])[0][0]
        : 'neutral';

    return {
        score: sentimentScore,
        isToxic,
        emotions,
        dominantEmotion
    };
}

/**
 * Analiza sentimiento de una comunidad completa
 */
export function analyzeCommunityAdvanced(community: any, allTweets: any[], allNodes: any[], allEdges: any[]): any {
    // Filtrar tweets de la comunidad
    const communityTweets = allTweets.filter(item =>
        community.nodes.includes(item.tweet.username)
    );

    if (communityTweets.length === 0) {
        return null;
    }

    // 1. ANÁLISIS DE SENTIMIENTO
    let totalSentiment = 0;
    let toxicCount = 0;
    const emotions: Record<string, number> = { ira: 0, miedo: 0, felicidad: 0, neutral: 0 };

    communityTweets.forEach(item => {
        const analysis = analyzeSentiment(item.tweet.text || '');
        totalSentiment += analysis.score;
        if (analysis.isToxic) toxicCount++;
        emotions[analysis.dominantEmotion]++;
    });

    const avgSentiment = totalSentiment / communityTweets.length;
    const toxicityRate = toxicCount / communityTweets.length;
    const emotionScores: Record<string, number> = {};
    Object.entries(emotions).forEach(([emotion, count]) => {
        emotionScores[emotion] = count / communityTweets.length;
    });
    const dominantEmotion = Object.entries(emotions)
        .sort((a, b) => b[1] - a[1])[0][0];

    // Clasificar comunidad por sentimiento
    let sentimentClass;
    if (avgSentiment < -1) {
        sentimentClass = { type: 'REACTIVA_NEGATIVA', icon: '😡', color: '#ef4444' };
    } else if (avgSentiment > 1) {
        sentimentClass = { type: 'POSITIVA', icon: '😊', color: '#22c55e' };
    } else if (toxicityRate > 0.3) {
        sentimentClass = { type: 'TOXICA', icon: '🔥', color: '#dc2626' };
    } else {
        sentimentClass = { type: 'NEUTRAL_ANALITICA', icon: '🤔', color: '#6b7280' };
    }

    // 2. VOCABULARIO ÚNICO (para Echo Chambers)
    const wordFreq = new Map<string, number>();
    communityTweets.forEach(item => {
        const words = (item.tweet.text || '')
            .toLowerCase()
            .replace(/[^a-záéíóúñü\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3);

        words.forEach(word => {
            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });
    });

    // 3. COORDINACIÓN TEMPORAL
    const timestamps = communityTweets
        .map(item => new Date(item.tweet.time_parsed).getTime())
        .filter(ts => !isNaN(ts));

    let temporalEntropy = 1; // Default: distribución uniforme
    if (timestamps.length > 1) {
        // Dividir en buckets de 1 hora
        const buckets = new Map<number, number>();
        timestamps.forEach(ts => {
            const hour = Math.floor(ts / (1000 * 60 * 60));
            buckets.set(hour, (buckets.get(hour) || 0) + 1);
        });

        // Calcular entropía
        const total = timestamps.length;
        let entropy = 0;
        buckets.forEach(count => {
            const p = count / total;
            entropy -= p * Math.log2(p);
        });

        const maxEntropy = Math.log2(Math.max(buckets.size, 1));
        temporalEntropy = maxEntropy > 0 ? entropy / maxEntropy : 1;
    }

    // 4. SIMILITUD DE CONTENIDO (detección de duplicados)
    let duplicateCount = 0;
    const textsNormalized = communityTweets.map(item =>
        (item.tweet.text || '').toLowerCase().replace(/\s+/g, ' ').trim()
    );

    for (let i = 0; i < textsNormalized.length && i < 50; i++) { // Limitar para performance
        for (let j = i + 1; j < textsNormalized.length && j < 50; j++) {
            const similarity = calculateTextSimilarity(textsNormalized[i], textsNormalized[j]);
            if (similarity > 0.8) {
                duplicateCount++;
            }
        }
    }
    const duplicateRate = textsNormalized.length > 1
        ? duplicateCount / Math.min(50, textsNormalized.length)
        : 0;

    // 5. CONCENTRACIÓN DE BOTS
    const botUsers = community.nodes.filter((nodeId: string) => {
        const node = allNodes.find(n => n.id === nodeId);
        return node && node.bot_score > 60;
    }).length;
    const botRate = botUsers / community.nodes.length;

    // 6. SCORE DE COORDINACIÓN
    const coordScore = (
        (1 - temporalEntropy) * 0.3 +
        duplicateRate * 0.4 +
        botRate * 0.2 +
        0.1 // Reservado para futura métrica de hashtags
    );

    let coordClass;
    if (coordScore > 0.7) {
        coordClass = { type: 'ALTAMENTE_COORDINADA', level: 'Crítico', color: '#dc2626' };
    } else if (coordScore > 0.5) {
        coordClass = { type: 'POSIBLEMENTE_COORDINADA', level: 'Alto', color: '#f59e0b' };
    } else if (coordScore > 0.3) {
        coordClass = { type: 'SOSPECHOSA', level: 'Medio', color: '#3b82f6' };
    } else {
        coordClass = { type: 'ORGANICA', level: 'Bajo', color: '#22c55e' };
    }

    return {
        sentiment: {
            avgScore: avgSentiment,
            toxicityRate,
            emotionScores,
            dominantEmotion,
            classification: sentimentClass
        },
        vocabulary: {
            uniqueWords: Array.from(wordFreq.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([word, freq]) => ({ word, freq })),
            totalWords: wordFreq.size
        },
        coordination: {
            score: coordScore,
            temporalSync: 1 - temporalEntropy,
            contentDuplication: duplicateRate,
            botConcentration: botRate,
            classification: coordClass
        }
    };
}

/**
 * Calcula similaridad de texto (Jaccard de n-gramas)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
    const createNGrams = (text: string, n = 3): Set<string> => {
        const grams = new Set<string>();
        for (let i = 0; i <= text.length - n; i++) {
            grams.add(text.substring(i, i + n));
        }
        return grams;
    };

    const grams1 = createNGrams(text1);
    const grams2 = createNGrams(text2);

    const intersection = new Set([...grams1].filter(g => grams2.has(g)));
    const union = new Set([...grams1, ...grams2]);

    return union.size > 0 ? intersection.size / union.size : 0;
}
