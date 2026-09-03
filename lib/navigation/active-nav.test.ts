import { describe, expect, it } from 'vitest';
import { getActiveNavHref, getBestActiveHref } from '@/lib/navigation/active-nav';

describe('getBestActiveHref', () => {
  it('prefers the most specific matching route', () => {
    const hrefs = ['/admin/needs', '/admin/needs/map'];

    expect(getBestActiveHref('/admin/needs/map', hrefs)).toBe('/admin/needs/map');
  });

  it('matches exact parent route when nested route is not active', () => {
    const hrefs = ['/admin/needs', '/admin/needs/map'];

    expect(getBestActiveHref('/admin/needs', hrefs)).toBe('/admin/needs');
  });

  it('returns null when no route matches', () => {
    const hrefs = ['/admin/needs', '/admin/needs/map'];

    expect(getBestActiveHref('/admin/services', hrefs)).toBeNull();
  });
});

describe('getActiveNavHref', () => {
  it('resolves an alias path back to the nav item that owns it', () => {
    const items = [
      { href: '/admin/organisations', matchPaths: ['/admin/users'] },
      { href: '/admin/taxonomy' },
    ];

    expect(getActiveNavHref('/admin/users/new', items)).toBe('/admin/organisations');
    expect(getActiveNavHref('/admin/organisations/abc', items)).toBe('/admin/organisations');
    expect(getActiveNavHref('/admin/taxonomy', items)).toBe('/admin/taxonomy');
    expect(getActiveNavHref('/admin/services', items)).toBeNull();
  });
});
