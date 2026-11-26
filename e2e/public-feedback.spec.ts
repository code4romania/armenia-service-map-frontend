import { test, expect } from '@playwright/test';
import { CREDENTIALS, E2E_FEEDBACK_PREFIX, apiList, deleteE2eFeedback, login } from './helpers';

// Public project (English, signed out). The pop-up dwell is shortened to 1 s through
// NEXT_PUBLIC_FEEDBACK_TEST_DWELL_MS (playwright.config.ts webServer env).

test.describe('Public feedback pop-up', () => {
  const lookingFor = `${E2E_FEEDBACK_PREFIX}${Date.now()}`;

  test.afterAll(() => {
    deleteE2eFeedback(lookingFor);
  });

  test('opens after a search + scroll, submits, then stays gone', async ({ page, request }) => {
    await page.goto('/');
    // Homepage search marks an "own search", which counts as a results interaction.
    await page.locator('form').filter({ has: page.getByRole('searchbox') }).getByRole('button', { name: 'Find services' }).click();
    await expect(page).toHaveURL(/\/services/);
    await expect(page.getByRole('heading', { level: 1, name: 'Explore services' })).toBeVisible();

    // The homepage search counts as the visitor's own lookup: the pop-up opens
    // right away on /services, no scrolling needed.
    const dialog = page.getByRole('dialog', { name: 'Help us improve' });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await dialog
      .getByRole('radiogroup', { name: 'How useful was this information for you?' })
      .getByLabel('Very useful')
      .check();
    await dialog.getByRole('radiogroup', { name: 'Did you find what you were looking for?' }).getByLabel('No').check();
    await dialog.getByLabel(/What were you looking for\?/).fill(lookingFor);
    await dialog
      .getByRole('radiogroup', { name: 'Did you or your family move to Armenia from Nagorno-Karabakh?' })
      .getByLabel('Prefer not to say')
      .check();
    await dialog.getByRole('button', { name: 'Send' }).click();

    await expect(dialog.getByRole('status')).toHaveText('Thank you for your feedback!');

    // The answer reached the backend.
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const { data } = await apiList(request, accessToken, '/admin/feedback?perPage=50');
    const row = data.find((f) => f.lookingFor === lookingFor);
    expect(row, 'submitted feedback should be listed for admins').toBeTruthy();
    expect(row).toMatchObject({ found: 'NO', usefulness: 'VERY', fromKarabakh: 'PREFER_NOT_TO_SAY', locale: 'en' });
    expect(String(row?.pagePath)).toMatch(/^\/services/);

    // After a reload, neither the pop-up nor the "Feedback" pill comes back.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Explore services' })).toBeVisible();
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(2_000); // longer than the 1 s test dwell
    await expect(page.getByRole('dialog', { name: 'Help us improve' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Feedback', exact: true })).toHaveCount(0);
  });
});
