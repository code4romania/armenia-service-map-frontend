import { describe, expect, it } from 'vitest';
import { formatRegionNames } from '@/lib/formatting/region-names';

const regions = [{ name: 'Yerevan' }, { name: 'Shirak' }];

describe('formatRegionNames', () => {
  it('returns the empty marker when no regions are set', () => {
    expect(formatRegionNames([], { totalRegions: 11, allLabel: 'All regions' })).toBe('—');
  });

  it('joins region names with a comma', () => {
    expect(formatRegionNames(regions, { totalRegions: 11, allLabel: 'All regions' })).toBe('Yerevan, Shirak');
  });

  it('collapses to the "all" label when every region is selected', () => {
    expect(formatRegionNames(regions, { totalRegions: 2, allLabel: 'All regions' })).toBe('All regions');
  });

  it('does not collapse when the total is unknown', () => {
    expect(formatRegionNames(regions, { totalRegions: undefined, allLabel: 'All regions' })).toBe('Yerevan, Shirak');
  });
});
