# Ratama Project & Finance Tracker - Tech Stack

## Active MVP Architecture

```text
User
-> Cloudflare Access
-> Cloudflare Pages
-> Cloudflare Workers
-> Cloudflare D1
```

The MVP uses Cloudflare for hosting, API runtime, authentication gate, and database. The app does not store binary documents in the platform.

## Final Active Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | Web app |
| Styling | Tailwind CSS | UI styling |
| UI primitives | shadcn-compatible components | Consistent app controls |
| Backend | Hono on Cloudflare Workers | API layer |
| Database | Cloudflare D1 | Main relational data store |
| ORM/schema | Drizzle ORM | Typed schema source |
| Validation | Zod | Request validation |
| Auth gate | Cloudflare Access | Protect internal app access |
| Web hosting | Cloudflare Pages | Frontend deployment |
| Document storage | Google Drive/OneDrive/external URL | Physical document storage outside the app |

## Document Storage Strategy

MVP uses External Document Link Management.

Files such as proposals, contracts, SPK, PO, invoice PDFs, payment proofs, AP proofs, and project documents are uploaded manually to Google Drive, OneDrive, Dropbox, or another approved external location.

The application stores only:

- linked entity type
- linked entity id
- document kind
- title
- external URL
- provider
- notes
- audit metadata

The metadata is stored in Cloudflare D1 in the `document_links` table.

## Not Active In MVP

Cloudflare R2 is not part of the active MVP architecture. There is no bucket binding, no bucket setup, and no binary upload endpoint in the active application. It can be reconsidered later as an optional future storage layer only after a separate architecture decision.

## Backend Responsibilities

The Worker API owns all business logic:

- health checks
- D1 queries
- request validation
- document link CRUD
- linked entity existence checks
- permission checks through Cloudflare Access and the app user model
- consistent API error responses

Frontend code must not access D1 directly.

## Core API Areas

Current and planned API modules:

- `/api/health`
- `/api/auth/me`
- `/api/users`
- `/api/clients`
- `/api/document-links`
- clients
- opportunities
- projects
- invoices
- payments
- payables
- users and access identity
- audit logs

The legacy binary upload route is disabled:

- `POST /api/attachments/upload` returns `FILE_UPLOAD_DISABLED`

`GET /api/me` exists only as a temporary compatibility alias for `/api/auth/me`.

## Database Modules

Active database tables include:

- users
- clients
- client_contacts
- opportunities
- opportunity_logs
- projects
- project_members
- project_activities
- invoices
- payments
- payables
- document_links
- audit_logs

The old `attachments` table from migration `0001` may exist in environments where it was already applied, but it is legacy and not used by the MVP API.

## Environment Configuration

Worker environments use:

```toml
APP_ENV = "staging"
APP_NAME = "Ratama Project & Finance Tracker"
ALLOWED_ORIGIN = "https://staging-rmc.alfrzhb.com"
ENABLE_FILE_UPLOADS = "false"
DOCUMENT_STORAGE_MODE = "external_link"
```

Required Worker binding:

```toml
[[env.staging.d1_databases]]
binding = "DB"
database_name = "rmc_staging"
database_id = "..."
migrations_dir = "../../packages/db/migrations"
```

No document storage bucket binding is required for MVP.

## Deployment Targets

| Environment | Frontend | API | Database |
| --- | --- | --- | --- |
| Local | Vite dev server | Wrangler dev | Local D1 |
| Staging | Cloudflare Pages | Worker staging | `rmc_staging` |
| Production | Cloudflare Pages | Worker production | `rmc_production` |

Production deployment is held until staging is tested and production D1 is explicitly configured.
