# End-to-end tests (Playwright)

A full regression suite that runs the **real app against the real backend**.

## Prerequisites

1. **Backend** (NestJS) on `http://localhost:3000` with a **seeded database**
   (seeded test accounts share the password `admin123`).
2. The frontend dev server is started automatically by Playwright on port `3001`
   (`next dev -p 3001`); an already-running server there is reused.

## Run

```bash
npm run test:e2e            # headless
npm run test:e2e:ui         # interactive UI mode
npm run test:e2e:report     # open the last HTML report
npm run test:e2e:cleanup    # safety-net: delete any leftover [e2e] fixtures from the DB
```

Override the URLs if needed:

```bash
E2E_BASE_URL=http://localhost:3001 NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run test:e2e
```

## Projects (Playwright)

`setup` logs the seeded `SUPER_ADMIN`, `ORG_ADMIN`, `ORG_MEMBER` in via the API, stores their
tokens, and pins the UI language to English (`locale` cookie). It also writes a token-less
`public` state. State files live under `e2e/.auth/` (gitignored). The other projects reuse them:

| Project | Auth | Specs |
|---|---|---|
| `public` | signed out, English | `public-*.spec.ts` |
| `admin` | SUPER_ADMIN | `admin-*.spec.ts` |
| `org-admin` | ORG_ADMIN | `org-admin-*.spec.ts` |
| `org-member` | ORG_MEMBER | `org-member-*.spec.ts` |

## Coverage

- **Public** (`public-pages`, `public-auth`, `public-forms`): every public page renders; login
  (invalid creds, super-admin redirect, org redirect); signed-out guards on `/admin` + `/org`;
  join-the-network + report-a-need validation and a real submit (cleaned up via the admin API).
- **Service form** (`shared/service-form-suite.ts`, run for admin + org-admin + org-member):
  Armenian-first tabs, required-field asterisks, the error summary box, language-specific
  required messages, live error clearing, create end-to-end, edit pre-population, blocked save
  on a cleared required field, and a persisted edit.
- **Admin** (`admin-smoke`, `admin-crud`): every admin page loads; organisations / users /
  topics surface in the list UI after an API create; target-groups / need-tags API round-trip;
  the pending-organisation approval workflow; a public-submitted need appears in the admin list.
- **Org** (`org-admin-smoke`, `org-admin-access`): every org page loads; an org user visiting
  `/admin` is redirected to `/org/dashboard`.

## Idempotency / DB safety

Every test that mutates uses a unique `[e2e] … <timestamp>` name and **deletes its fixtures via
the API in a `finally`/cleanup block** (note: approving an organisation provisions an org user
from the contact email, which is also removed). Running the suite twice on the same database is
clean — and `npm run test:e2e:cleanup` sweeps anything an interrupted run left behind.
