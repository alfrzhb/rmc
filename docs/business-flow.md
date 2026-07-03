# Business Flow - Ratama Project & Finance Tracker

## 1. Project Context

| Item | Detail |
| --- | --- |
| Project Name | Ratama Project & Finance Tracker |
| Company | Ratama Mitra Kualitas / Ratama Management Consultant |
| System Type | Internal business management system |
| Main Focus | Project pipeline, project progress, follow-up tracking, AR/invoice/payment tracking, and simple AP/project cost tracking |

This system is created to help Ratama track business flow from:

```txt
Lead / Client Inquiry
-> Penawaran / Proposal
-> Follow-up
-> Negosiasi
-> Deal
-> Project Started
-> Project Activity / Progress
-> Invoice
-> Payment
-> AP / Project Cost
-> Project Closed
```

The system is **not** a full ERP, not a full accounting system, and not a KPI tracker for the first version.

KPI tracker may be added later after project, activity, invoice, payment, and AP data are already stable.

---

## 2. Core Business Problem

Ratama needs one internal system to answer these questions:

1. Which clients are currently being offered services?
2. Which proposals have been sent?
3. Which proposals still need follow-up?
4. Which opportunities are in negotiation?
5. Which opportunities have become real projects?
6. Which projects are currently running?
7. Which project is handled by which PIC or staff?
8. What is the latest progress of each project?
9. Which projects are waiting for client response?
10. Which projects have not been updated for several days?
11. Which invoices have been sent?
12. Which invoices have been paid?
13. Which invoices are overdue?
14. Which project costs or AP still need to be paid?
15. Which projects can be considered fully closed?

The main goal is **operational visibility**.

The owner should be able to open the dashboard and immediately see:

```txt
What needs follow-up today?
Which projects are stuck?
Which invoices are unpaid?
Which invoices are overdue?
Which AP is due soon?
Which staff/PIC has not updated their project?
```

---

## 3. Main Business Entities

The system should be centered around the **Project**.

However, before a project exists, there is usually an **Opportunity**.

### Main Entities

| Entity | Meaning |
| --- | --- |
| Client | Company/customer that may use Ratama's service |
| Client Contact | Person/contact from the client side |
| Opportunity | Potential project before deal |
| Opportunity Log | Follow-up or negotiation note before deal |
| Project | Real work after deal |
| Project Member | Internal staff assigned to project |
| Project Activity | Work/follow-up/progress note in project |
| Invoice | AR document sent to client |
| Payment | Incoming payment from client |
| Payable/AP | Outgoing bill or project cost |
| Attachment | Uploaded document/file |
| Audit Log | History of important data changes |

---

## 4. High-Level Flow

The main flow is:

```txt
Client
  |
  v
Opportunity / Penawaran
  |
  v
Follow-up / Negotiation
  |
  v
Won / Deal
  |
  v
Convert to Project
  |
  v
Project Tracking
  |
  v
Project Activity / Follow-up
  |
  v
Invoice / AR
  |
  v
Payment
  |
  v
AP / Project Cost
  |
  v
Project Completed
  |
  v
Project Closed
```

Important principle:

```txt
COMPLETED means the work is done.
CLOSED means the work is done and finance/admin is settled.
```

A project should not be considered fully closed only because the work is finished. It should be closed after invoice/payment/admin status is also clear.

---

## 5. Role Overview

Recommended roles:

```txt
OWNER
ADMIN
FINANCE
PROJECT_MANAGER
STAFF
```

### OWNER

Can view everything:

1. Dashboard.
2. All clients.
3. All opportunities.
4. All projects.
5. All activities.
6. All invoices.
7. All payments.
8. All AP/payables.
9. Reports.
10. Audit logs.

### ADMIN

Can manage operational master data:

1. Users.
2. Roles.
3. Clients.
4. Contacts.
5. Basic settings.

### FINANCE

Can manage finance-related data:

1. Invoices.
2. Payments.
3. AP/payables.
4. Finance attachments.
5. AR/AP reports.

### PROJECT_MANAGER

Can manage assigned projects:

1. Project status.
2. Project members.
3. Project activity.
4. Project progress.
5. Project follow-up.
6. Project attachments.

### STAFF

Can update assigned work:

1. Add project activity.
2. Add follow-up notes.
3. Upload project-related documents.
4. Update next action.
5. Update activity status.

---

## 6. Client Flow

### Purpose

Client module stores company/customer data.

### Flow

```txt
Create Client
-> Add Client Contact
-> Use Client in Opportunity
-> Use Client in Project
-> Use Client in Invoice
```

### Client Data

Minimum fields:

```txt
client_name
client_type
industry
address
email
phone
notes
status
```

Recommended client status:

```txt
ACTIVE
INACTIVE
PROSPECT
BLACKLISTED
```

### Client Contact Data

Minimum fields:

```txt
client_id
contact_name
position
email
phone
whatsapp
notes
is_primary
```

---

## 7. Opportunity / Penawaran Flow

### Purpose

Opportunity is used to track potential projects before they become real projects.

### Flow

```txt
Create Opportunity
-> Set PIC
-> Prepare Proposal
-> Send Proposal
-> Follow-up
-> Negotiation
-> Won / Lost / On Hold
```

### Opportunity Status

Use clear status names:

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

### Status Meaning

| Status | Meaning |
| --- | --- |
| NEW | New opportunity or new client inquiry |
| PROPOSAL_DRAFT | Proposal is still being prepared |
| PROPOSAL_SENT | Proposal has been sent to client |
| FOLLOW_UP | Waiting for client response and needs follow-up |
| NEGOTIATION | Price/scope/payment terms are being negotiated |
| WON | Client agreed / deal confirmed |
| LOST | Opportunity failed / rejected |
| ON_HOLD | Temporarily paused |

### Opportunity Data

Minimum fields:

```txt
client_id
opportunity_name
service_type
estimated_value
initial_offer_amount
pic_user_id
status
source
proposal_sent_date
next_follow_up_date
notes
created_at
updated_at
```

### Business Rule

An opportunity can become a project only when status is:

```txt
WON
```

When opportunity becomes `WON`, user should be able to convert it into a project.

---

## 8. Opportunity Follow-up Flow

### Purpose

Opportunity follow-up log is used to track communication before the project is won.

### Flow

```txt
Opportunity Created
-> Staff/PIC adds follow-up log
-> Set next action
-> Set next follow-up date
-> Owner can monitor follow-up status
```

### Opportunity Log Data

Minimum fields:

```txt
opportunity_id
user_id
activity_type
activity_date
notes
next_action
next_follow_up_date
attachment_id
created_at
```

### Recommended Activity Types

```txt
CALL
WHATSAPP_FOLLOW_UP
EMAIL_SENT
MEETING
PROPOSAL_SENT
PROPOSAL_REVISED
NEGOTIATION_NOTE
CLIENT_FEEDBACK
OTHER
```

### Important Rule

Every opportunity should clearly show:

```txt
Last follow-up date
Last follow-up note
Next action
Next follow-up date
PIC responsible
```

This prevents opportunities from being forgotten.

---

## 9. Negotiation and Deal Flow

### Purpose

Negotiation flow tracks changes from initial offer to final deal.

### Flow

```txt
Proposal Sent
-> Client gives feedback
-> Price/scope negotiation
-> Revised offer
-> Final deal
-> Payment scheme agreed
-> Contract/SPK/PO uploaded
-> Convert to Project
```

### Negotiation Data

Minimum fields can be stored in opportunity or opportunity logs:

```txt
initial_offer_amount
revised_offer_amount
deal_amount
deal_date
deal_notes
payment_scheme
contract_file
spk_file
po_file
```

### Business Rule

Do not overwrite history without trace.

If the price changes, store the change in log/audit trail:

```txt
Initial offer: Rp 60.000.000
Revised offer: Rp 55.000.000
Final deal: Rp 50.000.000
Reason: Scope adjusted after negotiation
```

### Deal Requirements

Before converting opportunity to project, recommended required fields:

```txt
client_id
opportunity_name
deal_amount
deal_date
payment_scheme
pic_user_id
```

Contract/SPK/PO upload is recommended but may be optional in MVP.

---

## 10. Convert Opportunity to Project Flow

### Purpose

Convert opportunity into project after deal.

### Flow

```txt
Opportunity status = WON
-> User clicks Convert to Project
-> System creates Project
-> System copies client, name, PIC, deal amount
-> User fills project detail
-> Project status starts as NOT_STARTED or KICKOFF
```

### Data Copied from Opportunity

```txt
client_id
opportunity_id
project_name
deal_amount
pic_user_id
payment_scheme
notes
```

### Project Initial Data

Required fields:

```txt
client_id
opportunity_id
project_name
contract_value
pic_user_id
start_date
deadline
status
```

### Business Rule

One opportunity usually creates one project.

For MVP, do not support one opportunity creating multiple projects unless explicitly needed.

---

## 11. Project Flow

### Purpose

Project module tracks work after deal.

### Flow

```txt
Project Created
-> Assign PIC and members
-> Set project status
-> Add activities
-> Track progress
-> Track blockers
-> Create invoice
-> Record payment
-> Mark completed
-> Mark closed
```

### Project Status

Recommended statuses:

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

### Status Meaning

| Status | Meaning |
| --- | --- |
| NOT_STARTED | Deal exists but work has not started |
| KICKOFF | Project has started / kickoff stage |
| IN_PROGRESS | Project work is actively running |
| WAITING_CLIENT | Work is blocked by client response/document/approval |
| INTERNAL_REVIEW | Work is being reviewed internally |
| REVISION | Revision is needed |
| COMPLETED | Main work/deliverable is finished |
| CLOSED | Work, invoice, payment, and admin are settled |
| CANCELLED | Project was cancelled |

### Project Data

Minimum fields:

```txt
client_id
opportunity_id
project_name
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
```

### Business Rule

A project should always show:

```txt
Current status
PIC
Progress
Last update
Next action
Next follow-up date
Deadline
Finance summary
```

---

## 12. Project Member Flow

### Purpose

Track which staff are involved in each project.

### Flow

```txt
Project Created
-> Assign PIC
-> Add Project Members
-> Members can add activities
-> Owner/PM can see contribution
```

### Project Member Data

Minimum fields:

```txt
project_id
user_id
role_in_project
assigned_at
is_active
```

Example project roles:

```txt
PIC
CONSULTANT
FINANCE_SUPPORT
ADMIN_SUPPORT
REVIEWER
```

---

## 13. Project Activity / Progress Flow

### Purpose

Project activity log is used to track actual work and follow-up.

This is one of the most important modules because it answers:

```txt
What has the staff done?
When was the last update?
What is the next action?
Is the project stuck?
```

### Flow

```txt
Project Running
-> Staff/PM adds activity
-> Activity has notes and next action
-> System updates last activity date
-> Owner can monitor project movement
```

### Project Activity Data

Minimum fields:

```txt
project_id
user_id
activity_type
activity_date
notes
next_action
next_follow_up_date
attachment_id
created_at
```

### Recommended Activity Types

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

### Important Rule

Every activity should answer:

```txt
Who did what?
When?
What happened?
What is the next action?
When should it be followed up?
```

### Stuck Project Rule

A project can be considered potentially stuck if:

```txt
No activity update for more than 7 days
```

This should appear in the owner dashboard.

---

## 14. Invoice / AR Flow

### Purpose

Invoice module tracks AR: money that Ratama should receive from clients.

### Flow

```txt
Project exists
-> Finance creates invoice
-> Invoice is marked as draft
-> Invoice is sent to client
-> Payment is received
-> Payment is recorded
-> Invoice becomes partially paid or paid
-> Overdue invoice appears in dashboard
```

### Invoice Status

Recommended statuses:

```txt
PLANNED
DRAFT
SENT
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
```

### Status Meaning

| Status | Meaning |
| --- | --- |
| PLANNED | Invoice is planned but not created yet |
| DRAFT | Invoice is being prepared |
| SENT | Invoice has been sent to client |
| PARTIALLY_PAID | Some payment received |
| PAID | Full payment received |
| OVERDUE | Due date passed and not fully paid |
| CANCELLED | Invoice cancelled |

### Invoice Data

Minimum fields:

```txt
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
```

### Business Rule

Invoice must be linked to a project.

Do not create standalone invoice without project link in MVP.

### AR Calculation

System should calculate:

```txt
invoice_amount
total_paid
remaining_amount
is_overdue
```

Example:

```txt
Invoice amount: Rp 50.000.000
Payment 1: Rp 20.000.000
Payment 2: Rp 10.000.000
Total paid: Rp 30.000.000
Remaining: Rp 20.000.000
Status: PARTIALLY_PAID
```

---

## 15. Payment Flow

### Purpose

Payment module records incoming payments from clients.

### Flow

```txt
Invoice exists
-> Client pays full/partial amount
-> Finance records payment
-> Upload payment proof
-> System recalculates invoice status
```

### Payment Data

Minimum fields:

```txt
invoice_id
project_id
client_id
payment_date
amount
payment_method
reference_number
notes
attachment_id
created_by
created_at
```

### Payment Methods

Recommended values:

```txt
BANK_TRANSFER
CASH
GIRO
OTHER
```

### Business Rule

Do not overwrite invoice amount when payment is added.

Payment must be stored as separate transaction.

Invoice status should be calculated based on payment total:

```txt
If total_paid = 0 -> SENT
If total_paid > 0 and total_paid < invoice_amount -> PARTIALLY_PAID
If total_paid >= invoice_amount -> PAID
If due_date passed and total_paid < invoice_amount -> OVERDUE
```

### Important Rule

Payment records should not be hard deleted.

If wrong, use cancellation/reversal logic or soft delete with audit log.

---

## 16. AP / Project Cost Flow

### Purpose

AP module tracks outgoing bills and project costs.

This is not full accounting. It is simple project cost tracking.

### Flow

```txt
Project exists
-> Vendor/subcontractor/expense appears
-> Finance creates payable
-> Payable is approved/scheduled
-> Payable is paid
-> Upload proof
-> Project cost summary updated
```

### Payable Status

Recommended statuses:

```txt
UNPAID
WAITING_APPROVAL
APPROVED
SCHEDULED
PAID
OVERDUE
CANCELLED
```

### Payable Data

Minimum fields:

```txt
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
attachment_id
created_by
created_at
updated_at
```

### Cost Categories

Initial values:

```txt
SUBCONTRACTOR
TRANSPORT
ACCOMMODATION
DOCUMENT_PRINTING
CERTIFICATION_COST
CONSULTANT_FEE
OPERATIONAL
OTHER
```

### Business Rule

Payable should be linked to project if the cost belongs to a specific project.

If the cost is general operational cost, project link may be optional.

For MVP, prioritize project-linked AP.

---

## 17. Attachment Flow

### Purpose

Attachment module stores documents related to opportunities, projects, invoices, payments, and AP.

### Flow

```txt
User uploads file
-> File is stored in R2
-> Metadata is stored in database
-> File is linked to entity
```

### Attachment Linked Types

```txt
CLIENT
OPPORTUNITY
PROJECT
PROJECT_ACTIVITY
INVOICE
PAYMENT
PAYABLE
```

### Attachment Data

Minimum fields:

```txt
linked_type
linked_id
file_name
file_key
mime_type
file_size
uploaded_by
created_at
```

### Upload Rule

Initial MVP rule:

```txt
Max file size: 5 MB
Allowed: PDF, JPG, JPEG, PNG, XLSX, DOCX
Max files per item: 5
```

Do not store file binary in database.

---

## 18. Project Completion and Closing Rule

### Completed

Project can be marked as `COMPLETED` when:

```txt
Main work/deliverable is finished.
Report/document/output has been submitted.
Internal team considers the work done.
```

### Closed

Project can be marked as `CLOSED` when:

```txt
Project work is completed.
Invoice status is clear.
Payment status is clear.
AP/project cost status is clear.
Important documents are uploaded/archived.
```

### Business Rule

Project should not be automatically closed only because progress is 100%.

Recommended closing checklist:

```txt
Project status = COMPLETED
All required invoices created
All required payments recorded or marked as exception
All major AP recorded or marked as exception
Final document uploaded
Owner/PM confirms closing
```

---

## 19. Owner Dashboard Flow

### Purpose

Dashboard gives owner quick operational visibility.

### Dashboard Must Show

```txt
Active opportunities
Opportunities in negotiation
Opportunities needing follow-up
Active projects
Projects waiting client
Projects not updated for more than 7 days
Projects near deadline
Total outstanding AR
Total overdue AR
Total unpaid AP
AP due this week
Recently updated projects
```

### Dashboard Questions

Dashboard should answer:

```txt
What needs attention today?
Which client needs follow-up?
Which project is stuck?
Which invoice is overdue?
Which payment is still outstanding?
Which AP needs payment soon?
Which staff/PIC has not updated their project?
```

### Dashboard Priority

Prioritize actionable data over decorative charts.

Use:

```txt
Cards
Tables
Status badges
Filters
Due date indicators
```

Charts are optional and can be added later.

---

## 20. Report Flow

### Purpose

Reports help owner and finance review data periodically.

### MVP Reports

Recommended reports:

```txt
Opportunity Pipeline Report
Project Status Report
Project Activity Report
AR / Invoice Report
Payment Report
AP / Payable Report
```

### Export Format

Initial export:

```txt
XLSX
CSV
```

PDF can be added later.

---

## 21. Audit Log Flow

### Purpose

Audit log tracks important changes.

This is important because the system stores business and finance data.

### Actions That Must Be Logged

```txt
Opportunity created
Opportunity status changed
Opportunity deal amount changed
Opportunity converted to project
Project created
Project status changed
Project PIC changed
Project progress changed
Invoice created
Invoice amount changed
Invoice status changed
Payment added
Payment changed/cancelled
Payable created
Payable status changed
Attachment uploaded
User role changed
```

### Audit Log Data

Minimum fields:

```txt
actor_user_id
entity_type
entity_id
action
old_value
new_value
created_at
```

### Business Rule

Audit logs should not be edited or deleted by normal users.

---

## 22. Notification / Reminder Logic

Notifications are not mandatory for MVP, but the system should prepare data for reminders.

Important reminder conditions:

```txt
Opportunity follow-up due today
Project follow-up due today
Project not updated for more than 7 days
Project deadline approaching
Invoice due soon
Invoice overdue
AP due soon
AP overdue
```

MVP can show these reminders in dashboard first.

Email/WhatsApp notification can be added later.

---

## 23. MVP Build Order

Build the system in this order:

```txt
1. User and role foundation
2. Client module
3. Client contact module
4. Opportunity module
5. Opportunity follow-up log
6. Negotiation/deal fields
7. Convert opportunity to project
8. Project module
9. Project member module
10. Project activity log
11. Invoice module
12. Payment module
13. AP/payable module
14. Attachment module
15. Owner dashboard
16. Reports/export
17. Audit logs
18. Staging test
19. Production deployment
```

Do not start from KPI tracker.

Do not build full accounting.

Do not build mobile app first.

---

## 24. What Not To Build in MVP

Do not build these in version 1:

```txt
KPI tracker
Full accounting
General ledger
Balance sheet
Profit and loss report
Payroll
Tax report
Bank integration
OCR invoice scanning
AI automation
Flutter mobile app
Client portal
Complex approval workflow
Real-time collaboration
Complex notification system
```

These can be added only after the core flow is stable.

---

## 25. Core Success Criteria

The MVP is successful if owner can answer these questions from the system:

```txt
Which opportunities are active?
Which opportunities need follow-up?
Which opportunities are in negotiation?
Which opportunities became projects?
Which projects are active?
Which projects are waiting for client?
Which projects have not been updated?
Who is responsible for each project?
What is the latest activity of each project?
Which invoices are unpaid?
Which invoices are overdue?
How much AR is outstanding?
Which AP is unpaid?
Which AP is due soon?
Which projects can be closed?
```

If the system can answer those questions clearly, the first version is already valuable.

---

## 26. AI Agent Development Rules

When developing this project, AI agent must follow these rules:

1. Focus only on Ratama Project & Finance Tracker.
2. Treat Project as the center of the system.
3. Opportunity exists before Project.
4. Invoice and Payment must be linked to Project.
5. AP should be linked to Project when possible.
6. Activity log is critical and must not be skipped.
7. Follow-up date and next action are important fields.
8. Do not create KPI module in MVP.
9. Do not turn the system into full accounting software.
10. Do not build Flutter/mobile-first.
11. Do not overengineer workflow.
12. Use clear workflow statuses.
13. Use audit log for important changes.
14. Do not hard delete finance data.
15. Prioritize owner visibility and operational control.

---

## 27. Final Business Flow Summary

The final intended business flow is:

```txt
Client is created
-> Opportunity is created
-> Proposal is prepared and sent
-> PIC follows up with client
-> Negotiation happens
-> Opportunity becomes WON
-> Opportunity is converted to Project
-> Project gets PIC and team members
-> Staff updates activity and progress
-> Finance creates invoice
-> Client pays invoice
-> Finance records payment
-> AP/project cost is recorded
-> Project is marked COMPLETED
-> Project is checked financially/admin-wise
-> Project is marked CLOSED
```

The system should make Ratama's project and finance status visible, traceable, and easier to control.
