import { test, expect } from '@playwright/test';
import { CREDENTIALS } from './helpers';

// Public project (signed out, English locale): login flows + route guards.

test.describe('Authentication', () => {
  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill('nobody@example.com');
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('super admin lands on the admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(CREDENTIALS.admin.email);
    await page.getByLabel('Password', { exact: true }).fill(CREDENTIALS.admin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('org user lands on the org dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(CREDENTIALS.org.email);
    await page.getByLabel('Password', { exact: true }).fill(CREDENTIALS.org.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/org\/dashboard/);
  });
});

test.describe('Route guards (signed out)', () => {
  test('admin area redirects to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('org area redirects to login', async ({ page }) => {
    await page.goto('/org/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Password setup', () => {
  test('explains when the link has no token', async ({ page }) => {
    await page.goto('/setup-password');
    await expect(page.getByText('This setup link is missing its token.')).toBeVisible();
  });

  test('rejects an invalid or expired token', async ({ page }) => {
    await page.goto('/setup-password?token=not-a-real-token');
    await page.getByLabel('New password', { exact: true }).fill('correct-horse');
    await page.getByLabel('Confirm password', { exact: true }).fill('correct-horse');
    await page.getByRole('button', { name: 'Set password' }).click();
    await expect(page.getByText(/This setup link is invalid or has expired/)).toBeVisible();
    await expect(page).toHaveURL(/\/setup-password/);
  });
});
