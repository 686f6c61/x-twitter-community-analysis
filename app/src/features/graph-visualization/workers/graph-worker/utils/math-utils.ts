/**
 * Utilidades matemáticas para cálculos estadísticos
 */

/**
 * Normaliza un valor en el rango [0, 1]
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

/**
 * Calcula la media de un array
 */
export function mean(array: number[]): number {
  if (array.length === 0) return 0;
  return array.reduce((sum, val) => sum + val, 0) / array.length;
}

/**
 * Calcula la desviación estándar
 */
export function stddev(array: number[]): number {
  const avg = mean(array);
  const squareDiffs = array.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calcula la mediana de un array
 */
export function median(array: number[]): number {
  if (array.length === 0) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calcula el valor máximo de un array
 */
export function max(array: number[]): number {
  if (array.length === 0) return 0;
  return Math.max(...array);
}

/**
 * Calcula el valor mínimo de un array
 */
export function min(array: number[]): number {
  if (array.length === 0) return 0;
  return Math.min(...array);
}
