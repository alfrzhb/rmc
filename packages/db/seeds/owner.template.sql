INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'usr_owner_001',
  '<OWNER_EMAIL>',
  'Owner Ratama',
  'OWNER',
  'ACTIVE',
  datetime('now'),
  datetime('now')
);
