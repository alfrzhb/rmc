# Tech Stack - Ratama Project & Finance Tracker

## 1. Project Overview

| Item | Detail |
| --- | --- |
| Project Name | Ratama Project & Finance Tracker |
| Company | Ratama Mitra Kualitas / Ratama Management Consultant |
| Type | Internal business management system |
| Platform | Web responsive / PWA-first |
| Deployment Target | Cloudflare |
| Primary Domain | `rmc.alfrzhb.com` |
| Staging Domain | `staging-rmc.alfrzhb.com` |

Project ini bukan sekadar AR/AP tracker dan bukan KPI tracker untuk versi awal.

Project ini adalah sistem internal untuk membantu owner dan tim Ratama melihat alur kerja dari:

```txt
Client / Lead
-> Penawaran
-> Follow-up
-> Negosiasi
-> Deal
-> Project berjalan
-> Activity / progress tracking
-> Invoice
-> Payment
-> AP / project cost
-> Project closed
```

Fokus utama project:

1. Tracking penawaran dan peluang proyek.
2. Tracking follow-up client.
3. Tracking negosiasi dan deal harga.
4. Tracking status proyek dan progress pekerjaan.
5. Tracking aktivitas karyawan/PIC.
6. Tracking invoice dan pembayaran client.
7. Tracking AP / biaya proyek sederhana.
8. Dashboard owner untuk melihat status bisnis secara cepat.

KPI tracker **tidak dibuat di versi awal**. KPI dapat menjadi versi berikutnya setelah data project, activity, invoice, payment, dan AP sudah rapi.

---

## 2. Project Scale

Project ini termasuk:

```txt
Internal business system skala menengah
```

Bukan aplikasi kecil seperti todo list, tetapi juga belum sebesar ERP/accounting system penuh.

Project ini **bukan**:

1. Full ERP.
2. Full accounting system.
3. Payroll system.
4. Tax/reporting system.
5. Bank reconciliation system.
6. Mobile app Flutter.
7. AI automation system.
8. Pengganti software akuntansi resmi seperti Accurate/Jurnal.

Project ini adalah:

```txt
Operational visibility system + project tracker + finance tracker ringan
```

Tujuan utamanya adalah membantu owner mengetahui:

1. Penawaran mana yang sedang berjalan.
2. Penawaran mana yang perlu follow-up.
3. Proyek mana yang sedang berjalan.
4. Proyek mana yang macet.
5. PIC/karyawan mana yang bertanggung jawab.
6. Invoice mana yang sudah dikirim.
7. Invoice mana yang belum dibayar.
8. Payment mana yang sudah masuk.
9. AP/biaya proyek mana yang belum dibayar.
10. Project mana yang sudah benar-benar closed.

---

## 3. Recommended Architecture

Architecture yang digunakan adalah Cloudflare-native architecture.

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
API
Cloudflare Workers
        |
        v
Database
Cloudflare D1
        |
        v
File Storage
Cloudflare R2
```

### Main Components

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | Web dashboard |
| UI Styling | Tailwind CSS + shadcn/ui | UI components |
| Data Fetching | TanStack Query | API fetching and cache |
| Form Handling | React Hook Form | Form management |
| Validation | Zod | Frontend/backend validation |
| Backend API | Cloudflare Workers | Serverless API |
| API Framework | Hono | Lightweight API routing |
| Database | Cloudflare D1 | Relational database |
| ORM | Drizzle ORM | Typed database schema/query |
| File Storage | Cloudflare R2 | Store documents and attachments |
| Auth Gate | Cloudflare Access | Protect internal app access |
| App Role Access | Internal RBAC | Control user permissions |
| Deployment | Cloudflare Pages + Workers | Hosting and API deployment |

---

## 4. Domain Strategy

Gunakan satu subdomain utama untuk production:

```txt
rmc.alfrzhb.com
```

Gunakan satu subdomain terpisah untuk staging/testing:

```txt
staging-rmc.alfrzhb.com
```

Recommended API pattern:

```txt
rmc.alfrzhb.com/api/clients
rmc.alfrzhb.com/api/opportunities
rmc.alfrzhb.com/api/projects
rmc.alfrzhb.com/api/invoices
rmc.alfrzhb.com/api/payments
rmc.alfrzhb.com/api/payables
```

Gunakan **same-origin API** untuk MVP.

Recommended:

```txt
Frontend: rmc.alfrzhb.com
API:      rmc.alfrzhb.com/api/*
```

Hindari untuk MVP:

```txt
Frontend: rmc.alfrzhb.com
API:      api-rmc.alfrzhb.com
```

Alasan:

1. Fewer CORS problems.
2. Easier authentication.
3. Easier cookie/session handling.
4. Easier Cloudflare Access protection.
5. Simpler deployment.

---

## 5. Frontend Stack

### Core

```txt
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
```

### Data and Form

```txt
TanStack Query
React Hook Form
Zod
```

### Recommended Frontend Responsibilities

Frontend is responsible for:

1. Dashboard UI.
2. Tables and filtering.
3. Forms for CRUD operations.
4. Detail pages.
5. Status badges.
6. Activity timeline display.
7. Invoice/payment/AP screens.
8. Upload UI.
9. Export button UI.
10. Role-based UI visibility.

Frontend should **not** directly access database or storage.

All database and storage operations must go through backend API.

---

## 6. Backend Stack

### Core

```txt
Cloudflare Workers
Hono
TypeScript
Zod
Drizzle ORM
```

### Backend Responsibilities

Backend is responsible for:

1. API routing.
2. Authentication context checking.
3. Role-based authorization.
4. Request validation.
5. Database queries.
6. Business rules.
7. Invoice/payment calculations.
8. File upload signing/handling.
9. Audit logging.
10. Dashboard aggregation.

Recommended API endpoint groups:

```txt
/api/auth/me
/api/users
/api/clients
/api/client-contacts
/api/opportunities
/api/opportunity-logs
/api/projects
/api/project-members
/api/project-activities
/api/invoices
/api/payments
/api/payables
/api/attachments
/api/dashboard
/api/reports
```

---

## 7. Database Stack

Use:

```txt
Cloudflare D1
Drizzle ORM
SQLite-compatible schema
```

D1 is suitable for MVP because this system is mostly relational CRUD:

```txt
clients
opportunities
projects
activities
invoices
payments
payables
attachments
users
roles
audit logs
```

### Important Database Rules

1. Use relational schema.
2. Do not use NoSQL for MVP.
3. Do not store files directly in database.
4. Store only file metadata in database.
5. Store file binaries in Cloudflare R2.
6. Store money as integer, not float.
7. Use `created_at`, `updated_at`, and `deleted_at` where needed.
8. Use soft delete for important records.
9. Use audit logs for critical changes.
10. Avoid over-normalization in MVP.

---

## 8. File Storage

Use:

```txt
Cloudflare R2
```

R2 is used for:

1. Proposal files.
2. Contract files.
3. SPK / PO files.
4. Invoice PDF.
5. Payment proof.
6. Vendor bill.
7. AP proof.
8. Supporting project documents.

### Attachment Strategy

Do not store files in D1.

D1 should only store metadata:

```txt
attachments
- id
- linked_type
- linked_id
- file_name
- file_key
- mime_type
- file_size
- uploaded_by
- created_at
```

Example `linked_type` values:

```txt
opportunity
project
invoice
payment
payable
activity
```

### Upload Limits for MVP

Initial upload rule:

```txt
Max file size: 5 MB
Allowed files: PDF, JPG, JPEG, PNG, XLSX, DOCX
Max files per item: 5
```

Large files should be stored manually outside the system first, for example in Google Drive, until the system is more mature.

---

## 9. Authentication and Authorization

Recommended auth architecture:

```txt
Cloudflare Access
+
Internal RBAC
```

### Cloudflare Access

Cloudflare Access protects the app before users enter the system.

Flow:

```txt
User opens rmc.alfrzhb.com
        |
        v
Cloudflare Access checks allowed email/domain
        |
        v
If allowed, user can access frontend
        |
        v
Frontend calls backend API
        |
        v
Backend checks user role from internal database
```

### Internal Roles

Recommended roles:

```txt
OWNER
ADMIN
FINANCE
PROJECT_MANAGER
STAFF
```

### Role Meaning

| Role | Description |
| --- | --- |
| OWNER | Can view all projects, finance, dashboard, and reports |
| ADMIN | Can manage master data and users |
| FINANCE | Can manage invoices, payments, AP, and finance reports |
| PROJECT_MANAGER | Can manage assigned projects and team activity |
| STAFF | Can update activity/follow-up for assigned projects |

### Security Rule

Do not rely only on frontend role hiding.

Every sensitive action must be checked in backend API.

---

## 10. MVP Modules

### MVP 1 - Client Tracker

Purpose:

```txt
Store client/company data.
```

Features:

1. Create client.
2. Edit client.
3. View client detail.
4. Add client contacts.
5. Search/filter clients.

Tables:

```txt
clients
client_contacts
```

### MVP 2 - Opportunity / Penawaran Tracker

Purpose:

```txt
Track potential projects from first contact until won/lost.
```

Features:

1. Create opportunity.
2. Set estimated value.
3. Set PIC.
4. Set opportunity status.
5. Set next follow-up date.
6. Upload proposal.
7. View opportunity list.
8. Filter by status/PIC/date.

Recommended opportunity statuses:

```txt
NEW
PROPOSAL_DRAFT
PROPOSAL_SENT
FOLLOW_UP
NEGOTIATION
WON
LOST
ON_HOLD
```

Tables:

```txt
opportunities
opportunity_logs
attachments
```

### MVP 3 - Negotiation & Deal Tracker

Purpose:

```txt
Track negotiation history and final deal value.
```

Features:

1. Store initial offer value.
2. Store revised offer value.
3. Store final deal value.
4. Store negotiation notes.
5. Store payment scheme.
6. Upload contract/SPK/PO.
7. Convert won opportunity into project.

Important fields:

```txt
initial_offer_amount
revised_offer_amount
deal_amount
deal_date
payment_scheme
deal_notes
```

### MVP 4 - Project Tracker

Purpose:

```txt
Track project after opportunity is won.
```

Features:

1. Convert opportunity to project.
2. Assign project PIC.
3. Assign project members.
4. Set start date.
5. Set deadline.
6. Set project status.
7. Set progress.
8. Set next action.
9. Track project blockers.
10. View project detail.

Recommended project statuses:

```txt
NOT_STARTED
KICKOFF
IN_PROGRESS
WAITING_CLIENT
INTERNAL_REVIEW
REVISION
COMPLETED
CLOSED
CANCELLED
```

Important distinction:

```txt
COMPLETED = work is done
CLOSED = work is done + finance/payment/admin is settled
```

Tables:

```txt
projects
project_members
project_activities
attachments
```

### MVP 5 - Activity / Follow-up Tracker

Purpose:

```txt
Track what staff/PIC has done for each opportunity or project.
```

Features:

1. Add activity log.
2. Add follow-up note.
3. Add next action.
4. Add next follow-up date.
5. View activity timeline.
6. Detect projects not updated for more than 7 days.

Recommended activity types:

```txt
MEETING
CALL
WHATSAPP_FOLLOW_UP
EMAIL_SENT
DOCUMENT_RECEIVED
DOCUMENT_REVIEWED
REPORT_DRAFTED
REPORT_SUBMITTED
REVISION_REQUESTED
CLIENT_APPROVAL
INTERNAL_DISCUSSION
OTHER
```

Activity should always answer:

```txt
Who did what?
When?
For which project/opportunity?
What is the next action?
When should it be followed up?
```

Tables:

```txt
opportunity_logs
project_activities
```

### MVP 6 - AR Tracker / Invoice & Payment

Purpose:

```txt
Track invoice sent to client and incoming payment.
```

Features:

1. Create invoice.
2. Link invoice to project.
3. Set invoice number.
4. Set invoice due date.
5. Set invoice amount.
6. Upload invoice file.
7. Mark invoice as sent.
8. Record partial/full payment.
9. Upload payment proof.
10. Calculate outstanding AR.
11. Detect overdue invoice.

Recommended invoice statuses:

```txt
PLANNED
DRAFT
SENT
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
```

Tables:

```txt
invoices
payments
attachments
```

Important rule:

```txt
Invoice amount is fixed.
Payment is stored as separate transaction.
Invoice paid amount is calculated from payments.
Remaining amount is calculated automatically.
```

Do not overwrite invoice amount when payment is added.

### MVP 7 - AP / Project Cost Tracker

Purpose:

```txt
Track outgoing bills and project costs.
```

Features:

1. Create payable.
2. Link payable to project.
3. Add vendor/subcontractor name.
4. Add cost category.
5. Add due date.
6. Add payable amount.
7. Upload bill/proof.
8. Mark as approved/paid.
9. Track unpaid AP.
10. Track AP due soon.

Recommended AP statuses:

```txt
UNPAID
WAITING_APPROVAL
APPROVED
SCHEDULED
PAID
OVERDUE
CANCELLED
```

Tables:

```txt
payables
attachments
```

### MVP 8 - Owner Dashboard

Purpose:

```txt
Give owner quick visibility of project and finance condition.
```

Dashboard cards:

1. Active opportunities.
2. Opportunities in negotiation.
3. Active projects.
4. Projects waiting client.
5. Projects not updated for more than 7 days.
6. Total outstanding AR.
7. Total overdue invoice.
8. Total unpaid AP.
9. AP due this week.
10. Projects near deadline.

Dashboard should prioritize actionable information, not decorative charts.

Important questions dashboard must answer:

```txt
What needs follow-up today?
Which project is stuck?
Which invoice is overdue?
Which project has not been updated?
Which payment is still outstanding?
Which AP is due soon?
```

---

## 11. Recommended Database Tables

Initial schema:

```txt
users
clients
client_contacts
opportunities
opportunity_logs
projects
project_members
project_activities
invoices
payments
payables
attachments
audit_logs
```

Optional future tables:

```txt
proposal_versions
billing_schedules
vendors
kpi_metrics
kpi_targets
kpi_results
notifications
```

Do not build optional future tables until MVP is stable.

---

## 12. Money Handling Rule

Never store money as float.

Use integer.

Example:

```txt
Rp 1.500.000 -> 1500000
```

Recommended fields:

```txt
amount
deal_amount
invoice_amount
paid_amount
payable_amount
```

All money fields should use integer.

Currency default:

```txt
IDR
```

---

## 13. Status Workflow Rules

Avoid vague status names.

Bad examples:

```txt
Pending
Process
Done
```

Good examples:

```txt
WAITING_CLIENT
IN_PROGRESS
PROPOSAL_SENT
PARTIALLY_PAID
OVERDUE
CLOSED
```

Every status should be clear enough to explain the actual business condition.

---

## 14. Audit Log Rules

Important actions must be logged.

Examples:

1. Opportunity status changed.
2. Project status changed.
3. Deal amount changed.
4. Invoice created.
5. Invoice amount changed.
6. Payment added.
7. Payment deleted/cancelled.
8. AP created.
9. AP marked as paid.
10. Attachment uploaded.
11. User role changed.

Audit log should store:

```txt
id
actor_user_id
entity_type
entity_id
action
old_value
new_value
created_at
```

Audit logs are important because this system tracks project and finance data.

---

## 15. Delete Rules

Do not hard delete important records.

Use soft delete:

```txt
deleted_at
deleted_by
delete_reason
```

For finance records, prefer cancellation instead of deletion.

Example:

```txt
invoice.status = CANCELLED
invoice.cancel_reason = "Wrong invoice number"
```

---

## 16. Reporting and Export

Export feature should be included after core CRUD is stable.

Minimum export:

1. Opportunities export.
2. Projects export.
3. Project activities export.
4. AR/invoices export.
5. Payments export.
6. AP/payables export.

Format:

```txt
XLSX
CSV
```

PDF can be added later.

---

## 17. Backup Strategy

Even for MVP, backup must not be ignored.

Minimum backup strategy:

1. Export D1 database regularly.
2. Export finance report regularly.
3. Keep important contract/invoice files backed up outside R2.
4. Use separate staging and production environments.
5. Do not test destructive operations on production.

Recommended schedule:

```txt
Weekly database export
Monthly full archive
Manual backup before major migration
```

---

## 18. Environment Strategy

Use 3 environments:

```txt
local
staging
production
```

Recommended mapping:

```txt
local:
  Frontend: localhost:5173
  API: local worker
  DB: local D1

staging:
  URL: staging-rmc.alfrzhb.com
  DB: rmc_staging

production:
  URL: rmc.alfrzhb.com
  DB: rmc_production
```

Never use production database for development testing.

---

## 19. Deployment Strategy

Recommended deployment flow:

```txt
Push to GitHub
        |
        v
Cloudflare Pages builds frontend
        |
        v
Cloudflare Workers deploys API
        |
        v
D1 migrations are applied
        |
        v
Application is available on Cloudflare domain
```

Branches:

```txt
main      -> production
develop   -> staging
feature/* -> development work
```

Recommended workflow:

1. Develop feature locally.
2. Push to feature branch.
3. Merge to develop.
4. Test on staging.
5. Merge to main.
6. Deploy to production.

---

## 20. Suggested Folder Structure

Recommended monorepo structure:

```txt
ratama-tracker/
|-- apps/
|   |-- web/
|   |   |-- src/
|   |   |-- public/
|   |   `-- package.json
|   |
|   `-- api/
|       |-- src/
|       |-- wrangler.toml
|       `-- package.json
|
|-- packages/
|   |-- db/
|   |   |-- schema/
|   |   |-- migrations/
|   |   `-- index.ts
|   |
|   |-- shared/
|   |   |-- types/
|   |   `-- constants/
|   |
|   `-- validation/
|       `-- schemas/
|
|-- docs/
|   |-- business-flow.md
|   |-- database-schema.md
|   |-- api-spec.md
|   |-- deployment.md
|   `-- techstack.md
|
|-- package.json
|-- pnpm-workspace.yaml
`-- README.md
```

Monorepo is recommended because frontend, backend, database schema, shared types, and validation are tightly connected.

---

## 21. Development Best Practices

### Code Quality

Use:

```txt
TypeScript
ESLint
Prettier
Zod validation
Typed API response
Typed database schema
```

### API Best Practices

1. Validate every request body.
2. Validate every query parameter.
3. Check user role on backend.
4. Return consistent response format.
5. Do not expose stack traces in production.
6. Use pagination for tables.
7. Use filters for dashboard and reports.
8. Use soft delete for important records.

### Frontend Best Practices

1. Use reusable components.
2. Use loading states.
3. Use error states.
4. Use empty states.
5. Use confirmation dialog for dangerous actions.
6. Use status badges.
7. Use table filters.
8. Use date formatting consistently.
9. Use IDR currency formatting.
10. Do not trust frontend validation only.

### Database Best Practices

1. Use migration files.
2. Do not manually alter production DB without migration.
3. Use indexes for searchable fields.
4. Avoid storing duplicate calculated data unless necessary.
5. Keep payment as separate transaction.
6. Use audit logs for important changes.
7. Use integer for money.
8. Use ISO date format.

---

## 22. Reliability Rules

This system handles sensitive business and finance data, so reliability matters.

Rules:

1. Do not build finance logic carelessly.
2. Do not hard delete invoices/payments/AP.
3. Do not store money as float.
4. Do not allow all roles to access finance data.
5. Do not store files in database.
6. Do not deploy untested migration to production.
7. Do not make production and staging use the same database.
8. Do not rely only on UI validation.
9. Do not skip audit logs for finance actions.
10. Do not treat this as formal accounting software.

---

## 23. Future Scaling Plan

Current MVP:

```txt
Cloudflare Pages
Cloudflare Workers
Cloudflare D1
Cloudflare R2
Cloudflare Access
```

If usage grows and D1 becomes limiting, migrate database to:

```txt
Supabase PostgreSQL
Neon PostgreSQL
VPS PostgreSQL
Managed PostgreSQL
```

Possible future architecture:

```txt
Frontend: Cloudflare Pages
Backend: Cloudflare Workers or Node.js API
Database: PostgreSQL
Storage: Cloudflare R2
Auth: Cloudflare Access / Auth provider
```

Do not migrate too early. Start with D1 first for MVP.

---

## 24. Features Not Included in MVP

Do not build these in version 1:

1. KPI tracker.
2. Full accounting.
3. General ledger.
4. Balance sheet.
5. Profit and loss report.
6. Payroll.
7. Tax reporting.
8. Bank integration.
9. OCR invoice scanning.
10. AI automation.
11. Flutter mobile app.
12. Real-time collaboration.
13. Complex notification system.
14. Approval workflow with many levels.
15. Client portal.

These can be considered after the core project and finance tracking flow is stable.

---

## 25. Recommended Build Order

Build in this order:

```txt
1. Project setup
2. Cloudflare setup
3. Auth gate with Cloudflare Access
4. Database schema
5. User and role system
6. Client module
7. Client contact module
8. Opportunity module
9. Opportunity follow-up log
10. Opportunity to project conversion
11. Project module
12. Project members
13. Project activity log
14. Invoice module
15. Payment module
16. AP/payable module
17. Owner dashboard
18. Export report
19. Audit log
20. Staging test
21. Production deployment
```

Do not start from dashboard first. Dashboard depends on data from other modules.

---

## 26. AI Agent Rules

When helping develop this project, the AI agent must follow these rules:

1. Focus only on Ratama Project & Finance Tracker.
2. Do not add KPI tracker unless explicitly requested.
3. Do not turn this into full accounting software.
4. Do not suggest Flutter/mobile-first for MVP.
5. Use web responsive approach.
6. Use Cloudflare-first architecture.
7. Use relational database design.
8. Keep project centered around `Project`.
9. Link invoice, payment, and AP to project where possible.
10. Always consider audit log for finance-related changes.
11. Use role-based access control.
12. Avoid overengineering.
13. Build incrementally by MVP modules.
14. Prioritize reliable CRUD, workflow status, and dashboard visibility.
15. Prefer simple, maintainable architecture over complex enterprise architecture.

---

## 27. Final Tech Stack Decision

Final recommended stack:

```txt
Frontend:
React + Vite + TypeScript + Tailwind CSS + shadcn/ui

State/Data:
TanStack Query + React Hook Form + Zod

Backend:
Cloudflare Workers + Hono + TypeScript

Database:
Cloudflare D1 + Drizzle ORM

Storage:
Cloudflare R2

Auth:
Cloudflare Access + Internal RBAC

Deployment:
Cloudflare Pages + Cloudflare Workers

Domain:
rmc.alfrzhb.com

Staging:
staging-rmc.alfrzhb.com
```

This stack is selected because it is:

1. Free/low-cost for MVP.
2. Suitable for internal company use.
3. Good for web dashboard and table-heavy workflow.
4. Easy to deploy using Cloudflare.
5. Reliable enough for early-stage operational tracking.
6. Scalable enough to migrate to PostgreSQL later.
7. Simple enough for solo/fresh graduate development.
