# Cloudflare Foundation

## Goal

Prepare Cloudflare resources for the MVP:

- Cloudflare Workers
- Cloudflare Pages
- Cloudflare D1
- Cloudflare Access

MVP document handling uses external document links. Do not create document storage buckets for MVP.

## D1 Databases

Staging database:

```text
database_name = rmc_staging
binding = DB
```

Production database is created only when approved:

```bash
npx wrangler d1 create rmc_production
```

After production D1 is created, add its `database_id` to `apps/api/wrangler.toml`.

## Document Link Management

Physical documents are stored manually in Google Drive, OneDrive, Dropbox, or another approved external provider.

The app stores document metadata and URL in Cloudflare D1 through the `document_links` table.

Worker variables:

```toml
ENABLE_FILE_UPLOADS = "false"
DOCUMENT_STORAGE_MODE = "external_link"
```

## Phase 2 Verification

Phase 2 verification depends on:

- Wrangler login
- D1 staging database exists
- `DB` binding exists in Worker config
- staging migrations can run
- Worker staging can deploy
- `/api/health` can respond
- Cloudflare Access can be configured

Phase 2 verification does not depend on binary document storage.

## Cloudflare Access and App Users

Cloudflare Access protects the application before requests reach the Worker.

The Worker reads the authenticated email from:

```text
cf-access-authenticated-user-email
```

The email must exist in the D1 `users` table and must have:

```text
status = ACTIVE
deleted_at IS NULL
```

If the user is missing or inactive, protected APIs return an error and do not continue.

Phase 4 backend endpoints:

```text
GET    /api/auth/me
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

`GET /api/me` exists only as a temporary compatibility alias. New frontend code should use `GET /api/auth/me`.

## Seed OWNER User

The first OWNER user must be seeded before protected APIs can be used. This prevents a bootstrap lock where `/api/auth/me` requires an existing active user.

`<OWNER_EMAIL>` must be the same email used to log in through Cloudflare Access.

Local seed:

```bash
pnpm --dir apps/api exec wrangler d1 execute rmc_local --local --command "INSERT OR IGNORE INTO users (id, email, name, role, status, created_at, updated_at) VALUES ('usr_owner_001', '<OWNER_EMAIL>', 'Owner Ratama', 'OWNER', 'ACTIVE', datetime('now'), datetime('now'));"
```

Staging seed:

```bash
pnpm --dir apps/api exec wrangler d1 execute rmc_staging --remote --env staging --command "INSERT OR IGNORE INTO users (id, email, name, role, status, created_at, updated_at) VALUES ('usr_owner_001', '<OWNER_EMAIL>', 'Owner Ratama', 'OWNER', 'ACTIVE', datetime('now'), datetime('now'));"
```

Template file:

```text
packages/db/seeds/owner.template.sql
```

Do not seed production without explicit confirmation. Production owner seed must be done manually and carefully.

## Local Auth Test

Local development uses the same Cloudflare Access email header as staging:

```text
cf-access-authenticated-user-email
```

Example:

```bash
curl -H "cf-access-authenticated-user-email: <OWNER_EMAIL>" http://127.0.0.1:8787/api/auth/me
```

This is not an auto-register flow. The email must already exist in the local D1 `users` table. No local-only fallback is enabled in production.

## Staging Commands

Apply migrations:

```bash
pnpm db:migrate:staging
```

Deploy Worker staging:

```bash
pnpm deploy:api:staging
```

Test health:

```bash
curl https://staging-rmc.alfrzhb.com/api/health
```

## Guardrails

1. Do not deploy production before staging is tested.
2. Do not apply production migration without confirmation.
3. Do not change DNS, nameserver, or domain settings without confirmation.
4. Do not request passwords, global API keys, or full access tokens.
5. Keep D1, Workers, Pages, and Access in the active architecture.
