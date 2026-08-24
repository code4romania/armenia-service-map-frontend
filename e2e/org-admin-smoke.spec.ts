import { test, expect } from '@playwright/test';

// ORG_ADMIN. Smoke: every org page renders a stable landmark.

const pages: Array<{ name: string; path: string; check: (page: import('@playwright/test').Page) => Promise<unknown> }> = [
  { name: 'dashboard', path: '/org/dashboard', check: (p) => expect(p.getByText('Total services')).toBeVisible() },
  { name: 'services', path: '/org/services', check: (p) => expect(p.getByRole('heading', { level: 1, name: 'Service listings' })).toBeVisible() },
  { name: 'needs', path: '/org/needs', check: (p) => expect(p.getByRole('heading', { level: 1, name: 'Assigned needs' })).toBeVisible() },
  { name: 'needs map', path: '/org/needs/map', check: (p) => expect(p.getByRole('heading', { name: 'Needs map' })).toBeVisible() },
  { name: 'profile', path: '/org/profile', check: (p) => expect(p.getByRole('heading', { level: 1, name: 'Organisation profile' })).toBeVisible() },
];

for (const { name, path, check } of pages) {
  test(`org ${name} loads`, async ({ page }) => {
    await page.goto(path);
    await check(page);
  });
}
