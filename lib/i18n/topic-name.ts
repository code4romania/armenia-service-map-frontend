import { useTranslations } from 'next-intl';

// Topic names come from the API in English only; localise them via the `topics` namespace,
// keyed by the camelCased slug (`shelter-housing` -> `shelterHousing`).
function topicKey(slug: string) {
  return slug.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

/** Returns a resolver that maps an API topic to its localised name, falling back to the API name. */
export function useTopicName() {
  const t = useTranslations('topics');
  return (topic: { name: string; slug?: string }) => {
    if (!topic.slug) return topic.name;
    const key = topicKey(topic.slug);
    return t.has(key) ? t(key) : topic.name;
  };
}
