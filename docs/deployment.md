# Ratama Project & Finance Tracker - Deployment

## Active Deployment Architecture

```text
Cloudflare Pages + Cloudflare Workers + Cloudflare D1 + Cloudflare Access
```

MVP does not use Cloudflare R2. Documents are managed as external links.

## Environments

| Environment | Frontend | API | Database |
| --- | --- | --- | --- |
| Local | Vite | Wrangler dev | Local D1 |
| Staging | Cloudflare Pages | Worker staging | `rmc_staging` |
| Production | Cloudflare Pages | Worker production | `rmc_production` |

Do not deploy production until staging has been tested and production D1 is explicitly configured.

## Required Cloudflare Resources

- Cloudflare Pages project for frontend
- Cloudflare Worker for API
- Cloudflare D1 database for staging
- Cloudflare D1 database for production when approved
- Cloudflare Access application and policies

No document storage bucket is required for MVP.

## Cloudflare Access Requirement

Protected API routes require Cloudflare Access to send:

```text
cf-access-authenticated-user-email
```

That email must be registered as an active app user in D1. Inactive users are blocked by the Worker.

Primary current-user endpoint:

```text
GET /api/auth/me
```

`GET /api/me` is a temporary compatibility alias.

Seed the first OWNER user before testing protected APIs:

```bash
pnpm --dir apps/api exec wrangler d1 execute rmc_staging --remote --env staging --command "INSERT OR IGNORE INTO users (id, email, name, role, status, created_at, updated_at) VALUES ('usr_owner_001', '<OWNER_EMAIL>', 'Owner Ratama', 'OWNER', 'ACTIVE', datetime('now'), datetime('now'));"
```

`<OWNER_EMAIL>` must match the email used for Cloudflare Access login. Do not seed production without confirmation.

## Worker Configuration

Required binding:

```toml
[[env.staging.d1_databases]]
binding = "DB"
database_name = "rmc_staging"
database_id = "..."
migrations_dir = "../../packages/db/migrations"
```

Required variables:

```toml
ENABLE_FILE_UPLOADS = "false"
DOCUMENT_STORAGE_MODE = "external_link"
```

## Local Commands

Install dependencies:

```bash
pnpm install
```

Run frontend:

```bash
pnpm dev:web
```

Run API:

```bash
pnpm dev:api
```

Run local migration:

```bash
pnpm db:migrate:local
```

## Staging Deployment

Apply staging migration:

```bash
pnpm db:migrate:staging
```

Deploy Worker staging:

```bash
pnpm deploy:api:staging
```

Deploy Pages staging after frontend is ready:

```bash
pnpm deploy:web:staging
```

Test health:

```bash
curl https://staging-rmc.alfrzhb.com/api/health
```

## Production Deployment

Production is blocked until explicitly approved.

When approved:

1. Create production D1.
2. Add production database ID to `wrangler.toml`.
3. Apply production migrations.
4. Deploy Worker production.
5. Deploy Pages production.
6. Test production health.

## Production Readiness Checklist

- [ ] Staging Worker deploy succeeds.
- [ ] Staging `/api/health` succeeds.
- [ ] Staging D1 migration succeeds.
- [ ] Document Link CRUD works in staging.
- [ ] Cloudflare Access protects staging.
- [ ] Production D1 ID is configured.
- [ ] Production migration is approved.
- [ ] DNS/domain changes are explicitly approved if needed.

## Document Handling

Documents are uploaded manually to Google Drive, OneDrive, Dropbox, or another external provider. The app stores only document metadata and URL in D1.

Users must ensure external sharing permissions are appropriate for the organization.

## Maintenance

Monitor:

- Worker errors
- D1 migration state
- D1 query/storage usage
- Cloudflare Access login issues
- broken external document links

Backups:

- D1 export/backup process
- external provider document backup policy outside the app
