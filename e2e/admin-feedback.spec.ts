import { test, expect } from '@playwright/test';
import { API_URL, E2E_FEEDBACK_PREFIX, deleteE2eFeedback } from './helpers';

// SUPER_ADMIN. Seeds one feedback row through the public endpoint, checks it is listed on
// /admin/feedback, and that "Download CSV" saves a dated CSV. The row is removed afterwards
// through deleteE2eFeedback (needs E2E_DATABASE_URL; otherwise `npm run test:e2e:cleanup`).

test.describe('Admin feedback', () => {
  const lookingFor = `${E2E_FEEDBACK_PREFIX}${Date.now()}-admin`;

  test.afterAll(() => {
    deleteE2eFeedback(lookingFor);
  });

  test('lists a response and downloads the CSV', async ({ page, request }) => {
    const res = await request.post(`${API_URL}/public/feedback`, {
      data: {
        usefulness: 'MODERATELY',
        found: 'PARTLY',
        lookingFor,
        fromKarabakh: 'NO',
        locale: 'en',
        pagePath: '/services',
      },
    });
    expect(res.ok(), `POST /public/feedback: ${res.status()}`).toBeTruthy();

    await page.goto('/admin/feedback');
    await expect(page.getByRole('heading', { level: 1, name: 'Feedback' })).toBeVisible();
    // Desktop table cell (a hidden mobile card renders the same text).
    await expect(page.getByRole('cell', { name: lookingFor })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^feedback-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
