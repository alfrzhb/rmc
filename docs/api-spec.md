# Ratama Project & Finance Tracker - API Spec

## Base Principles

The API runs on Cloudflare Workers and stores data in Cloudflare D1.

Documents are handled as external document links. The API stores only metadata and URL in D1. There is no binary file upload in MVP.

## Response Shape

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message."
  }
}
```

## Health

### GET /api/health

Returns API health.

Response:

```json
{
  "status": "ok",
  "service": "ratama-tracker-api"
}
```

## Access and Users API

Protected APIs use Cloudflare Access identity from:

```text
cf-access-authenticated-user-email
```

The email must match an active row in the `users` table.

### GET /api/auth/me

Returns the current active app user mapped from Cloudflare Access.

Error cases:

- `ACCESS_IDENTITY_REQUIRED`
- `USER_NOT_REGISTERED`
- `USER_INACTIVE`

Response:

```json
{
  "success": true,
  "data": {
    "id": "usr_owner_001",
    "email": "owner@example.com",
    "name": "Owner Ratama",
    "role": "OWNER",
    "status": "ACTIVE"
  }
}
```

### GET /api/me

Temporary backward-compatible alias for `GET /api/auth/me`. New frontend code should use `/api/auth/me`.

### GET /api/users

List app users.

Allowed roles:

- `OWNER`
- `ADMIN`

### GET /api/users/:id

Get a user by id.

Allowed roles:

- `OWNER`
- `ADMIN`

### POST /api/users

Create a user mapping for Cloudflare Access identity.

Allowed roles:

- `OWNER`
- `ADMIN`

Request:

```json
{
  "email": "manager@example.com",
  "name": "Project Manager",
  "role": "PROJECT_MANAGER",
  "status": "ACTIVE"
}
```

### PUT /api/users/:id

Update email, name, role, or status.

Request:

```json
{
  "status": "INACTIVE"
}
```

### DELETE /api/users/:id

Soft delete a user and mark them inactive.

## Document Links API

Document links replace the old binary attachment upload flow.

### GET /api/document-links

List document links.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `linked_type` | No | Filter by linked entity type |
| `linked_id` | No | Filter by linked entity id |

Example:

```text
GET /api/document-links?linked_type=PROJECT&linked_id=prj_001
```

### GET /api/document-links/:id

Get one document link by id.

### POST /api/document-links

Create a document link.

Request:

```json
{
  "linked_type": "PROJECT",
  "linked_id": "prj_001",
  "document_kind": "PROJECT_DOCUMENT",
  "title": "Dokumen Kickoff Project",
  "url": "https://drive.google.com/...",
  "provider": "GOOGLE_DRIVE",
  "notes": "Dokumen disimpan di Google Drive"
}
```

Response: `201 Created`

### PUT /api/document-links/:id

Update document link metadata or URL.

Request example:

```json
{
  "title": "Dokumen Kickoff Project - Final",
  "url": "https://drive.google.com/..."
}
```

### DELETE /api/document-links/:id

Soft delete a document link.

Response:

```json
{
  "success": true,
  "data": {
    "id": "doc_001"
  }
}
```

## Document Link Rules

1. Validate linked entity exists.
2. Validate user has permission to linked entity.
3. Validate URL format.
4. Store only metadata and URL in D1.
5. Do not upload binary files.
6. Do not require any document storage bucket.
7. Soft delete by setting `deleted_at`.

## Document Link Values

`linked_type`:

- `CLIENT`
- `OPPORTUNITY`
- `OPPORTUNITY_LOG`
- `PROJECT`
- `PROJECT_ACTIVITY`
- `INVOICE`
- `PAYMENT`
- `PAYABLE`

`document_kind`:

- `PROPOSAL`
- `CONTRACT`
- `SPK`
- `PO`
- `PROJECT_DOCUMENT`
- `INVOICE_FILE`
- `PAYMENT_PROOF`
- `VENDOR_BILL`
- `AP_PAYMENT_PROOF`
- `OTHER`

`provider`:

- `GOOGLE_DRIVE`
- `ONEDRIVE`
- `DROPBOX`
- `EXTERNAL_URL`
- `OTHER`

## Disabled Legacy Upload API

### POST /api/attachments/upload

Binary upload is disabled in MVP.

Response:

```json
{
  "success": false,
  "error": {
    "code": "FILE_UPLOAD_DISABLED",
    "message": "Binary file upload is disabled. Use document links instead."
  }
}
```

HTTP status: `410 Gone`

## Active Business APIs

These modules are active backend APIs:

- clients
- client contacts
- opportunities
- opportunity logs
- projects
- project members
- project activities
- invoices
- payments
- payables
- dashboard
- document links
- audit logs

All APIs follow the same response shape and D1-backed validation rules.

## Clients API

Client APIs require an active app user.

### GET /api/clients

List clients.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `search` | No | Search by name, email, or phone |
| `status` | No | Filter by client status |
| `industry` | No | Filter by industry |
| `page` | No | Page number, default `1` |
| `pageSize` | No | Page size, default `20`, max `100` |

### GET /api/clients/:id

Get a client with its contacts.

### POST /api/clients

Create a client.

Request:

```json
{
  "name": "PT Contoh Ratama",
  "client_type": "Company",
  "industry": "Manufacturing",
  "address": "Jakarta",
  "email": "client@example.com",
  "phone": "021-000000",
  "notes": "Prospek audit",
  "status": "PROSPECT"
}
```

### PUT /api/clients/:id

Update a client.

### DELETE /api/clients/:id

Soft delete a client and its active contacts.

## Client Contacts API

### GET /api/clients/:clientId/contacts

List contacts for a client.

### GET /api/clients/:clientId/contacts/:contactId

Get one client contact.

### POST /api/clients/:clientId/contacts

Create a contact for a client.

Request:

```json
{
  "name": "Budi Santoso",
  "position": "Finance Manager",
  "email": "budi@example.com",
  "phone": "0812000000",
  "whatsapp": "0812000000",
  "is_primary": true,
  "notes": "Kontak utama invoice"
}
```

### PUT /api/clients/:clientId/contacts/:contactId

Update a contact. If `is_primary` is set to `true`, other active contacts for the same client are set to non-primary.

### DELETE /api/clients/:clientId/contacts/:contactId

Soft delete a contact.

## Opportunities API

Opportunity APIs require an active app user.

### GET /api/opportunities

List opportunities.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `search` | No | Search by opportunity name, client name, or service type |
| `client_id` | No | Filter by client |
| `pic_user_id` | No | Filter by PIC user |
| `status` | No | Filter by opportunity status |
| `page` | No | Page number, default `1` |
| `pageSize` | No | Page size, default `20`, max `100` |

### GET /api/opportunities/:id

Get an opportunity with logs.

### POST /api/opportunities

Create an opportunity.

Request:

```json
{
  "client_id": "client_001",
  "name": "Audit Internal 2026",
  "service_type": "Audit",
  "estimated_value": 50000000,
  "initial_offer_amount": 45000000,
  "pic_user_id": "usr_owner_001",
  "status": "NEW",
  "source": "Referral",
  "next_follow_up_date": "2026-07-10",
  "notes": "Prospek awal"
}
```

Rules:

- `client_id` must exist.
- `pic_user_id` must point to an active user.
- If `status` is `WON`, `deal_amount` is required.

### PUT /api/opportunities/:id

Update an opportunity or transition its status.

### DELETE /api/opportunities/:id

Soft delete an opportunity and its logs.

## Opportunity Logs API

### GET /api/opportunities/:opportunityId/logs

List logs for an opportunity.

### GET /api/opportunities/:opportunityId/logs/:logId

Get one opportunity log.

### POST /api/opportunities/:opportunityId/logs

Create a log for an opportunity. The API stores the current active user as `user_id`.

Request:

```json
{
  "activity_type": "CALL",
  "activity_date": "2026-07-04",
  "notes": "Follow-up kebutuhan client",
  "next_action": "Kirim proposal",
  "next_follow_up_date": "2026-07-08"
}
```

### PUT /api/opportunities/:opportunityId/logs/:logId

Update an opportunity log.

### DELETE /api/opportunities/:opportunityId/logs/:logId

Soft delete an opportunity log.

## Projects API

Project APIs require an active app user.

### GET /api/projects

List projects.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `search` | No | Search by project name, client name, or service type |
| `client_id` | No | Filter by client |
| `pic_user_id` | No | Filter by PIC user |
| `status` | No | Filter by project status |
| `page` | No | Page number, default `1` |
| `pageSize` | No | Page size, default `20`, max `100` |

### GET /api/projects/:id

Get a project with members and activities.

### POST /api/projects

Create a project.

Request:

```json
{
  "client_id": "client_001",
  "opportunity_id": "opp_001",
  "name": "Project Audit 2026",
  "service_type": "Audit",
  "contract_value": 42000000,
  "pic_user_id": "usr_owner_001",
  "status": "KICKOFF",
  "progress_percentage": 10,
  "start_date": "2026-07-04",
  "deadline": "2026-08-31",
  "next_action": "Kickoff meeting"
}
```

Rules:

- `client_id` must exist.
- `pic_user_id` must point to an active user.
- `opportunity_id` is optional.
- If provided, `opportunity_id` must exist and belong to the selected client.
- `contract_value` must be non-negative.
- `progress_percentage` must be between `0` and `100`.

### PUT /api/projects/:id

Update a project.

### DELETE /api/projects/:id

Soft delete a project, its members, and its activities.

## Project Members API

### GET /api/projects/:projectId/members

List project members.

### GET /api/projects/:projectId/members/:memberId

Get one project member.

### POST /api/projects/:projectId/members

Add a member to a project.

Request:

```json
{
  "user_id": "usr_owner_001",
  "role_in_project": "PIC",
  "assigned_at": "2026-07-04",
  "is_active": true
}
```

### PUT /api/projects/:projectId/members/:memberId

Update project member role or active state.

### DELETE /api/projects/:projectId/members/:memberId

Soft delete and deactivate a project member.

## Project Activities API

### GET /api/projects/:projectId/activities

List project activities.

### GET /api/projects/:projectId/activities/:activityId

Get one project activity.

### POST /api/projects/:projectId/activities

Create a project activity. The API stores the current active user as `user_id`.

Request:

```json
{
  "activity_type": "MEETING",
  "activity_date": "2026-07-04",
  "notes": "Kickoff project",
  "next_action": "Collect client documents",
  "next_follow_up_date": "2026-07-08",
  "progress_snapshot": 20
}
```

If `progress_snapshot` is provided, the project `progress_percentage` is updated to the same value.

### PUT /api/projects/:projectId/activities/:activityId

Update a project activity.

### DELETE /api/projects/:projectId/activities/:activityId

Soft delete a project activity.

## Invoices API

Invoice APIs require an active app user.

### GET /api/invoices

List invoices.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `search` | No | Search by invoice number, project name, or client name |
| `project_id` | No | Filter by project |
| `client_id` | No | Filter by client |
| `status` | No | Filter by invoice status |
| `page` | No | Page number |
| `pageSize` | No | Page size |

### GET /api/invoices/:id

Get invoice detail with payments.

### POST /api/invoices

Create an invoice.

```json
{
  "project_id": "project_001",
  "invoice_number": "INV-2026-001",
  "invoice_date": "2026-07-04",
  "due_date": "2026-07-31",
  "termin_number": 1,
  "description": "Termin 1",
  "amount": 25000000,
  "status": "DRAFT"
}
```

Rules:

- `project_id` must exist.
- `client_id` is derived from the project.
- `invoice_number` must be unique.
- `amount` must be positive.

### PUT /api/invoices/:id

Update invoice data.

### DELETE /api/invoices/:id

Soft delete an invoice.

## Payments API

### GET /api/payments

List payments.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `invoice_id` | No | Filter by invoice |
| `project_id` | No | Filter by project |
| `client_id` | No | Filter by client |
| `status` | No | Filter by payment status |
| `page` | No | Page number |
| `pageSize` | No | Page size |

### GET /api/payments/:id

Get one payment.

### POST /api/payments

Create a payment. Project and client are derived from the invoice.

```json
{
  "invoice_id": "invoice_001",
  "payment_date": "2026-07-20",
  "amount": 10000000,
  "payment_method": "BANK_TRANSFER",
  "reference_number": "TRX-001",
  "status": "VALID"
}
```

Valid payments update invoice status:

- no valid payment keeps current invoice status
- partial total sets `PARTIALLY_PAID`
- full total sets `PAID`

### PUT /api/payments/:id

Update a payment and recalculate invoice payment status.

### DELETE /api/payments/:id

Soft delete a payment and recalculate invoice payment status.

## Payables API

### GET /api/payables

List AP/payables.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `project_id` | No | Filter by project |
| `status` | No | Filter by payable status |
| `cost_category` | No | Filter by cost category |
| `vendor_name` | No | Search vendor name |
| `page` | No | Page number |
| `pageSize` | No | Page size |

### GET /api/payables/:id

Get one payable.

### POST /api/payables

Create a payable.

```json
{
  "project_id": "project_001",
  "vendor_name": "Vendor Contoh",
  "cost_category": "OPERATIONAL",
  "description": "Biaya operasional project",
  "bill_date": "2026-07-04",
  "due_date": "2026-07-15",
  "amount": 5000000,
  "status": "UNPAID"
}
```

### PUT /api/payables/:id

Update a payable.

### DELETE /api/payables/:id

Soft delete a payable.

## Dashboard API

Dashboard APIs require an active app user.

### GET /api/dashboard/summary

Returns summary cards, receivable overview, payable overview, status summaries, and overdue items.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `as_of` | No | Date cutoff for overdue checks. Defaults to current date. |

Example:

```text
GET /api/dashboard/summary?as_of=2026-07-04
```

Response shape:

```json
{
  "success": true,
  "data": {
    "as_of": "2026-07-04",
    "summary_cards": {
      "active_clients": 10,
      "prospect_clients": 4,
      "open_opportunities": 8,
      "won_opportunities": 3,
      "active_projects": 5,
      "overdue_projects": 1
    },
    "receivables": {
      "total_invoiced": 100000000,
      "total_paid": 60000000,
      "outstanding": 40000000,
      "overdue_amount": 15000000
    },
    "payables": {
      "unpaid_amount": 12000000,
      "overdue_amount": 3000000
    },
    "status_summary": {
      "opportunities": [],
      "projects": [],
      "invoices": [],
      "payables": []
    },
    "overdue_items": {
      "invoices": [],
      "payables": []
    }
  }
}
```

## Audit Logs API

Audit log APIs require an active app user with `OWNER` or `ADMIN` role.

### GET /api/audit-logs

List audit logs for create, update, delete, transition, and finance actions.

Query:

| Param | Required | Description |
| --- | --- | --- |
| `actor_user_id` | No | Filter by actor user |
| `entity_type` | No | Filter by entity type |
| `entity_id` | No | Filter by entity id |
| `action` | No | Filter by action |
| `page` | No | Page number |
| `pageSize` | No | Page size |

Example:

```text
GET /api/audit-logs?entity_type=INVOICE&action=FINANCE
```

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": "audit_001",
      "actor_user_id": "usr_owner_001",
      "actor_name": "Owner Ratama",
      "actor_email": "owner@example.com",
      "entity_type": "INVOICE",
      "entity_id": "invoice_001",
      "action": "FINANCE",
      "old_value": null,
      "new_value": {},
      "ip_address": "127.0.0.1",
      "user_agent": "curl/8.0",
      "created_at": "2026-07-05T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

Tracked actions:

- `CREATE`
- `UPDATE`
- `DELETE`
- `TRANSITION`
- `FINANCE`
