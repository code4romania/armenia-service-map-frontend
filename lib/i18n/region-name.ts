import { useTranslations } from 'next-intl';

// Region names come from the API in English only; localise them via the `regions` namespace,
// keyed by the camelCased svgPathId suffix (`region-vayots-dzor` -> `vayotsDzor`).
function regionKey(svgPathId: string) {
  return svgPathId.replace(/^region-/, '').replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

/** Returns a resolver that maps an API region to its localised name, falling back to the API name. */
export function useRegionName() {
  const t = useTranslations('regions');
  return (region: { name: string; svgPathId?: string }) => {
    if (!region.svgPathId) return region.name;
    const key = regionKey(region.svgPathId);
    return t.has(key) ? t(key) : region.name;
  };
}
