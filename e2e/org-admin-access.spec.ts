import { test, expect } from '@playwright/test';

// ORG_ADMIN must not reach the super-admin area: the admin layout redirects non-super-admins
// to /org/dashboard.
test('org user visiting the admin area is redirected to the org dashboard', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/org\/dashboard/);
});
