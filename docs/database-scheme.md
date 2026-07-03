# Database Schema - Ratama Project & Finance Tracker

## 1. Purpose

Dokumen ini menjelaskan rancangan database untuk **Ratama Project & Finance Tracker**.

Sistem ini berfokus pada alur:

```txt
Client
-> Opportunity / Penawaran
-> Follow-up
-> Negosiasi
-> Deal
-> Project
-> Project Activity
-> Invoice / AR
-> Payment
-> AP / Project Cost
-> Project Closed
```

Database ini dirancang untuk:

1. Tracking client dan kontak client.
2. Tracking peluang proyek/penawaran.
3. Tracking follow-up dan negosiasi.
4. Tracking proyek setelah deal.
5. Tracking aktivitas karyawan/PIC.
6. Tracking invoice dan pembayaran client.
7. Tracking AP/biaya proyek sederhana.
8. Tracking lampiran dokumen.
9. Tracking audit log untuk perubahan penting.

Database ini **bukan** untuk full accounting, pajak, payroll, general ledger, neraca, laba rugi formal, atau KPI tracker versi awal.

---

## 2. Database Technology

Target database:

```txt
Cloudflare D1
SQLite-compatible database
Drizzle ORM
```

Recommended implementation:

```txt
Database: Cloudflare D1
ORM: Drizzle ORM
Schema style: relational
ID type: TEXT
Money type: INTEGER
Timestamp type: TEXT ISO-8601
Soft delete: yes
Audit log: yes
```

---

## 3. Core Design Rules

### 3.1 Use Relational Schema

Gunakan relational schema karena data sistem ini saling berhubungan:

```txt
clients -> opportunities -> projects -> invoices -> payments
projects -> project_activities
projects -> payables
entities -> attachments
entities -> audit_logs
```

Jangan gunakan NoSQL untuk MVP.

---

### 3.2 Use TEXT Primary Key

Gunakan `TEXT` untuk primary key.

Recommended ID format:

```txt
UUID
CUID
NanoID
```

Contoh:

```txt
clt_01H...
opp_01H...
prj_01H...
inv_01H...
pay_01H...
```

ID dibuat di application layer, bukan mengandalkan auto-increment.

---

### 3.3 Use Integer for Money

Semua nominal uang harus disimpan sebagai integer dalam Rupiah.

Contoh:

```txt
Rp 1.500.000 -> 1500000
Rp 25.000.000 -> 25000000
```

Jangan gunakan:

```txt
FLOAT
REAL
DOUBLE
```

Money fields:

```txt
estimated_value
initial_offer_amount
revised_offer_amount
deal_amount
contract_value
amount
```

---

### 3.4 Use ISO Date Format

Gunakan format:

```txt
YYYY-MM-DD
```

Untuk tanggal bisnis:

```txt
invoice_date
due_date
payment_date
bill_date
start_date
deadline
deal_date
```

Gunakan format ISO timestamp:

```txt
YYYY-MM-DDTHH:mm:ss.sssZ
```

Untuk timestamp sistem:

```txt
created_at
updated_at
deleted_at
sent_at
paid_at
cancelled_at
completed_at
closed_at
```

---

### 3.5 Use Soft Delete

Untuk data penting, jangan hard delete.

Gunakan:

```txt
deleted_at
deleted_by
delete_reason
```

Minimal gunakan:

```txt
deleted_at
```

Data finance seperti invoice, payment, dan payable sebaiknya tidak dihapus. Gunakan status `CANCELLED`.

---

### 3.6 Use Audit Log

Semua perubahan penting harus masuk ke `audit_logs`.

Wajib audit untuk:

```txt
Opportunity status changed
Opportunity deal amount changed
Opportunity converted to project
Project status changed
Project progress changed
Invoice created
Invoice amount changed
Invoice cancelled
Payment added
Payment cancelled
Payable created
Payable marked paid
Payable cancelled
User role changed
```

---

### 3.7 Store Files in R2, Not D1

File asli tidak boleh disimpan di D1.

D1 hanya menyimpan metadata:

```txt
file_name
file_key
mime_type
file_size
linked_type
linked_id
uploaded_by
```

File binary disimpan di:

```txt
Cloudflare R2
```

---

## 4. Entity Relationship Overview

High-level relationship:

```txt
users
  |-- opportunities.pic_user_id
  |-- opportunity_logs.user_id
  |-- projects.pic_user_id
  |-- project_members.user_id
  |-- project_activities.user_id
  |-- invoices.created_by
  |-- payments.created_by
  |-- payables.created_by
  `-- attachments.uploaded_by

clients
  |-- client_contacts
  |-- opportunities
  |-- projects
  |-- invoices
  `-- payments

opportunities
  |-- opportunity_logs
  `-- projects

projects
  |-- project_members
  |-- project_activities
  |-- invoices
  |-- payments
  |-- payables
  `-- attachments

invoices
  `-- payments

payables
  `-- attachments
```

Core flow:

```txt
clients
  |
  v
opportunities
  |
  v
projects
  |
  v
invoices
  |
  v
payments
```

Project cost flow:

```txt
projects
  |
  v
payables
```

Activity flow:

```txt
opportunities -> opportunity_logs
projects -> project_activities
```

Attachment flow:

```txt
attachments linked by linked_type + linked_id
```

---

## 5. Enum Definitions

### 5.1 User Role

```txt
OWNER
ADMIN
FINANCE
PROJECT_MANAGER
STAFF
```

### 5.2 User Status

```txt
ACTIVE
INACTIVE
SUSPENDED
```

### 5.3 Client Status

```txt
ACTIVE
INACTIVE
PROSPECT
BLACKLISTED
```

### 5.4 Opportunity Status

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

### 5.5 Project Status

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

### 5.6 Invoice Status

```txt
PLANNED
DRAFT
SENT
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
```

Important note:

```txt
OVERDUE should be treated as computed/effective status when possible.
The source of truth is due_date + payment total.
```

Do not rely only on stored `status = OVERDUE`, because overdue status changes based on date.

Backend should return:

```txt
stored_status
effective_status
```

Example:

```txt
stored_status = SENT
due_date = past date
total_paid < amount
effective_status = OVERDUE
```

### 5.7 Payment Status

```txt
VALID
CANCELLED
```

### 5.8 Payable Status

```txt
UNPAID
WAITING_APPROVAL
APPROVED
SCHEDULED
PAID
OVERDUE
CANCELLED
```

Same rule as invoice:

```txt
OVERDUE can be computed from due_date + paid_at/status.
```

### 5.9 Activity Type

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
PROPOSAL_SENT
PROPOSAL_REVISED
NEGOTIATION_NOTE
CLIENT_FEEDBACK
OTHER
```

### 5.10 Payment Method

```txt
BANK_TRANSFER
CASH
GIRO
OTHER
```

### 5.11 Project Member Role

```txt
PIC
CONSULTANT
FINANCE_SUPPORT
ADMIN_SUPPORT
REVIEWER
OTHER
```

### 5.12 Cost Category

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

### 5.13 Attachment Linked Type

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

### 5.14 Attachment Kind

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

---

## 6. Table Summary

Core MVP tables:

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
billing_schedules
vendors
notifications
kpi_metrics
kpi_targets
kpi_results
```

Do not create optional future tables in MVP unless explicitly needed.

---

## 7. Table: users

### Purpose

Menyimpan user internal Ratama yang boleh menggunakan aplikasi.

Cloudflare Access hanya berfungsi sebagai gerbang login. Role tetap disimpan di tabel `users`.

### Columns

| Column          | Type | Required | Description                                   |
| --------------- | ---: | -------: | --------------------------------------------- |
| `id`            | TEXT |      Yes | Primary key                                   |
| `email`         | TEXT |      Yes | Email user, unique, lowercase                 |
| `name`          | TEXT |      Yes | Nama user                                     |
| `role`          | TEXT |      Yes | OWNER, ADMIN, FINANCE, PROJECT_MANAGER, STAFF |
| `status`        | TEXT |      Yes | ACTIVE, INACTIVE, SUSPENDED                   |
| `last_login_at` | TEXT |       No | Last login timestamp                          |
| `created_at`    | TEXT |      Yes | Created timestamp                             |
| `updated_at`    | TEXT |      Yes | Updated timestamp                             |
| `deleted_at`    | TEXT |       No | Soft delete timestamp                         |

### Constraints

```sql
PRIMARY KEY (id)
UNIQUE (email)

CHECK (role IN (
  'OWNER',
  'ADMIN',
  'FINANCE',
  'PROJECT_MANAGER',
  'STAFF'
))

CHECK (status IN (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
))
```

### Indexes

```sql
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### Business Rules

1. Email harus lowercase.
2. User dengan status selain `ACTIVE` tidak boleh mengakses aplikasi.
3. User tidak langsung dibuat otomatis dari Cloudflare Access kecuali memang diputuskan.
4. Role hanya boleh diubah oleh `OWNER` atau `ADMIN`.
5. Perubahan role harus masuk `audit_logs`.

---

## 8. Table: clients

### Purpose

Menyimpan data perusahaan/client/prospect.

### Columns

| Column        | Type | Required | Description                                           |
| ------------- | ---: | -------: | ----------------------------------------------------- |
| `id`          | TEXT |      Yes | Primary key                                           |
| `name`        | TEXT |      Yes | Nama perusahaan/client                                |
| `client_type` | TEXT |       No | Jenis client, contoh: COMPANY, GOVERNMENT, INDIVIDUAL |
| `industry`    | TEXT |       No | Bidang industri                                       |
| `address`     | TEXT |       No | Alamat                                                |
| `email`       | TEXT |       No | Email umum client                                     |
| `phone`       | TEXT |       No | Telepon umum client                                   |
| `notes`       | TEXT |       No | Catatan                                               |
| `status`      | TEXT |      Yes | ACTIVE, INACTIVE, PROSPECT, BLACKLISTED               |
| `created_at`  | TEXT |      Yes | Created timestamp                                     |
| `updated_at`  | TEXT |      Yes | Updated timestamp                                     |
| `deleted_at`  | TEXT |       No | Soft delete timestamp                                 |

### Constraints

```sql
PRIMARY KEY (id)

CHECK (status IN (
  'ACTIVE',
  'INACTIVE',
  'PROSPECT',
  'BLACKLISTED'
))
```

### Indexes

```sql
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_industry ON clients(industry);
```

### Business Rules

1. Client tidak boleh hard delete jika sudah punya opportunity, project, invoice, atau payment.
2. Gunakan soft delete.
3. Client dengan status `BLACKLISTED` sebaiknya tidak bisa dibuatkan opportunity baru tanpa override dari OWNER.

---

## 9. Table: client_contacts

### Purpose

Menyimpan kontak person dari sisi client.

### Columns

| Column       |    Type | Required | Description           |
| ------------ | ------: | -------: | --------------------- |
| `id`         |    TEXT |      Yes | Primary key           |
| `client_id`  |    TEXT |      Yes | FK to clients         |
| `name`       |    TEXT |      Yes | Nama kontak           |
| `position`   |    TEXT |       No | Jabatan               |
| `email`      |    TEXT |       No | Email                 |
| `phone`      |    TEXT |       No | Nomor telepon         |
| `whatsapp`   |    TEXT |       No | Nomor WhatsApp        |
| `is_primary` | INTEGER |      Yes | 0/1                   |
| `notes`      |    TEXT |       No | Catatan               |
| `created_at` |    TEXT |      Yes | Created timestamp     |
| `updated_at` |    TEXT |      Yes | Updated timestamp     |
| `deleted_at` |    TEXT |       No | Soft delete timestamp |

### Constraints

```sql
PRIMARY KEY (id)
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
CHECK (is_primary IN (0, 1))
```

### Indexes

```sql
CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_name ON client_contacts(name);
```

Recommended partial unique index:

```sql
CREATE UNIQUE INDEX idx_client_contacts_one_primary
ON client_contacts(client_id)
WHERE is_primary = 1 AND deleted_at IS NULL;
```

### Business Rules

1. Satu client boleh punya banyak contact.
2. Satu client sebaiknya hanya punya satu primary contact aktif.
3. Contact tidak hard delete.

---

## 10. Table: opportunities

### Purpose

Menyimpan peluang proyek sebelum menjadi project.

Opportunity adalah tahap:

```txt
Lead / inquiry -> proposal -> follow-up -> negotiation -> won/lost
```

### Columns

| Column                 |    Type | Required | Description                  |
| ---------------------- | ------: | -------: | ---------------------------- |
| `id`                   |    TEXT |      Yes | Primary key                  |
| `client_id`            |    TEXT |      Yes | FK to clients                |
| `name`                 |    TEXT |      Yes | Nama opportunity/penawaran   |
| `service_type`         |    TEXT |       No | Jenis layanan                |
| `estimated_value`      | INTEGER |       No | Estimasi nilai awal          |
| `initial_offer_amount` | INTEGER |       No | Harga penawaran awal         |
| `revised_offer_amount` | INTEGER |       No | Harga revisi terakhir        |
| `deal_amount`          | INTEGER |       No | Harga deal final             |
| `deal_date`            |    TEXT |       No | Tanggal deal                 |
| `payment_scheme`       |    TEXT |       No | Skema pembayaran             |
| `pic_user_id`          |    TEXT |      Yes | PIC internal                 |
| `status`               |    TEXT |      Yes | Opportunity status           |
| `source`               |    TEXT |       No | Sumber lead                  |
| `proposal_sent_date`   |    TEXT |       No | Tanggal proposal dikirim     |
| `next_follow_up_date`  |    TEXT |       No | Tanggal follow-up berikutnya |
| `notes`                |    TEXT |       No | Catatan umum                 |
| `lost_reason`          |    TEXT |       No | Alasan lost                  |
| `on_hold_reason`       |    TEXT |       No | Alasan hold                  |
| `created_at`           |    TEXT |      Yes | Created timestamp            |
| `updated_at`           |    TEXT |      Yes | Updated timestamp            |
| `deleted_at`           |    TEXT |       No | Soft delete timestamp        |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE RESTRICT

CHECK (status IN (
  'NEW',
  'PROPOSAL_DRAFT',
  'PROPOSAL_SENT',
  'FOLLOW_UP',
  'NEGOTIATION',
  'WON',
  'LOST',
  'ON_HOLD'
))

CHECK (estimated_value IS NULL OR estimated_value >= 0)
CHECK (initial_offer_amount IS NULL OR initial_offer_amount >= 0)
CHECK (revised_offer_amount IS NULL OR revised_offer_amount >= 0)
CHECK (deal_amount IS NULL OR deal_amount >= 0)

CHECK (
  status != 'WON'
  OR deal_amount IS NOT NULL
)
```

### Indexes

```sql
CREATE INDEX idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX idx_opportunities_pic_user_id ON opportunities(pic_user_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_next_follow_up_date ON opportunities(next_follow_up_date);
CREATE INDEX idx_opportunities_deal_date ON opportunities(deal_date);
```

### Business Rules

1. Opportunity wajib punya client.
2. Opportunity wajib punya PIC.
3. Opportunity hanya bisa dikonversi menjadi project jika status `WON`.
4. Status `WON` wajib punya `deal_amount`.
5. Jika status `LOST`, sebaiknya isi `lost_reason`.
6. Jika status `ON_HOLD`, sebaiknya isi `on_hold_reason`.
7. Perubahan status harus masuk audit log.
8. Perubahan `deal_amount` harus masuk audit log.

---

## 11. Table: opportunity_logs

### Purpose

Menyimpan riwayat follow-up, komunikasi, dan negosiasi sebelum opportunity menjadi project.

### Columns

| Column                | Type | Required | Description           |
| --------------------- | ---: | -------: | --------------------- |
| `id`                  | TEXT |      Yes | Primary key           |
| `opportunity_id`      | TEXT |      Yes | FK to opportunities   |
| `user_id`             | TEXT |      Yes | User yang membuat log |
| `activity_type`       | TEXT |      Yes | Jenis aktivitas       |
| `activity_date`       | TEXT |      Yes | Tanggal aktivitas     |
| `notes`               | TEXT |      Yes | Isi catatan           |
| `next_action`         | TEXT |       No | Tindakan berikutnya   |
| `next_follow_up_date` | TEXT |       No | Follow-up berikutnya  |
| `created_at`          | TEXT |      Yes | Created timestamp     |
| `updated_at`          | TEXT |      Yes | Updated timestamp     |
| `deleted_at`          | TEXT |       No | Soft delete timestamp |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT

CHECK (activity_type IN (
  'MEETING',
  'CALL',
  'WHATSAPP_FOLLOW_UP',
  'EMAIL_SENT',
  'DOCUMENT_RECEIVED',
  'DOCUMENT_REVIEWED',
  'REPORT_DRAFTED',
  'REPORT_SUBMITTED',
  'REVISION_REQUESTED',
  'CLIENT_APPROVAL',
  'INTERNAL_DISCUSSION',
  'PROPOSAL_SENT',
  'PROPOSAL_REVISED',
  'NEGOTIATION_NOTE',
  'CLIENT_FEEDBACK',
  'OTHER'
))
```

### Indexes

```sql
CREATE INDEX idx_opportunity_logs_opportunity_id ON opportunity_logs(opportunity_id);
CREATE INDEX idx_opportunity_logs_user_id ON opportunity_logs(user_id);
CREATE INDEX idx_opportunity_logs_activity_date ON opportunity_logs(activity_date);
CREATE INDEX idx_opportunity_logs_next_follow_up_date ON opportunity_logs(next_follow_up_date);
```

### Business Rules

1. Setiap follow-up harus punya catatan.
2. Log membantu owner melihat kapan terakhir opportunity di-follow-up.
3. Jangan hard delete log.
4. Attachment untuk log disimpan lewat tabel `attachments`.

---

## 12. Table: projects

### Purpose

Menyimpan data project setelah opportunity dinyatakan deal/won.

Project adalah pusat sistem.

### Columns

| Column                |    Type | Required | Description                  |
| --------------------- | ------: | -------: | ---------------------------- |
| `id`                  |    TEXT |      Yes | Primary key                  |
| `client_id`           |    TEXT |      Yes | FK to clients                |
| `opportunity_id`      |    TEXT |       No | FK to opportunities          |
| `name`                |    TEXT |      Yes | Nama project                 |
| `service_type`        |    TEXT |       No | Jenis layanan                |
| `contract_value`      | INTEGER |      Yes | Nilai kontrak/deal           |
| `pic_user_id`         |    TEXT |      Yes | PIC utama project            |
| `status`              |    TEXT |      Yes | Project status               |
| `progress_percentage` | INTEGER |      Yes | Progress 0-100               |
| `start_date`          |    TEXT |       No | Tanggal mulai                |
| `deadline`            |    TEXT |       No | Deadline                     |
| `completed_at`        |    TEXT |       No | Waktu completed              |
| `closed_at`           |    TEXT |       No | Waktu closed                 |
| `next_action`         |    TEXT |       No | Tindakan berikutnya          |
| `next_follow_up_date` |    TEXT |       No | Tanggal follow-up berikutnya |
| `blocker_notes`       |    TEXT |       No | Kendala/blocker              |
| `cancelled_at`        |    TEXT |       No | Waktu cancelled              |
| `cancel_reason`       |    TEXT |       No | Alasan cancelled             |
| `created_at`          |    TEXT |      Yes | Created timestamp            |
| `updated_at`          |    TEXT |      Yes | Updated timestamp            |
| `deleted_at`          |    TEXT |       No | Soft delete timestamp        |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT
FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE RESTRICT

UNIQUE (opportunity_id)

CHECK (contract_value >= 0)

CHECK (
  progress_percentage >= 0
  AND progress_percentage <= 100
)

CHECK (status IN (
  'NOT_STARTED',
  'KICKOFF',
  'IN_PROGRESS',
  'WAITING_CLIENT',
  'INTERNAL_REVIEW',
  'REVISION',
  'COMPLETED',
  'CLOSED',
  'CANCELLED'
))
```

### Important Note About `UNIQUE (opportunity_id)`

This means one opportunity can only become one project.

If in the future one opportunity can create multiple projects, remove this constraint.

For MVP, one opportunity -> one project is simpler and recommended.

### Indexes

```sql
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_pic_user_id ON projects(pic_user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_next_follow_up_date ON projects(next_follow_up_date);
CREATE INDEX idx_projects_opportunity_id ON projects(opportunity_id);
```

### Business Rules

1. Project wajib punya client.
2. Project wajib punya PIC.
3. Project biasanya dibuat dari opportunity dengan status `WON`.
4. `COMPLETED` berarti pekerjaan selesai.
5. `CLOSED` berarti pekerjaan selesai + finance/admin selesai.
6. Project tidak boleh otomatis `CLOSED` hanya karena progress 100%.
7. Status `CANCELLED` harus punya alasan.
8. Perubahan status harus masuk audit log.
9. Perubahan PIC harus masuk audit log.
10. Perubahan progress signifikan harus masuk audit log atau project activity.

---

## 13. Table: project_members

### Purpose

Menyimpan anggota tim yang terlibat dalam project.

### Columns

| Column            |    Type | Required | Description           |
| ----------------- | ------: | -------: | --------------------- |
| `id`              |    TEXT |      Yes | Primary key           |
| `project_id`      |    TEXT |      Yes | FK to projects        |
| `user_id`         |    TEXT |      Yes | FK to users           |
| `role_in_project` |    TEXT |      Yes | PIC, CONSULTANT, etc. |
| `assigned_at`     |    TEXT |      Yes | Tanggal assign        |
| `is_active`       | INTEGER |      Yes | 0/1                   |
| `created_at`      |    TEXT |      Yes | Created timestamp     |
| `updated_at`      |    TEXT |      Yes | Updated timestamp     |
| `deleted_at`      |    TEXT |       No | Soft delete timestamp |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT

CHECK (role_in_project IN (
  'PIC',
  'CONSULTANT',
  'FINANCE_SUPPORT',
  'ADMIN_SUPPORT',
  'REVIEWER',
  'OTHER'
))

CHECK (is_active IN (0, 1))
```

### Indexes

```sql
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_is_active ON project_members(is_active);
```

Recommended unique index:

```sql
CREATE UNIQUE INDEX idx_project_members_unique_active
ON project_members(project_id, user_id)
WHERE deleted_at IS NULL;
```

### Business Rules

1. Satu project bisa punya banyak member.
2. Satu user bisa menjadi member di banyak project.
3. PIC utama tetap disimpan di `projects.pic_user_id`.
4. `project_members` digunakan untuk anggota tambahan.
5. Staff hanya boleh update activity untuk project yang dia assign, kecuali role-nya OWNER/ADMIN/PROJECT_MANAGER.

---

## 14. Table: project_activities

### Purpose

Menyimpan aktivitas, progres, dan follow-up project.

Ini salah satu tabel paling penting karena menjawab:

```txt
Siapa mengerjakan apa?
Kapan terakhir update?
Apa next action?
Apakah project sedang stuck?
```

### Columns

| Column                |    Type | Required | Description                   |
| --------------------- | ------: | -------: | ----------------------------- |
| `id`                  |    TEXT |      Yes | Primary key                   |
| `project_id`          |    TEXT |      Yes | FK to projects                |
| `user_id`             |    TEXT |      Yes | User yang membuat activity    |
| `activity_type`       |    TEXT |      Yes | Jenis activity                |
| `activity_date`       |    TEXT |      Yes | Tanggal activity              |
| `notes`               |    TEXT |      Yes | Catatan activity              |
| `next_action`         |    TEXT |       No | Next action                   |
| `next_follow_up_date` |    TEXT |       No | Follow-up berikutnya          |
| `progress_snapshot`   | INTEGER |       No | Progress saat activity dibuat |
| `created_at`          |    TEXT |      Yes | Created timestamp             |
| `updated_at`          |    TEXT |      Yes | Updated timestamp             |
| `deleted_at`          |    TEXT |       No | Soft delete timestamp         |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT

CHECK (activity_type IN (
  'MEETING',
  'CALL',
  'WHATSAPP_FOLLOW_UP',
  'EMAIL_SENT',
  'DOCUMENT_RECEIVED',
  'DOCUMENT_REVIEWED',
  'REPORT_DRAFTED',
  'REPORT_SUBMITTED',
  'REVISION_REQUESTED',
  'CLIENT_APPROVAL',
  'INTERNAL_DISCUSSION',
  'PROPOSAL_SENT',
  'PROPOSAL_REVISED',
  'NEGOTIATION_NOTE',
  'CLIENT_FEEDBACK',
  'OTHER'
))

CHECK (
  progress_snapshot IS NULL
  OR (progress_snapshot >= 0 AND progress_snapshot <= 100)
)
```

### Indexes

```sql
CREATE INDEX idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX idx_project_activities_user_id ON project_activities(user_id);
CREATE INDEX idx_project_activities_activity_date ON project_activities(activity_date);
CREATE INDEX idx_project_activities_next_follow_up_date ON project_activities(next_follow_up_date);
```

### Business Rules

1. Setiap project activity harus punya catatan.
2. Activity tidak boleh hard delete.
3. Owner harus bisa melihat activity timeline project.
4. Project dianggap berpotensi stuck jika tidak ada activity lebih dari 7 hari.
5. Backend/dashboard menghitung last activity dari tabel ini.
6. Attachment activity disimpan lewat tabel `attachments`.

---

## 15. Table: invoices

### Purpose

Menyimpan invoice/AR yang dikirim ke client.

Invoice harus selalu terhubung ke project.

### Columns

| Column           |    Type | Required | Description           |
| ---------------- | ------: | -------: | --------------------- |
| `id`             |    TEXT |      Yes | Primary key           |
| `project_id`     |    TEXT |      Yes | FK to projects        |
| `client_id`      |    TEXT |      Yes | FK to clients         |
| `invoice_number` |    TEXT |      Yes | Nomor invoice         |
| `invoice_date`   |    TEXT |      Yes | Tanggal invoice       |
| `due_date`       |    TEXT |      Yes | Tanggal jatuh tempo   |
| `termin_number`  | INTEGER |       No | Termin keberapa       |
| `description`    |    TEXT |       No | Deskripsi invoice     |
| `amount`         | INTEGER |      Yes | Nominal invoice       |
| `status`         |    TEXT |      Yes | Stored invoice status |
| `sent_at`        |    TEXT |       No | Waktu dikirim         |
| `created_by`     |    TEXT |      Yes | User finance/admin    |
| `created_at`     |    TEXT |      Yes | Created timestamp     |
| `updated_at`     |    TEXT |      Yes | Updated timestamp     |
| `deleted_at`     |    TEXT |       No | Soft delete timestamp |
| `cancelled_at`   |    TEXT |       No | Cancel timestamp      |
| `cancel_reason`  |    TEXT |       No | Alasan cancel         |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT

UNIQUE (invoice_number)

CHECK (amount > 0)

CHECK (
  termin_number IS NULL
  OR termin_number > 0
)

CHECK (status IN (
  'PLANNED',
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED'
))
```

### Indexes

```sql
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
```

### Business Rules

1. Invoice wajib link ke project.
2. Invoice wajib link ke client.
3. `client_id` harus sama dengan client dari project.
4. `invoice_number` harus unik.
5. Invoice tidak boleh hard delete.
6. Invoice salah sebaiknya `CANCELLED`, bukan dihapus.
7. Jika status `CANCELLED`, wajib ada `cancel_reason`.
8. Perubahan amount harus masuk audit log.
9. Invoice paid amount tidak disimpan di tabel ini.
10. Paid amount dihitung dari tabel `payments`.

### Computed Fields

Backend harus menghitung:

```txt
total_paid = sum(payments.amount where payments.status = 'VALID')
remaining_amount = invoices.amount - total_paid
is_overdue = due_date < today AND remaining_amount > 0 AND status != 'CANCELLED'
effective_status = computed from amount, total_paid, due_date, status
```

Recommended effective status logic:

```txt
If status = CANCELLED -> CANCELLED
Else if total_paid >= amount -> PAID
Else if due_date < today AND total_paid < amount -> OVERDUE
Else if total_paid > 0 AND total_paid < amount -> PARTIALLY_PAID
Else if sent_at is not null -> SENT
Else -> DRAFT or PLANNED
```

---

## 16. Table: payments

### Purpose

Menyimpan pembayaran masuk dari client.

Payment harus terhubung ke invoice.

### Columns

| Column             |    Type | Required | Description                   |
| ------------------ | ------: | -------: | ----------------------------- |
| `id`               |    TEXT |      Yes | Primary key                   |
| `invoice_id`       |    TEXT |      Yes | FK to invoices                |
| `project_id`       |    TEXT |      Yes | FK to projects                |
| `client_id`        |    TEXT |      Yes | FK to clients                 |
| `payment_date`     |    TEXT |      Yes | Tanggal pembayaran            |
| `amount`           | INTEGER |      Yes | Nominal pembayaran            |
| `payment_method`   |    TEXT |      Yes | Metode pembayaran             |
| `reference_number` |    TEXT |       No | Nomor referensi transfer/giro |
| `notes`            |    TEXT |       No | Catatan                       |
| `status`           |    TEXT |      Yes | VALID or CANCELLED            |
| `created_by`       |    TEXT |      Yes | User finance/admin            |
| `created_at`       |    TEXT |      Yes | Created timestamp             |
| `updated_at`       |    TEXT |      Yes | Updated timestamp             |
| `deleted_at`       |    TEXT |       No | Soft delete timestamp         |
| `cancelled_at`     |    TEXT |       No | Cancel timestamp              |
| `cancel_reason`    |    TEXT |       No | Alasan cancel                 |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT

CHECK (amount > 0)

CHECK (payment_method IN (
  'BANK_TRANSFER',
  'CASH',
  'GIRO',
  'OTHER'
))

CHECK (status IN (
  'VALID',
  'CANCELLED'
))
```

### Indexes

```sql
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_by ON payments(created_by);
```

### Business Rules

1. Payment wajib link ke invoice.
2. `project_id` dan `client_id` harus sesuai dengan invoice.
3. Satu invoice bisa punya banyak payment.
4. Partial payment harus didukung.
5. Payment tidak boleh hard delete.
6. Payment salah harus di-cancel dengan alasan.
7. Payment valid memengaruhi total paid invoice.
8. Payment cancelled tidak boleh dihitung sebagai pembayaran.
9. Payment created/cancelled harus masuk audit log.

---

## 17. Table: payables

### Purpose

Menyimpan AP/project cost/tagihan keluar.

Ini bukan full accounting. Ini hanya tracking biaya/tagihan keluar yang berkaitan dengan project.

### Columns

| Column             |    Type | Required | Description                               |
| ------------------ | ------: | -------: | ----------------------------------------- |
| `id`               |    TEXT |      Yes | Primary key                               |
| `project_id`       |    TEXT |       No | FK to projects, nullable for general cost |
| `vendor_name`      |    TEXT |      Yes | Vendor/subkontraktor/penerima pembayaran  |
| `cost_category`    |    TEXT |      Yes | Kategori biaya                            |
| `description`      |    TEXT |       No | Deskripsi biaya                           |
| `bill_date`        |    TEXT |       No | Tanggal tagihan                           |
| `due_date`         |    TEXT |       No | Tanggal jatuh tempo                       |
| `amount`           | INTEGER |      Yes | Nominal AP                                |
| `status`           |    TEXT |      Yes | Payable status                            |
| `paid_at`          |    TEXT |       No | Waktu dibayar                             |
| `payment_method`   |    TEXT |       No | Metode pembayaran                         |
| `reference_number` |    TEXT |       No | Nomor referensi pembayaran                |
| `notes`            |    TEXT |       No | Catatan                                   |
| `created_by`       |    TEXT |      Yes | User pembuat                              |
| `created_at`       |    TEXT |      Yes | Created timestamp                         |
| `updated_at`       |    TEXT |      Yes | Updated timestamp                         |
| `deleted_at`       |    TEXT |       No | Soft delete timestamp                     |
| `cancelled_at`     |    TEXT |       No | Cancel timestamp                          |
| `cancel_reason`    |    TEXT |       No | Alasan cancel                             |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT

CHECK (amount > 0)

CHECK (cost_category IN (
  'SUBCONTRACTOR',
  'TRANSPORT',
  'ACCOMMODATION',
  'DOCUMENT_PRINTING',
  'CERTIFICATION_COST',
  'CONSULTANT_FEE',
  'OPERATIONAL',
  'OTHER'
))

CHECK (status IN (
  'UNPAID',
  'WAITING_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'PAID',
  'OVERDUE',
  'CANCELLED'
))

CHECK (
  payment_method IS NULL
  OR payment_method IN (
    'BANK_TRANSFER',
    'CASH',
    'GIRO',
    'OTHER'
  )
)
```

### Indexes

```sql
CREATE INDEX idx_payables_project_id ON payables(project_id);
CREATE INDEX idx_payables_status ON payables(status);
CREATE INDEX idx_payables_due_date ON payables(due_date);
CREATE INDEX idx_payables_bill_date ON payables(bill_date);
CREATE INDEX idx_payables_cost_category ON payables(cost_category);
CREATE INDEX idx_payables_created_by ON payables(created_by);
```

### Business Rules

1. AP sebaiknya link ke project jika biaya terkait project.
2. AP umum boleh `project_id = NULL`.
3. AP tidak boleh hard delete.
4. Jika AP salah, gunakan `CANCELLED`.
5. Jika status `PAID`, sebaiknya `paid_at` terisi.
6. Jika status `CANCELLED`, wajib ada `cancel_reason`.
7. AP marked paid/cancelled harus masuk audit log.
8. AP overdue sebaiknya dihitung dari `due_date` dan `status`.

### Computed Fields

Backend dapat menghitung:

```txt
is_due_soon = due_date within next 7 days AND status not in PAID/CANCELLED
is_overdue = due_date < today AND status not in PAID/CANCELLED
effective_status = OVERDUE if overdue
```

---

## 18. Table: attachments

### Purpose

Menyimpan metadata file yang tersimpan di Cloudflare R2.

Tabel ini memakai polymorphic link:

```txt
linked_type + linked_id
```

Karena SQLite tidak bisa enforce foreign key polymorphic, validasi relasi wajib dilakukan di backend.

### Columns

| Column            |    Type | Required | Description            |
| ----------------- | ------: | -------: | ---------------------- |
| `id`              |    TEXT |      Yes | Primary key            |
| `linked_type`     |    TEXT |      Yes | Entity type            |
| `linked_id`       |    TEXT |      Yes | Entity ID              |
| `attachment_kind` |    TEXT |      Yes | Jenis dokumen          |
| `file_name`       |    TEXT |      Yes | Nama asli file         |
| `file_key`        |    TEXT |      Yes | Key/path file di R2    |
| `mime_type`       |    TEXT |      Yes | MIME type              |
| `file_size`       | INTEGER |      Yes | Ukuran file dalam byte |
| `uploaded_by`     |    TEXT |      Yes | FK to users            |
| `created_at`      |    TEXT |      Yes | Created timestamp      |
| `deleted_at`      |    TEXT |       No | Soft delete timestamp  |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT

UNIQUE (file_key)

CHECK (linked_type IN (
  'CLIENT',
  'OPPORTUNITY',
  'OPPORTUNITY_LOG',
  'PROJECT',
  'PROJECT_ACTIVITY',
  'INVOICE',
  'PAYMENT',
  'PAYABLE'
))

CHECK (attachment_kind IN (
  'PROPOSAL',
  'CONTRACT',
  'SPK',
  'PO',
  'PROJECT_DOCUMENT',
  'INVOICE_FILE',
  'PAYMENT_PROOF',
  'VENDOR_BILL',
  'AP_PAYMENT_PROOF',
  'OTHER'
))

CHECK (file_size > 0)
```

### Indexes

```sql
CREATE INDEX idx_attachments_linked ON attachments(linked_type, linked_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX idx_attachments_kind ON attachments(attachment_kind);
CREATE INDEX idx_attachments_created_at ON attachments(created_at);
```

### Business Rules

1. File binary disimpan di R2.
2. D1 hanya menyimpan metadata.
3. Backend wajib validasi bahwa `linked_id` benar-benar ada sesuai `linked_type`.
4. File size maksimal MVP: 5 MB.
5. Allowed MIME type MVP:

   * PDF
   * JPG/JPEG
   * PNG
   * XLSX
   * DOCX
6. Attachment tidak hard delete.
7. Delete attachment hanya mengisi `deleted_at`.
8. Penghapusan file dari R2 bisa dilakukan belakangan dengan cleanup job.

---

## 19. Table: audit_logs

### Purpose

Menyimpan jejak perubahan data penting.

Audit log penting karena sistem ini menyimpan data project dan finance.

### Columns

| Column          | Type | Required | Description              |
| --------------- | ---: | -------: | ------------------------ |
| `id`            | TEXT |      Yes | Primary key              |
| `actor_user_id` | TEXT |       No | User yang melakukan aksi |
| `entity_type`   | TEXT |      Yes | Jenis entity             |
| `entity_id`     | TEXT |      Yes | ID entity                |
| `action`        | TEXT |      Yes | Nama aksi                |
| `old_value`     | TEXT |       No | JSON string data lama    |
| `new_value`     | TEXT |       No | JSON string data baru    |
| `ip_address`    | TEXT |       No | IP user jika tersedia    |
| `user_agent`    | TEXT |       No | User agent jika tersedia |
| `created_at`    | TEXT |      Yes | Created timestamp        |

### Constraints

```sql
PRIMARY KEY (id)

FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
```

### Indexes

```sql
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Recommended Entity Types

```txt
USER
CLIENT
CLIENT_CONTACT
OPPORTUNITY
OPPORTUNITY_LOG
PROJECT
PROJECT_MEMBER
PROJECT_ACTIVITY
INVOICE
PAYMENT
PAYABLE
ATTACHMENT
```

### Recommended Actions

```txt
CREATE
UPDATE
DELETE
SOFT_DELETE
STATUS_CHANGE
ROLE_CHANGE
AMOUNT_CHANGE
CONVERT_TO_PROJECT
MARK_SENT
MARK_PAID
MARK_COMPLETED
MARK_CLOSED
CANCEL
UPLOAD_ATTACHMENT
```

### Business Rules

1. Audit log tidak boleh diedit oleh normal user.
2. Audit log tidak boleh dihapus dari aplikasi.
3. Semua finance-related action harus membuat audit log.
4. `old_value` dan `new_value` disimpan sebagai JSON string.
5. Jika actor tidak ditemukan, `actor_user_id` boleh null.

---

## 20. Recommended SQLite DDL Skeleton

This is not final migration code, but the AI agent can use it as a base for Drizzle schema and migrations.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER', 'STAFF')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_type TEXT,
  industry TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PROSPECT' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PROSPECT', 'BLACKLISTED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE client_contacts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);

CREATE TABLE opportunities (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  service_type TEXT,
  estimated_value INTEGER CHECK (estimated_value IS NULL OR estimated_value >= 0),
  initial_offer_amount INTEGER CHECK (initial_offer_amount IS NULL OR initial_offer_amount >= 0),
  revised_offer_amount INTEGER CHECK (revised_offer_amount IS NULL OR revised_offer_amount >= 0),
  deal_amount INTEGER CHECK (deal_amount IS NULL OR deal_amount >= 0),
  deal_date TEXT,
  payment_scheme TEXT,
  pic_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'PROPOSAL_DRAFT', 'PROPOSAL_SENT', 'FOLLOW_UP', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD')),
  source TEXT,
  proposal_sent_date TEXT,
  next_follow_up_date TEXT,
  notes TEXT,
  lost_reason TEXT,
  on_hold_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CHECK (status != 'WON' OR deal_amount IS NOT NULL)
);

CREATE TABLE opportunity_logs (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('MEETING', 'CALL', 'WHATSAPP_FOLLOW_UP', 'EMAIL_SENT', 'DOCUMENT_RECEIVED', 'DOCUMENT_REVIEWED', 'REPORT_DRAFTED', 'REPORT_SUBMITTED', 'REVISION_REQUESTED', 'CLIENT_APPROVAL', 'INTERNAL_DISCUSSION', 'PROPOSAL_SENT', 'PROPOSAL_REVISED', 'NEGOTIATION_NOTE', 'CLIENT_FEEDBACK', 'OTHER')),
  activity_date TEXT NOT NULL,
  notes TEXT NOT NULL,
  next_action TEXT,
  next_follow_up_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  opportunity_id TEXT UNIQUE,
  name TEXT NOT NULL,
  service_type TEXT,
  contract_value INTEGER NOT NULL CHECK (contract_value >= 0),
  pic_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'KICKOFF', 'IN_PROGRESS', 'WAITING_CLIENT', 'INTERNAL_REVIEW', 'REVISION', 'COMPLETED', 'CLOSED', 'CANCELLED')),
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_date TEXT,
  deadline TEXT,
  completed_at TEXT,
  closed_at TEXT,
  next_action TEXT,
  next_follow_up_date TEXT,
  blocker_notes TEXT,
  cancelled_at TEXT,
  cancel_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_in_project TEXT NOT NULL CHECK (role_in_project IN ('PIC', 'CONSULTANT', 'FINANCE_SUPPORT', 'ADMIN_SUPPORT', 'REVIEWER', 'OTHER')),
  assigned_at TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE project_activities (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('MEETING', 'CALL', 'WHATSAPP_FOLLOW_UP', 'EMAIL_SENT', 'DOCUMENT_RECEIVED', 'DOCUMENT_REVIEWED', 'REPORT_DRAFTED', 'REPORT_SUBMITTED', 'REVISION_REQUESTED', 'CLIENT_APPROVAL', 'INTERNAL_DISCUSSION', 'PROPOSAL_SENT', 'PROPOSAL_REVISED', 'NEGOTIATION_NOTE', 'CLIENT_FEEDBACK', 'OTHER')),
  activity_date TEXT NOT NULL,
  notes TEXT NOT NULL,
  next_action TEXT,
  next_follow_up_date TEXT,
  progress_snapshot INTEGER CHECK (progress_snapshot IS NULL OR (progress_snapshot >= 0 AND progress_snapshot <= 100)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  termin_number INTEGER CHECK (termin_number IS NULL OR termin_number > 0),
  description TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('PLANNED', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
  sent_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  cancelled_at TEXT,
  cancel_reason TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'CASH', 'GIRO', 'OTHER')),
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'CANCELLED')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  cancelled_at TEXT,
  cancel_reason TEXT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE payables (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  vendor_name TEXT NOT NULL,
  cost_category TEXT NOT NULL CHECK (cost_category IN ('SUBCONTRACTOR', 'TRANSPORT', 'ACCOMMODATION', 'DOCUMENT_PRINTING', 'CERTIFICATION_COST', 'CONSULTANT_FEE', 'OPERATIONAL', 'OTHER')),
  description TEXT,
  bill_date TEXT,
  due_date TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'WAITING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PAID', 'OVERDUE', 'CANCELLED')),
  paid_at TEXT,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('BANK_TRANSFER', 'CASH', 'GIRO', 'OTHER')),
  reference_number TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  cancelled_at TEXT,
  cancel_reason TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  linked_type TEXT NOT NULL CHECK (linked_type IN ('CLIENT', 'OPPORTUNITY', 'OPPORTUNITY_LOG', 'PROJECT', 'PROJECT_ACTIVITY', 'INVOICE', 'PAYMENT', 'PAYABLE')),
  linked_id TEXT NOT NULL,
  attachment_kind TEXT NOT NULL CHECK (attachment_kind IN ('PROPOSAL', 'CONTRACT', 'SPK', 'PO', 'PROJECT_DOCUMENT', 'INVOICE_FILE', 'PAYMENT_PROOF', 'VENDOR_BILL', 'AP_PAYMENT_PROOF', 'OTHER')),
  file_name TEXT NOT NULL,
  file_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 21. Recommended Indexes

```sql
-- users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- clients
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_industry ON clients(industry);

-- client_contacts
CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_name ON client_contacts(name);
CREATE UNIQUE INDEX idx_client_contacts_one_primary
ON client_contacts(client_id)
WHERE is_primary = 1 AND deleted_at IS NULL;

-- opportunities
CREATE INDEX idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX idx_opportunities_pic_user_id ON opportunities(pic_user_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_next_follow_up_date ON opportunities(next_follow_up_date);
CREATE INDEX idx_opportunities_deal_date ON opportunities(deal_date);

-- opportunity_logs
CREATE INDEX idx_opportunity_logs_opportunity_id ON opportunity_logs(opportunity_id);
CREATE INDEX idx_opportunity_logs_user_id ON opportunity_logs(user_id);
CREATE INDEX idx_opportunity_logs_activity_date ON opportunity_logs(activity_date);
CREATE INDEX idx_opportunity_logs_next_follow_up_date ON opportunity_logs(next_follow_up_date);

-- projects
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_pic_user_id ON projects(pic_user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_next_follow_up_date ON projects(next_follow_up_date);
CREATE INDEX idx_projects_opportunity_id ON projects(opportunity_id);

-- project_members
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_is_active ON project_members(is_active);
CREATE UNIQUE INDEX idx_project_members_unique_active
ON project_members(project_id, user_id)
WHERE deleted_at IS NULL;

-- project_activities
CREATE INDEX idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX idx_project_activities_user_id ON project_activities(user_id);
CREATE INDEX idx_project_activities_activity_date ON project_activities(activity_date);
CREATE INDEX idx_project_activities_next_follow_up_date ON project_activities(next_follow_up_date);

-- invoices
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);

-- payments
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_by ON payments(created_by);

-- payables
CREATE INDEX idx_payables_project_id ON payables(project_id);
CREATE INDEX idx_payables_status ON payables(status);
CREATE INDEX idx_payables_due_date ON payables(due_date);
CREATE INDEX idx_payables_bill_date ON payables(bill_date);
CREATE INDEX idx_payables_cost_category ON payables(cost_category);
CREATE INDEX idx_payables_created_by ON payables(created_by);

-- attachments
CREATE INDEX idx_attachments_linked ON attachments(linked_type, linked_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX idx_attachments_kind ON attachments(attachment_kind);
CREATE INDEX idx_attachments_created_at ON attachments(created_at);

-- audit_logs
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 22. Computed Queries

### 22.1 Invoice Paid Amount

```sql
SELECT
  i.id,
  i.amount AS invoice_amount,
  COALESCE(SUM(
    CASE
      WHEN p.status = 'VALID' AND p.deleted_at IS NULL THEN p.amount
      ELSE 0
    END
  ), 0) AS total_paid,
  i.amount - COALESCE(SUM(
    CASE
      WHEN p.status = 'VALID' AND p.deleted_at IS NULL THEN p.amount
      ELSE 0
    END
  ), 0) AS remaining_amount
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
WHERE i.deleted_at IS NULL
GROUP BY i.id;
```

### 22.2 Outstanding AR

```sql
SELECT
  SUM(i.amount) - COALESCE(SUM(valid_payments.total_paid), 0) AS outstanding_ar
FROM invoices i
LEFT JOIN (
  SELECT
    invoice_id,
    SUM(amount) AS total_paid
  FROM payments
  WHERE status = 'VALID'
    AND deleted_at IS NULL
  GROUP BY invoice_id
) valid_payments ON valid_payments.invoice_id = i.id
WHERE i.status != 'CANCELLED'
  AND i.deleted_at IS NULL;
```

### 22.3 Overdue Invoices

```sql
SELECT
  i.*
FROM invoices i
LEFT JOIN (
  SELECT
    invoice_id,
    SUM(amount) AS total_paid
  FROM payments
  WHERE status = 'VALID'
    AND deleted_at IS NULL
  GROUP BY invoice_id
) p ON p.invoice_id = i.id
WHERE i.status != 'CANCELLED'
  AND i.deleted_at IS NULL
  AND i.due_date < date('now')
  AND COALESCE(p.total_paid, 0) < i.amount;
```

### 22.4 Projects Not Updated for More Than 7 Days

```sql
SELECT
  p.*
FROM projects p
LEFT JOIN (
  SELECT
    project_id,
    MAX(activity_date) AS last_activity_date
  FROM project_activities
  WHERE deleted_at IS NULL
  GROUP BY project_id
) a ON a.project_id = p.id
WHERE p.deleted_at IS NULL
  AND p.status NOT IN ('CLOSED', 'CANCELLED')
  AND (
    a.last_activity_date IS NULL
    OR a.last_activity_date < date('now', '-7 day')
  );
```

### 22.5 AP Due This Week

```sql
SELECT
  *
FROM payables
WHERE deleted_at IS NULL
  AND status NOT IN ('PAID', 'CANCELLED')
  AND due_date >= date('now')
  AND due_date <= date('now', '+7 day');
```

---

## 23. Data Integrity Rules

### 23.1 Opportunity to Project

Rule:

```txt
Only opportunity with status WON can be converted to project.
```

Backend must check:

```txt
opportunity.status = WON
opportunity.deal_amount is not null
project with same opportunity_id does not exist
```

### 23.2 Invoice to Project

Rule:

```txt
Invoice must belong to project.
```

Backend must check:

```txt
invoice.project_id exists
invoice.client_id matches project.client_id
```

### 23.3 Payment to Invoice

Rule:

```txt
Payment must belong to invoice.
```

Backend must check:

```txt
payment.invoice_id exists
payment.project_id matches invoice.project_id
payment.client_id matches invoice.client_id
payment.amount > 0
```

### 23.4 Payable to Project

Rule:

```txt
Payable should link to project if it is a project cost.
```

Backend must check:

```txt
if project_id is not null, project must exist
```

### 23.5 Attachment Link

Rule:

```txt
Attachment linked_type and linked_id must point to an existing entity.
```

Because polymorphic FK cannot be enforced by SQLite, backend must validate manually.

---

## 24. Soft Delete Rules

Use `deleted_at` for:

```txt
users
clients
client_contacts
opportunities
opportunity_logs
projects
project_members
project_activities
attachments
```

For finance records:

```txt
invoices
payments
payables
```

Prefer cancellation over deletion.

Recommended:

```txt
Invoice wrong -> status = CANCELLED
Payment wrong -> status = CANCELLED
Payable wrong -> status = CANCELLED
```

Do not physically delete finance rows from the application.

---

## 25. Dashboard Source Fields

Owner dashboard should be computed from these tables:

| Dashboard Metric              | Source                               |
| ----------------------------- | ------------------------------------ |
| Active opportunities          | `opportunities`                      |
| Opportunities in negotiation  | `opportunities.status = NEGOTIATION` |
| Opportunities need follow-up  | `opportunities.next_follow_up_date`  |
| Active projects               | `projects`                           |
| Projects waiting client       | `projects.status = WAITING_CLIENT`   |
| Projects not updated > 7 days | `project_activities`                 |
| Projects near deadline        | `projects.deadline`                  |
| Outstanding AR                | `invoices + payments`                |
| Overdue AR                    | `invoices + payments + due_date`     |
| Unpaid AP                     | `payables`                           |
| AP due this week              | `payables.due_date`                  |
| Recent project updates        | `project_activities`                 |

---

## 26. MVP Seed Data

For first setup, create at least one owner user.

Example:

```txt
email: owner email from Cloudflare Access
name: Owner Ratama
role: OWNER
status: ACTIVE
```

Recommended dummy data for staging:

```txt
3 clients
5 opportunities
3 projects
10 project activities
5 invoices
5 payments
3 payables
```

Do not seed dummy data into production unless explicitly needed.

---

## 27. Tables Not Included in MVP

Do not create these tables in MVP:

```txt
kpi_metrics
kpi_targets
kpi_results
general_ledger
journal_entries
chart_of_accounts
payroll
tax_reports
bank_transactions
client_portal_users
```

Reason:

```txt
The MVP focus is project and finance visibility, not full ERP/accounting/KPI.
```

---

## 28. Future Optional Tables

### 28.1 billing_schedules

Useful later if Ratama wants planned invoice schedule before invoice is actually created.

Possible columns:

```txt
id
project_id
termin_number
description
planned_invoice_date
percentage
amount
status
created_at
updated_at
deleted_at
```

Do not add this in MVP unless needed.

### 28.2 vendors

Useful later if vendor data becomes repetitive.

Current MVP stores vendor name directly in `payables.vendor_name`.

Possible columns:

```txt
id
name
email
phone
address
notes
status
created_at
updated_at
deleted_at
```

Do not add this in MVP unless vendor management becomes necessary.

### 28.3 notifications

Useful later for reminders.

Possible columns:

```txt
id
user_id
entity_type
entity_id
notification_type
title
message
status
created_at
read_at
```

Do not add this in MVP.

---

## 29. Drizzle ORM Implementation Notes

Recommended file structure:

```txt
packages/db/
|-- schema/
|   |-- users.ts
|   |-- clients.ts
|   |-- opportunities.ts
|   |-- projects.ts
|   |-- finance.ts
|   |-- attachments.ts
|   `-- audit-logs.ts
|-- migrations/
`-- index.ts
```

Recommended grouping:

```txt
users.ts:
  users

clients.ts:
  clients
  clientContacts

opportunities.ts:
  opportunities
  opportunityLogs

projects.ts:
  projects
  projectMembers
  projectActivities

finance.ts:
  invoices
  payments
  payables

attachments.ts:
  attachments

audit-logs.ts:
  auditLogs
```

Use shared enum constants from:

```txt
packages/shared/constants
```

Use Zod validation from:

```txt
packages/validation
```

---

## 30. Final Schema Decision

The MVP database should include exactly these tables first:

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

This schema is enough to support:

```txt
Client tracking
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
Attachment upload
Owner dashboard
Reports/export
Audit log
```

This schema should not be expanded into KPI/accounting/payroll/tax modules until MVP is stable.


