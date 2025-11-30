/**
 * Utilidades para manejo de fechas y timestamps
 */

/**
 * Extrae timestamps válidos de un array de tweets
 */
export function extractTimestamps(tweets: any[]): number[] {
  return tweets.map(t => {
    try {
      const timeStr = typeof t.time === 'string' ? t.time.replace('Z', '+00:00') : t.time;
      return new Date(timeStr).getTime();
    } catch (e) {
      return null;
    }
  }).filter((t): t is number => t !== null && !isNaN(t));
}

/**
 * Parsea una fecha de Twitter y retorna timestamp
 */
export function parseTwitterDate(dateStr: string): number | null {
  try {
    const normalized = typeof dateStr === 'string' ? dateStr.replace('Z', '+00:00') : dateStr;
    const timestamp = new Date(normalized).getTime();
    return isNaN(timestamp) ? null : timestamp;
  } catch {
    return null;
  }
}

/**
 * Agrupa timestamps por hora del día
 */
export function groupByHour(timestamps: number[]): Record<number, number> {
  const hourCounts: Record<number, number> = {};

  for (let i = 0; i < 24; i++) {
    hourCounts[i] = 0;
  }

  timestamps.forEach(ts => {
    const date = new Date(ts);
    const hour = date.getHours();
    hourCounts[hour]++;
  });

  return hourCounts;
}

/**
 * Agrupa timestamps por día de la semana
 */
export function groupByDayOfWeek(timestamps: number[]): Record<number, number> {
  const dayCounts: Record<number, number> = {};

  for (let i = 0; i < 7; i++) {
    dayCounts[i] = 0;
  }

  timestamps.forEach(ts => {
    const date = new Date(ts);
    const day = date.getDay();
    dayCounts[day]++;
  });

  return dayCounts;
}
