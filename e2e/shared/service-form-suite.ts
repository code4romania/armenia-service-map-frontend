import { test, expect } from '@playwright/test';
import {
  API_URL,
  authHeaders,
  login,
  fillRequiredServiceFields,
  firstService,
  createServiceViaApi,
  deleteServiceViaApi,
  firstOrganisationId,
} from '../helpers';

export type ServiceFormRole = {
  /** Human label used in test titles, e.g. "Super admin". */
  label: string;
  /** App route of the create form. */
  createRoute: string;
  /** Accessible name of the create form's submit button. */
  createSubmitLabel: string;
  /** Whether this role's form shows the organisation selector (admin) or not (org). */
  showsOrg: boolean;
  /** App route prefix for edit, e.g. "/admin/services/" (+ id + "/edit"). */
  editRoutePrefix: string;
  /** App base path the form navigates to after a successful save, e.g. "/admin/services". */
  serviceBasePath: string;
  /** API path for this role's services, e.g. "/admin/services" or "/org/services". */
  apiServicesPath: string;
  /** Seeded credentials for API setup/cleanup. */
  credentials: { email: string; password: string };
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function serviceFormSuite(role: ServiceFormRole) {
  test.describe(`${role.label} – create service`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(role.createRoute);
      await expect(page.getByRole('button', { name: 'Armenian' })).toBeVisible();
    });

    test('opens on the Armenian tab, rendered before English', async ({ page }) => {
      const armenianBox = await page.getByRole('button', { name: 'Armenian' }).boundingBox();
      const englishBox = await page.getByRole('button', { name: 'English' }).boundingBox();
      expect(armenianBox!.x).toBeLessThan(englishBox!.x);
      // Armenian is the active tab by default (its title field is shown).
      await expect(page.getByLabel('Title (Armenian)')).toBeVisible();
    });

    test('marks required fields with an asterisk', async ({ page }) => {
      await expect(page.getByText('Title (Armenian) *')).toBeVisible();
      await expect(page.getByText('Location *')).toBeVisible();
      await expect(page.getByText('Topics *')).toBeVisible();
      await expect(page.getByText('Target groups *')).toBeVisible();
      if (role.showsOrg) {
        await expect(page.getByText('Organisation *')).toBeVisible();
      } else {
        await expect(page.getByText('Organisation *')).toHaveCount(0);
      }
      // Dates are optional — no asterisk.
      await expect(page.getByText('Start date', { exact: true })).toBeVisible();
    });

    test('blocks submit and shows an error summary when required fields are empty', async ({ page }) => {
      await page.getByRole('button', { name: role.createSubmitLabel }).click();
      const summary = page.getByTestId('service-form-errors');
      await expect(summary).toBeVisible();
      await expect(summary).toContainText('Please fix the following before saving:');
      await expect(page).toHaveURL(new RegExp(escapeRegExp(role.createRoute)));
    });

    test('reports Armenian-required fields by language even when English is filled', async ({ page }) => {
      await page.getByRole('button', { name: 'English' }).click();
      await page.getByLabel('Title (English)').fill('English only title');
      await page.getByRole('button', { name: role.createSubmitLabel }).click();
      await expect(page.getByTestId('service-form-errors')).toContainText('Title (Armenian) is required.');
    });

    test('clears an error live once the field becomes valid', async ({ page }) => {
      await page.getByRole('button', { name: role.createSubmitLabel }).click();
      const summary = page.getByTestId('service-form-errors');
      await expect(summary).toContainText('Title (Armenian) is required.');
      await page.getByLabel('Title (Armenian)').fill('A valid Armenian title');
      await expect(summary).not.toContainText('Title (Armenian) is required.');
    });

    test('creates a service end-to-end, then cleans it up', async ({ page, request }) => {
      const title = `[e2e] create ${role.label} ${Date.now()}`;
      await fillRequiredServiceFields(page, { title, selectOrg: role.showsOrg });
      await page.getByRole('button', { name: role.createSubmitLabel }).click();
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(role.serviceBasePath)}(\\?|$)`));

      const { accessToken } = await login(request, role.credentials);
      const list = await request.get(`${API_URL}${role.apiServicesPath}?perPage=100`, authHeaders(accessToken));
      const { data } = await list.json();
      const created = data.find((service: { titleHy: string }) => service.titleHy === title);
      expect(created, 'created service should exist in the backend').toBeTruthy();
      if (created) {
        await deleteServiceViaApi(request, {
          token: accessToken,
          apiServicesPath: role.apiServicesPath,
          id: created.id,
        });
      }
    });
  });

  test.describe(`${role.label} – edit service`, () => {
    test('pre-populates fields and keeps the required markers', async ({ page, request }) => {
      const { accessToken } = await login(request, role.credentials);
      const service = await firstService(request, accessToken, role.apiServicesPath);
      test.skip(!service, 'No seeded services available to edit');

      await page.goto(`${role.editRoutePrefix}${service!.id}/edit`);
      await expect(page.getByLabel('Title (Armenian)')).toHaveValue(service!.titleHy);
      await expect(page.getByText('Title (Armenian) *')).toBeVisible();
    });

    test('blocks save when a required field is cleared', async ({ page, request }) => {
      const { accessToken } = await login(request, role.credentials);
      const service = await firstService(request, accessToken, role.apiServicesPath);
      test.skip(!service, 'No seeded services available to edit');

      await page.goto(`${role.editRoutePrefix}${service!.id}/edit`);
      await page.getByLabel('Title (Armenian)').fill('');
      await page.getByRole('button', { name: 'Save changes' }).click();

      const summary = page.getByTestId('service-form-errors');
      await expect(summary).toBeVisible();
      await expect(summary).toContainText('Title (Armenian) is required.');
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(role.editRoutePrefix)}.*/edit`));
    });

    test('saves an edit and persists it', async ({ page, request }) => {
      const { accessToken } = await login(request, role.credentials);
      const organisationId = role.showsOrg ? await firstOrganisationId(request, accessToken) : undefined;
      const fixture = await createServiceViaApi(request, {
        token: accessToken,
        apiServicesPath: role.apiServicesPath,
        title: `[e2e] edit-src ${role.label} ${Date.now()}`,
        organisationId,
      });

      try {
        await page.goto(`${role.editRoutePrefix}${fixture.id}/edit`);
        const newTitle = `[e2e] edited ${role.label} ${Date.now()}`;
        await page.getByLabel('Title (Armenian)').fill(newTitle);
        await page.getByRole('button', { name: 'Save changes' }).click();

        // Navigates to the detail page on success. The negative lookahead ensures we wait
        // for the real navigation (detail URL) instead of matching the edit URL we start on,
        // which also guarantees the PATCH has committed before we read it back.
        await expect(page).toHaveURL(
          new RegExp(`${escapeRegExp(role.serviceBasePath)}/${escapeRegExp(fixture.id)}(?!/edit)`),
        );

        // The change is persisted.
        const detail = await request
          .get(`${API_URL}${role.apiServicesPath}/${fixture.id}`, authHeaders(accessToken))
          .then((r) => r.json());
        expect(detail.titleHy).toBe(newTitle);
      } finally {
        await deleteServiceViaApi(request, {
          token: accessToken,
          apiServicesPath: role.apiServicesPath,
          id: fixture.id,
        });
      }
    });
  });
}
