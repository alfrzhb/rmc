# Deployment Guide - Ratama Project & Finance Tracker

## 1. Purpose

Dokumen ini menjelaskan strategi deployment untuk **Ratama Project & Finance Tracker**.

Target deployment:

```txt
Frontend: Cloudflare Pages
Backend API: Cloudflare Workers
Database: Cloudflare D1
File Storage: Cloudflare R2
Auth Gate: Cloudflare Access
Domain: rmc.alfrzhb.com
Staging: staging-rmc.alfrzhb.com
```

Deployment harus dibuat sederhana, aman, dan bisa dipakai untuk sistem internal perusahaan.

Sistem ini bukan public SaaS. Sistem ini adalah aplikasi internal untuk Ratama Mitra Kualitas / Ratama Management Consultant.

---

## 2. Deployment Architecture

Final deployment architecture:

```txt
User / Staff Ratama
        |
        v
rmc.alfrzhb.com
        |
        v
Cloudflare Access
        |
        v
Frontend Web App
Cloudflare Pages
        |
        v
API route
rmc.alfrzhb.com/api/*
        |
        v
Cloudflare Workers
        |
        v
Cloudflare D1
        |
        v
Cloudflare R2
```

Staging architecture:

```txt
User / Developer
        |
        v
staging-rmc.alfrzhb.com
        |
        v
Cloudflare Access
        |
        v
Frontend Web App
Cloudflare Pages Preview / Staging Project
        |
        v
API route
staging-rmc.alfrzhb.com/api/*
        |
        v
Cloudflare Workers staging environment
        |
        v
D1 staging database
        |
        v
R2 staging bucket
```

---

## 3. Deployment Principles

Deployment must follow these rules:

1. Production and staging must be separated.
2. Production database and staging database must be different.
3. Production R2 bucket and staging R2 bucket must be different.
4. Production domain must be protected by Cloudflare Access.
5. Staging domain must also be protected by Cloudflare Access.
6. API must use backend RBAC, not only frontend role hiding.
7. Database migration must be reviewed before production.
8. Never test destructive operations on production.
9. Never expose R2 file URLs publicly without access check.
10. Finance data must not be hard deleted.
11. All important production changes must be auditable.
12. Rollback plan must exist before major deployment.

---

## 4. Domain Strategy

Recommended domains:

```txt
Production:
rmc.alfrzhb.com

Staging:
staging-rmc.alfrzhb.com
```

Recommended API route:

```txt
Production API:
rmc.alfrzhb.com/api/*

Staging API:
staging-rmc.alfrzhb.com/api/*
```

Use same-origin API.

Recommended:

```txt
Frontend: rmc.alfrzhb.com
API:      rmc.alfrzhb.com/api/*
```

Avoid for MVP:

```txt
Frontend: rmc.alfrzhb.com
API:      api-rmc.alfrzhb.com
```

Reason:

1. Less CORS complexity.
2. Simpler security.
3. Simpler Cloudflare Access configuration.
4. Easier frontend API calls.
5. Cleaner user experience.

---

## 5. Environment Strategy

Use three environments:

```txt
local
staging
production
```

### Local

```txt
Frontend: http://localhost:5173
API: http://localhost:8787/api
Database: local D1
Storage: local/dev R2 binding or staging test bucket
```

### Staging

```txt
Frontend: staging-rmc.alfrzhb.com
API: staging-rmc.alfrzhb.com/api/*
Database: rmc_staging
R2 Bucket: rmc-staging-files
Access: restricted to developer/owner test emails
```

### Production

```txt
Frontend: rmc.alfrzhb.com
API: rmc.alfrzhb.com/api/*
Database: rmc_production
R2 Bucket: rmc-production-files
Access: restricted to Ratama allowed emails
```

---

## 6. Repository Deployment Model

Recommended repository structure:

```txt
ratama-tracker/
|-- apps/
|   |-- web/
|   `-- api/
|-- packages/
|   |-- db/
|   |-- shared/
|   `-- validation/
|-- docs/
`-- package.json
```

Recommended branches:

```txt
main        -> production
develop     -> staging
feature/*   -> feature development
```

Recommended flow:

```txt
feature/* branch
|
v
Pull request to develop
|
v
Deploy to staging
|
v
Test staging
|
v
Merge develop to main
|
v
Deploy to production
```

---

## 7. Cloudflare Resources

Create these Cloudflare resources.

### 7.1 Pages Projects

Recommended:

```txt
ratama-tracker-web-production
ratama-tracker-web-staging
```

Alternative:

```txt
Use one Cloudflare Pages project with production branch main and preview branch develop.
```

For simplicity and clearer separation, using separate production and staging projects is acceptable.

### 7.2 Workers

Recommended Workers:

```txt
ratama-tracker-api-production
ratama-tracker-api-staging
```

Alternative:

```txt
One Worker with environments:
production
staging
```

For early MVP, separate Workers are easier to reason about.

### 7.3 D1 Databases

Create:

```txt
rmc_production
rmc_staging
```

### 7.4 R2 Buckets

Create:

```txt
rmc-production-files
rmc-staging-files
```

### 7.5 Cloudflare Access Applications

Create Access applications for:

```txt
rmc.alfrzhb.com
staging-rmc.alfrzhb.com
```

Cloudflare Access should sit in front of the application and check requests against Access policies before allowing users through. Cloudflare describes Access as an identity-aware proxy for securing web applications.

---

## 8. Frontend Deployment - Cloudflare Pages

Frontend stack:

```txt
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
```

Cloudflare's Vite Pages guide uses a build command and a `dist` output directory for Vite projects. For a monorepo, configure the root/output carefully.

---

### 8.1 Option A - Pages Root Directory = apps/web

Use this if Cloudflare Pages project root is set to:

```txt
apps/web
```

Build settings:

```txt
Framework preset: Vite
Build command: pnpm build
Build output directory: dist
Root directory: apps/web
```

Environment variables:

```txt
VITE_API_BASE_URL=/api
VITE_APP_ENV=production
```

Staging environment variables:

```txt
VITE_API_BASE_URL=/api
VITE_APP_ENV=staging
```

---

### 8.2 Option B - Pages Root Directory = Repository Root

Use this if Cloudflare Pages root is the repo root.

Build settings:

```txt
Framework preset: None / Vite
Build command: pnpm install --frozen-lockfile && pnpm --filter web build
Build output directory: apps/web/dist
Root directory: /
```

Environment variables:

```txt
VITE_API_BASE_URL=/api
VITE_APP_ENV=production
```

---

### 8.3 Recommended Frontend API Base URL

Use same-origin API:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
```

Production:

```txt
VITE_API_BASE_URL=/api
```

Staging:

```txt
VITE_API_BASE_URL=/api
```

Local:

```txt
VITE_API_BASE_URL=http://localhost:8787/api
```

---

### 8.4 Pages Preview Deployments

Cloudflare Pages supports preview deployments so new versions can be viewed before production. Use this for PR/develop testing when possible.

Recommended:

```txt
main branch -> production
develop branch -> staging/preview
feature branch -> preview only
```

Do not connect production directly to unfinished feature branches.

---

## 9. Backend Deployment - Cloudflare Workers

Backend stack:

```txt
Cloudflare Workers
Hono
TypeScript
Drizzle ORM
Cloudflare D1
Cloudflare R2
```

Workers routes can be configured in Cloudflare dashboard or Wrangler, and Cloudflare notes that a DNS record should exist before setting up a route for the domain/subdomain.

---

### 9.1 Worker Route Strategy

Production Worker route:

```txt
rmc.alfrzhb.com/api/*
```

Staging Worker route:

```txt
staging-rmc.alfrzhb.com/api/*
```

This ensures:

```txt
rmc.alfrzhb.com         -> Frontend Pages
rmc.alfrzhb.com/api/*   -> Worker API
```

---

### 9.2 Example wrangler.toml

Example for production Worker:

```toml
name = "ratama-tracker-api-production"
main = "src/index.ts"
compatibility_date = "2026-07-03"

routes = [
  { pattern = "rmc.alfrzhb.com/api/*", zone_name = "alfrzhb.com" }
]

[vars]
APP_ENV = "production"
APP_NAME = "Ratama Project & Finance Tracker"
ALLOWED_ORIGIN = "https://rmc.alfrzhb.com"

[[d1_databases]]
binding = "DB"
database_name = "rmc_production"
database_id = "<RMC_PRODUCTION_D1_DATABASE_ID>"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "rmc-production-files"
```

Example for staging Worker:

```toml
name = "ratama-tracker-api-staging"
main = "src/index.ts"
compatibility_date = "2026-07-03"

routes = [
  { pattern = "staging-rmc.alfrzhb.com/api/*", zone_name = "alfrzhb.com" }
]

[vars]
APP_ENV = "staging"
APP_NAME = "Ratama Project & Finance Tracker"
ALLOWED_ORIGIN = "https://staging-rmc.alfrzhb.com"

[[d1_databases]]
binding = "DB"
database_name = "rmc_staging"
database_id = "<RMC_STAGING_D1_DATABASE_ID>"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "rmc-staging-files"
```

Cloudflare's Wrangler configuration supports R2 bucket bindings through `r2_buckets`, with a `binding` name used by the Worker and a `bucket_name` pointing to the bucket.

---

### 9.3 One Worker with Environments

If using one Worker with environments, use:

```toml
name = "ratama-tracker-api"
main = "src/index.ts"
compatibility_date = "2026-07-03"

[vars]
APP_NAME = "Ratama Project & Finance Tracker"

[env.staging]
routes = [
  { pattern = "staging-rmc.alfrzhb.com/api/*", zone_name = "alfrzhb.com" }
]

[env.staging.vars]
APP_ENV = "staging"
ALLOWED_ORIGIN = "https://staging-rmc.alfrzhb.com"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "rmc_staging"
database_id = "<RMC_STAGING_D1_DATABASE_ID>"

[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "rmc-staging-files"

[env.production]
routes = [
  { pattern = "rmc.alfrzhb.com/api/*", zone_name = "alfrzhb.com" }
]

[env.production.vars]
APP_ENV = "production"
ALLOWED_ORIGIN = "https://rmc.alfrzhb.com"

[[env.production.d1_databases]]
binding = "DB"
database_name = "rmc_production"
database_id = "<RMC_PRODUCTION_D1_DATABASE_ID>"

[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "rmc-production-files"
```

Deploy staging:

```bash
pnpm --filter api wrangler deploy --env staging
```

Deploy production:

```bash
pnpm --filter api wrangler deploy --env production
```

Wrangler commands can be added as scripts in `package.json`, such as `wrangler deploy` and `wrangler dev`.

---

## 10. D1 Database Setup

Use separate D1 databases:

```txt
rmc_staging
rmc_production
```

Cloudflare D1 migrations are SQL files that can be created, listed, and applied with Wrangler.

---

### 10.1 Create D1 Databases

Example commands:

```bash
npx wrangler d1 create rmc_staging
npx wrangler d1 create rmc_production
```

After creating each database, copy the generated `database_id` into `wrangler.toml`.

---

### 10.2 Migration Directory

Recommended location:

```txt
packages/db/migrations
```

Alternative if Wrangler expects migrations inside API project:

```txt
apps/api/migrations
```

Choose one and keep it consistent.

Recommended:

```txt
apps/api/migrations
```

Reason:

```txt
Wrangler commands are usually executed from the Worker project directory.
```

---

### 10.3 Create Migration

Example:

```bash
cd apps/api
npx wrangler d1 migrations create rmc_staging init_schema
```

This creates a SQL migration file.

Put SQL schema from `database-schema.md` into the migration file.

---

### 10.4 Apply Migration Locally

Example:

```bash
cd apps/api
npx wrangler d1 migrations apply rmc_staging --local
```

Use local D1 for development.

Cloudflare D1 local development supports running migrations against a local database through Wrangler configuration.

---

### 10.5 Apply Migration to Staging

Example:

```bash
cd apps/api
npx wrangler d1 migrations apply rmc_staging --remote
```

Verify staging after migration.

---

### 10.6 Apply Migration to Production

Production migration must be manual and reviewed.

Example:

```bash
cd apps/api
npx wrangler d1 migrations apply rmc_production --remote
```

Cloudflare's D1 migration apply command applies unapplied migrations and prompts for confirmation in interactive use; in CI/CD the confirmation step is skipped, so production migrations should be handled carefully.

Production rules:

1. Review migration SQL before applying.
2. Backup/export before major migration.
3. Apply to staging first.
4. Test staging.
5. Apply to production.
6. Verify production.

---

## 11. R2 Storage Setup

Use separate buckets:

```txt
rmc-staging-files
rmc-production-files
```

Cloudflare R2 can be bound to Workers, and the Worker accesses the bucket via the configured binding.

---

### 11.1 Create R2 Buckets

Example:

```bash
npx wrangler r2 bucket create rmc-staging-files
npx wrangler r2 bucket create rmc-production-files
```

---

### 11.2 R2 Binding Names

Use same binding name across environments:

```txt
R2_BUCKET
```

Staging binding:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "rmc-staging-files"
```

Production binding:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "rmc-production-files"
```

---

### 11.3 File Storage Rules

1. Store file binary in R2.
2. Store file metadata in D1.
3. Do not make R2 bucket public.
4. Use backend download endpoint.
5. Validate permission before serving file.
6. Use max file size 5 MB in MVP.
7. Allow only PDF, JPG, JPEG, PNG, XLSX, DOCX.
8. Soft delete attachment metadata.
9. Do not immediately delete R2 object unless cleanup job exists.

---

## 12. Cloudflare Access Setup

Cloudflare Access protects the app before the user reaches frontend/API.

Create Access applications:

```txt
rmc.alfrzhb.com
staging-rmc.alfrzhb.com
```

Cloudflare's self-hosted Access app setup requires selecting a domain in an active Cloudflare zone.

---

### 12.1 Production Access Policy

Recommended policy:

```txt
Application: rmc.alfrzhb.com
Action: Allow
Selector: Emails
Value: selected Ratama emails
```

Example allowed emails:

```txt
ayah@example.com
finance@example.com
staff@example.com
```

Cloudflare Access Allow policies permit users who meet configured criteria, such as specific emails or email domains, to reach the protected application.

---

### 12.2 Staging Access Policy

Recommended policy:

```txt
Application: staging-rmc.alfrzhb.com
Action: Allow
Selector: Emails
Value: developer and owner test emails only
```

Staging should be more restricted than production.

---

### 12.3 Backend User Mapping

Cloudflare Access allows access to the domain, but the app must still check internal users.

Backend rule:

```txt
Cloudflare Access authenticated email
|
v
Find user in users table
|
v
Check user.status = ACTIVE
|
v
Attach user role
|
v
Authorize endpoint
```

Cloudflare's Access application token includes an email field for the authenticated user, verified by the identity provider.

---

### 12.4 Access Safety Rules

1. Do not rely only on Cloudflare Access for authorization.
2. Use Cloudflare Access for identity gate.
3. Use app RBAC for internal permissions.
4. Block users not present in `users` table.
5. Block inactive/suspended users.
6. Test unauthorized access before production.
7. Test staff role cannot access finance endpoints.

---

## 13. Environment Variables and Secrets

Workers support environment variables and secrets through the dashboard or Wrangler. Cloudflare documents adding Worker variables through Workers & Pages settings and secrets through `wrangler secret put`.

---

### 13.1 Frontend Environment Variables

Production:

```txt
VITE_API_BASE_URL=/api
VITE_APP_ENV=production
VITE_APP_NAME=Ratama Project & Finance Tracker
```

Staging:

```txt
VITE_API_BASE_URL=/api
VITE_APP_ENV=staging
VITE_APP_NAME=Ratama Project & Finance Tracker Staging
```

Local:

```txt
VITE_API_BASE_URL=http://localhost:8787/api
VITE_APP_ENV=local
VITE_APP_NAME=Ratama Project & Finance Tracker Local
```

Cloudflare Pages environment variables can be configured in the Pages project settings.

---

### 13.2 Backend Variables

Production:

```txt
APP_ENV=production
APP_NAME=Ratama Project & Finance Tracker
ALLOWED_ORIGIN=https://rmc.alfrzhb.com
MAX_UPLOAD_SIZE_MB=5
```

Staging:

```txt
APP_ENV=staging
APP_NAME=Ratama Project & Finance Tracker
ALLOWED_ORIGIN=https://staging-rmc.alfrzhb.com
MAX_UPLOAD_SIZE_MB=5
```

Local:

```txt
APP_ENV=local
APP_NAME=Ratama Project & Finance Tracker
ALLOWED_ORIGIN=http://localhost:5173
MAX_UPLOAD_SIZE_MB=5
```

---

### 13.3 Secrets

For MVP, avoid unnecessary secrets.

Potential future secrets:

```txt
EMAIL_API_KEY
WHATSAPP_API_KEY
EXPORT_SIGNING_SECRET
```

Do not commit secrets to GitHub.

Local secrets can use:

```txt
apps/api/.dev.vars
```

Example:

```txt
APP_ENV=local
ALLOWED_ORIGIN=http://localhost:5173
```

Cloudflare notes that local Worker secrets can be placed in `.dev.vars` or `.env`, and if `.dev.vars` exists, `.env` values are not included.

---

## 14. Local Development Setup

### 14.1 Install Dependencies

From repo root:

```bash
pnpm install
```

---

### 14.2 Run Frontend Locally

```bash
pnpm --filter web dev
```

Expected:

```txt
http://localhost:5173
```

---

### 14.3 Run API Locally

```bash
pnpm --filter api dev
```

Expected:

```txt
http://localhost:8787/api/health
```

---

### 14.4 Local API Test

```bash
curl http://localhost:8787/api/health
```

Expected:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "ratama-tracker-api"
  }
}
```

---

## 15. Package Scripts

Recommended root `package.json` scripts:

```json
{
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "build:web": "pnpm --filter web build",
    "build:api": "pnpm --filter api build",
    "deploy:api:staging": "pnpm --filter api wrangler deploy --env staging",
    "deploy:api:production": "pnpm --filter api wrangler deploy --env production",
    "db:migrate:local": "pnpm --filter api wrangler d1 migrations apply rmc_staging --local",
    "db:migrate:staging": "pnpm --filter api wrangler d1 migrations apply rmc_staging --remote",
    "db:migrate:production": "pnpm --filter api wrangler d1 migrations apply rmc_production --remote",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

Adjust script names if the package names differ.

---

## 16. Staging Deployment Flow

Use staging before production.

### 16.1 Staging Deployment Steps

```txt
1. Merge feature branch into develop.
2. Run local typecheck and lint.
3. Run local build.
4. Deploy frontend to staging Pages.
5. Deploy API to staging Worker.
6. Apply D1 migration to staging.
7. Verify staging Access policy.
8. Test complete business flow.
9. Fix bugs before production.
```

---

### 16.2 Staging Commands

Build frontend:

```bash
pnpm build:web
```

Deploy API staging:

```bash
pnpm deploy:api:staging
```

Apply staging migration:

```bash
pnpm db:migrate:staging
```

---

### 16.3 Staging Test Checklist

Test these scenarios:

```txt
Login through Cloudflare Access
GET /api/auth/me
Create client
Create contact
Create opportunity
Add opportunity log
Set opportunity to WON
Convert opportunity to project
Add project activity
Create invoice
Mark invoice sent
Add partial payment
Add final payment
Create payable
Mark payable paid
Upload attachment
Check dashboard
Export report
Check audit logs
```

---

## 17. Production Deployment Flow

Production deployment must be stricter.

### 17.1 Production Deployment Steps

```txt
1. Confirm staging is stable.
2. Review database migration.
3. Export/backup production database if existing data exists.
4. Merge develop into main.
5. Deploy frontend production.
6. Deploy API production.
7. Apply production D1 migration manually.
8. Verify Cloudflare Access production policy.
9. Test production health endpoint.
10. Test login with owner account.
11. Test one non-destructive read operation.
12. Monitor errors.
```

---

### 17.2 Production Commands

Deploy API production:

```bash
pnpm deploy:api:production
```

Apply production migration:

```bash
pnpm db:migrate:production
```

Production migration should not be automatic in early MVP.

Recommended:

```txt
Manual migration approval only.
```

---

## 18. Migration Rules

### 18.1 Migration Order

Always apply migrations in this order:

```txt
local
|
v
staging
|
v
production
```

Never apply new migration directly to production.

---

### 18.2 Safe Migration Rules

Safe:

```txt
Create new table
Add nullable column
Add index
Add new enum-like value if app supports it
```

Risky:

```txt
Drop table
Drop column
Rename column
Change column type
Add NOT NULL column without default
Change status values
Change finance calculation logic
```

For risky migrations:

```txt
1. Backup database.
2. Create migration plan.
3. Test on staging.
4. Verify data.
5. Deploy code that supports both old and new structure if needed.
6. Migrate production.
7. Verify production.
```

---

### 18.3 Production Migration Checklist

Before production migration:

```txt
Migration reviewed.
Migration tested on local.
Migration tested on staging.
Staging data verified.
Backup/export done.
Rollback plan known.
No active user input during migration if risky.
```

After production migration:

```txt
Check /api/health.
Check /api/auth/me.
Check dashboard.
Check important table list.
Check invoice/payment calculation.
Check attachment access.
```

---

## 19. Backup Strategy

Backup is mandatory because this system stores business and finance data.

### 19.1 Minimum Backup Schedule

```txt
Weekly D1 export
Monthly full archive
Manual backup before major migration
Regular AR/AP export
Important files copied outside R2 if needed
```

---

### 19.2 Backup Targets

Back up:

```txt
D1 database
R2 files metadata
Important R2 files
Exported reports
Deployment config
wrangler.toml
Migration files
```

---

### 19.3 Backup Location

Recommended backup locations:

```txt
Local encrypted folder
Google Drive restricted folder
External drive
Private GitHub release/artifact for non-sensitive schema only
```

Do not store sensitive production data in a public repository.

---

### 19.4 Backup Naming Convention

```txt
rmc-production-db-backup-YYYY-MM-DD.sql
rmc-production-ar-report-YYYY-MM-DD.xlsx
rmc-production-ap-report-YYYY-MM-DD.xlsx
```

Example:

```txt
rmc-production-db-backup-2026-07-03.sql
```

---

## 20. Rollback Strategy

Rollback must cover frontend, backend, and database.

### 20.1 Frontend Rollback

If frontend deployment breaks:

```txt
Rollback Cloudflare Pages deployment to previous successful build.
```

Rules:

1. Keep last working deployment.
2. Do not deploy untested UI to production.
3. Test API compatibility after rollback.

---

### 20.2 API Rollback

If API deployment breaks:

```txt
Rollback Worker to previous working version/deployment.
```

Rules:

1. Keep previous API version compatible with current database.
2. Avoid deploying API that requires migration before migration is applied.
3. Avoid migration that breaks previous API unless carefully planned.

---

### 20.3 Database Rollback

Database rollback is more sensitive.

Rules:

1. Prefer forward-fix migrations.
2. Do not rely on easy rollback for destructive changes.
3. Backup before risky migration.
4. Avoid dropping columns/tables in MVP.
5. Use additive migrations.

Recommended safe approach:

```txt
Add new column/table first.
Deploy app using new column/table.
Verify.
Only remove old column/table in later version if necessary.
```

---

## 21. Security Checklist

### 21.1 Cloudflare Access

Check:

```txt
Production domain protected.
Staging domain protected.
Only allowed emails can login.
Unauthorized email is blocked.
Access policy is not too broad.
```

Avoid:

```txt
Allow all Gmail users
Allow public access
Allow wildcard domain without approval
```

---

### 21.2 Backend RBAC

Check:

```txt
STAFF cannot access all finance data.
STAFF cannot create invoice.
STAFF cannot create payment.
FINANCE can manage invoice/payment/AP.
PROJECT_MANAGER can manage assigned projects.
OWNER can access all.
Inactive user is blocked.
Unknown Access-authenticated user is blocked.
```

---

### 21.3 File Security

Check:

```txt
R2 bucket is not public.
Download endpoint checks permission.
Upload endpoint checks file size.
Upload endpoint checks MIME type.
File metadata stored in D1.
File binary stored in R2.
```

---

### 21.4 Finance Safety

Check:

```txt
Invoice cannot be hard deleted.
Payment cannot be hard deleted.
Payable cannot be hard deleted.
Cancel reason required.
Amount stored as integer.
Audit log created for finance actions.
```

---

## 22. Monitoring and Observability

For MVP, keep monitoring simple.

### 22.1 What to Monitor

```txt
Worker errors
Failed API requests
Failed uploads
D1 query failures
R2 upload/download failures
Auth failures
Dashboard calculation bugs
Migration failures
```

---

### 22.2 Manual Monitoring

In early MVP:

```txt
Check Cloudflare Worker logs.
Check failed API response.
Check dashboard numbers.
Check audit logs.
Check storage usage.
```

---

### 22.3 Error Logging Rule

Backend should not expose internal stack traces to users.

Production error response:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error."
  }
}
```

Development can show more detail.

---

## 23. CORS Strategy

Because the app uses same-origin API, CORS should be minimal.

Production:

```txt
Frontend: https://rmc.alfrzhb.com
API: https://rmc.alfrzhb.com/api/*
```

Staging:

```txt
Frontend: https://staging-rmc.alfrzhb.com
API: https://staging-rmc.alfrzhb.com/api/*
```

Local development may need CORS:

```txt
Frontend: http://localhost:5173
API: http://localhost:8787
```

Allowed local origin:

```txt
http://localhost:5173
```

Do not allow:

```txt
*
```

in production.

---

## 24. Production Readiness Checklist

Before first production release:

```txt
[ ] Production domain rmc.alfrzhb.com configured.
[ ] Staging domain staging-rmc.alfrzhb.com configured.
[ ] Cloudflare Pages production deployed.
[ ] Cloudflare Pages staging deployed.
[ ] Worker production route works.
[ ] Worker staging route works.
[ ] D1 production database created.
[ ] D1 staging database created.
[ ] R2 production bucket created.
[ ] R2 staging bucket created.
[ ] Cloudflare Access production app configured.
[ ] Cloudflare Access staging app configured.
[ ] Owner user seeded in production.
[ ] /api/health works.
[ ] /api/auth/me works.
[ ] RBAC works.
[ ] Client CRUD works.
[ ] Opportunity CRUD works.
[ ] Convert opportunity to project works.
[ ] Project activity works.
[ ] Invoice/payment calculation works.
[ ] AP tracking works.
[ ] Attachment upload/download works.
[ ] Dashboard summary works.
[ ] Audit log works.
[ ] Export/report works.
[ ] Backup procedure documented.
[ ] Rollback procedure known.
```

---

## 25. First Production Seed

Production must start with at least one owner user.

Seed user:

```txt
email: <OWNER_EMAIL>
name: Owner Ratama
role: OWNER
status: ACTIVE
```

Important:

```txt
The email must match the email authenticated through Cloudflare Access.
```

Optional initial users:

```txt
Finance user
Project manager user
Staff user
```

Do not create too many users before role permissions are tested.

---

## 26. Deployment Order for First MVP

Recommended first deployment order:

```txt
1. Deploy staging frontend.
2. Deploy staging API.
3. Apply staging database migration.
4. Configure staging R2.
5. Configure staging Access.
6. Seed staging owner user.
7. Test full staging flow.
8. Fix issues.
9. Deploy production frontend.
10. Deploy production API.
11. Apply production database migration.
12. Configure production R2.
13. Configure production Access.
14. Seed production owner user.
15. Test production login.
16. Test production read operations.
17. Start limited real usage.
```

---

## 27. Limited Real Usage Strategy

Do not immediately move all company workflow into the system.

Use limited rollout:

```txt
Week 1:
Use for 1-2 sample projects.

Week 2:
Use for active opportunities and project activity.

Week 3:
Start using invoice/payment tracking.

Week 4:
Start using AP/project cost tracking.
```

Goal:

```txt
Validate business flow before depending fully on the system.
```

---

## 28. Common Deployment Mistakes to Avoid

Avoid:

```txt
Using same D1 database for staging and production.
Using same R2 bucket for staging and production.
Leaving staging public.
Leaving production public.
Allowing all emails in Cloudflare Access.
Hardcoding API URL to localhost.
Storing secrets in GitHub.
Applying production migration before staging.
Deploying frontend that expects API changes not deployed yet.
Deploying API that expects database migration not applied yet.
Deleting invoice/payment/AP data.
Making R2 bucket public.
Skipping audit logs.
```

---

## 29. Recommended Deployment Scripts

Root `package.json` example:

```json
{
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "build:web": "pnpm --filter web build",
    "build:api": "pnpm --filter api build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "deploy:api:staging": "pnpm --filter api wrangler deploy --env staging",
    "deploy:api:production": "pnpm --filter api wrangler deploy --env production",
    "db:migrate:local": "pnpm --filter api wrangler d1 migrations apply rmc_staging --local",
    "db:migrate:staging": "pnpm --filter api wrangler d1 migrations apply rmc_staging --remote",
    "db:migrate:production": "pnpm --filter api wrangler d1 migrations apply rmc_production --remote"
  }
}
```

---

## 30. Final Deployment Decision

Final recommended deployment setup:

```txt
Frontend:
Cloudflare Pages

Backend:
Cloudflare Workers

Database:
Cloudflare D1

Storage:
Cloudflare R2

Auth Gate:
Cloudflare Access

Production Domain:
rmc.alfrzhb.com

Staging Domain:
staging-rmc.alfrzhb.com

API Pattern:
same-origin /api/*
```

This deployment model is selected because it is:

1. Simple.
2. Low-cost.
3. Suitable for internal company system.
4. Good for web dashboard.
5. Compatible with Cloudflare ecosystem.
6. Easier to maintain by solo developer.
7. Safe enough if Access, RBAC, audit log, backup, and migration rules are followed.

---

## 31. Official Reference Notes

The deployment assumptions in this document are based on official Cloudflare documentation:

1. Cloudflare Pages build configuration and Vite deployment use a build command and output directory such as `dist`.
2. Workers routes can be configured for domain patterns such as `rmc.alfrzhb.com/api/*`, and the domain/subdomain should have DNS set up first.
3. D1 migrations are versioned SQL migration files managed and applied with Wrangler.
4. R2 buckets can be bound to Workers through Wrangler configuration and accessed from Worker code through the binding.
5. Cloudflare Access can protect self-hosted web applications using policies such as email-based Allow rules.
6. Worker variables and secrets can be configured through Cloudflare dashboard or Wrangler.


