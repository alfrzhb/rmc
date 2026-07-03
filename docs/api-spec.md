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

## Planned Business APIs

These modules remain planned for later phases:

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
- audit logs

All future APIs should follow the same response shape and D1-backed validation rules.

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
