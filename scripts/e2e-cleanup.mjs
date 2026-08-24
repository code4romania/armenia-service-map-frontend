// Sweeps any leftover e2e fixtures from the backend so the DB stays clean and runs stay
// idempotent. Tests clean up after themselves; this is a safety net for interrupted runs.
//
//   node scripts/e2e-cleanup.mjs
//
// Env: NEXT_PUBLIC_API_URL (default http://localhost:3000/api), and the seeded super-admin
// credentials (admin@refugeesupport.am / admin123).

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@refugeesupport.am';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin123';

const NAME_PREFIX = /^\[e2e\]/; // organisations, topics, services (titleHy)
const USER_EMAIL = /^e2e-|^pending@example\.com$/i; // provisioned / fixture users
const NEED_NAME = /^E2E|^\[e2e\]/i; // need report fullName

async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) throw new Error(`login failed: ${loginRes.status}`);
  const { accessToken } = await loginRes.json();
  const H = { Authorization: `Bearer ${accessToken}` };

  const list = async (path) => (await (await fetch(`${API}${path}?perPage=500`, { headers: H })).json()).data ?? [];
  const del = async (path, id) => fetch(`${API}${path}/${id}`, { method: 'DELETE', headers: H });

  const removed = { users: 0, organisations: 0, services: 0, topics: 0, targetGroups: 0, needTags: 0, needs: 0 };

  for (const u of await list('/admin/users')) if (USER_EMAIL.test(u.email)) { await del('/admin/users', u.id); removed.users++; }
  for (const s of await list('/admin/services')) if (NAME_PREFIX.test(s.titleHy ?? '')) { await del('/admin/services', s.id); removed.services++; }
  for (const o of await list('/admin/organisations')) if (NAME_PREFIX.test(o.name ?? '')) { await del('/admin/organisations', o.id); removed.organisations++; }
  for (const t of await list('/admin/topics')) if (NAME_PREFIX.test(t.name ?? '')) { await del('/admin/taxonomy/topics', t.id); removed.topics++; }
  for (const g of await list('/admin/taxonomy/target-groups')) if (NAME_PREFIX.test(g.name ?? '')) { await del('/admin/taxonomy/target-groups', g.id); removed.targetGroups++; }
  for (const t of await list('/admin/need-tags')) if (NAME_PREFIX.test(t.name ?? '')) { await del('/admin/taxonomy/need-tags', t.id); removed.needTags++; }
  for (const n of await list('/admin/needs')) if (NEED_NAME.test(n.fullName ?? '')) { await del('/admin/needs', n.id); removed.needs++; }

  console.log('e2e cleanup complete:', JSON.stringify(removed));
}

main().catch((err) => {
  console.error('e2e cleanup failed:', err);
  process.exit(1);
});
