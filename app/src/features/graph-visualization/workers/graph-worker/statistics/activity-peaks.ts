/**
 * Detección de picos de actividad
 */

import stopwordsData from '../../../../../data/stopwords.json';

/**
 * Detecta picos de actividad en la timeline
 */
export function detectActivityPeaks(
    temporalActivity: any[],
    hashtagsByTime: any,
    tweetsByTime: any,
    allTweets: any[]
): any[] {
    console.log('[Worker] detectActivityPeaks llamado');
    console.log('  temporalActivity.length:', temporalActivity.length);
    console.log('  tweetsByTime keys:', Object.keys(tweetsByTime).length);

    if (temporalActivity.length === 0) {
        console.log('[Worker] temporalActivity vacío, retornando []');
        return [];
    }

    // Calcular estadísticas del volumen
    const counts = temporalActivity.map(d => d.count);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
    const stddev = Math.sqrt(variance);

    // Umbral adaptativo basado en cantidad de datos
    let thresholdMultiplier = 1.5;

    // Si hay pocos datos, ser más permisivo
    if (temporalActivity.length <= 5) {
        thresholdMultiplier = 0.5; // Más permisivo
    } else if (temporalActivity.length <= 10) {
        thresholdMultiplier = 1.0;
    }

    const threshold = mean + (thresholdMultiplier * stddev);

    console.log('[Worker] Estadísticas:', {
        mean: mean.toFixed(2),
        stddev: stddev.toFixed(2),
        threshold: threshold.toFixed(2),
        multiplier: thresholdMultiplier
    });

    // Detectar picos
    let peaks = temporalActivity.filter(d => d.count >= threshold);

    // Si no se detectaron picos, tomar los top 30% con más actividad (mínimo 1)
    if (peaks.length === 0) {
        const topN = Math.max(1, Math.ceil(temporalActivity.length * 0.3));
        const sorted = [...temporalActivity].sort((a, b) => b.count - a.count);
        peaks = sorted.slice(0, topN);
        console.log('[Worker] Sin picos por umbral, usando top', topN, 'periodos con más actividad');
    }

    console.log('[Worker] Picos detectados:', peaks.length);
    if (peaks.length > 0) {
        console.log('[Worker] Primer pico:', peaks[0]);
    }

    // Para cada pico, calcular métricas avanzadas
    const detectedEvents = peaks.map((peak, peakIndex) => {
        const hashtagsInPeriod = hashtagsByTime[peak.time] || [];
        const tweetsInPeriod = tweetsByTime[peak.time] || [];

        // 1. HASHTAGS TRENDING
        const hashtagFreq: Record<string, number> = {};
        hashtagsInPeriod.forEach((tag: string) => {
            hashtagFreq[tag] = (hashtagFreq[tag] || 0) + 1;
        });
        const topHashtags = Object.entries(hashtagFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([hashtag, count]) => ({ hashtag, count }));

        // 2. VELOCIDAD DE PROPAGACIÓN
        const velocityVsBaseline = ((peak.count - mean) / mean * 100).toFixed(1);
        const tweetsPerHour = peak.count; // Ya está agregado por hora

        // 3. DURACIÓN DEL EVENTO (horas consecutivas por encima del umbral)
        let duration = 1;
        const peakIdx = temporalActivity.findIndex(d => d.time === peak.time);

        // Contar hacia atrás
        for (let i = peakIdx - 1; i >= 0; i--) {
            if (temporalActivity[i].count >= threshold * 0.8) { // 80% del umbral
                duration++;
            } else break;
        }
        // Contar hacia adelante
        for (let i = peakIdx + 1; i < temporalActivity.length; i++) {
            if (temporalActivity[i].count >= threshold * 0.8) {
                duration++;
            } else break;
        }

        // 4. ALCANCE ESTIMADO (suma de views/likes)
        const totalViews = tweetsInPeriod.reduce((sum: number, t: any) => sum + (t.views || 0), 0);
        const totalLikes = tweetsInPeriod.reduce((sum: number, t: any) => sum + (t.likes || 0), 0);
        const totalRetweets = tweetsInPeriod.reduce((sum: number, t: any) => sum + (t.retweets || 0), 0);
        const reach = totalViews + totalLikes;

        // 5. USUARIOS MÁS ACTIVOS DEL PERIODO
        const userActivity: Record<string, any> = {};
        tweetsInPeriod.forEach((t: any) => {
            const user = t.username;
            if (!userActivity[user]) {
                userActivity[user] = { username: user, name: t.name, tweets: 0, likes: 0, retweets: 0 };
            }
            userActivity[user].tweets++;
            userActivity[user].likes += t.likes || 0;
            userActivity[user].retweets += t.retweets || 0;
        });
        const topUsers = Object.values(userActivity)
            .sort((a, b) => b.tweets - a.tweets)
            .slice(0, 5);

        // 6. TASA DE CRECIMIENTO
        const growthRate = velocityVsBaseline; // Ya calculado

        // 7. ANÁLISIS DE PROPAGACIÓN

        // Nodo iniciador (primer tweet del periodo)
        const sortedTweets = [...tweetsInPeriod].sort((a, b) =>
            new Date(a.time_parsed).getTime() - new Date(b.time_parsed).getTime()
        );
        const initiator = sortedTweets[0] ? {
            username: sortedTweets[0].username,
            name: sortedTweets[0].name,
            time: sortedTweets[0].time_parsed
        } : null;

        // Influencers clave (más retweets)
        const influencers = Object.values(userActivity)
            .sort((a, b) => b.retweets - a.retweets)
            .slice(0, 3)
            .map(u => ({ username: u.username, name: u.name, retweets: u.retweets }));

        // Tiempo hasta el pico (desde primer tweet del periodo hasta el momento actual)
        const timeToPeak = sortedTweets.length > 0 ? peak.time : null;

        // 8. DETECCIÓN DE PATRONES

        // Orgánico vs Coordinado (heurística)
        const uniqueUsers = Object.keys(userActivity).length;
        const avgTweetsPerUser = tweetsInPeriod.length / uniqueUsers;
        const isCoordinated = avgTweetsPerUser > 3 || uniqueUsers < 5; // Si pocos usuarios tuitean mucho

        // Bot score promedio de usuarios activos
        const botScores = tweetsInPeriod.map((t: any) => t.bot_score || 0).filter((s: number) => s > 0);
        const avgBotScore = botScores.length > 0
            ? (botScores.reduce((a: number, b: number) => a + b, 0) / botScores.length).toFixed(1)
            : 0;

        const eventType = isCoordinated && Number(avgBotScore) > 40 ? 'coordinado' : 'orgánico';

        // Palabras clave emergentes (no hashtags)
        const wordFreq: Record<string, number> = {};
        // Usar stopwords importadas estáticamente
        const stopwords = new Set([...stopwordsData.spanish, ...stopwordsData.english]);

        tweetsInPeriod.forEach((t: any) => {
            const words = (t.text || '').toLowerCase()
                .replace(/[^\w\sáéíóúñü]/g, ' ')
                .split(/\s+/)
                .filter((w: string) => w.length > 3 && !stopwords.has(w) && !w.startsWith('http'));

            words.forEach((w: string) => {
                wordFreq[w] = (wordFreq[w] || 0) + 1;
            });
        });

        const topWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => ({ word, count }));

        // URLs compartidas
        const urlFreq: Record<string, number> = {};
        tweetsInPeriod.forEach((t: any) => {
            const urls = (t.text || '').match(/https?:\/\/[^\s]+/g) || [];
            urls.forEach((url: string) => {
                // Limpiar URL
                const cleanUrl = url.replace(/[.,;!?)]+$/, '');
                urlFreq[cleanUrl] = (urlFreq[cleanUrl] || 0) + 1;
            });
        });

        const topUrls = Object.entries(urlFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([url, count]) => ({ url, count }));

        // Menciones destacadas
        const mentionFreq: Record<string, number> = {};
        tweetsInPeriod.forEach((t: any) => {
            const mentions = t.mentions || [];
            mentions.forEach((m: any) => {
                if (m.username) {
                    mentionFreq[m.username] = (mentionFreq[m.username] || 0) + 1;
                }
            });
        });

        const topMentions = Object.entries(mentionFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([username, count]) => ({ username, count }));

        return {
            // Básicas
            time: peak.time,
            count: peak.count,
            threshold: Math.round(threshold),
            intensity: ((peak.count - mean) / stddev).toFixed(2),

            // Estadísticas avanzadas
            velocity: `+${velocityVsBaseline}%`,
            tweetsPerHour: tweetsPerHour,
            duration: duration,
            reach: reach,
            totalViews: totalViews,
            totalLikes: totalLikes,
            totalRetweets: totalRetweets,
            growthRate: `${growthRate}%`,

            // Usuarios
            topUsers: topUsers,
            uniqueUsers: uniqueUsers,

            // Propagación
            initiator: initiator,
            influencers: influencers,
            timeToPeak: timeToPeak,

            // Patrones
            eventType: eventType,
            isCoordinated: isCoordinated,
            avgBotScore: parseFloat(avgBotScore as string),

            // Contenido
            trending_hashtags: topHashtags,
            topWords: topWords,
            topUrls: topUrls,
            topMentions: topMentions
        };
    });

    return detectedEvents;
}
