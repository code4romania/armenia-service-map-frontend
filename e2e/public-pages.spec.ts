import { test, expect } from '@playwright/test';
import { API_URL } from './helpers';

// Public project: English locale, signed out. Smoke checks that every public page renders.

test.describe('Public pages – smoke', () => {
  test('home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('RefugeeSupport');
    await expect(page.getByRole('heading', { name: 'Browse support topics' })).toBeVisible();
  });

  test('about', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: /About RefugeeSupport/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
  });

  test('services list', async ({ page }) => {
    await page.goto('/services');
    await expect(page.getByRole('heading', { level: 1, name: 'Explore services' })).toBeVisible();
    await expect(page.getByPlaceholder(/Search for housing/i)).toBeVisible();
  });

  test('service detail', async ({ page, request }) => {
    const res = await request.get(`${API_URL}/public/services?perPage=1`);
    const { data } = await res.json();
    test.skip(!data?.length, 'No public services available');
    await page.goto(`/services/${data[0].id}`);
    await expect(page.getByRole('heading', { name: 'About this service' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to all services/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Service not found' })).toHaveCount(0);
  });

  test('login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in to your account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('join the network', async ({ page }) => {
    await page.goto('/join-the-network');
    await expect(page.getByRole('heading', { level: 1, name: 'Join the network' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit request' })).toBeVisible();
  });

  test('report a need', async ({ page }) => {
    await page.goto('/report-a-need');
    await expect(page.getByRole('heading', { level: 1, name: 'Report a need' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send need report' })).toBeVisible();
  });

  test('unsubscribe without a token shows an error', async ({ page }) => {
    await page.goto('/unsubscribe');
    await expect(page.getByText(/This unsubscribe link is missing its token/i)).toBeVisible();
  });
});
