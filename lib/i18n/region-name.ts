import { useTranslations } from 'next-intl';

// Region names come from the API in English only; localise them via the `regions` namespace,
// keyed by the camelCased svgPathId suffix (`region-vayots-dzor` -> `vayotsDzor`). Some endpoints
// (e.g. a service's or need's nested region) omit svgPathId, so fall back to the camelCased name
// (`Vayots Dzor` -> `vayotsDzor`).
export function regionKey(region: { name: string; svgPathId?: string | null }) {
  if (region.svgPathId) {
    return region.svgPathId.replace(/^region-/, '').replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
  }
  return region.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+([a-z0-9])/g, (_, char: string) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

/** Returns a resolver that maps an API region to its localised name, falling back to the API name. */
export function useRegionName() {
  const t = useTranslations('regions');
  return (region: { name: string; svgPathId?: string | null }) => {
    const key = regionKey(region);
    return key && t.has(key) ? t(key) : region.name;
  };
}
