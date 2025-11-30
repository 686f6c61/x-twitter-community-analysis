/**
 * Helper functions para graph builders
 */

/**
 * Obtiene los top hashtags más frecuentes
 */
export function getTopHashtags(hashtags: string[], limit: number = 3): Array<{ hashtag: string; count: number }> {
    if (!hashtags || hashtags.length === 0) return [];

    const hashtagCounts: Record<string, number> = {};
    hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });

    return Object.entries(hashtagCounts)
        .map(([hashtag, count]) => ({ hashtag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}
