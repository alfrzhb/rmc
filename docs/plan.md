# Ratama Project & Finance Tracker - Implementation Plan

## Current Position

The project has completed Phase 15 staging verification and the pre-production Users Management refinement. Backend foundation APIs are implemented, the frontend supports the main module workflows, staging browser verification passed, and Settings now includes OWNER/ADMIN-only Users Management.

D1 staging has been created and migrations have been applied. Production has not been deployed. Production D1, production DNS, and production deployment remain blocked until explicit confirmation.

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

Status: completed for local and staging foundation; production remains blocked until approval.

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

Status: completed for active MVP schema.

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

Status: completed for backend foundation and pre-production Users Management UI.

Implement Cloudflare Access identity handling and app-level user records.

Acceptance criteria:

- Access email is read from Worker headers.
- Users table maps Access identity to app role.
- Inactive users cannot use protected APIs.
- OWNER and ADMIN can manage app users from Settings.
- STAFF cannot access Users Management.
- User records are manually created by OWNER/ADMIN; self-registration is not allowed.

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

Pre-production UI refinement:

- Settings -> Users Management lists app users.
- OWNER/ADMIN can create users.
- OWNER/ADMIN can edit user email, name, role, and status.
- UI role options are limited to `OWNER`, `ADMIN`, and `STAFF`.
- UI status options are limited to `ACTIVE` and `INACTIVE`.
- OWNER/ADMIN can deactivate or soft delete users after confirmation.
- Unregistered Access identities see: `Akun Anda belum terdaftar di aplikasi. Hubungi OWNER/ADMIN.`

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

Status: completed for backend foundation.

Implement opportunity CRUD, status transitions, and opportunity logs.

Implemented API:

```text
GET    /api/opportunities
GET    /api/opportunities/:id
POST   /api/opportunities
PUT    /api/opportunities/:id
DELETE /api/opportunities/:id
GET    /api/opportunities/:opportunityId/logs
GET    /api/opportunities/:opportunityId/logs/:logId
POST   /api/opportunities/:opportunityId/logs
PUT    /api/opportunities/:opportunityId/logs/:logId
DELETE /api/opportunities/:opportunityId/logs/:logId
```

Acceptance criteria:

- Active users can manage opportunities.
- Opportunity list supports search, client filter, PIC filter, status filter, and pagination.
- Create/update validates linked client exists.
- Create/update validates PIC user exists and is active.
- `WON` opportunity requires `deal_amount`.
- Opportunity log CRUD works and stores the active user as `user_id`.
- Delete uses soft delete for opportunity and logs.

## Phase 7 - Projects

Status: completed for backend foundation.

Implement project CRUD, project members, project activities, and progress tracking.

Implemented API:

```text
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/:projectId/members
GET    /api/projects/:projectId/members/:memberId
POST   /api/projects/:projectId/members
PUT    /api/projects/:projectId/members/:memberId
DELETE /api/projects/:projectId/members/:memberId
GET    /api/projects/:projectId/activities
GET    /api/projects/:projectId/activities/:activityId
POST   /api/projects/:projectId/activities
PUT    /api/projects/:projectId/activities/:activityId
DELETE /api/projects/:projectId/activities/:activityId
```

Acceptance criteria:

- Active users can manage projects.
- Project list supports search, client filter, PIC filter, status filter, and pagination.
- Create/update validates linked client exists.
- Create/update validates PIC user exists and is active.
- Optional opportunity must exist and belong to the selected client.
- Project member CRUD works and validates active users.
- Project activity CRUD works and stores current user as `user_id`.
- Activity `progress_snapshot` updates project `progress_percentage`.
- Delete uses soft delete for project, members, and activities.

## Phase 8 - Finance

Status: completed for backend foundation.

Implement invoices, payments, and payables.

Implemented API:

```text
GET    /api/invoices
GET    /api/invoices/:id
POST   /api/invoices
PUT    /api/invoices/:id
DELETE /api/invoices/:id
GET    /api/payments
GET    /api/payments/:id
POST   /api/payments
PUT    /api/payments/:id
DELETE /api/payments/:id
GET    /api/payables
GET    /api/payables/:id
POST   /api/payables
PUT    /api/payables/:id
DELETE /api/payables/:id
```

Acceptance criteria:

- Active users can manage invoices, payments, and payables.
- Invoice create/update validates project exists and derives client from project.
- Payment create/update validates invoice exists and derives project/client from invoice.
- Valid payments update invoice status to `PARTIALLY_PAID` or `PAID`.
- Payable can optionally be linked to a project.
- Delete uses soft delete.

## Phase 9 - Dashboard

Status: completed for backend foundation.

Implement summary cards, receivable overview, payable overview, overdue items, and project status summary.

Implemented API:

```text
GET /api/dashboard/summary
```

Acceptance criteria:

- Active users can access dashboard summary.
- Summary includes active/prospect clients.
- Summary includes open/won opportunities.
- Summary includes active/overdue projects.
- Receivable overview includes invoiced, paid, outstanding, and overdue amount.
- Payable overview includes unpaid and overdue amount.
- Status summary includes opportunities, projects, invoices, and payables.
- Overdue item lists include overdue invoices and overdue payables.

## Phase 10 - Document Link Module

Status: completed for backend foundation.

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

Active backend scope:

```text
GET /api/audit-logs
```

Tracked actions:

- `CREATE`
- `UPDATE`
- `DELETE`
- `TRANSITION`
- `FINANCE`

Acceptance criteria:

- Create, update, delete, transition, and finance mutations write audit logs.
- Audit logs store actor user, entity type, entity id, action, old value, new value, IP address, user agent, and created timestamp.
- `/api/audit-logs` supports pagination and filters for actor, entity, and action.
- `/api/audit-logs` is restricted to `OWNER` and `ADMIN`.

## Phase 12 - Frontend Shell

Build navigation, layout, auth state, and placeholder pages.

Acceptance criteria:

- React app has a protected application shell layout.
- Sidebar and mobile navigation are available.
- Frontend uses `GET /api/auth/me` for current user state.
- Login check page shows current user mapping status.
- Core module pages exist for dashboard, clients, opportunities, projects, finance, settings/users, and document-related workflows. Reports remains a placeholder refinement.
- Local Vite dev can proxy `/api` requests to the local Worker.

## Phase 13 - Frontend Modules

Build client, opportunity, project, finance, dashboard, and document link screens.

Acceptance criteria:

- Dashboard screen reads `/api/dashboard/summary`.
- Clients screen can list, create, and delete clients.
- Opportunities screen can list, create, and delete opportunities.
- Projects screen can list, create, and delete projects.
- Invoices, payments, and payables screens can list, create, and delete finance records.
- Document Links screen can list, create, and delete external document links.
- Screens use `/api/auth/me` identity through the frontend shell.
- MVP UI does not expose binary upload or R2 features.
- Settings exposes Users Management for OWNER/ADMIN.

## Phase 13.5 - Pre-production Users Management Refinement

Status: completed on 2026-07-05.

Scope:

- Audit existing Users API.
- Build Settings -> Users Management UI.
- Restrict Users Management UI to OWNER and ADMIN.
- Keep Cloudflare Access as the authentication gate.
- Keep app-level role/status in the `users` table.
- Prevent free self-registration by requiring OWNER/ADMIN-created user records.

Implemented UI:

- User list.
- Create user.
- Edit user.
- Change role.
- Change status between `ACTIVE` and `INACTIVE`.
- Deactivate user.
- Soft delete user after confirmation.
- Access help text explaining Cloudflare Access plus app registration.
- Clear unregistered-user message in the app shell.

Verification:

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm build:web` passed.
- `pnpm build:api` passed.
- Local Users API test passed:
  - OWNER can list users.
  - OWNER can create users.
  - OWNER can edit role/status.
  - OWNER can soft delete/deactivate users.
  - STAFF cannot access Users Management API.
  - INACTIVE users cannot use protected APIs.

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

Local automation:

- `pnpm test:phase14:local` applies local D1 migrations, starts the local Worker if needed, and runs the Phase 14 smoke suite.
- The smoke suite covers health, user access, client CRUD, opportunity update flow, project update flow, invoice/payment sync, payable update flow, and Document Link CRUD.

## Phase 15 - Staging Deployment

Status: completed on 2026-07-05.

Completed:

- Staging D1 migration command ran successfully; no migrations were pending.
- Worker staging deployed to `ratama-tracker-api-staging`.
- Cloudflare Pages project `ratama-tracker-web-staging` was created.
- Pages staging deployed and responds at `https://ratama-tracker-web-staging.pages.dev`.
- Custom domain `staging-rmc.alfrzhb.com` works.
- Worker route `staging-rmc.alfrzhb.com/api/*` works.
- Cloudflare Access works.
- `/api/health` works.
- `/api/auth/me` works for `usr_owner_001 / v60code@gmail.com / OWNER / ACTIVE`.
- Dashboard and critical CRUD flows passed manual browser verification.

Tasks:

1. Apply D1 staging migrations.
2. Deploy Worker staging.
3. Deploy Pages staging.
4. Configure Cloudflare Access for staging.
5. Test `/api/health`.
6. Test Document Link CRUD.

Do not change DNS, nameserver, staging settings, or production settings without confirmation.

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
