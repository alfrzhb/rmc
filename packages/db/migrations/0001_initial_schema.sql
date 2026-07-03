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

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_industry ON clients(industry);

CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_name ON client_contacts(name);
CREATE UNIQUE INDEX idx_client_contacts_one_primary
ON client_contacts(client_id)
WHERE is_primary = 1 AND deleted_at IS NULL;

CREATE INDEX idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX idx_opportunities_pic_user_id ON opportunities(pic_user_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_next_follow_up_date ON opportunities(next_follow_up_date);
CREATE INDEX idx_opportunities_deal_date ON opportunities(deal_date);

CREATE INDEX idx_opportunity_logs_opportunity_id ON opportunity_logs(opportunity_id);
CREATE INDEX idx_opportunity_logs_user_id ON opportunity_logs(user_id);
CREATE INDEX idx_opportunity_logs_activity_date ON opportunity_logs(activity_date);
CREATE INDEX idx_opportunity_logs_next_follow_up_date ON opportunity_logs(next_follow_up_date);

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_pic_user_id ON projects(pic_user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_next_follow_up_date ON projects(next_follow_up_date);
CREATE INDEX idx_projects_opportunity_id ON projects(opportunity_id);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_is_active ON project_members(is_active);
CREATE UNIQUE INDEX idx_project_members_unique_active
ON project_members(project_id, user_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX idx_project_activities_user_id ON project_activities(user_id);
CREATE INDEX idx_project_activities_activity_date ON project_activities(activity_date);
CREATE INDEX idx_project_activities_next_follow_up_date ON project_activities(next_follow_up_date);

CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_by ON payments(created_by);

CREATE INDEX idx_payables_project_id ON payables(project_id);
CREATE INDEX idx_payables_status ON payables(status);
CREATE INDEX idx_payables_due_date ON payables(due_date);
CREATE INDEX idx_payables_bill_date ON payables(bill_date);
CREATE INDEX idx_payables_cost_category ON payables(cost_category);
CREATE INDEX idx_payables_created_by ON payables(created_by);

CREATE INDEX idx_attachments_linked ON attachments(linked_type, linked_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX idx_attachments_kind ON attachments(attachment_kind);
CREATE INDEX idx_attachments_created_at ON attachments(created_at);

CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
