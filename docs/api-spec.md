# API Spec - Ratama Project & Finance Tracker

## 1. Purpose

Dokumen ini menjelaskan rancangan API untuk **Ratama Project & Finance Tracker**.

API ini digunakan untuk mendukung sistem internal Ratama dari alur:

```txt
Client
-> Opportunity / Penawaran
-> Follow-up
-> Negotiation
-> Deal
-> Project
-> Project Activity
-> Invoice / AR
-> Payment
-> AP / Project Cost
-> Dashboard
-> Reports
```

API ini **bukan** untuk full accounting, payroll, tax system, KPI tracker, bank integration, atau client portal pada MVP.

---

## 2. API Architecture

Recommended architecture:

```txt
Frontend Web App
Cloudflare Pages
        |
        v
Same-origin API
rmc.alfrzhb.com/api/*
        |
        v
Cloudflare Workers + Hono
        |
        v
Cloudflare D1 + R2
```

Production:

```txt
https://rmc.alfrzhb.com/api
```

Staging:

```txt
https://staging-rmc.alfrzhb.com/api
```

Local:

```txt
http://localhost:8787/api
```

Use same-origin API for MVP:

```txt
rmc.alfrzhb.com/api/*
```

Avoid separate API domain for MVP unless necessary.

---

## 3. Technology

Backend stack:

```txt
Cloudflare Workers
Hono
TypeScript
Zod
Drizzle ORM
Cloudflare D1
Cloudflare R2
Cloudflare Access
```

API responsibilities:

1. Read authenticated user identity from Cloudflare Access.
2. Match authenticated email to internal `users` table.
3. Enforce role-based access control.
4. Validate all request payloads with Zod.
5. Run database operations through Drizzle ORM.
6. Store file metadata in D1.
7. Store file binary in R2.
8. Create audit logs for important actions.
9. Return consistent response format.
10. Protect finance and sensitive data.

---

## 4. Authentication

Authentication is handled by:

```txt
Cloudflare Access
+
Internal users table
```

### 4.1 Authentication Flow

```txt
User opens rmc.alfrzhb.com
|
v
Cloudflare Access verifies email
|
v
Request reaches frontend/API
|
v
Backend reads Cloudflare Access identity headers
|
v
Backend checks user email in users table
|
v
Backend checks user.status = ACTIVE
|
v
Backend attaches current user to request context
```

### 4.2 Required User Rule

A user is allowed to access the application only if:

```txt
Cloudflare Access allows the user
AND
user email exists in internal users table
AND
user.status = ACTIVE
```

If Cloudflare Access allows the user but user is not found in internal database, return:

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_REGISTERED",
    "message": "User is authenticated but not registered in this application."
  }
}
```

### 4.3 Current User Endpoint

```txt
GET /api/auth/me
```

Purpose:

```txt
Return current authenticated user.
```

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER, STAFF
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "email": "owner@example.com",
    "name": "Owner Ratama",
    "role": "OWNER",
    "status": "ACTIVE"
  }
}
```

---

## 5. Authorization / RBAC

Use internal role-based access control.

Roles:

```txt
OWNER
ADMIN
FINANCE
PROJECT_MANAGER
STAFF
```

### 5.1 Role Meaning

| Role            | Meaning                                                      |
| --------------- | ------------------------------------------------------------ |
| OWNER           | Can view and manage all business and finance data            |
| ADMIN           | Can manage users, clients, contacts, and basic master data   |
| FINANCE         | Can manage invoices, payments, payables, and finance reports |
| PROJECT_MANAGER | Can manage assigned projects and related activities          |
| STAFF           | Can update assigned project activities and follow-up notes   |

### 5.2 General Permission Rules

| Module        | OWNER |        ADMIN |              FINANCE |       PROJECT_MANAGER |                    STAFF |
| ------------- | ----: | -----------: | -------------------: | --------------------: | -----------------------: |
| Dashboard     |  Full |      Limited |              Finance |               Project |                  Limited |
| Users         |  Full |       Manage |                   No |                    No |                       No |
| Clients       |  Full |         Full |                 View |                  View |            View assigned |
| Opportunities |  Full |         Full |                 View |       Assigned/manage |          Assigned/update |
| Projects      |  Full |         Full | View finance-related |       Assigned/manage | Assigned/update activity |
| Activities    |  Full |         Full |                 View |       Assigned/manage |          Assigned/create |
| Invoices      |  Full |         View |                 Full | View assigned project |               No/limited |
| Payments      |  Full |         View |                 Full | View assigned project |                       No |
| Payables      |  Full |         View |                 Full | View assigned project |                       No |
| Attachments   |  Full |         Full |      Finance-related |      Assigned project |         Assigned project |
| Reports       |  Full |  Operational |              Finance |      Assigned project |                  Limited |
| Audit Logs    |  Full | View limited |      Finance-related |            No/limited |                       No |

### 5.3 Backend Enforcement

Do not rely only on frontend UI hiding.

Every endpoint must enforce authorization in backend middleware or route handler.

---

## 6. Standard API Response

All API responses should use consistent shape.

### 6.1 Success Response

```json
{
  "success": true,
  "data": {}
}
```

### 6.2 Success List Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 6.3 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload.",
    "details": {}
  }
}
```

---

## 7. HTTP Status Codes

Use these status codes consistently:

| Status | Meaning                              |
| -----: | ------------------------------------ |
|    200 | Success                              |
|    201 | Created                              |
|    400 | Bad request / validation error       |
|    401 | Unauthenticated                      |
|    403 | Forbidden                            |
|    404 | Resource not found                   |
|    409 | Conflict / duplicate / invalid state |
|    422 | Business rule violation              |
|    500 | Internal server error                |

---

## 8. Error Codes

Recommended error codes:

```txt
UNAUTHENTICATED
USER_NOT_REGISTERED
USER_INACTIVE
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
DUPLICATE_RESOURCE
INVALID_STATUS_TRANSITION
BUSINESS_RULE_VIOLATION
FILE_TOO_LARGE
INVALID_FILE_TYPE
UPLOAD_FAILED
DATABASE_ERROR
INTERNAL_SERVER_ERROR
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

---

## 9. Pagination, Filtering, and Sorting

List endpoints should support:

```txt
page
pageSize
search
sortBy
sortOrder
```

Example:

```txt
GET /api/projects?page=1&pageSize=20&status=IN_PROGRESS&sortBy=deadline&sortOrder=asc
```

### 9.1 Pagination Defaults

```txt
page = 1
pageSize = 20
maxPageSize = 100
```

### 9.2 Sort Order

```txt
asc
desc
```

### 9.3 List Response Meta

```json
{
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 57,
    "totalPages": 3
  }
}
```

---

## 10. Date, Time, and Money Format

### 10.1 Date Format

Use ISO date string:

```txt
YYYY-MM-DD
```

Example:

```txt
2026-07-03
```

### 10.2 Timestamp Format

Use ISO timestamp:

```txt
YYYY-MM-DDTHH:mm:ss.sssZ
```

Example:

```txt
2026-07-03T10:30:00.000Z
```

### 10.3 Money Format

Store money as integer in IDR.

Example:

```json
{
  "amount": 25000000
}
```

Meaning:

```txt
Rp 25.000.000
```

Do not use float.

Bad:

```json
{
  "amount": 25000000.5
}
```

---

## 11. Health Check

### 11.1 GET /api/health

Purpose:

```txt
Check API availability.
```

Auth:

```txt
Public or protected depending deployment preference.
Recommended: public for basic health check, but without sensitive data.
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "ratama-tracker-api",
    "timestamp": "2026-07-03T10:30:00.000Z"
  }
}
```

---

## 12. Users API

Users are internal application users mapped to Cloudflare Access email.

### 12.1 GET /api/users

Purpose:

```txt
List internal users.
```

Allowed roles:

```txt
OWNER, ADMIN
```

Query params:

```txt
page
pageSize
search
role
status
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "usr_001",
      "email": "owner@example.com",
      "name": "Owner Ratama",
      "role": "OWNER",
      "status": "ACTIVE",
      "last_login_at": "2026-07-03T10:00:00.000Z",
      "created_at": "2026-07-03T09:00:00.000Z",
      "updated_at": "2026-07-03T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 12.2 GET /api/users/:id

Allowed roles:

```txt
OWNER, ADMIN
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "email": "owner@example.com",
    "name": "Owner Ratama",
    "role": "OWNER",
    "status": "ACTIVE",
    "last_login_at": null,
    "created_at": "2026-07-03T09:00:00.000Z",
    "updated_at": "2026-07-03T09:00:00.000Z"
  }
}
```

---

### 12.3 POST /api/users

Purpose:

```txt
Create internal user.
```

Allowed roles:

```txt
OWNER, ADMIN
```

Request:

```json
{
  "email": "staff@example.com",
  "name": "Staff Ratama",
  "role": "STAFF",
  "status": "ACTIVE"
}
```

Validation:

```txt
email required, valid email, lowercase
name required
role must be valid
status must be valid
email must be unique
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "usr_002",
    "email": "staff@example.com",
    "name": "Staff Ratama",
    "role": "STAFF",
    "status": "ACTIVE"
  }
}
```

Audit log:

```txt
USER CREATE
```

---

### 12.4 PUT /api/users/:id

Purpose:

```txt
Update internal user.
```

Allowed roles:

```txt
OWNER, ADMIN
```

Request:

```json
{
  "name": "Updated Staff",
  "role": "PROJECT_MANAGER",
  "status": "ACTIVE"
}
```

Business rules:

1. Role change must create audit log.
2. User status change must create audit log.
3. Do not allow last OWNER to be demoted or deactivated.

Audit log:

```txt
USER UPDATE
USER ROLE_CHANGE
```

---

### 12.5 DELETE /api/users/:id

Purpose:

```txt
Soft delete user.
```

Allowed roles:

```txt
OWNER, ADMIN
```

Business rules:

1. Use soft delete.
2. Do not allow deletion of last OWNER.
3. Do not hard delete user.

Response:

```json
{
  "success": true,
  "data": {
    "id": "usr_002",
    "deleted": true
  }
}
```

---

## 13. Clients API

### 13.1 GET /api/clients

Purpose:

```txt
List clients.
```

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER, STAFF
```

Query params:

```txt
page
pageSize
search
status
industry
```

Response item:

```json
{
  "id": "clt_001",
  "name": "PT ABC",
  "client_type": "COMPANY",
  "industry": "Manufacturing",
  "email": "info@ptabc.com",
  "phone": "021000000",
  "status": "ACTIVE",
  "created_at": "2026-07-03T09:00:00.000Z",
  "updated_at": "2026-07-03T09:00:00.000Z"
}
```

---

### 13.2 GET /api/clients/:id

Purpose:

```txt
Get client detail with contacts summary.
```

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER, STAFF
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "clt_001",
    "name": "PT ABC",
    "client_type": "COMPANY",
    "industry": "Manufacturing",
    "address": "Jakarta",
    "email": "info@ptabc.com",
    "phone": "021000000",
    "notes": "Important client",
    "status": "ACTIVE",
    "contacts": [
      {
        "id": "cnt_001",
        "name": "Bapak Ahmad",
        "position": "Manager",
        "email": "ahmad@ptabc.com",
        "phone": "08123456789",
        "whatsapp": "08123456789",
        "is_primary": 1
      }
    ]
  }
}
```

---

### 13.3 POST /api/clients

Allowed roles:

```txt
OWNER, ADMIN
```

Request:

```json
{
  "name": "PT ABC",
  "client_type": "COMPANY",
  "industry": "Manufacturing",
  "address": "Jakarta",
  "email": "info@ptabc.com",
  "phone": "021000000",
  "notes": "Important client",
  "status": "PROSPECT"
}
```

Validation:

```txt
name required
status valid
email optional but must be valid if provided
```

Audit log:

```txt
CLIENT CREATE
```

---

### 13.4 PUT /api/clients/:id

Allowed roles:

```txt
OWNER, ADMIN
```

Request:

```json
{
  "name": "PT ABC Updated",
  "status": "ACTIVE",
  "notes": "Updated notes"
}
```

Audit log:

```txt
CLIENT UPDATE
```

---

### 13.5 DELETE /api/clients/:id

Purpose:

```txt
Soft delete client.
```

Allowed roles:

```txt
OWNER, ADMIN
```

Business rules:

1. Do not hard delete.
2. Do not delete client if active opportunities/projects/invoices exist unless OWNER confirms archive flow.
3. Use `deleted_at`.

Audit log:

```txt
CLIENT SOFT_DELETE
```

---

## 14. Client Contacts API

### 14.1 GET /api/clients/:clientId/contacts

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER, STAFF
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "cnt_001",
      "client_id": "clt_001",
      "name": "Bapak Ahmad",
      "position": "Manager",
      "email": "ahmad@ptabc.com",
      "phone": "08123456789",
      "whatsapp": "08123456789",
      "is_primary": 1,
      "notes": null
    }
  ]
}
```

---

### 14.2 POST /api/clients/:clientId/contacts

Allowed roles:

```txt
OWNER, ADMIN
```

Request:

```json
{
  "name": "Bapak Ahmad",
  "position": "Manager",
  "email": "ahmad@ptabc.com",
  "phone": "08123456789",
  "whatsapp": "08123456789",
  "is_primary": 1,
  "notes": "Main contact"
}
```

Business rules:

1. If `is_primary = 1`, unset other active primary contacts for same client.
2. Client must exist.
3. Contact uses soft delete.

Audit log:

```txt
CLIENT_CONTACT CREATE
```

---

### 14.3 PUT /api/client-contacts/:id

Allowed roles:

```txt
OWNER, ADMIN
```

Business rules:

1. If set as primary, unset other primary contacts for same client.

Audit log:

```txt
CLIENT_CONTACT UPDATE
```

---

### 14.4 DELETE /api/client-contacts/:id

Allowed roles:

```txt
OWNER, ADMIN
```

Business rules:

1. Use soft delete.

Audit log:

```txt
CLIENT_CONTACT SOFT_DELETE
```

---

## 15. Opportunities API

### 15.1 GET /api/opportunities

Purpose:

```txt
List opportunities/penawaran.
```

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER, STAFF
```

Permission behavior:

```txt
OWNER/ADMIN: all opportunities
FINANCE: view all, finance context only
PROJECT_MANAGER: all or assigned depending policy
STAFF: assigned opportunities only
```

Query params:

```txt
page
pageSize
search
clientId
picUserId
status
nextFollowUpFrom
nextFollowUpTo
sortBy
sortOrder
```

Response item:

```json
{
  "id": "opp_001",
  "client_id": "clt_001",
  "client_name": "PT ABC",
  "name": "Konsultasi ISO PT ABC",
  "service_type": "ISO Consultation",
  "estimated_value": 50000000,
  "initial_offer_amount": 60000000,
  "revised_offer_amount": 55000000,
  "deal_amount": null,
  "deal_date": null,
  "pic_user_id": "usr_003",
  "pic_name": "Budi",
  "status": "NEGOTIATION",
  "proposal_sent_date": "2026-07-01",
  "next_follow_up_date": "2026-07-05",
  "last_follow_up_date": "2026-07-03",
  "created_at": "2026-07-03T09:00:00.000Z",
  "updated_at": "2026-07-03T09:00:00.000Z"
}
```

---

### 15.2 GET /api/opportunities/:id

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER, STAFF assigned
```

Response should include:

```txt
opportunity detail
client summary
PIC summary
latest logs
project conversion status
attachments summary
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "opp_001",
    "client": {
      "id": "clt_001",
      "name": "PT ABC"
    },
    "name": "Konsultasi ISO PT ABC",
    "service_type": "ISO Consultation",
    "estimated_value": 50000000,
    "initial_offer_amount": 60000000,
    "revised_offer_amount": 55000000,
    "deal_amount": null,
    "deal_date": null,
    "payment_scheme": "50% DP, 50% after final report",
    "pic": {
      "id": "usr_003",
      "name": "Budi"
    },
    "status": "NEGOTIATION",
    "source": "Referral",
    "proposal_sent_date": "2026-07-01",
    "next_follow_up_date": "2026-07-05",
    "notes": "Client asks for revised scope.",
    "project_id": null,
    "created_at": "2026-07-03T09:00:00.000Z",
    "updated_at": "2026-07-03T09:00:00.000Z"
  }
}
```

---

### 15.3 POST /api/opportunities

Allowed roles:

```txt
OWNER, ADMIN, PROJECT_MANAGER
```

Request:

```json
{
  "client_id": "clt_001",
  "name": "Konsultasi ISO PT ABC",
  "service_type": "ISO Consultation",
  "estimated_value": 50000000,
  "initial_offer_amount": 60000000,
  "pic_user_id": "usr_003",
  "status": "NEW",
  "source": "Referral",
  "proposal_sent_date": null,
  "next_follow_up_date": "2026-07-05",
  "notes": "Initial inquiry from client."
}
```

Validation:

```txt
client_id required and must exist
name required
pic_user_id required and must exist
status required and valid
money values must be integer >= 0
```

Audit log:

```txt
OPPORTUNITY CREATE
```

---

### 15.4 PUT /api/opportunities/:id

Allowed roles:

```txt
OWNER, ADMIN, assigned PROJECT_MANAGER
```

Request:

```json
{
  "status": "NEGOTIATION",
  "revised_offer_amount": 55000000,
  "next_follow_up_date": "2026-07-08",
  "notes": "Client requested lower price."
}
```

Business rules:

1. Status must be valid.
2. If status becomes `WON`, `deal_amount` is required.
3. If status becomes `LOST`, `lost_reason` should be provided.
4. If status becomes `ON_HOLD`, `on_hold_reason` should be provided.
5. Changes to status and amount must create audit log.
6. Money must be integer.

Audit log:

```txt
OPPORTUNITY UPDATE
OPPORTUNITY STATUS_CHANGE
OPPORTUNITY AMOUNT_CHANGE
```

---

### 15.5 DELETE /api/opportunities/:id

Allowed roles:

```txt
OWNER, ADMIN
```

Business rules:

1. Use soft delete.
2. Do not delete if already converted to project.
3. If already converted, block deletion and recommend cancelling/archiving project instead.

Audit log:

```txt
OPPORTUNITY SOFT_DELETE
```

---

## 16. Opportunity Logs API

### 16.1 GET /api/opportunities/:id/logs

Allowed roles:

```txt
OWNER, ADMIN, FINANCE view, PROJECT_MANAGER assigned, STAFF assigned
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "olg_001",
      "opportunity_id": "opp_001",
      "user": {
        "id": "usr_003",
        "name": "Budi"
      },
      "activity_type": "WHATSAPP_FOLLOW_UP",
      "activity_date": "2026-07-03",
      "notes": "Client requested revised price and scope.",
      "next_action": "Send revised proposal",
      "next_follow_up_date": "2026-07-05",
      "created_at": "2026-07-03T10:00:00.000Z"
    }
  ]
}
```

---

### 16.2 POST /api/opportunities/:id/logs

Allowed roles:

```txt
OWNER, ADMIN, assigned PROJECT_MANAGER, assigned STAFF
```

Request:

```json
{
  "activity_type": "WHATSAPP_FOLLOW_UP",
  "activity_date": "2026-07-03",
  "notes": "Client requested revised price and scope.",
  "next_action": "Send revised proposal",
  "next_follow_up_date": "2026-07-05"
}
```

Validation:

```txt
opportunity must exist
activity_type valid
activity_date required
notes required
```

Business rules:

1. Create opportunity log.
2. Optionally update opportunity `next_follow_up_date` from log.
3. Optionally update opportunity `notes` or latest activity summary at response level only.

Audit log:

```txt
OPPORTUNITY_LOG CREATE
```

---

### 16.3 PUT /api/opportunity-logs/:id

Allowed roles:

```txt
OWNER, ADMIN, author user if allowed
```

Business rules:

1. Only allow editing within reasonable policy, for example same day, unless OWNER/ADMIN.
2. Keep audit log.

Audit log:

```txt
OPPORTUNITY_LOG UPDATE
```

---

### 16.4 DELETE /api/opportunity-logs/:id

Allowed roles:

```txt
OWNER, ADMIN
```

Business rules:

1. Use soft delete.
2. Do not hard delete.

Audit log:

```txt
OPPORTUNITY_LOG SOFT_DELETE
```

---

## 17. Convert Opportunity to Project API

### 17.1 POST /api/opportunities/:id/convert-to-project

Purpose:

```txt
Convert WON opportunity into project.
```

Allowed roles:

```txt
OWNER, ADMIN, PROJECT_MANAGER assigned
```

Request:

```json
{
  "start_date": "2026-07-10",
  "deadline": "2026-09-10",
  "status": "NOT_STARTED",
  "progress_percentage": 0,
  "next_action": "Schedule kickoff meeting",
  "next_follow_up_date": "2026-07-11"
}
```

Business rules:

1. Opportunity must exist.
2. Opportunity status must be `WON`.
3. Opportunity must have `deal_amount`.
4. Opportunity must have `pic_user_id`.
5. Project for this opportunity must not already exist.
6. Project `contract_value` uses `opportunity.deal_amount`.
7. Project `client_id` uses `opportunity.client_id`.
8. Project `name` defaults to opportunity name.
9. Create audit log.

Response:

```json
{
  "success": true,
  "data": {
    "id": "prj_001",
    "opportunity_id": "opp_001",
    "client_id": "clt_001",
    "name": "Konsultasi ISO PT ABC",
    "contract_value": 50000000,
    "pic_user_id": "usr_003",
    "status": "NOT_STARTED"
  }
}
```

Possible errors:

```txt
OPPORTUNITY_NOT_WON
DEAL_AMOUNT_REQUIRED
PROJECT_ALREADY_EXISTS
```

Audit log:

```txt
OPPORTUNITY CONVERT_TO_PROJECT
PROJECT CREATE
```

---

## 18. Projects API

### 18.1 GET /api/projects

Purpose:

```txt
List projects.
```

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER, STAFF
```

Permission behavior:

```txt
OWNER/ADMIN: all projects
FINANCE: all projects with finance visibility
PROJECT_MANAGER: assigned or all depending policy
STAFF: assigned projects only
```

Query params:

```txt
page
pageSize
search
clientId
picUserId
status
deadlineFrom
deadlineTo
nextFollowUpFrom
nextFollowUpTo
staleOnly
sortBy
sortOrder
```

Response item:

```json
{
  "id": "prj_001",
  "client_id": "clt_001",
  "client_name": "PT ABC",
  "name": "Konsultasi ISO PT ABC",
  "service_type": "ISO Consultation",
  "contract_value": 50000000,
  "pic_user_id": "usr_003",
  "pic_name": "Budi",
  "status": "IN_PROGRESS",
  "progress_percentage": 45,
  "start_date": "2026-07-10",
  "deadline": "2026-09-10",
  "next_action": "Review client documents",
  "next_follow_up_date": "2026-07-15",
  "last_activity_date": "2026-07-12",
  "is_stale": false,
  "created_at": "2026-07-10T09:00:00.000Z",
  "updated_at": "2026-07-12T09:00:00.000Z"
}
```

---

### 18.2 GET /api/projects/:id

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER assigned, STAFF assigned
```

Response should include:

```txt
project detail
client summary
opportunity summary
PIC summary
members
activity summary
finance summary
attachment summary
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "prj_001",
    "client": {
      "id": "clt_001",
      "name": "PT ABC"
    },
    "opportunity": {
      "id": "opp_001",
      "name": "Konsultasi ISO PT ABC"
    },
    "name": "Konsultasi ISO PT ABC",
    "service_type": "ISO Consultation",
    "contract_value": 50000000,
    "pic": {
      "id": "usr_003",
      "name": "Budi"
    },
    "status": "IN_PROGRESS",
    "progress_percentage": 45,
    "start_date": "2026-07-10",
    "deadline": "2026-09-10",
    "completed_at": null,
    "closed_at": null,
    "next_action": "Review client documents",
    "next_follow_up_date": "2026-07-15",
    "blocker_notes": null,
    "finance_summary": {
      "contract_value": 50000000,
      "total_invoiced": 25000000,
      "total_paid": 10000000,
      "outstanding_ar": 15000000,
      "total_payables": 5000000,
      "unpaid_payables": 2000000
    },
    "activity_summary": {
      "last_activity_date": "2026-07-12",
      "is_stale": false
    }
  }
}
```

---

### 18.3 POST /api/projects

Purpose:

```txt
Create project manually.
```

Recommended:

```txt
Use mainly for projects that do not come from opportunity.
```

Allowed roles:

```txt
OWNER, ADMIN
```

Request:

```json
{
  "client_id": "clt_001",
  "name": "Project Manual PT ABC",
  "service_type": "Consulting",
  "contract_value": 30000000,
  "pic_user_id": "usr_003",
  "status": "NOT_STARTED",
  "progress_percentage": 0,
  "start_date": "2026-07-10",
  "deadline": "2026-09-10",
  "next_action": "Schedule kickoff"
}
```

Validation:

```txt
client_id required
name required
contract_value integer >= 0
pic_user_id required
status valid
progress 0-100
```

Audit log:

```txt
PROJECT CREATE
```

---

### 18.4 PUT /api/projects/:id

Allowed roles:

```txt
OWNER, ADMIN, assigned PROJECT_MANAGER
```

Request:

```json
{
  "status": "WAITING_CLIENT",
  "progress_percentage": 60,
  "next_action": "Follow up missing documents",
  "next_follow_up_date": "2026-07-16",
  "blocker_notes": "Waiting for client to send legal documents."
}
```

Business rules:

1. Status must be valid.
2. Progress must be 0-100.
3. If status becomes `COMPLETED`, set `completed_at` if empty.
4. If status becomes `CANCELLED`, require `cancel_reason`.
5. Status `CLOSED` should use dedicated close endpoint.
6. Status changes must create audit log.
7. PIC changes must create audit log.
8. Major progress changes should create audit log or project activity.

Audit log:

```txt
PROJECT UPDATE
PROJECT STATUS_CHANGE
PROJECT PROGRESS_CHANGE
```

---

### 18.5 DELETE /api/projects/:id

Allowed roles:

```txt
OWNER, ADMIN
```

Business rules:

1. Use soft delete.
2. Do not delete if invoices/payments/payables exist.
3. If project should stop, use `CANCELLED`.

Audit log:

```txt
PROJECT SOFT_DELETE
```

---

### 18.6 POST /api/projects/:id/complete

Purpose:

```txt
Mark project as completed.
```

Allowed roles:

```txt
OWNER, ADMIN, assigned PROJECT_MANAGER
```

Request:

```json
{
  "completed_at": "2026-09-10T10:00:00.000Z",
  "notes": "Final report submitted to client."
}
```

Business rules:

1. Project must not be `CANCELLED`.
2. Set status `COMPLETED`.
3. Set `completed_at`.
4. Create project activity optionally.
5. Create audit log.

Audit log:

```txt
PROJECT MARK_COMPLETED
```

---

### 18.7 POST /api/projects/:id/close

Purpose:

```txt
Mark project as fully closed.
```

Allowed roles:

```txt
OWNER, ADMIN
```

Request:

```json
{
  "closed_at": "2026-09-20T10:00:00.000Z",
  "closing_note": "Work completed, invoice settled, documents archived.",
  "allow_unpaid_invoice_exception": false,
  "allow_unpaid_ap_exception": false
}
```

Business rules:

1. Project should be `COMPLETED` before `CLOSED`.
2. Check unpaid invoice.
3. Check unpaid AP.
4. Check important document presence if policy requires.
5. If unpaid invoice exists, require explicit exception.
6. If unpaid AP exists, require explicit exception.
7. Create audit log.

Response:

```json
{
  "success": true,
  "data": {
    "id": "prj_001",
    "status": "CLOSED",
    "closed_at": "2026-09-20T10:00:00.000Z"
  }
}
```

Audit log:

```txt
PROJECT MARK_CLOSED
```

---

### 18.8 POST /api/projects/:id/cancel

Allowed roles:

```txt
OWNER, ADMIN
```

Request:

```json
{
  "cancel_reason": "Client cancelled the project."
}
```

Business rules:

1. Require cancel reason.
2. Set status `CANCELLED`.
3. Set `cancelled_at`.
4. Create audit log.

Audit log:

```txt
PROJECT CANCEL
```

---

## 19. Project Members API

### 19.1 GET /api/projects/:id/members

Allowed roles:

```txt
OWNER, ADMIN, FINANCE view, assigned PROJECT_MANAGER, assigned STAFF view
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "prm_001",
      "project_id": "prj_001",
      "user": {
        "id": "usr_003",
        "name": "Budi",
        "email": "budi@example.com"
      },
      "role_in_project": "PIC",
      "assigned_at": "2026-07-10T09:00:00.000Z",
      "is_active": 1
    }
  ]
}
```

---

### 19.2 POST /api/projects/:id/members

Allowed roles:

```txt
OWNER, ADMIN, assigned PROJECT_MANAGER
```

Request:

```json
{
  "user_id": "usr_004",
  "role_in_project": "CONSULTANT",
  "assigned_at": "2026-07-10T09:00:00.000Z"
}
```

Business rules:

1. User must exist and active.
2. Project must exist.
3. Prevent duplicate active member.
4. Create audit log.

Audit log:

```txt
PROJECT_MEMBER CREATE
```

---

### 19.3 PUT /api/project-members/:id

Allowed roles:

```txt
OWNER, ADMIN, assigned PROJECT_MANAGER
```

Request:

```json
{
  "role_in_project": "REVIEWER",
  "is_active": 1
}
```

Audit log:

```txt
PROJECT_MEMBER UPDATE
```

---

### 19.4 DELETE /api/project-members/:id

Allowed roles:

```txt
OWNER, ADMIN, assigned PROJECT_MANAGER
```

Business rules:

1. Use soft delete or set `is_active = 0`.
2. Do not remove main project PIC unless project PIC is changed first.

Audit log:

```txt
PROJECT_MEMBER SOFT_DELETE
```

---

## 20. Project Activities API

### 20.1 GET /api/projects/:id/activities

Allowed roles:

```txt
OWNER, ADMIN, FINANCE view, assigned PROJECT_MANAGER, assigned STAFF
```

Query params:

```txt
page
pageSize
activityType
userId
dateFrom
dateTo
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "act_001",
      "project_id": "prj_001",
      "user": {
        "id": "usr_003",
        "name": "Budi"
      },
      "activity_type": "MEETING",
      "activity_date": "2026-07-12",
      "notes": "Kickoff meeting completed.",
      "next_action": "Prepare initial report draft.",
      "next_follow_up_date": "2026-07-15",
      "progress_snapshot": 20,
      "created_at": "2026-07-12T10:00:00.000Z"
    }
  ]
}
```

---

### 20.2 POST /api/projects/:id/activities

Allowed roles:

```txt
OWNER, ADMIN, assigned PROJECT_MANAGER, assigned STAFF
```

Request:

```json
{
  "activity_type": "MEETING",
  "activity_date": "2026-07-12",
  "notes": "Kickoff meeting completed.",
  "next_action": "Prepare initial report draft.",
  "next_follow_up_date": "2026-07-15",
  "progress_snapshot": 20
}
```

Business rules:

1. Project must exist.
2. User must be allowed to update this project.
3. Activity notes required.
4. If `progress_snapshot` provided, must be 0-100.
5. Optionally update project `next_action`, `next_follow_up_date`, and `progress_percentage`.
6. Create audit log.

Audit log:

```txt
PROJECT_ACTIVITY CREATE
```

---

### 20.3 PUT /api/project-activities/:id

Allowed roles:

```txt
OWNER, ADMIN, author user if policy allows, assigned PROJECT_MANAGER
```

Business rules:

1. Restrict editing old activities if needed.
2. Create audit log.

Audit log:

```txt
PROJECT_ACTIVITY UPDATE
```

---

### 20.4 DELETE /api/project-activities/:id

Allowed roles:

```txt
OWNER, ADMIN
```

Business rules:

1. Use soft delete.
2. Do not hard delete.

Audit log:

```txt
PROJECT_ACTIVITY SOFT_DELETE
```

---

## 21. Invoices API

### 21.1 GET /api/invoices

Purpose:

```txt
List invoices / AR.
```

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER view assigned project
```

Query params:

```txt
page
pageSize
search
clientId
projectId
status
effectiveStatus
invoiceDateFrom
invoiceDateTo
dueDateFrom
dueDateTo
overdueOnly
sortBy
sortOrder
```

Response item:

```json
{
  "id": "inv_001",
  "project_id": "prj_001",
  "project_name": "Konsultasi ISO PT ABC",
  "client_id": "clt_001",
  "client_name": "PT ABC",
  "invoice_number": "INV/2026/001",
  "invoice_date": "2026-07-15",
  "due_date": "2026-07-30",
  "termin_number": 1,
  "amount": 25000000,
  "total_paid": 10000000,
  "remaining_amount": 15000000,
  "status": "SENT",
  "effective_status": "PARTIALLY_PAID",
  "sent_at": "2026-07-15T09:00:00.000Z"
}
```

---

### 21.2 GET /api/invoices/:id

Allowed roles:

```txt
OWNER, ADMIN, FINANCE, PROJECT_MANAGER view assigned project
```

Response should include:

```txt
invoice detail
client summary
project summary
payments
attachments
computed total_paid
computed remaining_amount
computed effective_status
```

---

### 21.3 POST /api/invoices

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "project_id": "prj_001",
  "invoice_number": "INV/2026/001",
  "invoice_date": "2026-07-15",
  "due_date": "2026-07-30",
  "termin_number": 1,
  "description": "Termin 1 - DP",
  "amount": 25000000,
  "status": "DRAFT"
}
```

Backend fills:

```txt
client_id from project.client_id
created_by from current user
```

Validation:

```txt
project_id required
project must exist
invoice_number required and unique
invoice_date required
due_date required
amount integer > 0
termin_number optional integer > 0
status valid
```

Business rules:

1. Invoice must link to project.
2. `client_id` must be copied from project.
3. Invoice amount must be integer > 0.
4. Invoice number must be unique.
5. Create audit log.

Audit log:

```txt
INVOICE CREATE
```

---

### 21.4 PUT /api/invoices/:id

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "due_date": "2026-08-05",
  "description": "Updated invoice description",
  "amount": 25000000
}
```

Business rules:

1. Cannot edit cancelled invoice.
2. Editing amount after payment exists should require OWNER or explicit policy.
3. Amount change must create audit log.
4. Invoice number change must be carefully validated.

Audit log:

```txt
INVOICE UPDATE
INVOICE AMOUNT_CHANGE
```

---

### 21.5 POST /api/invoices/:id/mark-sent

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "sent_at": "2026-07-15T09:00:00.000Z"
}
```

Business rules:

1. Invoice must not be cancelled.
2. Set `sent_at`.
3. Set stored status to `SENT` if no payment exists.
4. Create audit log.

Audit log:

```txt
INVOICE MARK_SENT
```

---

### 21.6 POST /api/invoices/:id/cancel

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "cancel_reason": "Wrong invoice number."
}
```

Business rules:

1. Require cancel reason.
2. If invoice already has valid payments, require OWNER approval or block.
3. Set status `CANCELLED`.
4. Set `cancelled_at`.
5. Create audit log.
6. Cancelled invoice is excluded from AR calculation.

Audit log:

```txt
INVOICE CANCEL
```

---

### 21.7 DELETE /api/invoices/:id

Recommended behavior:

```txt
Do not implement hard delete for MVP.
```

If endpoint exists:

```txt
Only OWNER can soft delete draft invoice with no payment.
```

Recommended alternative:

```txt
Use POST /api/invoices/:id/cancel
```

---

## 22. Payments API

### 22.1 GET /api/payments

Allowed roles:

```txt
OWNER, ADMIN view, FINANCE, PROJECT_MANAGER view assigned project
```

Query params:

```txt
page
pageSize
clientId
projectId
invoiceId
status
paymentDateFrom
paymentDateTo
paymentMethod
sortBy
sortOrder
```

Response item:

```json
{
  "id": "pay_001",
  "invoice_id": "inv_001",
  "invoice_number": "INV/2026/001",
  "project_id": "prj_001",
  "project_name": "Konsultasi ISO PT ABC",
  "client_id": "clt_001",
  "client_name": "PT ABC",
  "payment_date": "2026-07-20",
  "amount": 10000000,
  "payment_method": "BANK_TRANSFER",
  "reference_number": "TRX123",
  "status": "VALID",
  "created_at": "2026-07-20T09:00:00.000Z"
}
```

---

### 22.2 GET /api/payments/:id

Allowed roles:

```txt
OWNER, ADMIN view, FINANCE, PROJECT_MANAGER view assigned project
```

Response includes:

```txt
payment detail
invoice summary
project summary
client summary
attachments
```

---

### 22.3 POST /api/payments

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "invoice_id": "inv_001",
  "payment_date": "2026-07-20",
  "amount": 10000000,
  "payment_method": "BANK_TRANSFER",
  "reference_number": "TRX123",
  "notes": "Partial payment from client."
}
```

Backend fills:

```txt
project_id from invoice.project_id
client_id from invoice.client_id
created_by from current user
status = VALID
```

Validation:

```txt
invoice_id required
invoice must exist
invoice must not be cancelled
amount integer > 0
payment_date required
payment_method valid
```

Business rules:

1. Payment must link to invoice.
2. Project and client are copied from invoice.
3. Partial payment is allowed.
4. Multiple payments per invoice are allowed.
5. Prevent payment total from exceeding invoice amount unless explicit overpayment policy exists.
6. After payment, compute effective invoice status.
7. Create audit log.

Audit log:

```txt
PAYMENT CREATE
```

---

### 22.4 PUT /api/payments/:id

Allowed roles:

```txt
OWNER, FINANCE
```

Recommended policy:

```txt
Editing payment should be restricted.
Prefer cancel wrong payment and create new payment.
```

If allowed:

1. Cannot edit cancelled payment.
2. Amount change must create audit log.
3. Recalculate invoice status after update.

Audit log:

```txt
PAYMENT UPDATE
PAYMENT AMOUNT_CHANGE
```

---

### 22.5 POST /api/payments/:id/cancel

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "cancel_reason": "Wrong transfer amount input."
}
```

Business rules:

1. Require cancel reason.
2. Set status `CANCELLED`.
3. Set `cancelled_at`.
4. Cancelled payment excluded from invoice total paid.
5. Recalculate invoice effective status.
6. Create audit log.

Audit log:

```txt
PAYMENT CANCEL
```

---

### 22.6 DELETE /api/payments/:id

Recommended behavior:

```txt
Do not implement hard delete.
```

Use:

```txt
POST /api/payments/:id/cancel
```

---

## 23. Payables / AP API

### 23.1 GET /api/payables

Purpose:

```txt
List AP/project costs.
```

Allowed roles:

```txt
OWNER, ADMIN view, FINANCE, PROJECT_MANAGER view assigned project
```

Query params:

```txt
page
pageSize
search
projectId
status
costCategory
dueDateFrom
dueDateTo
billDateFrom
billDateTo
dueSoonOnly
overdueOnly
sortBy
sortOrder
```

Response item:

```json
{
  "id": "ap_001",
  "project_id": "prj_001",
  "project_name": "Konsultasi ISO PT ABC",
  "vendor_name": "Vendor A",
  "cost_category": "SUBCONTRACTOR",
  "description": "External consultant fee",
  "bill_date": "2026-07-18",
  "due_date": "2026-07-25",
  "amount": 5000000,
  "status": "UNPAID",
  "effective_status": "UNPAID",
  "paid_at": null
}
```

---

### 23.2 GET /api/payables/:id

Allowed roles:

```txt
OWNER, ADMIN view, FINANCE, PROJECT_MANAGER view assigned project
```

Response includes:

```txt
payable detail
project summary
attachments
effective status
```

---

### 23.3 POST /api/payables

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "project_id": "prj_001",
  "vendor_name": "Vendor A",
  "cost_category": "SUBCONTRACTOR",
  "description": "External consultant fee",
  "bill_date": "2026-07-18",
  "due_date": "2026-07-25",
  "amount": 5000000,
  "status": "UNPAID",
  "notes": "For project support."
}
```

Validation:

```txt
vendor_name required
cost_category valid
amount integer > 0
status valid
project_id optional, but must exist if provided
```

Business rules:

1. If project cost, link to project.
2. General operational AP may have `project_id = null`.
3. Create audit log.

Audit log:

```txt
PAYABLE CREATE
```

---

### 23.4 PUT /api/payables/:id

Allowed roles:

```txt
OWNER, FINANCE
```

Business rules:

1. Cannot edit cancelled payable.
2. Amount change must create audit log.
3. If status becomes `PAID`, prefer using mark-paid endpoint.

Audit log:

```txt
PAYABLE UPDATE
PAYABLE AMOUNT_CHANGE
```

---

### 23.5 POST /api/payables/:id/mark-paid

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "paid_at": "2026-07-24T09:00:00.000Z",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "TRXAP123",
  "notes": "Paid to vendor."
}
```

Business rules:

1. Payable must not be cancelled.
2. Set status `PAID`.
3. Set `paid_at`.
4. Create audit log.

Audit log:

```txt
PAYABLE MARK_PAID
```

---

### 23.6 POST /api/payables/:id/cancel

Allowed roles:

```txt
OWNER, FINANCE
```

Request:

```json
{
  "cancel_reason": "Duplicate AP entry."
}
```

Business rules:

1. Require cancel reason.
2. Set status `CANCELLED`.
3. Set `cancelled_at`.
4. Exclude from unpaid AP calculation.
5. Create audit log.

Audit log:

```txt
PAYABLE CANCEL
```

---

### 23.7 DELETE /api/payables/:id

Recommended behavior:

```txt
Do not implement hard delete.
```

Use:

```txt
POST /api/payables/:id/cancel
```

---

## 24. Attachments API

### 24.1 GET /api/attachments

Purpose:

```txt
List attachments by linked entity.
```

Allowed roles:

```txt
Depends on linked entity permission.
```

Query params:

```txt
linkedType
linkedId
attachmentKind
```

Example:

```txt
GET /api/attachments?linkedType=PROJECT&linkedId=prj_001
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "att_001",
      "linked_type": "PROJECT",
      "linked_id": "prj_001",
      "attachment_kind": "PROJECT_DOCUMENT",
      "file_name": "dokumen-project.pdf",
      "mime_type": "application/pdf",
      "file_size": 300000,
      "uploaded_by": {
        "id": "usr_003",
        "name": "Budi"
      },
      "created_at": "2026-07-12T10:00:00.000Z"
    }
  ]
}
```

---

### 24.2 POST /api/attachments/upload

Purpose:

```txt
Upload file and link it to entity.
```

Allowed roles:

```txt
Depends on linked entity permission.
```

Content type:

```txt
multipart/form-data
```

Fields:

```txt
linked_type
linked_id
attachment_kind
file
```

Allowed linked types:

```txt
CLIENT
OPPORTUNITY
OPPORTUNITY_LOG
PROJECT
PROJECT_ACTIVITY
INVOICE
PAYMENT
PAYABLE
```

Allowed attachment kinds:

```txt
PROPOSAL
CONTRACT
SPK
PO
PROJECT_DOCUMENT
INVOICE_FILE
PAYMENT_PROOF
VENDOR_BILL
AP_PAYMENT_PROOF
OTHER
```

Upload validation:

```txt
Max file size: 5 MB
Allowed: PDF, JPG, JPEG, PNG, XLSX, DOCX
```

Business rules:

1. Validate linked entity exists.
2. Validate current user has access to linked entity.
3. Store binary file in R2.
4. Store metadata in D1.
5. Create audit log.
6. Do not expose raw R2 public URL unless policy allows.

Response:

```json
{
  "success": true,
  "data": {
    "id": "att_001",
    "linked_type": "PROJECT",
    "linked_id": "prj_001",
    "attachment_kind": "PROJECT_DOCUMENT",
    "file_name": "dokumen-project.pdf",
    "mime_type": "application/pdf",
    "file_size": 300000,
    "created_at": "2026-07-12T10:00:00.000Z"
  }
}
```

Audit log:

```txt
ATTACHMENT UPLOAD_ATTACHMENT
```

---

### 24.3 GET /api/attachments/:id/download

Purpose:

```txt
Download attachment if user has access.
```

Allowed roles:

```txt
Depends on linked entity permission.
```

Business rules:

1. Attachment must exist and not deleted.
2. User must have permission to linked entity.
3. Backend retrieves file from R2.
4. Return file stream or signed temporary response.

---

### 24.4 DELETE /api/attachments/:id

Purpose:

```txt
Soft delete attachment metadata.
```

Allowed roles:

```txt
OWNER, ADMIN, uploader if policy allows, FINANCE for finance files
```

Business rules:

1. Use soft delete.
2. Do not immediately delete R2 object unless cleanup policy exists.
3. Create audit log.

Audit log:

```txt
ATTACHMENT SOFT_DELETE
```

---

## 25. Dashboard API

### 25.1 GET /api/dashboard/summary

Purpose:

```txt
Owner dashboard summary.
```

Allowed roles:

```txt
OWNER, ADMIN, FINANCE limited, PROJECT_MANAGER limited
```

Response for OWNER:

```json
{
  "success": true,
  "data": {
    "active_opportunities_count": 12,
    "negotiation_opportunities_count": 4,
    "opportunities_need_follow_up_count": 3,
    "active_projects_count": 9,
    "projects_waiting_client_count": 2,
    "projects_not_updated_7_days_count": 3,
    "projects_near_deadline_count": 2,
    "total_outstanding_ar": 180000000,
    "total_overdue_ar": 45000000,
    "total_unpaid_ap": 12000000,
    "ap_due_this_week": 5000000,
    "recent_project_updates": [
      {
        "project_id": "prj_001",
        "project_name": "Konsultasi ISO PT ABC",
        "activity_date": "2026-07-12",
        "activity_type": "MEETING",
        "user_name": "Budi"
      }
    ]
  }
}
```

Business rules:

1. Exclude deleted records.
2. Exclude cancelled invoice from AR.
3. Exclude cancelled payment from paid amount.
4. Exclude cancelled payable from unpaid AP.
5. Stale project means no activity for more than 7 days.
6. Finance numbers must be computed from invoices/payments/payables.

---

### 25.2 GET /api/dashboard/action-items

Purpose:

```txt
Return actionable items for owner.
```

Allowed roles:

```txt
OWNER, ADMIN, FINANCE limited, PROJECT_MANAGER limited
```

Response:

```json
{
  "success": true,
  "data": {
    "opportunities_need_follow_up": [],
    "projects_waiting_client": [],
    "projects_not_updated": [],
    "overdue_invoices": [],
    "ap_due_soon": []
  }
}
```

---

## 26. Reports API

Reports are used for export and review.

### 26.1 GET /api/reports/opportunities

Allowed roles:

```txt
OWNER, ADMIN, PROJECT_MANAGER
```

Query params:

```txt
status
clientId
picUserId
dateFrom
dateTo
format
```

Format:

```txt
json
csv
xlsx
```

---

### 26.2 GET /api/reports/projects

Allowed roles:

```txt
OWNER, ADMIN, PROJECT_MANAGER
```

Query params:

```txt
status
clientId
picUserId
deadlineFrom
deadlineTo
format
```

---

### 26.3 GET /api/reports/project-activities

Allowed roles:

```txt
OWNER, ADMIN, PROJECT_MANAGER
```

Query params:

```txt
projectId
userId
activityType
dateFrom
dateTo
format
```

---

### 26.4 GET /api/reports/invoices

Allowed roles:

```txt
OWNER, FINANCE
```

Query params:

```txt
clientId
projectId
status
effectiveStatus
invoiceDateFrom
invoiceDateTo
dueDateFrom
dueDateTo
format
```

---

### 26.5 GET /api/reports/payments

Allowed roles:

```txt
OWNER, FINANCE
```

Query params:

```txt
clientId
projectId
invoiceId
paymentDateFrom
paymentDateTo
paymentMethod
format
```

---

### 26.6 GET /api/reports/payables

Allowed roles:

```txt
OWNER, FINANCE
```

Query params:

```txt
projectId
status
costCategory
dueDateFrom
dueDateTo
format
```

---

### 26.7 Export Rules

1. Default format is `json`.
2. CSV/XLSX export should respect filters.
3. Export should not include deleted records.
4. Export should not include cancelled records unless explicitly requested.
5. Finance export only for OWNER/FINANCE.

Example:

```txt
GET /api/reports/invoices?effectiveStatus=OVERDUE&format=xlsx
```

---

## 27. Audit Logs API

### 27.1 GET /api/audit-logs

Allowed roles:

```txt
OWNER, ADMIN limited
```

Query params:

```txt
page
pageSize
actorUserId
entityType
entityId
action
dateFrom
dateTo
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "aud_001",
      "actor_user": {
        "id": "usr_001",
        "name": "Owner Ratama"
      },
      "entity_type": "INVOICE",
      "entity_id": "inv_001",
      "action": "CREATE",
      "old_value": null,
      "new_value": {
        "amount": 25000000,
        "status": "DRAFT"
      },
      "created_at": "2026-07-15T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Business rules:

1. Audit logs cannot be edited.
2. Audit logs cannot be deleted by normal user.
3. Finance audit logs should be visible to OWNER.
4. ADMIN may see non-finance audit logs depending policy.

---

### 27.2 GET /api/audit-logs/:id

Allowed roles:

```txt
OWNER, ADMIN limited
```

---

## 28. Effective Status Rules

Some statuses should be computed by backend.

### 28.1 Invoice Effective Status

Inputs:

```txt
invoice.status
invoice.amount
invoice.due_date
payments total where status = VALID and deleted_at is null
today date
```

Logic:

```txt
If invoice.status = CANCELLED:
  effective_status = CANCELLED

Else if total_paid >= invoice.amount:
  effective_status = PAID

Else if invoice.due_date < today and total_paid < invoice.amount:
  effective_status = OVERDUE

Else if total_paid > 0 and total_paid < invoice.amount:
  effective_status = PARTIALLY_PAID

Else if invoice.sent_at is not null:
  effective_status = SENT

Else:
  effective_status = invoice.status
```

API should return:

```json
{
  "status": "SENT",
  "effective_status": "OVERDUE"
}
```

---

### 28.2 Payable Effective Status

Inputs:

```txt
payable.status
payable.due_date
payable.paid_at
today date
```

Logic:

```txt
If payable.status = CANCELLED:
  effective_status = CANCELLED

Else if payable.status = PAID:
  effective_status = PAID

Else if due_date < today:
  effective_status = OVERDUE

Else:
  effective_status = payable.status
```

---

### 28.3 Project Stale Status

Inputs:

```txt
project.status
latest project_activity.activity_date
today date
```

Logic:

```txt
If project.status in CLOSED, CANCELLED:
  is_stale = false

Else if no activity exists:
  is_stale = true

Else if latest activity date < today - 7 days:
  is_stale = true

Else:
  is_stale = false
```

---

## 29. Business Rule Summary

### 29.1 Opportunity

1. Opportunity must have client.
2. Opportunity must have PIC.
3. Opportunity status `WON` requires `deal_amount`.
4. Opportunity can be converted only if status is `WON`.
5. One opportunity can create only one project in MVP.
6. Status and amount changes must be audited.

### 29.2 Project

1. Project must have client.
2. Project must have PIC.
3. Project may come from opportunity.
4. Project `CLOSED` should require closing check.
5. Project `CANCELLED` requires reason.
6. Project status changes must be audited.

### 29.3 Invoice

1. Invoice must link to project.
2. Invoice client must match project client.
3. Invoice amount must be integer > 0.
4. Invoice number must be unique.
5. Invoice should be cancelled, not hard deleted.
6. Paid amount is computed from payments.

### 29.4 Payment

1. Payment must link to invoice.
2. Project and client must match invoice.
3. Payment amount must be integer > 0.
4. Partial payments are allowed.
5. Multiple payments per invoice are allowed.
6. Cancelled payment is excluded from total paid.
7. Payment should be cancelled, not hard deleted.

### 29.5 Payable/AP

1. Payable may link to project.
2. Payable amount must be integer > 0.
3. Payable paid status should use mark-paid endpoint.
4. Payable should be cancelled, not hard deleted.
5. Payable finance actions must be audited.

### 29.6 Attachments

1. File binary stored in R2.
2. Metadata stored in D1.
3. Backend validates linked entity manually.
4. File size max 5 MB in MVP.
5. Allowed file types: PDF, JPG, JPEG, PNG, XLSX, DOCX.

---

## 30. Route Summary

### Auth

```txt
GET /api/auth/me
```

### Health

```txt
GET /api/health
```

### Users

```txt
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Clients

```txt
GET    /api/clients
GET    /api/clients/:id
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id
```

### Client Contacts

```txt
GET    /api/clients/:clientId/contacts
POST   /api/clients/:clientId/contacts
PUT    /api/client-contacts/:id
DELETE /api/client-contacts/:id
```

### Opportunities

```txt
GET    /api/opportunities
GET    /api/opportunities/:id
POST   /api/opportunities
PUT    /api/opportunities/:id
DELETE /api/opportunities/:id
POST   /api/opportunities/:id/convert-to-project
```

### Opportunity Logs

```txt
GET    /api/opportunities/:id/logs
POST   /api/opportunities/:id/logs
PUT    /api/opportunity-logs/:id
DELETE /api/opportunity-logs/:id
```

### Projects

```txt
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/complete
POST   /api/projects/:id/close
POST   /api/projects/:id/cancel
```

### Project Members

```txt
GET    /api/projects/:id/members
POST   /api/projects/:id/members
PUT    /api/project-members/:id
DELETE /api/project-members/:id
```

### Project Activities

```txt
GET    /api/projects/:id/activities
POST   /api/projects/:id/activities
PUT    /api/project-activities/:id
DELETE /api/project-activities/:id
```

### Invoices

```txt
GET  /api/invoices
GET  /api/invoices/:id
POST /api/invoices
PUT  /api/invoices/:id
POST /api/invoices/:id/mark-sent
POST /api/invoices/:id/cancel
```

### Payments

```txt
GET  /api/payments
GET  /api/payments/:id
POST /api/payments
PUT  /api/payments/:id
POST /api/payments/:id/cancel
```

### Payables

```txt
GET  /api/payables
GET  /api/payables/:id
POST /api/payables
PUT  /api/payables/:id
POST /api/payables/:id/mark-paid
POST /api/payables/:id/cancel
```

### Attachments

```txt
GET    /api/attachments
POST   /api/attachments/upload
GET    /api/attachments/:id/download
DELETE /api/attachments/:id
```

### Dashboard

```txt
GET /api/dashboard/summary
GET /api/dashboard/action-items
```

### Reports

```txt
GET /api/reports/opportunities
GET /api/reports/projects
GET /api/reports/project-activities
GET /api/reports/invoices
GET /api/reports/payments
GET /api/reports/payables
```

### Audit Logs

```txt
GET /api/audit-logs
GET /api/audit-logs/:id
```

---

## 31. MVP Implementation Priority

Build endpoints in this order:

```txt
1. GET /api/health
2. GET /api/auth/me
3. Users API
4. Clients API
5. Client Contacts API
6. Opportunities API
7. Opportunity Logs API
8. Convert Opportunity to Project API
9. Projects API
10. Project Members API
11. Project Activities API
12. Invoices API
13. Payments API
14. Payables API
15. Attachments API
16. Dashboard API
17. Reports API
18. Audit Logs API
```

Do not start with dashboard first because dashboard depends on core modules.

---

## 32. Non-MVP API Not Allowed Yet

Do not build these endpoints in MVP:

```txt
/api/kpi/*
/api/accounting/*
/api/journal-entries/*
/api/payroll/*
/api/tax/*
/api/bank/*
/api/client-portal/*
/api/ai/*
```

These are outside MVP scope.

---

## 33. AI Agent Implementation Rules

When implementing this API, the AI agent must follow these rules:

1. Follow `techstack.md`.
2. Follow `business-flow.md`.
3. Follow `database-schema.md`.
4. Follow this `api-spec.md`.
5. Do not add unrelated modules.
6. Do not create KPI endpoints in MVP.
7. Do not create full accounting endpoints.
8. Use Cloudflare Workers + Hono.
9. Use Zod for validation.
10. Use Drizzle ORM for database access.
11. Use Cloudflare D1 for structured data.
12. Use Cloudflare R2 for file storage.
13. Use Cloudflare Access identity for authentication.
14. Use internal RBAC for authorization.
15. Validate permission in backend.
16. Do not trust frontend validation.
17. Store money as integer.
18. Do not hard delete finance data.
19. Use cancellation flow for invoice/payment/payable.
20. Create audit logs for important actions.
21. Return consistent response format.
22. Keep API simple, reliable, and business-focused.

---

## 34. Final API Scope

The final MVP API scope is enough to support:

```txt
Client tracking
Contact tracking
Opportunity tracking
Follow-up tracking
Negotiation tracking
Opportunity to project conversion
Project tracking
Project member assignment
Project activity tracking
Invoice tracking
Payment tracking
AP/project cost tracking
Attachment upload/download
Owner dashboard
Reports/export
Audit logs
```

If these APIs are implemented correctly, the MVP can already answer the core business questions:

```txt
Which opportunities need follow-up?
Which projects are active?
Which projects are stuck?
Who is responsible?
Which invoices are unpaid?
Which invoices are overdue?
How much AR is outstanding?
Which payments have been received?
Which AP is unpaid?
Which projects can be closed?
```


