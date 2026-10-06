import { describe, expect, it } from 'vitest';
import hy from '@/messages/hy.json';
import { regionKey } from '@/lib/i18n/region-name';

describe('regionKey', () => {
  it('derives the key from svgPathId when present', () => {
    expect(regionKey({ name: 'Vayots Dzor', svgPathId: 'region-vayots-dzor' })).toBe('vayotsDzor');
  });

  it('falls back to the camelCased name when svgPathId is missing', () => {
    expect(regionKey({ name: 'Vayots Dzor' })).toBe('vayotsDzor');
    expect(regionKey({ name: 'Syunik' })).toBe('syunik');
  });

  it('maps every API region name to an Armenian translation', () => {
    const apiNames = ['Aragatsotn', 'Ararat', 'Armavir', 'Gegharkunik', 'Kotayk', 'Lori', 'Shirak', 'Syunik', 'Tavush', 'Vayots Dzor', 'Yerevan'];
    for (const name of apiNames) {
      expect(hy.regions).toHaveProperty(regionKey({ name }));
    }
  });
});
