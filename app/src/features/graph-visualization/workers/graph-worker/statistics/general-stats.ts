/**
 * Estadísticas generales del dataset
 */

import { detectActivityPeaks } from './activity-peaks';

/**
 * Calcula estadísticas generales MEJORADAS con datos enriquecidos
 */
export function calculateStats(
    userStats: any,
    allHashtags: string[],
    tweetTimes: string[],
    tweets: any[],
    usersMetadata: any = {}
): any {
    const users = Object.entries(userStats);

    // Helper: Enriquecer usuario con metadata
    const enrichUser = (username: string, stats: any) => {
        const metadata = usersMetadata[username] || {};
        const followers = metadata.followers || 0;
        const following = metadata.following || 0;
        const isVerified = metadata.verifiedType === 'Business' || metadata.verifiedType === 'Government';
        const isBlueVerified = metadata.isBlueVerified || false;
        const accountAgeDays = metadata.createdAt ?
            (Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;

        const totalEngagement = stats.likes + stats.views + stats.replies;

        return {
            username,
            name: stats.name,
            followers,
            following,
            verified: isVerified,
            blue_verified: isBlueVerified,
            location: metadata.location || '',
            account_age_days: Math.round(accountAgeDays),
            is_automated: metadata.isAutomated || false,
            // Métricas calculadas
            engagement_per_tweet: stats.tweets > 0 ? totalEngagement / stats.tweets : 0,
            reach_ratio: followers > 0 ? (totalEngagement / followers) : 0,
            follower_following_ratio: following > 0 ? (followers / following) : followers
        };
    };

    // FASE 1: Top por actividad (CON ENRIQUECIMIENTO) - Hasta 50 para paginación
    const topActive = users
        .sort((a: any, b: any) => (b[1]?.tweets || 0) - (a[1]?.tweets || 0))
        .slice(0, 50)
        .map(([username, stats]: [string, any]) => {
            const enriched = enrichUser(username, stats);
            return {
                username,
                name: stats.name,
                tweets: stats.tweets,
                followers: enriched.followers,
                verified: enriched.verified,
                blue_verified: enriched.blue_verified,
                engagement_per_tweet: Math.round(enriched.engagement_per_tweet),
                account_age_years: Math.round(enriched.account_age_days / 365)
            };
        });

    // FASE 2: Top por engagement - Hasta 50 para paginación
    const topEngagement = users
        .sort((a: any, b: any) => ((b[1]?.likes || 0) + (b[1]?.views || 0) + (b[1]?.replies || 0)) - ((a[1]?.likes || 0) + (a[1]?.views || 0) + (a[1]?.replies || 0)))
        .slice(0, 50)
        .map(([username, stats]: [string, any]) => {
            const enriched = enrichUser(username, stats);
            const totalEng = stats.likes + stats.views + stats.replies;
            return {
                username,
                name: stats.name,
                engagement: totalEng,
                likes: stats.likes,
                views: stats.views,
                replies: stats.replies,
                retweets: stats.retweets || 0,
                followers: enriched.followers,
                verified: enriched.verified,
                blue_verified: enriched.blue_verified,
                reach_ratio: enriched.reach_ratio.toFixed(4),
                location: enriched.location
            };
        });

    const hashtagCounts: Record<string, number> = {};
    allHashtags.forEach(h => hashtagCounts[h] = (hashtagCounts[h] || 0) + 1);
    const topHashtags = Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([hashtag, count]) => ({ hashtag, count }));

    const timeDistribution: Record<string, number> = {};
    const hashtagsByTime: Record<string, string[]> = {};
    const tweetsByTime: Record<string, any[]> = {};

    tweetTimes.forEach((time, idx) => {
        try {
            const dt = new Date(time.replace('Z', '+00:00'));
            const hour = dt.toISOString().substring(0, 13) + ':00';
            timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;

            // Guardar hashtags por periodo temporal
            if (!hashtagsByTime[hour]) {
                hashtagsByTime[hour] = [];
            }
            const tweetHashtags = tweets[idx]?.tweet?.hashtags || [];
            hashtagsByTime[hour].push(...tweetHashtags);

            // Guardar tweets completos por periodo
            if (!tweetsByTime[hour]) {
                tweetsByTime[hour] = [];
            }
            const tweet = tweets[idx]?.tweet;
            if (tweet) {
                tweetsByTime[hour].push({
                    username: tweet.username,
                    name: tweet.name,
                    text: tweet.text,
                    time_parsed: tweet.time_parsed,
                    likes: tweet.likes || 0,
                    retweets: tweet.retweets || 0,
                    replies: tweet.replies || 0,
                    views: tweet.views || 0,
                    mentions: tweet.mentions || [],
                    hashtags: tweet.hashtags || [],
                    bot_score: tweet.bot_score || 0
                });
            }
        } catch (e) {}
    });

    const temporalActivity = Object.entries(timeDistribution)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([time, count]) => ({ time, count }));

    // Detectar picos de actividad con análisis avanzado
    const detectedEvents = detectActivityPeaks(temporalActivity, hashtagsByTime, tweetsByTime, tweets);

    console.log('[Worker] Eventos detectados:', detectedEvents.length);
    if (detectedEvents.length > 0) {
        console.log('[Worker] Primer evento:', detectedEvents[0]);
    }

    // FASE 3: Top Influencers - Hasta 50 para paginación
    const topInfluencers = users
        .map(([username, stats]: [string, any]) => {
            const enriched = enrichUser(username, stats);
            const totalEngagement = stats.likes + stats.views + stats.replies;

            // Influence Score = (followers * 0.3) + (engagement * 0.4) + (tweets * 0.1) + (reach_ratio * followers * 0.2)
            const influenceScore =
                (enriched.followers * 0.3) +
                (totalEngagement * 0.4) +
                (stats.tweets * 0.1) +
                (enriched.reach_ratio * enriched.followers * 0.2);

            return {
                username,
                name: stats.name,
                influence_score: Math.round(influenceScore),
                followers: enriched.followers,
                tweets: stats.tweets,
                total_engagement: totalEngagement,
                reach_ratio: enriched.reach_ratio.toFixed(4),
                verified: enriched.verified,
                blue_verified: enriched.blue_verified,
                engagement_per_tweet: Math.round(enriched.engagement_per_tweet)
            };
        })
        .sort((a, b) => b.influence_score - a.influence_score)
        .slice(0, 50);

    // FASE 4: Detectar Usuarios Sospechosos de Amplificación Artificial
    const suspiciousUsers = users
        .map(([username, stats]: [string, any]) => {
            const enriched = enrichUser(username, stats);
            const totalEngagement = stats.likes + stats.views + stats.replies;

            // Criterios de sospecha:
            const suspicionSignals: string[] = [];
            let suspicionScore = 0;

            // 1. Alto engagement con pocos followers (ratio > 10)
            if (enriched.reach_ratio > 10 && enriched.followers < 1000) {
                suspicionSignals.push('high_reach_low_followers');
                suspicionScore += 30;
            }

            // 2. Muchos tweets en poco tiempo (> 50 tweets)
            if (stats.tweets > 50) {
                suspicionSignals.push('excessive_posting');
                suspicionScore += 20;
            }

            // 3. Ratio followers/following muy bajo (< 0.1) o muy alto (> 20)
            if (enriched.follower_following_ratio < 0.1 || enriched.follower_following_ratio > 20) {
                suspicionSignals.push('unusual_follow_ratio');
                suspicionScore += 15;
            }

            // 4. Cuenta muy nueva (< 90 días) con alta actividad
            if (enriched.account_age_days < 90 && stats.tweets > 20) {
                suspicionSignals.push('new_account_high_activity');
                suspicionScore += 25;
            }

            // 5. Usuario marcado como automatizado
            if (enriched.is_automated) {
                suspicionSignals.push('automated_account');
                suspicionScore += 40;
            }

            return {
                username,
                name: stats.name,
                suspicion_score: suspicionScore,
                signals: suspicionSignals,
                followers: enriched.followers,
                following: enriched.following,
                tweets: stats.tweets,
                total_engagement: totalEngagement,
                reach_ratio: enriched.reach_ratio.toFixed(4),
                account_age_days: enriched.account_age_days,
                is_automated: enriched.is_automated,
                verified: enriched.verified
            };
        })
        .filter(user => user.suspicion_score >= 30) // Solo usuarios con score >= 30
        .sort((a, b) => b.suspicion_score - a.suspicion_score)
        .slice(0, 15);

    console.log('[Worker] Top influencers calculados:', topInfluencers.length);
    console.log('[Worker] Usuarios sospechosos detectados:', suspiciousUsers.length);

    return {
        top_active_users: topActive,
        top_engagement_users: topEngagement,
        top_influencers: topInfluencers,
        suspicious_users: suspiciousUsers,
        top_hashtags: topHashtags,
        temporal_activity: temporalActivity,
        detected_events: detectedEvents,
        total_tweets: tweetTimes.length,
        total_users: users.length,
        total_hashtags: Object.keys(hashtagCounts).length
    };
}
