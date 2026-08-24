import { test, expect } from '@playwright/test';

// SUPER_ADMIN. Smoke: every admin page renders a stable landmark.

const pages: Array<{ name: string; path: string; check: (page: import('@playwright/test').Page) => Promise<unknown> }> = [
  { name: 'dashboard', path: '/admin/dashboard', check: (p) => expect(p.getByText('Total Services')).toBeVisible() },
  { name: 'services', path: '/admin/services', check: (p) => expect(p.getByRole('heading', { level: 1, name: 'Service directory' })).toBeVisible() },
  { name: 'organisations', path: '/admin/organisations', check: (p) => expect(p.getByRole('button', { name: 'Add organisation' })).toBeVisible() },
  { name: 'users', path: '/admin/users', check: (p) => expect(p.getByRole('button', { name: 'Add user' })).toBeVisible() },
  { name: 'taxonomy', path: '/admin/taxonomy', check: (p) => expect(p.getByRole('heading', { level: 1, name: 'Nomenclature' })).toBeVisible() },
  { name: 'needs', path: '/admin/needs', check: (p) => expect(p.getByRole('heading', { level: 1, name: 'Need reports' })).toBeVisible() },
  { name: 'needs map', path: '/admin/needs/map', check: (p) => expect(p.getByRole('heading', { name: 'Needs map' })).toBeVisible() },
  { name: 'analytics', path: '/admin/analytics', check: (p) => expect(p.getByRole('heading', { level: 1, name: 'Analytics' })).toBeVisible() },
];

for (const { name, path, check } of pages) {
  test(`admin ${name} loads`, async ({ page }) => {
    await page.goto(path);
    await check(page);
  });
}
