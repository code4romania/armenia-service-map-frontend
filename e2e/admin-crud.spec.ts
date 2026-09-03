import { test, expect } from '@playwright/test';
import {
  API_URL,
  CREDENTIALS,
  login,
  authHeaders,
  apiCreate,
  apiDelete,
  apiList,
  firstOrganisationId,
} from './helpers';

// SUPER_ADMIN. Each test creates a fixture, verifies it surfaces in the admin UI / API,
// then deletes it — so re-runs stay idempotent and the DB doesn't accumulate rows.

test.describe('Admin CRUD', () => {
  test('organisation surfaces in the directory and is removable', async ({ page, request }) => {
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const stamp = Date.now();
    const name = `[e2e] Org ${stamp}`;
    // Admin-created orgs provision an ORG_ADMIN user from `admin`, so its email must be unique.
    const org = await apiCreate(request, accessToken, '/admin/organisations', {
      name,
      admin: { firstName: 'E2E', lastName: 'OrgAdmin', email: `e2e-org-${stamp}@example.com` },
    });
    try {
      await page.goto('/admin/organisations');
      await page.getByPlaceholder('Search...').fill(name);
      // The responsive table renders the row in a <td> (desktop) and a hidden card (mobile);
      // target the table cell to avoid a strict-mode double match.
      await expect(page.getByRole('cell', { name }).first()).toBeVisible();
    } finally {
      const users = org.users as Array<{ id: string }> | undefined;
      for (const u of users ?? []) await apiDelete(request, accessToken, `/admin/users/${u.id}`);
      await apiDelete(request, accessToken, `/admin/organisations/${org.id}`);
    }
  });

  test('user surfaces in the users list and is removable', async ({ page, request }) => {
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const organisationId = await firstOrganisationId(request, accessToken);
    const firstName = `E2EUser${Date.now()}`;
    const user = await apiCreate(request, accessToken, '/admin/users', {
      email: `e2e-${Date.now()}@example.com`,
      firstName,
      lastName: 'Tester',
      role: 'ORG_MEMBER',
      organisationId,
    });
    try {
      await page.goto('/admin/users');
      await page.getByPlaceholder('Search...').fill(firstName);
      await expect(page.getByRole('cell', { name: firstName }).first()).toBeVisible();
    } finally {
      await apiDelete(request, accessToken, `/admin/users/${user.id}`);
    }
  });

  test('topic surfaces in the taxonomy list and is removable', async ({ page, request }) => {
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const name = `[e2e] Topic ${Date.now()}`;
    const topic = await apiCreate(request, accessToken, '/admin/taxonomy/topics', {
      name,
      status: 'ACTIVE',
      subtopics: [],
    });
    try {
      await page.goto('/admin/taxonomy');
      await page.getByPlaceholder('Search...').fill(name);
      await expect(page.getByRole('cell', { name }).first()).toBeVisible();
    } finally {
      await apiDelete(request, accessToken, `/admin/taxonomy/topics/${topic.id}`);
    }
  });

  test('target group create/list/delete (API round-trip)', async ({ request }) => {
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const name = `[e2e] TargetGroup ${Date.now()}`;
    const tg = await apiCreate(request, accessToken, '/admin/taxonomy/target-groups', { name, status: 'ACTIVE' });
    try {
      const { data } = await apiList(request, accessToken, '/admin/taxonomy/target-groups?perPage=200');
      expect(data.some((x) => x.id === tg.id)).toBeTruthy();
    } finally {
      await apiDelete(request, accessToken, `/admin/taxonomy/target-groups/${tg.id}`);
    }
  });

  test('need tag create/list/delete (API round-trip)', async ({ request }) => {
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const name = `[e2e] NeedTag ${Date.now()}`;
    const tag = await apiCreate(request, accessToken, '/admin/taxonomy/need-tags', { name, status: 'ACTIVE' });
    try {
      const { data } = await apiList(request, accessToken, '/admin/need-tags?perPage=200');
      expect(data.some((x) => x.id === tag.id)).toBeTruthy();
    } finally {
      await apiDelete(request, accessToken, `/admin/taxonomy/need-tags/${tag.id}`);
    }
  });

  test('approves a pending organisation from its detail page', async ({ page, request }) => {
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const stamp = Date.now();
    const orgName = `[e2e] Pending ${stamp}`;
    // Unique email: approval provisions an org-admin user from the contact email, and a
    // duplicate email would 409 on a re-run.
    const contactEmail = `e2e-pending-${stamp}@example.com`;
    const res = await request.post(`${API_URL}/public/join-network`, {
      data: {
        organisationName: orgName,
        contactName: 'Jane Tester',
        email: contactEmail,
        servicesDescription: 'We provide support services to refugees.',
      },
    });
    const org = await res.json();
    try {
      await page.goto(`/admin/organisations/${org.id}`);
      await expect(page.getByRole('heading', { level: 1, name: orgName })).toBeVisible();
      const approveButton = page.getByRole('button', { name: 'Approve organisation' });
      await expect(approveButton).toBeEnabled();
      const [approveResponse] = await Promise.all([
        page.waitForResponse((r) => r.url().includes(`/organisations/${org.id}/approve`)),
        approveButton.click(),
      ]);
      expect(approveResponse.ok()).toBeTruthy();
      // The UI cache can lag; assert the workflow's real outcome on the backend.
      await expect
        .poll(
          async () => {
            const detail = await request
              .get(`${API_URL}/admin/organisations/${org.id}`, authHeaders(accessToken))
              .then((r) => r.json());
            return detail.status;
          },
          { timeout: 10_000 },
        )
        .toBe('ACTIVE');
    } finally {
      // Remove the provisioned user first, then the organisation.
      const { data: users } = await apiList(
        request,
        accessToken,
        `/admin/users?perPage=100&search=${encodeURIComponent(contactEmail)}`,
      );
      const provisioned = users.find((u) => u.email === contactEmail);
      if (provisioned) await apiDelete(request, accessToken, `/admin/users/${provisioned.id}`);
      await apiDelete(request, accessToken, `/admin/organisations/${org.id}`);
    }
  });

  test('a submitted need surfaces in the admin needs list', async ({ page, request }) => {
    const { accessToken } = await login(request, CREDENTIALS.admin);
    const fullName = `E2ENeed${Date.now()}`;
    const res = await request.post(`${API_URL}/public/needs`, {
      data: {
        description: 'I need legal assistance.',
        fullName,
        contactMethod: 'email',
        contactValue: 'need@example.com',
      },
    });
    const need = await res.json();
    try {
      await page.goto('/admin/needs');
      await page.getByPlaceholder('Search...').fill(fullName);
      await expect(page.getByRole('cell', { name: fullName }).first()).toBeVisible();
    } finally {
      await apiDelete(request, accessToken, `/admin/needs/${need.id}`);
    }
  });
});
