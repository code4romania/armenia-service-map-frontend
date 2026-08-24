import { test, expect } from '@playwright/test';
import { CREDENTIALS, login, apiList, apiDelete } from './helpers';

// Public project: the two public submission forms — validation + a real submit that is
// cleaned up via the admin API so the run stays idempotent.

test.describe('Join the network form', () => {
  test('keeps submit disabled until required fields are filled', async ({ page }) => {
    await page.goto('/join-the-network');
    await expect(page.getByRole('button', { name: 'Submit request' })).toBeDisabled();
  });

  test('rejects an invalid email', async ({ page }) => {
    await page.goto('/join-the-network');
    await page.getByLabel('Organisation name').fill('Test Org');
    await page.getByLabel('Contact person name').fill('Jane Tester');
    // `tester@localhost` passes the browser's native type=email check but fails the app's
    // stricter validator (which requires a dotted domain), so the custom error surfaces.
    await page.getByLabel('Email address').fill('tester@localhost');
    await page.getByLabel('Brief description of services').fill('We provide test services to people.');
    await page.getByRole('button', { name: 'Submit request' }).click();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  });

  test('submits successfully and is cleaned up', async ({ page, request }) => {
    const orgName = `[e2e] Join Org ${Date.now()}`;
    await page.goto('/join-the-network');
    await page.getByLabel('Organisation name').fill(orgName);
    await page.getByLabel('Contact person name').fill('Jane Tester');
    await page.getByLabel('Email address').fill('jane.tester@example.com');
    await page.getByLabel('Brief description of services').fill('We provide support services to refugees.');
    await page.getByRole('button', { name: 'Submit request' }).click();

    await expect(page).toHaveURL(/\/join-the-network\/success/);
    await expect(page.getByRole('heading', { name: /Thank you for joining the network/i })).toBeVisible();

    // Cleanup: created as a PENDING organisation.
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const { data } = await apiList(request, accessToken, '/admin/organisations?perPage=100');
    const created = data.find((o) => o.name === orgName);
    expect(created, 'join request should create an organisation').toBeTruthy();
    if (created) await apiDelete(request, accessToken, `/admin/organisations/${created.id}`);
  });
});

test.describe('Report a need form', () => {
  test('keeps submit disabled until required fields are filled', async ({ page }) => {
    await page.goto('/report-a-need');
    await expect(page.getByRole('button', { name: 'Send need report' })).toBeDisabled();
  });

  test('submits successfully and is cleaned up', async ({ page, request }) => {
    const fullName = `[e2e] Needer ${Date.now()}`;
    await page.goto('/report-a-need');
    await page.getByLabel('How can we help you?').fill('I need housing assistance for my family.');
    await page.getByLabel('Full name').fill(fullName);
    await page.getByLabel('How would you like to be contacted?').selectOption({ label: 'Email' });
    await page.getByLabel('How can we reach you?').fill('needer@example.com');
    await page.getByRole('button', { name: 'Send need report' }).click();

    await expect(page.getByRole('heading', { name: /^Thank you$/i })).toBeVisible();

    // Cleanup: created as a need report.
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const { data } = await apiList(request, accessToken, '/admin/needs?perPage=100');
    const created = data.find((n) => n.fullName === fullName);
    expect(created, 'report should create a need').toBeTruthy();
    if (created) await apiDelete(request, accessToken, `/admin/needs/${created.id}`);
  });
});
