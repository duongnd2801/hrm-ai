-- V12__fix_missing_user_accounts.sql — Fix the discrepancy between employees and users
-- For every employee with user_id NULL, create a user and link them.

-- 1. Insert missing users using the same password logic as EmployeeService (Emp@123)
-- Password Bcrypt: $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06
INSERT INTO users (email, password, role, created_at)
SELECT email, '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'EMPLOYEE', NOW()
FROM employees
WHERE user_id IS NULL
ON CONFLICT (email) DO NOTHING;

-- 2. Map existing (or newly created) users back to employees that were NULL
UPDATE employees e
SET user_id = u.id
FROM users u
WHERE e.email = u.email AND e.user_id IS NULL;
