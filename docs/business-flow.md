# Ratama Project & Finance Tracker - Business Flow

## MVP Scope

Ratama Project & Finance Tracker manages the flow from sales opportunity to project execution, invoicing, payment tracking, AP tracking, and document references.

The system stores operational data in Cloudflare D1 and stores document references as external links.

Users enter the app through Cloudflare Access. The app resolves the authenticated email through `GET /api/auth/me` and maps it to an active row in the `users` table.

## Main Business Flow

```text
Client
-> Opportunity
-> Won Opportunity
-> Project
-> Project Activities
-> Invoice
-> Payment
-> Payables
-> Reports
```

Documents can be linked to the relevant entity at each stage.

## Client Flow

1. User creates a client.
2. User records contact details.
3. User tracks client status.
4. User links supporting client documents when needed.

Client backend endpoints:

```text
GET    /api/clients
GET    /api/clients/:id
POST   /api/clients
PUT    /api/clients/:id
DELETE /api/clients/:id
```

Client contact endpoints:

```text
GET    /api/clients/:clientId/contacts
POST   /api/clients/:clientId/contacts
PUT    /api/clients/:clientId/contacts/:contactId
DELETE /api/clients/:clientId/contacts/:contactId
```

## Opportunity Flow

1. User creates an opportunity for a client.
2. User tracks proposal, follow-up, negotiation, win, loss, or hold status.
3. User records opportunity logs.
4. User links proposal, contract draft, PO, SPK, or other external document URLs.
5. When an opportunity is won, it can become a project.

## Project Flow

1. User creates or converts a project.
2. User assigns PIC and project members.
3. User tracks progress, blockers, next action, deadline, and project activities.
4. User links project documents such as kickoff notes, client data, draft reports, and final reports.
5. User closes project after delivery and finance completion.

## Finance Flow

1. User creates invoices by project.
2. User records invoice status and due date.
3. User records payments received.
4. User records operational payables and vendor bills.
5. User links invoice files, proof of payment, vendor bills, and AP payment proofs as external document links.

## Document Link Flow

The MVP does not upload binary files through the app.

```text
User uploads file manually to Google Drive/OneDrive/Dropbox
-> User copies the share link
-> User adds document link in the app
-> App validates linked entity and URL
-> App stores metadata and URL in D1
-> Authorized users open the external link from the app
```

## Document Link Data

Each document link stores:

- `linked_type`
- `linked_id`
- `document_kind`
- `title`
- `url`
- `provider`
- `notes`
- `created_by`
- `created_at`
- `updated_at`
- `deleted_at`

## Linked Types

- `CLIENT`
- `OPPORTUNITY`
- `OPPORTUNITY_LOG`
- `PROJECT`
- `PROJECT_ACTIVITY`
- `INVOICE`
- `PAYMENT`
- `PAYABLE`

## Document Kinds

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

## Providers

- `GOOGLE_DRIVE`
- `ONEDRIVE`
- `DROPBOX`
- `EXTERNAL_URL`
- `OTHER`

## Business Rules

1. Document links must point to an existing linked entity.
2. User access to the linked entity must be checked before create, update, delete, or read.
3. URLs must be valid URLs.
4. The app stores only metadata and URL in D1.
5. Users are responsible for setting the correct sharing permission in the external storage provider.
6. Deleted document links are soft deleted.

## MVP Completion Signal

MVP document management is complete when users can create, view, update, and delete document links for core business entities without any binary upload dependency.
