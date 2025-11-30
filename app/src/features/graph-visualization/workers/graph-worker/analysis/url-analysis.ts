/**
 * Análisis de URLs compartidas
 */

/**
 * Analiza URLs compartidas en los tweets
 *
 * Extrae todas las URLs, cuenta frecuencias, identifica quién las comparte,
 * y asocia hashtags relacionados.
 *
 * @param {Array} tweets - Array de tweets
 * @returns {Object} - Análisis detallado de URLs
 */
export function analyzeSharedUrls(tweets: any[]): any {
    console.log('[Worker] analyzeSharedUrls iniciado con', tweets.length, 'tweets');

    const urlData: Record<string, any> = {};

    tweets.forEach(item => {
        const tweet = item.tweet;
        const text = tweet.text || '';
        const username = tweet.username || 'unknown';
        const name = tweet.name || username;
        const hashtags = tweet.hashtags || [];

        // Combinar URLs de dos fuentes:
        // 1. Campo tweet.urls (URLs normalizadas y expandidas del provider)
        // 2. Regex del texto (fallback para URLs no capturadas)
        const urlsFromField = (tweet.urls || [])
            .map((urlObj: any) => {
                // El campo urls puede contener strings directos o objetos {url, expanded_url, display_url}
                if (typeof urlObj === 'string') {
                    return urlObj;
                } else if (typeof urlObj === 'object' && urlObj !== null) {
                    return urlObj.expanded_url || urlObj.url || '';
                }
                return '';
            })
            .filter((url: string) => url && typeof url === 'string' && url.trim().length > 0);
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urlsFromText = text.match(urlRegex) || [];

        // Unir ambas fuentes y eliminar duplicados
        const allUrls = [...new Set([...urlsFromField, ...urlsFromText])];

        allUrls.forEach((rawUrl: string) => {
            // Validación defensiva
            if (!rawUrl || typeof rawUrl !== 'string') return;

            // Limpiar URL (quitar puntuación final)
            const cleanUrl = rawUrl.replace(/[.,;!?)]+$/, '');

            if (!urlData[cleanUrl]) {
                urlData[cleanUrl] = {
                    url: cleanUrl,
                    count: 0,
                    users: new Set(),
                    userDetails: [],
                    hashtags: new Set(),
                    tweets: []
                };
            }

            urlData[cleanUrl].count++;
            urlData[cleanUrl].users.add(username);

            // Guardar detalles del usuario si aún no está
            if (!urlData[cleanUrl].userDetails.find((u: any) => u.username === username)) {
                urlData[cleanUrl].userDetails.push({
                    username: username,
                    name: name,
                    shareCount: 1
                });
            } else {
                const user = urlData[cleanUrl].userDetails.find((u: any) => u.username === username);
                user.shareCount++;
            }

            // Asociar hashtags
            hashtags.forEach((ht: string) => urlData[cleanUrl].hashtags.add(ht));

            // Guardar referencia al tweet
            urlData[cleanUrl].tweets.push({
                username: username,
                text: text.substring(0, 150),
                time: tweet.time_parsed
            });
        });
    });

    // Convertir a array y calcular métricas
    const urlList = Object.values(urlData).map(data => ({
        url: data.url,
        count: data.count,
        uniqueUsers: data.users.size,
        users: data.userDetails.sort((a: any, b: any) => b.shareCount - a.shareCount).slice(0, 10),
        hashtags: Array.from(data.hashtags).slice(0, 10),
        hasHashtags: data.hashtags.size > 0,
        tweets: data.tweets,
        // Métricas adicionales
        viralityScore: (data.count * data.users.size) / Math.max(1, data.hashtags.size || 1)
    }));

    // Ordenar por frecuencia
    urlList.sort((a, b) => b.count - a.count);

    console.log('[Worker] URLs analizadas:', urlList.length);
    if (urlList.length > 0) {
        console.log('[Worker] Top URL:', urlList[0].url, '- compartida', urlList[0].count, 'veces');
    }

    return {
        topUrls: urlList.slice(0, 50), // Top 50 URLs
        totalUrls: urlList.length,
        totalShares: urlList.reduce((sum, u) => sum + u.count, 0)
    };
}
