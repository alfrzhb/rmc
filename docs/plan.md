# Development Plan - Ratama Project & Finance Tracker

## 1. Project Identity

| Item | Detail |
| --- | --- |
| Project Name | Ratama Project & Finance Tracker |
| Company | Ratama Mitra Kualitas / Ratama Management Consultant |
| Type | Internal business management system |
| Platform | Web responsive / PWA-first |
| Primary Domain | `rmc.alfrzhb.com` |
| Staging Domain | `staging-rmc.alfrzhb.com` |
| Deployment Target | Cloudflare |
| Architecture | Cloudflare-native web application |
| Main Goal | Track business flow from opportunity/penawaran to project, invoice, payment, AP, and project closing |

---

## 2. Project Direction

This project is not only an AR/AP tracker.

This project is a complete internal tracker for Ratama's operational and finance visibility.

The system should track:

```txt
Client
-> Opportunity / Penawaran
-> Follow-up
-> Negotiation
-> Deal
-> Project
-> Project activity
-> Invoice / AR
-> Payment
-> AP / project cost
-> Project closing
```

The main value of this system is to help the owner know:

```txt
Which opportunities need follow-up?
Which projects are running?
Which projects are stuck?
Which staff/PIC is responsible?
Which invoices are unpaid?
Which invoices are overdue?
Which AP/project costs are unpaid?
Which projects can be closed?
```

---

## 3. What This Project Is

This project is:

```txt
Operational visibility system
Project pipeline tracker
Project progress tracker
Follow-up tracker
Invoice and payment tracker
Simple AP/project cost tracker
Owner dashboard
```

This project is **not**:

```txt
Full ERP
Full accounting system
Tax system
Payroll system
Bank reconciliation system
KPI tracker for MVP
Flutter/mobile-first app
AI automation system
Client portal
```

KPI tracker can be developed later after the project, activity, invoice, payment, and AP data are already stable.

---

## 4. Final Tech Stack

### Frontend

```txt
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
React Hook Form
Zod
```

### Backend

```txt
Cloudflare Workers
Hono
TypeScript
Zod
Drizzle ORM
```

### Database

```txt
Cloudflare D1
SQLite-compatible relational schema
Drizzle ORM migrations
```

### File Storage

```txt
Cloudflare R2
```

### Authentication and Authorization

```txt
Cloudflare Access
Internal RBAC
```

### Deployment

```txt
Cloudflare Pages
Cloudflare Workers
GitHub
```

### Domain

```txt
Production: rmc.alfrzhb.com
Staging: staging-rmc.alfrzhb.com
```

---

## 5. Recommended Architecture

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

Use same-origin API pattern:

```txt
rmc.alfrzhb.com/api/*
```

Avoid separate API subdomain for MVP.

Recommended:

```txt
Frontend: rmc.alfrzhb.com
API:      rmc.alfrzhb.com/api/*
```

---

## 6. Development Principles

The AI agent and developer must follow these principles:

1. Build incrementally.
2. Do not overengineer.
3. Keep Project as the center of the system.
4. Opportunity exists before Project.
5. Invoice and Payment must be linked to Project.
6. AP should be linked to Project when possible.
7. Activity/follow-up log is critical.
8. Do not build KPI tracker in MVP.
9. Do not build full accounting.
10. Do not build Flutter/mobile-first.
11. Use clear status workflow.
12. Use audit log for important changes.
13. Do not hard delete finance data.
14. Store money as integer, not float.
15. Store files in R2, not D1.
16. Use D1 only for structured data and file metadata.
17. Use backend validation for all sensitive actions.
18. Do not trust frontend validation only.
19. Use role-based access control.
20. Prioritize owner visibility.

---

## 7. Target MVP Scope

The MVP should include these modules:

```txt
1. User and Role Foundation
2. Client Tracker
3. Client Contact Tracker
4. Opportunity / Penawaran Tracker
5. Opportunity Follow-up Log
6. Negotiation and Deal Fields
7. Convert Opportunity to Project
8. Project Tracker
9. Project Member Tracker
10. Project Activity / Follow-up Tracker
11. Invoice / AR Tracker
12. Payment Tracker
13. AP / Project Cost Tracker
14. Attachment Management
15. Owner Dashboard
16. Reports and Export
17. Audit Logs
```

---

## 8. Main User Roles

Use these roles:

```txt
OWNER
ADMIN
FINANCE
PROJECT_MANAGER
STAFF
```

### OWNER

Can view and manage everything.

### ADMIN

Can manage users, clients, contacts, and system settings.

### FINANCE

Can manage invoices, payments, payables/AP, and finance reports.

### PROJECT_MANAGER

Can manage assigned projects, members, activities, progress, and follow-up.

### STAFF

Can update assigned project activities and follow-up notes.

---

## 9. Main Status Enums

### Opportunity Status

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

### Project Status

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

### Invoice Status

```txt
PLANNED
DRAFT
SENT
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
```

### Payable/AP Status

```txt
UNPAID
WAITING_APPROVAL
APPROVED
SCHEDULED
PAID
OVERDUE
CANCELLED
```

### Activity Type

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

---

## Phase 0 - Project Preparation

### Goal

Prepare documentation, repository structure, development rules, and initial project direction.

### Tasks

### 0.1 Create Core Documentation

Create these files:

```txt
docs/techstack.md
docs/business-flow.md
docs/plan.md
docs/database-schema.md
docs/api-spec.md
docs/deployment.md
```

Current file:

```txt
docs/plan.md
```

### 0.2 Confirm MVP Scope

MVP must focus on:

```txt
Client
Opportunity
Follow-up
Negotiation
Project
Project activity
Invoice
Payment
AP/project cost
Dashboard
Export
Audit log
```

Do not include:

```txt
KPI tracker
Full accounting
Tax report
Payroll
Mobile app
AI automation
Client portal
```

### 0.3 Decide Repository Structure

Recommended structure:

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
|   |-- techstack.md
|   |-- business-flow.md
|   |-- plan.md
|   |-- database-schema.md
|   |-- api-spec.md
|   `-- deployment.md
|-- package.json
|-- pnpm-workspace.yaml
`-- README.md
```

### 0.4 Acceptance Criteria

Phase 0 is complete when:

```txt
Project scope is clear.
Tech stack is documented.
Business flow is documented.
Development plan is documented.
MVP boundaries are documented.
```

---

## Phase 1 - Project Setup

### Goal

Set up the technical foundation for frontend, backend, shared packages, database package, and development tooling.

---

### 1.1 Initialize Monorepo

### Tasks

1. Create root project folder:

```txt
ratama-tracker
```

2. Initialize package manager.

Recommended:

```txt
pnpm
```

3. Create workspace config:

```txt
pnpm-workspace.yaml
```

4. Create folders:

```txt
apps/web
apps/api
packages/db
packages/shared
packages/validation
docs
```

### Acceptance Criteria

```txt
Project has monorepo structure.
pnpm workspace works.
Each app/package can have its own package.json.
```

---

### 1.2 Setup Frontend App

### Stack

```txt
React
Vite
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
React Hook Form
Zod
```

### Tasks

1. Create Vite React TypeScript app in `apps/web`.
2. Install Tailwind CSS.
3. Install shadcn/ui.
4. Install TanStack Query.
5. Install React Hook Form.
6. Install Zod.
7. Create base layout.
8. Create routing structure.
9. Create placeholder pages.

### Initial Pages

```txt
/login-check
/dashboard
/clients
/opportunities
/projects
/invoices
/payments
/payables
/reports
/settings
```

### Acceptance Criteria

```txt
Frontend runs locally.
Tailwind works.
Base layout works.
Navigation sidebar exists.
Placeholder pages are accessible.
```

---

### 1.3 Setup Backend API

### Stack

```txt
Cloudflare Workers
Hono
TypeScript
Zod
Drizzle ORM
```

### Tasks

1. Create Cloudflare Worker app in `apps/api`.
2. Install Hono.
3. Install Zod.
4. Install Drizzle ORM.
5. Create basic API structure.
6. Create health check endpoint.

### Initial Endpoint

```txt
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "ratama-tracker-api"
}
```

### Acceptance Criteria

```txt
Worker runs locally.
Hono routing works.
GET /api/health returns expected response.
```

---

### 1.4 Setup Shared Packages

### Packages

```txt
packages/shared
packages/validation
packages/db
```

### Tasks

1. `packages/shared` stores shared TypeScript types and constants.
2. `packages/validation` stores Zod schemas.
3. `packages/db` stores Drizzle schema and migrations.

### Acceptance Criteria

```txt
Frontend and backend can import shared types.
Backend can import validation schemas.
Backend can import database schema.
```

---

### 1.5 Setup Code Quality Tools

### Recommended Tools

```txt
TypeScript
ESLint
Prettier
```

### Tasks

1. Configure TypeScript.
2. Configure ESLint.
3. Configure Prettier.
4. Add root scripts.

### Recommended Scripts

```json
{
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "build:web": "pnpm --filter web build",
    "build:api": "pnpm --filter api build",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

### Acceptance Criteria

```txt
Lint script works.
Format script works.
Typecheck script works.
No TypeScript errors in initial setup.
```

---

## Phase 2 - Cloudflare Foundation

### Goal

Prepare Cloudflare resources for deployment, database, storage, and access control.

---

### 2.1 Cloudflare Pages Setup

### Tasks

1. Create Cloudflare Pages project for frontend.
2. Connect GitHub repository.
3. Configure build command.
4. Configure output directory.
5. Configure production domain:

```txt
rmc.alfrzhb.com
```

6. Configure staging domain:

```txt
staging-rmc.alfrzhb.com
```

### Acceptance Criteria

```txt
Frontend can be deployed to Cloudflare Pages.
Production domain points to production build.
Staging domain points to staging build.
```

---

### 2.2 Cloudflare Workers Setup

### Tasks

1. Create Worker for API.
2. Configure `wrangler.toml`.
3. Configure route:

```txt
rmc.alfrzhb.com/api/*
```

4. Configure staging route:

```txt
staging-rmc.alfrzhb.com/api/*
```

### Acceptance Criteria

```txt
Worker is deployed.
API route works from production domain.
API route works from staging domain.
```

---

### 2.3 Cloudflare D1 Setup

### Databases

Create two D1 databases:

```txt
rmc_staging
rmc_production
```

### Tasks

1. Create staging D1 database.
2. Create production D1 database.
3. Bind D1 to Worker.
4. Configure local D1 development.
5. Prepare migration command.

### Acceptance Criteria

```txt
Worker can connect to local D1.
Worker can connect to staging D1.
Worker can connect to production D1.
Database binding is separated by environment.
```

---

### 2.4 Cloudflare R2 Setup

### Buckets

Create two R2 buckets:

```txt
rmc-staging-files
rmc-production-files
```

### Tasks

1. Create staging R2 bucket.
2. Create production R2 bucket.
3. Bind R2 to Worker.
4. Create upload/download helper.
5. Store only file metadata in D1.

### Acceptance Criteria

```txt
Worker can upload file to R2.
Worker can retrieve file from R2.
File metadata is stored in D1.
Frontend never writes directly to R2 without backend control.
```

---

### 2.5 Cloudflare Access Setup

### Tasks

1. Enable Cloudflare Access for:

```txt
rmc.alfrzhb.com
staging-rmc.alfrzhb.com
```

2. Allow only selected emails.
3. Start with owner/admin emails only.
4. Later add staff emails.
5. Confirm deny-by-default behavior.

### Acceptance Criteria

```txt
Unauthorized users cannot access app.
Allowed users can access app.
App receives user identity from Cloudflare Access headers.
```

---

## Phase 3 - Database Schema Foundation

### Goal

Create initial database schema for users, roles, clients, opportunities, projects, finance, attachments, and audit logs.

---

### 3.1 Core Tables

Create these tables first:

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

---

### 3.2 users Table

### Purpose

Store internal application users and roles.

### Fields

```txt
id
email
name
role
status
last_login_at
created_at
updated_at
deleted_at
```

### Role Values

```txt
OWNER
ADMIN
FINANCE
PROJECT_MANAGER
STAFF
```

### Status Values

```txt
ACTIVE
INACTIVE
SUSPENDED
```

### Acceptance Criteria

```txt
User can be created.
User role can be assigned.
Inactive user cannot access protected actions.
```

---

### 3.3 clients Table

### Purpose

Store client/company data.

### Fields

```txt
id
name
client_type
industry
address
email
phone
notes
status
created_at
updated_at
deleted_at
```

### Status Values

```txt
ACTIVE
INACTIVE
PROSPECT
BLACKLISTED
```

### Acceptance Criteria

```txt
Client can be created.
Client can be updated.
Client can be searched.
Client can be soft deleted.
```

---

### 3.4 client_contacts Table

### Purpose

Store contact persons from client side.

### Fields

```txt
id
client_id
name
position
email
phone
whatsapp
is_primary
notes
created_at
updated_at
deleted_at
```

### Acceptance Criteria

```txt
Client can have multiple contacts.
One contact can be marked as primary.
Contact can be edited.
Contact can be soft deleted.
```

---

### 3.5 opportunities Table

### Purpose

Track business opportunities before deal.

### Fields

```txt
id
client_id
name
service_type
estimated_value
initial_offer_amount
revised_offer_amount
deal_amount
deal_date
payment_scheme
pic_user_id
status
source
proposal_sent_date
next_follow_up_date
notes
created_at
updated_at
deleted_at
```

### Acceptance Criteria

```txt
Opportunity can be created.
Opportunity can be assigned to PIC.
Opportunity status can be updated.
Opportunity can store offer/deal values.
Opportunity can be converted to project only if status is WON.
```

---

### 3.6 opportunity_logs Table

### Purpose

Track follow-up and negotiation history before deal.

### Fields

```txt
id
opportunity_id
user_id
activity_type
activity_date
notes
next_action
next_follow_up_date
created_at
updated_at
deleted_at
```

### Acceptance Criteria

```txt
Opportunity can have multiple logs.
Last follow-up can be displayed.
Next follow-up can be tracked.
Negotiation notes can be stored.
```

---

### 3.7 projects Table

### Purpose

Track work after opportunity becomes deal/project.

### Fields

```txt
id
client_id
opportunity_id
name
service_type
contract_value
pic_user_id
status
progress_percentage
start_date
deadline
completed_at
closed_at
next_action
next_follow_up_date
blocker_notes
created_at
updated_at
deleted_at
```

### Acceptance Criteria

```txt
Project can be created from opportunity.
Project status can be updated.
Project progress can be updated.
Project can track next action.
Project can track blockers.
Project can be marked COMPLETED.
Project can be marked CLOSED.
```

---

### 3.8 project_members Table

### Purpose

Track internal staff assigned to project.

### Fields

```txt
id
project_id
user_id
role_in_project
assigned_at
is_active
created_at
updated_at
deleted_at
```

### Acceptance Criteria

```txt
Project can have multiple members.
Member can be activated/deactivated.
PIC can be different from regular member.
```

---

### 3.9 project_activities Table

### Purpose

Track actual project activity, follow-up, and progress.

### Fields

```txt
id
project_id
user_id
activity_type
activity_date
notes
next_action
next_follow_up_date
created_at
updated_at
deleted_at
```

### Acceptance Criteria

```txt
Project can have multiple activities.
Activity timeline can be displayed.
Last activity date can be calculated.
Projects not updated for more than 7 days can be detected.
```

---

### 3.10 invoices Table

### Purpose

Track AR/invoices sent to clients.

### Fields

```txt
id
project_id
client_id
invoice_number
invoice_date
due_date
termin_number
description
amount
status
sent_at
created_by
created_at
updated_at
deleted_at
cancelled_at
cancel_reason
```

### Acceptance Criteria

```txt
Invoice can be created for a project.
Invoice can be marked SENT.
Invoice can be marked CANCELLED.
Invoice status can be calculated from payments.
Invoice can become OVERDUE.
```

---

### 3.11 payments Table

### Purpose

Track incoming payments from clients.

### Fields

```txt
id
invoice_id
project_id
client_id
payment_date
amount
payment_method
reference_number
notes
created_by
created_at
updated_at
deleted_at
cancelled_at
cancel_reason
```

### Acceptance Criteria

```txt
Payment can be linked to invoice.
Partial payment is supported.
Multiple payments per invoice are supported.
Invoice paid amount is calculated from payments.
Payment should not hard delete.
```

---

### 3.12 payables Table

### Purpose

Track AP/project cost.

### Fields

```txt
id
project_id
vendor_name
cost_category
description
bill_date
due_date
amount
status
paid_at
notes
created_by
created_at
updated_at
deleted_at
cancelled_at
cancel_reason
```

### Acceptance Criteria

```txt
Payable can be linked to project.
Payable can be unpaid, approved, scheduled, paid, overdue, or cancelled.
Unpaid AP can be displayed.
AP due soon can be displayed.
```

---

### 3.13 attachments Table

### Purpose

Store metadata of uploaded files.

### Fields

```txt
id
linked_type
linked_id
file_name
file_key
mime_type
file_size
uploaded_by
created_at
deleted_at
```

### Acceptance Criteria

```txt
Attachment can be linked to opportunity.
Attachment can be linked to project.
Attachment can be linked to invoice.
Attachment can be linked to payment.
Attachment can be linked to payable.
File binary is stored in R2.
Metadata is stored in D1.
```

---

### 3.14 audit_logs Table

### Purpose

Track important data changes.

### Fields

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

### Acceptance Criteria

```txt
Important changes are logged.
Audit logs cannot be edited by normal users.
Finance changes are logged.
Status changes are logged.
```

---

## Phase 4 - Authentication and RBAC

### Goal

Connect Cloudflare Access identity with internal user and role system.

---

### 4.1 Read Cloudflare Access User Identity

### Tasks

1. Read authenticated email from Cloudflare Access headers.
2. Match email to internal `users` table.
3. Reject access if user does not exist.
4. Reject access if user is inactive.
5. Return current user profile.

### Endpoint

```txt
GET /api/auth/me
```

### Response

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "OWNER"
}
```

### Acceptance Criteria

```txt
Allowed Cloudflare Access user can be identified by backend.
Unknown user is rejected.
Inactive user is rejected.
Frontend can display current user.
```

---

### 4.2 Implement Role-Based Authorization

### Tasks

1. Create role helper functions.
2. Create backend middleware for protected actions.
3. Protect finance endpoints.
4. Protect user management endpoints.
5. Protect audit log endpoint.

### Permission Examples

```txt
OWNER:
  all access

ADMIN:
  users, clients, contacts, basic settings

FINANCE:
  invoices, payments, payables, finance reports

PROJECT_MANAGER:
  assigned projects, activities, members

STAFF:
  assigned project activities only
```

### Acceptance Criteria

```txt
Backend blocks unauthorized actions.
Frontend hides actions based on role.
Sensitive endpoints are protected on backend.
```

---

## Phase 5 - Client Module

### Goal

Build client and client contact management.

---

### 5.1 Client API

### Endpoints

```txt
GET /api/clients
GET /api/clients/:id
POST /api/clients
PUT /api/clients/:id
DELETE /api/clients/:id
```

### Features

1. List clients.
2. Search clients.
3. Filter by status.
4. Create client.
5. Edit client.
6. Soft delete client.

### Acceptance Criteria

```txt
Client list works.
Client detail works.
Client create/edit works.
Client soft delete works.
Search and filter work.
```

---

### 5.2 Client Contact API

### Endpoints

```txt
GET /api/clients/:clientId/contacts
POST /api/clients/:clientId/contacts
PUT /api/client-contacts/:id
DELETE /api/client-contacts/:id
```

### Features

1. Add contact.
2. Edit contact.
3. Delete contact.
4. Mark primary contact.

### Acceptance Criteria

```txt
Client can have multiple contacts.
Primary contact can be displayed.
Contact CRUD works.
```

---

### 5.3 Client UI

### Pages

```txt
/clients
/clients/new
/clients/:id
/clients/:id/edit
```

### UI Components

```txt
Client table
Client search
Client status badge
Client form
Client contact list
Client contact form
```

### Acceptance Criteria

```txt
Owner/Admin can manage clients.
Users can search clients.
Client detail shows contacts.
```

---

## Phase 6 - Opportunity Module

### Goal

Track opportunities from first inquiry until won/lost.

---

### 6.1 Opportunity API

### Endpoints

```txt
GET /api/opportunities
GET /api/opportunities/:id
POST /api/opportunities
PUT /api/opportunities/:id
DELETE /api/opportunities/:id
```

### Features

1. List opportunities.
2. Filter by status.
3. Filter by PIC.
4. Filter by client.
5. Filter by next follow-up date.
6. Create opportunity.
7. Update opportunity.
8. Soft delete opportunity.

### Acceptance Criteria

```txt
Opportunity list works.
Opportunity detail works.
Opportunity create/edit works.
Opportunity status can be changed.
Opportunity can be filtered by status/PIC/follow-up date.
```

---

### 6.2 Opportunity UI

### Pages

```txt
/opportunities
/opportunities/new
/opportunities/:id
/opportunities/:id/edit
```

### UI Components

```txt
Opportunity table
Opportunity status badge
Opportunity form
Opportunity detail summary
Next follow-up indicator
PIC indicator
```

### Acceptance Criteria

```txt
User can create opportunity.
User can see opportunity status.
User can see next follow-up date.
Owner can see all opportunities.
PIC can see assigned opportunities.
```

---

### 6.3 Opportunity Business Rules

### Rules

1. Opportunity must have a client.
2. Opportunity must have a PIC.
3. Opportunity must have a status.
4. `deal_amount` should be required before status becomes `WON`.
5. Opportunity can be converted to project only if status is `WON`.

### Acceptance Criteria

```txt
Invalid status changes are blocked.
Opportunity cannot become WON without required deal fields.
Opportunity cannot be converted if not WON.
```

---

## Phase 7 - Opportunity Log and Negotiation

### Goal

Track follow-up, communication, and negotiation history before deal.

---

### 7.1 Opportunity Log API

### Endpoints

```txt
GET /api/opportunities/:id/logs
POST /api/opportunities/:id/logs
PUT /api/opportunity-logs/:id
DELETE /api/opportunity-logs/:id
```

### Features

1. Add follow-up log.
2. Add negotiation note.
3. Add next action.
4. Add next follow-up date.
5. Display timeline.

### Acceptance Criteria

```txt
Opportunity log can be added.
Opportunity log appears in timeline.
Last follow-up can be calculated.
Next follow-up can be displayed.
```

---

### 7.2 Negotiation Fields

### Fields

```txt
initial_offer_amount
revised_offer_amount
deal_amount
deal_date
payment_scheme
deal_notes
```

### Features

1. Store initial offer.
2. Store revised offer.
3. Store final deal amount.
4. Store payment scheme.
5. Store deal notes.

### Acceptance Criteria

```txt
Offer and deal values can be recorded.
Deal amount is visible in opportunity detail.
Negotiation history can be reviewed.
```

---

### 7.3 Opportunity Timeline UI

### UI Content

```txt
Activity date
Activity type
User
Notes
Next action
Next follow-up date
Attachments
```

### Acceptance Criteria

```txt
Opportunity detail shows timeline.
Owner can quickly see last follow-up.
Owner can see next action.
```

---

## Phase 8 - Convert Opportunity to Project

### Goal

Allow WON opportunity to become real project.

---

### 8.1 Convert API

### Endpoint

```txt
POST /api/opportunities/:id/convert-to-project
```

### Logic

1. Check opportunity exists.
2. Check status is `WON`.
3. Check required deal fields.
4. Check project does not already exist for this opportunity.
5. Create project.
6. Copy relevant fields.
7. Create audit log.
8. Return created project.

### Copied Fields

```txt
client_id
opportunity_id
name
service_type
contract_value
pic_user_id
payment_scheme
notes
```

### Acceptance Criteria

```txt
Only WON opportunity can be converted.
Duplicate project cannot be created from same opportunity.
Created project links back to opportunity.
Audit log is created.
```

---

### 8.2 Convert UI

### UI Behavior

1. Show "Convert to Project" button only if status is `WON`.
2. Hide button if project already exists.
3. Show confirmation dialog.
4. Redirect to created project detail after success.

### Acceptance Criteria

```txt
User can convert won opportunity to project.
User gets confirmation before conversion.
User is redirected to project detail.
```

---

## Phase 9 - Project Module

### Goal

Track real project after deal.

---

### 9.1 Project API

### Endpoints

```txt
GET /api/projects
GET /api/projects/:id
POST /api/projects
PUT /api/projects/:id
DELETE /api/projects/:id
```

### Features

1. List projects.
2. Filter by status.
3. Filter by PIC.
4. Filter by client.
5. Filter by deadline.
6. Filter projects waiting client.
7. Filter projects not updated > 7 days.
8. Update progress.
9. Update status.
10. Update next action.
11. Update blocker notes.

### Acceptance Criteria

```txt
Project list works.
Project detail works.
Project update works.
Project status badge works.
Project can show last update.
Project can show finance summary later.
```

---

### 9.2 Project UI

### Pages

```txt
/projects
/projects/new
/projects/:id
/projects/:id/edit
```

### Project Detail Sections

```txt
Project Summary
Client Info
PIC and Members
Status and Progress
Next Action
Blocker Notes
Activity Timeline
Invoices
Payments
AP/Costs
Attachments
Audit History
```

### Acceptance Criteria

```txt
Project detail becomes central page.
Owner can see project status quickly.
PIC can update assigned project.
```

---

### 9.3 Project Status Rules

### Rules

1. Project starts as `NOT_STARTED` or `KICKOFF`.
2. Project can move to `IN_PROGRESS`.
3. Project can move to `WAITING_CLIENT` if blocked by client.
4. Project can move to `INTERNAL_REVIEW`.
5. Project can move to `REVISION`.
6. Project can move to `COMPLETED`.
7. Project can move to `CLOSED` only after closing checklist.
8. Project can move to `CANCELLED` with reason.

### Acceptance Criteria

```txt
Project status can be changed.
Important status changes create audit log.
CLOSED requires confirmation.
CANCELLED requires reason.
```

---

## Phase 10 - Project Member Module

### Goal

Assign staff to project.

---

### 10.1 Project Member API

### Endpoints

```txt
GET /api/projects/:id/members
POST /api/projects/:id/members
PUT /api/project-members/:id
DELETE /api/project-members/:id
```

### Features

1. Add member.
2. Remove/deactivate member.
3. Set role in project.
4. Display project members.

### Acceptance Criteria

```txt
Project can have multiple members.
Member has role in project.
Only authorized users can manage members.
```

---

### 10.2 Project Member UI

### UI Components

```txt
Member list
Add member dialog
Member role badge
Deactivate member action
```

### Acceptance Criteria

```txt
Project detail shows assigned staff.
PM/Owner can manage project members.
Staff can see assigned projects.
```

---

## Phase 11 - Project Activity Module

### Goal

Track actual project work and follow-up.

---

### 11.1 Project Activity API

### Endpoints

```txt
GET /api/projects/:id/activities
POST /api/projects/:id/activities
PUT /api/project-activities/:id
DELETE /api/project-activities/:id
```

### Features

1. Add project activity.
2. Add next action.
3. Add next follow-up date.
4. Display activity timeline.
5. Calculate last activity date.
6. Detect projects not updated > 7 days.

### Acceptance Criteria

```txt
Project activity can be added.
Activity timeline works.
Last update can be shown.
Next follow-up can be shown.
Project stale detection works.
```

---

### 11.2 Project Activity UI

### UI Content

```txt
Activity type
Activity date
User
Notes
Next action
Next follow-up date
Attachment
```

### Acceptance Criteria

```txt
Staff can add activity to assigned project.
Owner can view all activities.
PM can view assigned project activities.
Activity appears in project timeline.
```

---

### 11.3 Stuck Project Logic

### Rule

A project is potentially stuck if:

```txt
No activity update for more than 7 days
```

### Dashboard Output

```txt
Projects not updated > 7 days
```

### Acceptance Criteria

```txt
Dashboard can show stale projects.
Project table can show last update date.
```

---

## Phase 12 - Invoice / AR Module

### Goal

Track invoices and AR/outstanding payment from client.

---

### 12.1 Invoice API

### Endpoints

```txt
GET /api/invoices
GET /api/invoices/:id
POST /api/invoices
PUT /api/invoices/:id
DELETE /api/invoices/:id
POST /api/invoices/:id/cancel
```

### Features

1. Create invoice.
2. Link invoice to project.
3. Set invoice number.
4. Set invoice amount.
5. Set invoice date.
6. Set due date.
7. Set termin number.
8. Mark as sent.
9. Detect overdue.
10. Cancel invoice with reason.

### Acceptance Criteria

```txt
Invoice can be created.
Invoice must link to project.
Invoice can be marked sent.
Invoice can be cancelled with reason.
Invoice cannot be hard deleted.
Overdue invoice can be detected.
```

---

### 12.2 Invoice UI

### Pages

```txt
/invoices
/invoices/new
/invoices/:id
/invoices/:id/edit
```

### UI Components

```txt
Invoice table
Invoice form
Invoice status badge
Invoice detail
Payment summary
Project link
Client link
```

### Acceptance Criteria

```txt
Finance can manage invoices.
Owner can view invoices.
Invoice shows paid and remaining amount.
Invoice links to project.
```

---

### 12.3 Invoice Calculation

### Calculation

```txt
invoice_amount = invoice.amount
total_paid = sum(valid payments for invoice)
remaining_amount = invoice_amount - total_paid
```

### Status Logic

```txt
If cancelled -> CANCELLED
If total_paid >= invoice_amount -> PAID
If total_paid > 0 and total_paid < invoice_amount -> PARTIALLY_PAID
If due_date passed and total_paid < invoice_amount -> OVERDUE
If sent_at exists and total_paid = 0 -> SENT
Else -> DRAFT or PLANNED
```

### Acceptance Criteria

```txt
Partial payment is supported.
Remaining amount is calculated.
Invoice status is consistent.
Finance cannot manually break invoice calculation.
```

---

## Phase 13 - Payment Module

### Goal

Record incoming payment from client.

---

### 13.1 Payment API

### Endpoints

```txt
GET /api/payments
GET /api/payments/:id
POST /api/payments
PUT /api/payments/:id
POST /api/payments/:id/cancel
```

### Features

1. Add payment to invoice.
2. Support partial payment.
3. Support multiple payments per invoice.
4. Add payment method.
5. Add reference number.
6. Upload payment proof.
7. Cancel payment with reason.

### Acceptance Criteria

```txt
Payment can be recorded.
Payment is linked to invoice/project/client.
Invoice status updates after payment.
Payment can be cancelled with reason.
Payment cannot be hard deleted.
```

---

### 13.2 Payment UI

### Pages

```txt
/payments
/payments/new
/payments/:id
```

### UI Components

```txt
Payment table
Payment form
Payment detail
Invoice link
Project link
Attachment upload
```

### Acceptance Criteria

```txt
Finance can input payment.
Owner can view payment history.
Payment affects invoice paid/remaining amount.
```

---

## Phase 14 - AP / Project Cost Module

### Goal

Track outgoing bills and project costs.

---

### 14.1 Payable API

### Endpoints

```txt
GET /api/payables
GET /api/payables/:id
POST /api/payables
PUT /api/payables/:id
POST /api/payables/:id/mark-paid
POST /api/payables/:id/cancel
```

### Features

1. Create payable.
2. Link payable to project.
3. Add vendor name.
4. Add cost category.
5. Add amount.
6. Add bill date.
7. Add due date.
8. Mark paid.
9. Detect overdue.
10. Cancel with reason.

### Acceptance Criteria

```txt
AP can be created.
AP can be linked to project.
AP can be marked paid.
AP due soon can be shown.
AP overdue can be shown.
AP cannot be hard deleted.
```

---

### 14.2 Payable UI

### Pages

```txt
/payables
/payables/new
/payables/:id
/payables/:id/edit
```

### UI Components

```txt
Payable table
Payable form
Payable status badge
Payable detail
Project link
Attachment upload
```

### Acceptance Criteria

```txt
Finance can manage payables.
Owner can view unpaid AP.
Project detail shows related AP/cost.
```

---

## Phase 15 - Attachment Module

### Goal

Allow users to upload and link documents to business entities.

---

### 15.1 Attachment API

### Endpoints

```txt
GET /api/attachments
GET /api/attachments/:id
POST /api/attachments/upload
DELETE /api/attachments/:id
```

### Linked Types

```txt
CLIENT
OPPORTUNITY
PROJECT
PROJECT_ACTIVITY
INVOICE
PAYMENT
PAYABLE
```

### Features

1. Upload file.
2. Store file in R2.
3. Store metadata in D1.
4. Link file to entity.
5. Soft delete attachment.
6. Restrict file size and type.

### Acceptance Criteria

```txt
File upload works.
File metadata saved in D1.
File binary saved in R2.
Attachment linked to entity.
Invalid file type is rejected.
Large file is rejected.
```

---

### 15.2 Upload Rules

### Initial Rules

```txt
Max file size: 5 MB
Allowed: PDF, JPG, JPEG, PNG, XLSX, DOCX
Max files per item: 5
```

### Acceptance Criteria

```txt
Upload validation works on frontend.
Upload validation works on backend.
Backend remains source of truth.
```

---

## Phase 16 - Owner Dashboard

### Goal

Create dashboard that gives owner quick operational and finance visibility.

---

### 16.1 Dashboard API

### Endpoint

```txt
GET /api/dashboard/summary
```

### Data Returned

```txt
active_opportunities_count
negotiation_opportunities_count
opportunities_need_follow_up_count
active_projects_count
projects_waiting_client_count
projects_not_updated_7_days_count
projects_near_deadline_count
total_outstanding_ar
total_overdue_ar
total_unpaid_ap
ap_due_this_week
recent_project_updates
```

### Acceptance Criteria

```txt
Dashboard API returns correct summary.
Dashboard calculation excludes deleted/cancelled data.
Finance numbers are based on valid invoices/payments/AP.
```

---

### 16.2 Dashboard UI

### Cards

```txt
Active Opportunities
Needs Follow-up
In Negotiation
Active Projects
Waiting Client
Not Updated > 7 Days
Outstanding AR
Overdue AR
Unpaid AP
AP Due This Week
```

### Tables

```txt
Projects needing attention
Opportunities needing follow-up
Overdue invoices
AP due soon
Recent activity
```

### Acceptance Criteria

```txt
Owner can understand business condition quickly.
Dashboard prioritizes actionable items.
Dashboard does not focus on decorative charts.
```

---

## Phase 17 - Reports and Export

### Goal

Allow owner/finance to export operational and finance data.

---

### 17.1 Reports API

### Endpoints

```txt
GET /api/reports/opportunities
GET /api/reports/projects
GET /api/reports/project-activities
GET /api/reports/invoices
GET /api/reports/payments
GET /api/reports/payables
```

### Export Formats

```txt
CSV
XLSX
```

### Acceptance Criteria

```txt
Reports can be filtered by date.
Reports can be filtered by status.
Reports can be exported.
Exported data is understandable.
```

---

### 17.2 Reports UI

### Pages

```txt
/reports
/reports/opportunities
/reports/projects
/reports/ar
/reports/ap
```

### Acceptance Criteria

```txt
Owner can export project report.
Finance can export AR/AP report.
Filters work before export.
```

---

## Phase 18 - Audit Logs

### Goal

Track important business and finance changes.

---

### 18.1 Audit Log Service

### Actions to Log

```txt
User role changed
Client created/updated/deleted
Opportunity created
Opportunity status changed
Opportunity deal amount changed
Opportunity converted to project
Project created
Project status changed
Project progress changed
Project PIC changed
Project marked completed
Project marked closed
Invoice created
Invoice amount changed
Invoice cancelled
Payment added
Payment cancelled
Payable created
Payable marked paid
Payable cancelled
Attachment uploaded
```

### Acceptance Criteria

```txt
Audit log is created for important actions.
Audit log includes actor, entity, action, old value, new value, and timestamp.
Normal users cannot modify audit logs.
```

---

### 18.2 Audit Log UI

### Pages

```txt
/audit-logs
```

Optional in MVP if time is limited.

Minimum requirement:

```txt
Audit data must be stored even if UI is basic.
```

### Acceptance Criteria

```txt
Owner/Admin can view audit logs.
Finance-related audit logs are visible.
```

---

## Phase 19 - Validation, Error Handling, and UX Polish

### Goal

Make system reliable and usable.

---

### 19.1 Validation

### Backend Validation

Validate:

```txt
Required fields
Enum values
Money values
Date values
File type
File size
Role permissions
Entity existence
Status transition rules
```

### Frontend Validation

Validate:

```txt
Required fields
Date format
Number/money input
File upload input
Basic form constraints
```

### Acceptance Criteria

```txt
Invalid data is rejected by backend.
Frontend shows clear error messages.
User cannot submit obviously invalid forms.
```

---

### 19.2 Error Handling

### Required Error States

```txt
Loading state
Empty state
Unauthorized state
Forbidden state
Not found state
Validation error state
Server error state
Network error state
```

### Acceptance Criteria

```txt
User gets understandable error message.
App does not crash on API error.
```

---

### 19.3 UI Polish

### UI Standards

```txt
Use consistent layout.
Use status badges.
Use IDR currency formatting.
Use Indonesian date formatting.
Use confirmation dialog for destructive actions.
Use table filters.
Use search input.
Use pagination.
```

### Acceptance Criteria

```txt
App is usable by non-technical business users.
Owner can read dashboard easily.
Finance can input invoice/payment without confusion.
```

---

## Phase 20 - Testing

### Goal

Ensure critical business flow works end-to-end.

---

### 20.1 Manual Test Scenarios

### Scenario 1 - Opportunity to Project

```txt
Create client
Create contact
Create opportunity
Add follow-up log
Change status to NEGOTIATION
Set deal amount
Change status to WON
Convert to project
Open project detail
```

Expected result:

```txt
Project is created.
Project links to opportunity.
Audit log is created.
```

---

### Scenario 2 - Project Activity

```txt
Open project
Add project member
Add activity
Set next action
Set next follow-up date
Check project detail
Check dashboard
```

Expected result:

```txt
Activity appears in timeline.
Last update is calculated.
Next follow-up appears.
```

---

### Scenario 3 - Invoice and Payment

```txt
Create invoice for project
Mark invoice as sent
Add partial payment
Check invoice status
Add final payment
Check invoice status
```

Expected result:

```txt
Invoice becomes PARTIALLY_PAID after partial payment.
Invoice becomes PAID after full payment.
Remaining amount is calculated correctly.
```

---

### Scenario 4 - Overdue Invoice

```txt
Create invoice with past due date
Do not add full payment
Run dashboard check
```

Expected result:

```txt
Invoice appears as overdue.
Overdue AR appears in dashboard.
```

---

### Scenario 5 - AP / Project Cost

```txt
Create payable for project
Set due date
Mark payable as paid
Check project cost summary
```

Expected result:

```txt
Payable appears in project detail.
Unpaid AP decreases after marked paid.
```

---

### Scenario 6 - Attachment Upload

```txt
Upload proposal file to opportunity
Upload invoice file to invoice
Upload payment proof to payment
Open each detail page
```

Expected result:

```txt
File metadata saved.
File accessible by authorized user.
File is linked to correct entity.
```

---

### Scenario 7 - Role Permission

```txt
Login as STAFF
Try to access finance endpoint
Login as FINANCE
Try to manage invoice
Login as OWNER
View all data
```

Expected result:

```txt
STAFF cannot access finance actions.
FINANCE can manage finance data.
OWNER can access all.
```

---

### 20.2 Critical Tests

Before production, test:

```txt
Auth
RBAC
Client CRUD
Opportunity CRUD
Opportunity log
Convert to project
Project CRUD
Project activity
Invoice CRUD
Payment calculation
AP CRUD
Attachment upload
Dashboard summary
Export
Audit log
```

### Acceptance Criteria

```txt
Core business flow works without blocking bug.
Finance calculation is correct.
Unauthorized access is blocked.
No production data is accidentally deleted.
```

---

## Phase 21 - Staging Deployment

### Goal

Deploy system to staging for realistic testing.

---

### 21.1 Staging Setup

### Environment

```txt
URL: staging-rmc.alfrzhb.com
Database: rmc_staging
Storage: rmc-staging-files
```

### Tasks

1. Deploy frontend to staging.
2. Deploy Worker API to staging.
3. Run D1 migrations on staging.
4. Configure R2 staging bucket.
5. Configure Cloudflare Access.
6. Add test users.
7. Add dummy Ratama data.

### Acceptance Criteria

```txt
Staging is accessible only by allowed users.
Staging uses staging database.
Staging uses staging R2 bucket.
Core scenarios pass.
```

---

### 21.2 Staging Dummy Data

Create sample data:

```txt
3 clients
5 opportunities
3 projects
10 project activities
5 invoices
5 payments
3 payables
```

### Acceptance Criteria

```txt
Dashboard shows meaningful data.
Filters can be tested.
Reports can be tested.
```

---

## Phase 22 - Production Deployment

### Goal

Deploy stable MVP to production.

---

### 22.1 Production Setup

### Environment

```txt
URL: rmc.alfrzhb.com
Database: rmc_production
Storage: rmc-production-files
```

### Tasks

1. Deploy production frontend.
2. Deploy production Worker.
3. Run production D1 migrations.
4. Configure production R2 bucket.
5. Configure Cloudflare Access.
6. Add real users.
7. Add owner/admin account.
8. Test login.
9. Test one complete flow using real or semi-real data.

### Acceptance Criteria

```txt
Production app is accessible.
Production app is protected.
Production database is separate from staging.
Production storage is separate from staging.
Owner can login.
Finance can login.
Core flow works.
```

---

### 22.2 Production Safety Checklist

Before production use:

```txt
Cloudflare Access enabled.
Only allowed emails can access.
RBAC works.
Production database is empty or intentionally seeded.
Staging and production DB are separate.
File upload limit works.
Finance data cannot be hard deleted.
Audit logs work.
Backup/export process is known.
```

---

## Phase 23 - Backup and Maintenance

### Goal

Prevent data loss and maintain system health.

---

### 23.1 Backup Strategy

### Minimum Backup

```txt
Weekly D1 export
Monthly full archive
Manual export before major migration
Regular export of AR/AP reports
Important files backed up outside R2 if needed
```

### Acceptance Criteria

```txt
Database can be exported.
Backup files are stored safely.
Developer knows how to restore or inspect backup.
```

---

### 23.2 Maintenance Tasks

Regularly check:

```txt
D1 storage usage
R2 storage usage
Worker errors
Failed uploads
Dashboard calculation correctness
Slow queries
Broken attachments
Inactive users
Audit logs
```

### Acceptance Criteria

```txt
System remains usable.
Storage does not grow uncontrollably.
Errors are noticed and fixed.
```

---

## Phase 24 - Versioning Roadmap

### Version 1 - MVP Core

Includes:

```txt
Client
Opportunity
Follow-up
Negotiation
Convert to project
Project
Project activity
Invoice
Payment
AP
Attachment
Dashboard
Export
Audit log
```

Goal:

```txt
Owner can monitor operational and finance status.
```

---

### Version 1.1 - Usability Improvement

Possible additions:

```txt
Better filters
Saved views
Improved dashboard
Better export
Bulk import from Excel
Better attachment preview
Better status timeline
```

Goal:

```txt
Make daily usage easier.
```

---

### Version 1.2 - Reminder System

Possible additions:

```txt
Follow-up due reminders
Invoice due reminders
AP due reminders
Project not updated reminders
Email notification
WhatsApp notification later if feasible
```

Goal:

```txt
Reduce forgotten follow-ups and overdue items.
```

---

### Version 2 - KPI Tracker

Only after v1 data is stable.

Possible KPI:

```txt
Number of follow-ups per staff
Number of active projects
Projects completed on time
Outstanding AR
Overdue AR
Collection rate
Proposal to deal conversion rate
Monthly deal value
Monthly project completion
```

Goal:

```txt
Generate KPI from real operational data.
```

---

### Version 3 - Advanced Finance and Integration

Possible additions:

```txt
Integration with accounting software
Advanced reports
Profitability per project
Bank import
Tax fields
Approval workflow
```

Goal:

```txt
Move closer to finance operations, but still not necessarily full accounting.
```

---

### Version 4 - Mobile/PWA Improvement

Possible additions:

```txt
Better PWA install experience
Mobile-optimized activity update
Mobile upload from camera
Approval from phone
Push notification
```

Goal:

```txt
Make it easier for staff/owner to update from phone.
```

---

## Phase 25 - Final Acceptance Criteria for MVP

The MVP is considered successful when the system can answer these questions:

```txt
Which clients are active?
Which opportunities are active?
Which opportunities need follow-up?
Which opportunities are in negotiation?
Which opportunities became projects?
Which projects are active?
Which projects are waiting for client?
Which projects have not been updated for more than 7 days?
Who is responsible for each project?
What is the latest activity of each project?
Which invoices have been sent?
Which invoices are unpaid?
Which invoices are overdue?
How much AR is outstanding?
Which payments have been received?
Which AP is unpaid?
Which AP is due soon?
Which projects are completed?
Which projects are truly closed?
```

If those questions can be answered from the system, the MVP is valuable.

---

## Phase 26 - AI Agent Instructions

The AI agent must follow these rules while working on this project:

1. Work only on Ratama Project & Finance Tracker.
2. Follow `techstack.md`, `business-flow.md`, and `plan.md`.
3. Do not add unrelated features.
4. Do not create KPI tracker unless explicitly requested.
5. Do not convert the project into full ERP/accounting.
6. Do not suggest Flutter/mobile-first for MVP.
7. Use web responsive architecture.
8. Use Cloudflare-native deployment.
9. Use relational database design.
10. Use Project as the central entity.
11. Keep Opportunity before Project.
12. Link Invoice to Project.
13. Link Payment to Invoice and Project.
14. Link AP to Project where possible.
15. Keep Activity Log as a critical module.
16. Use clear status enums.
17. Use audit log for important changes.
18. Do not hard delete finance data.
19. Store files in R2.
20. Store file metadata in D1.
21. Store money as integer.
22. Validate all inputs with Zod.
23. Enforce permissions in backend.
24. Keep the system simple but reliable.
25. Build by phases, not randomly.

---

## Phase 27 - Recommended Immediate Next Steps

After this `plan.md`, create these documents in order:

```txt
1. database-schema.md
2. api-spec.md
3. ui-pages.md
4. deployment.md
5. testing-checklist.md
```

Recommended next document:

```txt
database-schema.md
```

Reason:

```txt
The business flow is already clear.
The tech stack is already clear.
The development plan is already clear.
The next logical step is translating business flow into database tables, fields, relations, indexes, and constraints.
```

---

## Final Summary

Build this project in this order:

```txt
Documentation
-> Project setup
-> Cloudflare setup
-> Database schema
-> Auth/RBAC
-> Client module
-> Opportunity module
-> Follow-up log
-> Convert to project
-> Project module
-> Project activity
-> Invoice module
-> Payment module
-> AP module
-> Attachment module
-> Dashboard
-> Reports/export
-> Audit log
-> Staging
-> Production
```

The MVP must stay focused on:

```txt
Operational visibility
Project tracking
Follow-up tracking
Invoice/payment tracking
Simple AP/project cost tracking
Owner dashboard
```

Do not expand into KPI, accounting, payroll, tax, mobile app, or AI automation until the core system is stable.

