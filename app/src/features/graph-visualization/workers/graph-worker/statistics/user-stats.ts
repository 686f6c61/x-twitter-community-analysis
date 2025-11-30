/**
 * Cálculo de estadísticas de usuarios a partir de enriched_users
 */

/**
 * Calcula estadísticas de usuarios a partir de enriched_users
 * @param {Object} enrichedUsers - Objeto enriched_users del dataset
 * @param {Object} authorUsernames - Set de usernames que son autores de tweets (opcional)
 * @returns {Object|undefined} - Estadísticas de usuarios o undefined si no hay datos
 */
export const calculateUserStatistics = (enrichedUsers: any, authorUsernames?: Set<string>): any | undefined => {
    if (!enrichedUsers || Object.keys(enrichedUsers).length === 0) {
        console.log('[Worker] No hay enriched_users en el dataset');
        return undefined;
    }

    console.log('[Worker] Calculando estadísticas de usuarios...');

    // Filtrar solo usuarios que son AUTORES de tweets (no solo mencionados)
    const usersList = Object.entries(enrichedUsers)
        .filter(([username, data]: [string, any]) => {
            // Filtrar usuarios no disponibles
            if (!data || data.unavailable) return false;

            // Si tenemos la lista de autores, filtrar solo autores
            if (authorUsernames && authorUsernames.size > 0) {
                return authorUsernames.has(username);
            }

            // Si no hay lista de autores, incluir todos
            return true;
        })
        .map(([username, data]: [string, any]) => ({
            username,
            ...data
        }));

    const totalUsers = usersList.length;
    console.log(`[Worker] ${totalUsers} usuarios enriquecidos que son autores de tweets`);

    if (totalUsers === 0) return undefined;

    // 1. Agregados generales
    const avgFollowers = usersList.reduce((sum, u) => sum + (u.followers || 0), 0) / totalUsers;
    const avgFollowing = usersList.reduce((sum, u) => sum + (u.following || 0), 0) / totalUsers;

    // Calcular antigüedad de cuentas
    const now = new Date();
    const accountAges = usersList
        .filter(u => u.createdAt)
        .map(u => {
            const created = new Date(u.createdAt);
            return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // días
        });

    const avgAccountAge = accountAges.length > 0
        ? accountAges.reduce((sum, age) => sum + age, 0) / accountAges.length
        : 0;

    // Mediana de seguidores
    const followersSorted = usersList.map(u => u.followers || 0).sort((a, b) => a - b);
    const medianFollowers = followersSorted.length > 0
        ? followersSorted[Math.floor(followersSorted.length / 2)]
        : 0;

    // 2. Distribuciones
    const verified = usersList.filter(u => u.verifiedType === 'Business' || u.verifiedType === 'Government').length;
    const blueVerified = usersList.filter(u => u.isBlueVerified).length;
    const unverified = totalUsers - verified - blueVerified;

    const likelyBots = usersList.filter(u => u.isAutomated).length;

    // Bucketing por followers
    const followerBuckets: any = {
        '0-100': 0,
        '100-1K': 0,
        '1K-10K': 0,
        '10K-100K': 0,
        '100K+': 0
    };

    usersList.forEach(u => {
        const f = u.followers || 0;
        if (f < 100) followerBuckets['0-100']++;
        else if (f < 1000) followerBuckets['100-1K']++;
        else if (f < 10000) followerBuckets['1K-10K']++;
        else if (f < 100000) followerBuckets['10K-100K']++;
        else followerBuckets['100K+']++;
    });

    // Bucketing por antigüedad
    const ageBuckets: any = {
        '< 1 month': 0,
        '1-6 months': 0,
        '6-12 months': 0,
        '1-5 years': 0,
        '5+ years': 0
    };

    accountAges.forEach(age => {
        if (age < 30) ageBuckets['< 1 month']++;
        else if (age < 180) ageBuckets['1-6 months']++;
        else if (age < 365) ageBuckets['6-12 months']++;
        else if (age < 1825) ageBuckets['1-5 years']++;
        else ageBuckets['5+ years']++;
    });

    // Top locations
    const locationCounts: any = {};
    usersList.forEach(u => {
        if (u.location && u.location.trim()) {
            locationCounts[u.location] = (locationCounts[u.location] || 0) + 1;
        }
    });

    const locationDistribution = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);

    // 3. Top usuarios (hasta 50 para paginación en frontend)
    const topByFollowers = [...usersList]
        .sort((a, b) => (b.followers || 0) - (a.followers || 0))
        .slice(0, 50)
        .map(u => ({
            username: u.username,
            followers: u.followers || 0,
            following: u.following || 0,
            verified: u.verifiedType === 'Business' || u.verifiedType === 'Government',
            blue_verified: u.isBlueVerified || false,
            location: u.location || '',
            description: u.description || ''
        }));

    const topByActivity = [...usersList]
        .sort((a, b) => (b.statusesCount || 0) - (a.statusesCount || 0))
        .slice(0, 10)
        .map(u => ({
            username: u.username,
            statusesCount: u.statusesCount || 0,
            followers: u.followers || 0,
            verified: u.verifiedType === 'Business' || u.verifiedType === 'Government'
        }));

    const suspectedBots = usersList
        .filter(u => u.isAutomated)
        .sort((a, b) => (b.followers || 0) - (a.followers || 0))
        .slice(0, 10)
        .map(u => ({
            username: u.username,
            isAutomated: u.isAutomated,
            automatedBy: u.automatedBy || null,
            followers: u.followers || 0
        }));

    console.log(`[Worker] Estadísticas de usuarios calculadas:
      - Promedio seguidores: ${Math.round(avgFollowers)}
      - Verificados: ${verified}, Blue Verified: ${blueVerified}
      - Posibles bots: ${likelyBots}`);

    return {
        total_unique_users: totalUsers,
        total_enriched_users: totalUsers,
        avg_followers: Math.round(avgFollowers),
        avg_following: Math.round(avgFollowing),
        avg_account_age_days: Math.round(avgAccountAge),
        median_followers: medianFollowers,
        verified_distribution: {
            verified,
            unverified,
            blue_verified: blueVerified
        },
        bot_distribution: {
            likely_bot: likelyBots,
            human: totalUsers - likelyBots
        },
        follower_buckets: followerBuckets,
        account_age_buckets: ageBuckets,
        location_distribution: locationDistribution,
        top_users_by_followers: topByFollowers,
        top_users_by_activity: topByActivity,
        suspected_bots: suspectedBots
    };
};
