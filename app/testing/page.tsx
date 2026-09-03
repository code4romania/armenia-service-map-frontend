'use client';

import { useState } from 'react';

/**
 * Internal QA reference page (gated by Basic Auth in middleware.ts).
 * Lists the seeded test accounts and the role/permission contract derived
 * from the backend @Roles() guards. Test fixtures only — not production data.
 */

const SHARED_PASSWORD = 'admin123';

type RoleKey = 'SUPER_ADMIN' | 'ORG_ADMIN';

const ROLES: { key: RoleKey; label: string; area: string; accent: string; dot: string }[] = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', area: '/admin', accent: 'text-amber-300 border-amber-400/30 bg-amber-400/10', dot: 'bg-amber-400' },
  { key: 'ORG_ADMIN', label: 'Org Admin', area: '/org', accent: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10', dot: 'bg-emerald-400' },
];

const ROLE_BY_KEY = Object.fromEntries(ROLES.map((r) => [r.key, r])) as Record<RoleKey, (typeof ROLES)[number]>;

const CAPABILITIES: { label: string; roles: RoleKey[] }[] = [
  { label: 'Approve, review & suspend organisations', roles: ['SUPER_ADMIN'] },
  { label: 'Manage all services (any organisation)', roles: ['SUPER_ADMIN'] },
  { label: 'Manage taxonomy — topics, tags, target groups', roles: ['SUPER_ADMIN'] },
  { label: 'Manage user accounts', roles: ['SUPER_ADMIN'] },
  { label: 'Manage all need reports', roles: ['SUPER_ADMIN'] },
  { label: 'Platform-wide analytics', roles: ['SUPER_ADMIN'] },
  { label: 'View own organisation profile & members', roles: ['ORG_ADMIN'] },
  { label: 'Edit own organisation profile', roles: ['ORG_ADMIN'] },
  { label: "Manage own org's services — create / edit / publish / delete", roles: ['ORG_ADMIN'] },
  { label: 'Manage assigned need reports — update & comment', roles: ['ORG_ADMIN'] },
  { label: 'Organisation analytics', roles: ['ORG_ADMIN'] },
  { label: 'Upload files — images & documents', roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
];

type Status = 'ACTIVE' | 'PENDING';

const USERS: { name: string; email: string; role: RoleKey; org: string; status: Status }[] = [
  { name: 'Super Admin', email: 'admin@refugeesupport.am', role: 'SUPER_ADMIN', org: '—', status: 'ACTIVE' },
  { name: 'Lilit Hakobyan', email: 'org-admin@missionarmenia.org', role: 'ORG_ADMIN', org: 'Mission Armenia', status: 'ACTIVE' },
  { name: 'Arman Petrosyan', email: 'org-member@missionarmenia.org', role: 'ORG_ADMIN', org: 'Mission Armenia', status: 'ACTIVE' },
  { name: 'Mariam Avetisyan', email: 'org-admin@caritas.am', role: 'ORG_ADMIN', org: 'Armenian Caritas', status: 'ACTIVE' },
  { name: 'Narek Stepanyan', email: 'org-member-pending@caritas.am', role: 'ORG_ADMIN', org: 'Armenian Caritas', status: 'PENDING' },
  { name: 'Sona Abrahamyan', email: 'org-admin@peopleinneed.am', role: 'ORG_ADMIN', org: 'People in Need', status: 'ACTIVE' },
  { name: 'Gor Melkonyan', email: 'org-admin@fulllifearmenia.org', role: 'ORG_ADMIN', org: 'Full Life NGO', status: 'ACTIVE' },
];

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
      aria-label={`Copy ${label ?? value}`}
    >
      {copied ? '✓ copied' : value}
    </button>
  );
}

function RoleBadge({ role }: { role: RoleKey }) {
  const r = ROLE_BY_KEY[role];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide ${r.accent}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  );
}

export default function TestingPage() {
  return (
    <main className="min-h-screen bg-[#0a0e16] text-slate-200 [background-image:radial-gradient(60rem_40rem_at_80%_-10%,rgba(56,189,248,0.08),transparent),radial-gradient(50rem_30rem_at_0%_0%,rgba(16,185,129,0.06),transparent)]">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-8">
        {/* Header */}
        <header className="mb-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-emerald-400/80">
            Internal · QA reference
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Test accounts
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Seeded fixtures for the RefugeeSupport.am platform. Roles and permissions
            below mirror the backend authorisation guards. Sign in at{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300">/login</code>.
          </p>
        </header>

        {/* Warning + shared password */}
        <div className="mb-10 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
            <span className="mt-0.5 text-amber-400">⚠</span>
            <p className="text-sm text-amber-100/80">
              Test environment only. These are shared, non-secret credentials —
              never reuse them or enter real personal data.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              Password (all)
            </span>
            <CopyButton value={SHARED_PASSWORD} label="shared password" />
          </div>
        </div>

        {/* Accounts table */}
        <section className="mb-14">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
            {USERS.length} accounts
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Organisation</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {USERS.map((u) => (
                  <tr key={u.email} className="border-b border-white/[0.06] transition hover:bg-white/[0.03] last:border-0">
                    <td className="px-5 py-3.5 font-medium text-white">{u.name}</td>
                    <td className="px-5 py-3.5">
                      <CopyButton value={u.email} label="email" />
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{u.org}</td>
                    <td className="px-5 py-3.5">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500" title="Pending accounts cannot sign in until approved">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" /> pending · no login
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Permission matrix */}
        <section>
          <h2 className="mb-1 text-2xl font-semibold tracking-tight text-white">
            Roles &amp; permissions
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Derived from the backend <code className="font-mono text-xs text-slate-300">@Roles()</code> guards.
            {' '}Each role works in a distinct area:
            {ROLES.map((r, i) => (
              <span key={r.key}>
                {i === 0 ? ' ' : ' · '}
                <span className="font-mono text-xs text-slate-300">{r.label}</span>
                {' → '}
                <code className="font-mono text-xs text-slate-400">{r.area}</code>
              </span>
            ))}
            .
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 text-left font-medium">Capability</th>
                  {ROLES.map((r) => (
                    <th key={r.key} className="px-4 py-3 text-center font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
                        {r.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map((cap) => (
                  <tr key={cap.label} className="border-b border-white/[0.06] transition hover:bg-white/[0.03] last:border-0">
                    <td className="px-5 py-3.5 text-slate-300">{cap.label}</td>
                    {ROLES.map((r) => {
                      const allowed = cap.roles.includes(r.key);
                      return (
                        <td key={r.key} className="px-4 py-3.5 text-center">
                          {allowed ? (
                            <span className={`font-mono text-base ${r.key === 'SUPER_ADMIN' ? 'text-amber-300' : r.key === 'ORG_ADMIN' ? 'text-emerald-300' : 'text-sky-300'}`}>
                              ✓
                            </span>
                          ) : (
                            <span className="font-mono text-base text-slate-700">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-14 border-t border-white/[0.06] pt-6 font-mono text-xs text-slate-600">
          RefugeeSupport.am · seeded test data · {USERS.length} users · {ROLES.length} roles
        </footer>
      </div>
    </main>
  );
}
