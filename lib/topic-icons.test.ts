import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import hy from '@/messages/hy.json';
import { TOPIC_ICONS, TOPIC_ICON_KEYS, topicIcon } from '@/lib/topic-icons';

describe('topicIcon', () => {
  it('returns the picked icon', () => {
    expect(topicIcon('grants', 0)).toBe(TOPIC_ICONS.grants);
  });

  it('falls back by position for missing or unknown icons', () => {
    expect(topicIcon(null, 0)).toBe(TOPIC_ICONS.legal);
    expect(topicIcon('', 1)).toBe(TOPIC_ICONS.health);
    expect(topicIcon('toString', 8)).toBe(TOPIC_ICONS.legal);
  });

  it('has an admin label for every icon in both locales', () => {
    for (const key of TOPIC_ICON_KEYS) {
      expect(en.admin.taxonomy.icons).toHaveProperty(key);
      expect(hy.admin.taxonomy.icons).toHaveProperty(key);
    }
  });
});
