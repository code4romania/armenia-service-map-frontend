import { test as setup, expect, type Page, type APIRequestContext } from '@playwright/test';
import { CREDENTIALS, STORAGE_STATE, login } from './helpers';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

/**
 * Authenticates a seeded role via the backend API, then writes the tokens into localStorage
 * and pins the interface language to English (the `locale` cookie) so e2e selectors can rely
 * on stable English labels. The resulting storage state is reused by the `admin` / `org`
 * projects.
 */
async function persistAuthState(
  page: Page,
  request: APIRequestContext,
  credentials: { email: string; password: string },
  statePath: string,
) {
  const { accessToken, refreshToken } = await login(request, credentials);
  await page.context().addCookies([{ name: 'locale', value: 'en', url: BASE_URL }]);
  await page.goto('/');
  await page.evaluate(
    ([access, refresh]) => {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    },
    [accessToken, refreshToken],
  );
  await page.context().storageState({ path: statePath });
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeTruthy();
}

setup('authenticate as super admin', async ({ page, request }) => {
  await persistAuthState(page, request, CREDENTIALS.admin, STORAGE_STATE.admin);
});

setup('authenticate as org admin', async ({ page, request }) => {
  await persistAuthState(page, request, CREDENTIALS.org, STORAGE_STATE.org);
});

setup('authenticate as org member', async ({ page, request }) => {
  await persistAuthState(page, request, CREDENTIALS.member, STORAGE_STATE.member);
});

// Public project: English locale, no auth tokens.
setup('prepare public (English locale, signed out)', async ({ page }) => {
  await page.context().addCookies([{ name: 'locale', value: 'en', url: BASE_URL }]);
  await page.goto('/');
  await page.context().storageState({ path: 'e2e/.auth/public.json' });
});
