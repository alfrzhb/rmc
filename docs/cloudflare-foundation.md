# Cloudflare Foundation - Phase 2

Dokumen ini adalah checklist operasional untuk menjalankan Phase 2 setelah repo siap.

## 1. Login Cloudflare

```bash
pnpm cf:login
pnpm cf:whoami
```

## 2. Create D1 Databases

```bash
pnpm db:create:staging
pnpm db:create:production
```

Setelah command selesai, salin `database_id` ke:

```txt
apps/api/wrangler.toml
```

Field yang harus diganti:

```txt
<RMC_STAGING_D1_DATABASE_ID>
<RMC_PRODUCTION_D1_DATABASE_ID>
```

## 3. Create R2 Buckets

```bash
pnpm r2:create:staging
pnpm r2:create:production
```

Bucket yang dipakai:

```txt
rmc-staging-files
rmc-production-files
```

## 4. Cloudflare Pages

Recommended Pages projects:

```txt
ratama-tracker-web-staging
ratama-tracker-web-production
```

Build settings:

```txt
Build command: pnpm build:web
Build output directory: apps/web/dist
Root directory: /
```

Environment variables:

```txt
VITE_API_BASE_URL=/api
VITE_APP_ENV=staging or production
VITE_APP_NAME=Ratama Project & Finance Tracker
```

Deploy from local after project exists:

```bash
pnpm deploy:web:staging
pnpm deploy:web:production
```

## 5. Cloudflare Workers

Routes are already configured in:

```txt
apps/api/wrangler.toml
```

Staging:

```txt
staging-rmc.alfrzhb.com/api/*
```

Production:

```txt
rmc.alfrzhb.com/api/*
```

Deploy:

```bash
pnpm deploy:api:staging
pnpm deploy:api:production
```

## 6. Cloudflare Access

Create Access applications for:

```txt
rmc.alfrzhb.com
staging-rmc.alfrzhb.com
```

Initial policy:

```txt
Action: Allow
Selector: Emails
Value: owner/admin emails only
```

Safety rules:

1. Keep deny-by-default behavior.
2. Do not allow wildcard public access.
3. Add staff emails only after RBAC is ready.
4. Backend must still check internal user role.

## 7. Phase 2 Verification

Local checks:

```bash
pnpm lint
pnpm typecheck
pnpm build:web
pnpm build:api
pnpm dev:api
```

Health endpoint:

```txt
http://127.0.0.1:8787/api/health
```

Expected:

```json
{"status":"ok","service":"ratama-tracker-api"}
```

Staging checks after deploy:

```txt
https://staging-rmc.alfrzhb.com
https://staging-rmc.alfrzhb.com/api/health
```

Production checks after deploy:

```txt
https://rmc.alfrzhb.com
https://rmc.alfrzhb.com/api/health
```
