# Ratama Project & Finance Tracker - Implementation Plan

## Current Position

The project is around Phase 3. Local schema and migration `0001` already exist. D1 staging has been created and migration `0001` has been applied. Production has not been deployed. DNS, nameserver, and domain settings must not be changed without confirmation.

## Active MVP Architecture

```text
Cloudflare Pages + Cloudflare Workers + Cloudflare D1 + Cloudflare Access
```

Document management uses external document links. The app stores document metadata and URLs in D1.

## MVP Modules

1. Authentication gate with Cloudflare Access
2. User and role model
3. Client management
4. Opportunity management
5. Project management
6. Project activity management
7. Invoice management
8. Payment management
9. Payable management
10. Document Link Management
11. Audit logs
12. Dashboard and reports

## Phase 1 - Project Foundation

Status: completed.

Scope:

- monorepo setup
- frontend app
- Worker API app
- shared package
- validation package
- db package
- lint, typecheck, and build scripts

## Phase 2 - Cloudflare Foundation

Status: in progress.

Scope:

- Wrangler login
- D1 staging database
- D1 production database when approved
- Cloudflare Access planning
- Cloudflare Pages planning
- Worker environment planning

### Phase 2.1 D1 Setup

Staging D1:

```text
database_name = rmc_staging
binding = DB
```

Production D1 will be created only when requested:

```bash
npx wrangler d1 create rmc_production
```

### Phase 2.2 Worker Environment

Worker uses the D1 binding `DB`.

Environment variables:

```toml
ENABLE_FILE_UPLOADS = "false"
DOCUMENT_STORAGE_MODE = "external_link"
```

### Phase 2.3 External Document Link Strategy

The MVP does not include binary file upload.

Tasks:

1. Store document metadata in D1.
2. Store external URL in D1.
3. Validate URL format.
4. Validate linked entity exists.
5. Validate user has access to linked entity.
6. Provide document link CRUD API.

Acceptance criteria:

- User can add an external document link.
- User can list document links by linked entity.
- User can update document metadata and URL.
- User can soft delete a document link.
- Worker deploy does not require any document storage bucket binding.

## Phase 3 - Database Schema

Status: in progress.

`0001_initial_schema.sql` exists and has already been applied to staging.

Do not rewrite `0001` for remote changes. Add new migrations for architecture changes.

New migration:

```text
packages/db/migrations/0002_document_links_no_r2.sql
```

The active document table is:

```text
document_links
```

The legacy `attachments` table may remain from `0001`, but it is not used by active MVP routes.

## Phase 4 - Access and Users

Status: completed for backend foundation.

Implement Cloudflare Access identity handling and app-level user records.

Acceptance criteria:

- Access email is read from Worker headers.
- Users table maps Access identity to app role.
- Inactive users cannot use protected APIs.

Implemented API:

```text
GET    /api/auth/me
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

Temporary alias:

```text
GET    /api/me
```

New frontend code must use `GET /api/auth/me`.

Protected APIs require a registered active user matching the Cloudflare Access email header:

```text
cf-access-authenticated-user-email
```

## Phase 5 - Clients

Status: completed for backend foundation.

Implement client CRUD and contacts.

Implemented API:

```text
GET    /api/clients
GET    /api/clients/:id
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id
GET    /api/clients/:clientId/contacts
GET    /api/clients/:clientId/contacts/:contactId
POST   /api/clients/:clientId/contacts
PUT    /api/clients/:clientId/contacts/:contactId
DELETE /api/clients/:clientId/contacts/:contactId
```

Acceptance criteria:

- Active users can manage clients.
- Client list supports search, status filter, industry filter, and pagination.
- Client contact CRUD works.
- A client can have only one primary active contact.
- Delete uses soft delete.

## Phase 6 - Opportunities

Implement opportunity CRUD, status transitions, and opportunity logs.

## Phase 7 - Projects

Implement project CRUD, project members, project activities, and progress tracking.

## Phase 8 - Finance

Implement invoices, payments, and payables.

## Phase 9 - Dashboard

Implement summary cards, receivable overview, payable overview, overdue items, and project status summary.

## Phase 10 - Document Link Module

Former Attachment Management is replaced by Document Link Management.

API:

```text
GET    /api/document-links
GET    /api/document-links/:id
POST   /api/document-links
PUT    /api/document-links/:id
DELETE /api/document-links/:id
```

Legacy upload route:

```text
POST /api/attachments/upload
```

returns `FILE_UPLOAD_DISABLED`.

Acceptance criteria:

- Document Link CRUD works.
- Linked entity exists before create/update.
- URL is valid.
- Metadata and URL are stored in D1.
- No binary file upload is required.

## Phase 11 - Audit Logs

Track important create, update, delete, transition, and finance actions.

## Phase 12 - Frontend Shell

Build navigation, layout, auth state, and placeholder pages.

## Phase 13 - Frontend Modules

Build client, opportunity, project, finance, dashboard, and document link screens.

## Phase 14 - Testing

Test critical flows:

- health check
- D1 migration
- user access
- client CRUD
- opportunity flow
- project flow
- invoice and payment flow
- payable flow
- Document Link CRUD

## Phase 15 - Staging Deployment

Tasks:

1. Apply D1 staging migrations.
2. Deploy Worker staging.
3. Deploy Pages staging.
4. Configure Cloudflare Access for staging.
5. Test `/api/health`.
6. Test Document Link CRUD.

Do not change DNS, nameserver, or production settings without confirmation.

## Phase 16 - Production Preparation

Tasks:

1. Create production D1 when approved.
2. Add production D1 database ID to `wrangler.toml`.
3. Apply production migration only after confirmation.
4. Deploy production Worker only after staging is approved.
5. Deploy production Pages only after staging is approved.

## Phase 17 - Maintenance

Monitor:

- Worker errors
- D1 query and storage usage
- failed requests
- broken external document links
- Access login issues

Backups:

- D1 export strategy
- critical external document provider backup policy handled outside the app

## Final Summary

The MVP target is a Cloudflare Pages, Workers, D1, and Access application with document files managed as external links. The application stores business data and document link metadata in D1 and does not require binary file storage in the active deployment.
