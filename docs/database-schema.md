# Ratama Project & Finance Tracker - Database Schema

## Active Database

Cloudflare D1 is the main database for the MVP.

Migration `0001_initial_schema.sql` contains the first schema and may already be applied to staging. Do not rewrite it for remote environments.

Architecture changes are added through new migrations.

## Active Document Link Schema

Document files are stored externally. The app stores metadata and URL in D1.

Migration:

```text
packages/db/migrations/0002_document_links_no_r2.sql
```

Table:

```sql
CREATE TABLE document_links (
  id TEXT PRIMARY KEY,
  linked_type TEXT NOT NULL,
  linked_id TEXT NOT NULL,
  document_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
```

## document_links Columns

| Column | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | TEXT | Yes | Primary key |
| `linked_type` | TEXT | Yes | Business entity type |
| `linked_id` | TEXT | Yes | ID of linked entity |
| `document_kind` | TEXT | Yes | Kind of document |
| `title` | TEXT | Yes | User-facing document title |
| `url` | TEXT | Yes | External document URL |
| `provider` | TEXT | No | External provider |
| `notes` | TEXT | No | Internal notes |
| `created_by` | TEXT | Yes | Creator user id or Access email |
| `created_at` | TEXT | Yes | ISO timestamp |
| `updated_at` | TEXT | Yes | ISO timestamp |
| `deleted_at` | TEXT | No | Soft delete timestamp |

## linked_type Values

- `CLIENT`
- `OPPORTUNITY`
- `OPPORTUNITY_LOG`
- `PROJECT`
- `PROJECT_ACTIVITY`
- `INVOICE`
- `PAYMENT`
- `PAYABLE`

## document_kind Values

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

## provider Values

- `GOOGLE_DRIVE`
- `ONEDRIVE`
- `DROPBOX`
- `EXTERNAL_URL`
- `OTHER`

## Indexes

```sql
CREATE INDEX idx_document_links_linked ON document_links(linked_type, linked_id);
CREATE INDEX idx_document_links_created_by ON document_links(created_by);
CREATE INDEX idx_document_links_kind ON document_links(document_kind);
CREATE INDEX idx_document_links_provider ON document_links(provider);
CREATE INDEX idx_document_links_created_at ON document_links(created_at);
```

## Legacy attachments Table

Some environments may still have an `attachments` table from migration `0001`. It is legacy and unused by active MVP routes.

Do not drop it casually because staging may already contain the table. A future cleanup migration can deprecate or remove it only after a data review.

## Active Entity Tables

The active schema includes:

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

## Audit Logs

`audit_logs` records important create, update, delete, transition, and finance actions.

Fields:

- `id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `old_value`
- `new_value`
- `ip_address`
- `user_agent`
- `created_at`

## Rules

1. `document_links.linked_type + linked_id` must point to an existing entity.
2. URL must be a valid URL.
3. Deleting a document link uses `deleted_at`.
4. The app does not store file binary data in D1.
5. D1 remains the main relational database for MVP.
