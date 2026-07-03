CREATE TABLE document_links (
  id TEXT PRIMARY KEY,
  linked_type TEXT NOT NULL CHECK (linked_type IN ('CLIENT', 'OPPORTUNITY', 'OPPORTUNITY_LOG', 'PROJECT', 'PROJECT_ACTIVITY', 'INVOICE', 'PAYMENT', 'PAYABLE')),
  linked_id TEXT NOT NULL,
  document_kind TEXT NOT NULL CHECK (document_kind IN ('PROPOSAL', 'CONTRACT', 'SPK', 'PO', 'PROJECT_DOCUMENT', 'INVOICE_FILE', 'PAYMENT_PROOF', 'VENDOR_BILL', 'AP_PAYMENT_PROOF', 'OTHER')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT CHECK (provider IS NULL OR provider IN ('GOOGLE_DRIVE', 'ONEDRIVE', 'DROPBOX', 'EXTERNAL_URL', 'OTHER')),
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_document_links_linked ON document_links(linked_type, linked_id);
CREATE INDEX idx_document_links_created_by ON document_links(created_by);
CREATE INDEX idx_document_links_kind ON document_links(document_kind);
CREATE INDEX idx_document_links_provider ON document_links(provider);
CREATE INDEX idx_document_links_created_at ON document_links(created_at);
