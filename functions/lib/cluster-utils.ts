/**
 * Groups numbers that fall within `tolerance` of each other into clusters,
 * then returns one representative (rounded mean) per cluster, ranked by
 * cluster size (how many raw occurrences it represents) and capped at
 * `limit`. Used to turn "17px, 18px, 19px, 21px" raw noise into a real scale.
 */
export function clusterNumbers(values: number[], tolerance: number, limit: number): number[] {
  if (values.length === 0) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const clusters: number[][] = [];

  for (const v of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && v - last[last.length - 1] <= tolerance) {
      last.push(v);
    } else {
      clusters.push([v]);
    }
  }

  return clusters
    .map((c) => ({ value: Math.round(c.reduce((sum, x) => sum + x, 0) / c.length), count: c.length }))
    .sort((a, b) => b.count - a.count || a.value - b.value)
    .slice(0, limit)
    .map((c) => c.value)
    .sort((a, b) => a - b);
}
