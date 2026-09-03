/**
 * Renders an organisation's regions for display. Collapses to `allLabel` when every
 * known region is selected (organisations store an explicit region list, no "all" sentinel).
 */
export function formatRegionNames(
  regions: { name: string }[],
  { totalRegions, allLabel }: { totalRegions: number | undefined; allLabel: string },
) {
  if (regions.length === 0) return '—';
  if (totalRegions !== undefined && totalRegions > 0 && regions.length >= totalRegions) return allLabel;
  return regions.map((region) => region.name).join(', ');
}
