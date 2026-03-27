-- V2__seed.sql — Reference and Core User data

-- Default company config
INSERT INTO company_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- Default departments
INSERT INTO departments (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'DEV1'),
  ('11111111-1111-1111-1111-111111111112', 'DEV2'),
  ('11111111-1111-1111-1111-111111111113', 'BO')
ON CONFLICT (name) DO NOTHING;

-- Default positions
INSERT INTO positions (id, name, description, is_locked) VALUES
  ('22222222-2222-2222-2222-222222222221', 'MNG',  'Manager',              TRUE),
  ('22222222-2222-2222-2222-222222222222', 'HEAD', 'Head of Department',   TRUE),
  ('22222222-2222-2222-2222-222222222223', 'PM',   'Project Manager',      FALSE),
  ('22222222-2222-2222-2222-222222222224', 'DEV',  'Developer',            FALSE),
  ('22222222-2222-2222-2222-222222222225', 'TEST', 'Tester / QA',          FALSE)
ON CONFLICT (name) DO NOTHING;

-- Seed Users (Password is 123456)
-- Bcrypt: $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06
INSERT INTO users (id, email, password, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@company.com',    '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'ADMIN'),
  ('a0000000-0000-0000-0000-000000000002', 'hr@company.com',       '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'HR'),
  ('a0000000-0000-0000-0000-000000000003', 'manager@company.com',  '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'MANAGER'),
  ('a0000000-0000-0000-0000-000000000004', 'employee@company.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'EMPLOYEE')
ON CONFLICT (email) DO NOTHING;
