import { useTranslations } from 'next-intl';

// Target group names come from the API in English only and carry no slug; localise them via the
// `targetGroups` namespace, keyed by the camelCased English name (`Older Persons` -> `olderPersons`).
function targetGroupKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+([a-z0-9])/g, (_, char: string) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

/** Returns a resolver that maps an API target group to its localised name, falling back to the API name. */
export function useTargetGroupName() {
  const t = useTranslations('targetGroups');
  return (targetGroup: { name: string }) => {
    const key = targetGroupKey(targetGroup.name);
    return key && t.has(key) ? t(key) : targetGroup.name;
  };
}
