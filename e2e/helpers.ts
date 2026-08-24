import type { APIRequestContext, Page } from '@playwright/test';

/** Backend base URL. Mirrors the frontend's NEXT_PUBLIC_API_URL default. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/** Frontend base URL (the Next dev server Playwright drives). */
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

/** Storage state with only the `locale=en` cookie (no auth) — for the public project. */
export const PUBLIC_STORAGE_STATE = 'e2e/.auth/public.json';

/** Seeded test accounts (shared password). See /testing in the app. */
export const CREDENTIALS = {
  admin: { email: 'admin@refugeesupport.am', password: 'admin123' },
  org: { email: 'org-admin@missionarmenia.org', password: 'admin123' },
  member: { email: 'org-member@missionarmenia.org', password: 'admin123' },
};

export const STORAGE_STATE = {
  admin: 'e2e/.auth/admin.json',
  org: 'e2e/.auth/org.json',
  member: 'e2e/.auth/member.json',
};

type Credentials = { email: string; password: string };

/** Logs in against the real backend and returns the token pair (for auth setup / API calls). */
export async function login(
  request: APIRequestContext,
  credentials: Credentials,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request.post(`${API_URL}/auth/login`, { data: credentials });
  if (!res.ok()) {
    throw new Error(`Login failed for ${credentials.email}: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

export function authHeaders(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** Fills every required field on the service form (Armenian tab). */
export async function fillRequiredServiceFields(
  page: Page,
  opts: { title: string; selectOrg?: boolean },
) {
  if (opts.selectOrg) {
    await page.getByLabel('Organisation', { exact: true }).selectOption({ index: 1 });
  }
  await page.getByLabel('Title (Armenian)').fill(opts.title);
  await page.getByLabel('Location', { exact: true }).selectOption({ index: 1 });

  // Topics + target groups are the two scroll boxes, in order.
  const boxes = page.locator('div.max-h-36');
  await boxes.nth(0).locator('input[type="checkbox"]').first().check();
  await boxes.nth(1).locator('input[type="checkbox"]').first().check();

  // Three rich-text editors: short description, description, how to access.
  const editors = page.locator('.ProseMirror');
  await editors.nth(0).click();
  await page.keyboard.type('Short description (e2e)');
  await editors.nth(1).click();
  await page.keyboard.type('Full description (e2e)');
  await editors.nth(2).click();
  await page.keyboard.type('How to access (e2e)');
}

/** GET the first service visible to this token from the given services path ({data:[...]}). */
export async function firstService(
  request: APIRequestContext,
  token: string,
  apiServicesPath: string,
): Promise<{ id: string; titleHy: string } | undefined> {
  const res = await request.get(`${API_URL}${apiServicesPath}?perPage=1`, authHeaders(token));
  const { data } = await res.json();
  return data?.[0];
}

/** Creates a service directly via the API (fixture for edit tests). Returns the created service. */
export async function createServiceViaApi(
  request: APIRequestContext,
  opts: { token: string; apiServicesPath: string; title: string; organisationId?: string },
): Promise<{ id: string; titleHy: string }> {
  const [regions, topics, groups] = await Promise.all([
    request.get(`${API_URL}/public/regions`).then((r) => r.json()),
    request.get(`${API_URL}/public/topics`).then((r) => r.json()),
    request.get(`${API_URL}/public/target-groups`).then((r) => r.json()),
  ]);

  const body: Record<string, unknown> = {
    titleHy: opts.title,
    shortDescriptionHy: '<p>short (e2e)</p>',
    descriptionHy: '<p>description (e2e)</p>',
    howToAccessHy: '<p>how to access (e2e)</p>',
    status: 'DRAFT',
    isAvailable: true,
    regionId: regions[0]?.id,
    topicIds: topics[0]?.id ? [topics[0].id] : [],
    targetGroupIds: groups[0]?.id ? [groups[0].id] : [],
  };
  if (opts.organisationId) body.organisationId = opts.organisationId;

  const res = await request.post(`${API_URL}${opts.apiServicesPath}`, {
    ...authHeaders(opts.token),
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`API create failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

export async function deleteServiceViaApi(
  request: APIRequestContext,
  opts: { token: string; apiServicesPath: string; id: string },
) {
  await request.delete(`${API_URL}${opts.apiServicesPath}/${opts.id}`, authHeaders(opts.token));
}

/** First organisation id (admin only — for building service fixtures that require an org). */
export async function firstOrganisationId(request: APIRequestContext, token: string): Promise<string> {
  const res = await request.get(`${API_URL}/admin/organisations?perPage=1`, authHeaders(token));
  const { data } = await res.json();
  return data[0].id;
}

/** POST a fixture to any API path; returns the created entity. Throws on non-2xx. */
export async function apiCreate(
  request: APIRequestContext,
  token: string,
  path: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await request.post(`${API_URL}${path}`, { ...authHeaders(token), data: body });
  if (!res.ok()) {
    throw new Error(`POST ${path} failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/** DELETE any API path (best-effort cleanup). */
export async function apiDelete(request: APIRequestContext, token: string, path: string) {
  await request.delete(`${API_URL}${path}`, authHeaders(token));
}

/** GET a list ({data:[...]}) from any API path. */
export async function apiList(
  request: APIRequestContext,
  token: string,
  path: string,
): Promise<{ data: Array<Record<string, unknown>> }> {
  const res = await request.get(`${API_URL}${path}`, authHeaders(token));
  return res.json();
}
