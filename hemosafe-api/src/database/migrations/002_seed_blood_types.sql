-- =============================================================================
-- HEMOSAFE — Migration 002: Seed reference data + admin user
-- =============================================================================

-- Seed national regions (Algeria example — adapt to target country)
INSERT INTO regions (code, name) VALUES
  ('DZ-01', 'Adrar'),
  ('DZ-16', 'Alger'),
  ('DZ-31', 'Oran'),
  ('DZ-25', 'Constantine')
ON CONFLICT (code) DO NOTHING;

-- Seed one national admin user (password must be changed immediately)
-- password_hash below = bcrypt('ChangeMe!2025', 12)
INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (
  'admin@hemosafe.gov',
  '$2b$12$PLACEHOLDER_HASH_CHANGE_IMMEDIATELY',
  'ADMIN',
  'System',
  'Administrator'
) ON CONFLICT (email) DO NOTHING;
