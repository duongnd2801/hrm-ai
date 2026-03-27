-- V4__fake_data.sql - Final fix for foreign key mapping

DO $$
DECLARE
    -- User IDs (references from users table)
    u_admin_id UUID;
    u_hr_id UUID;
    u_manager_id UUID;
    u_staff_id UUID;
    
    -- Dept IDs
    d_dev1_id UUID;
    d_dev2_id UUID;
    d_bo_id UUID;
    
    -- Position IDs
    p_mng_id UUID;
    p_head_id UUID;
    p_pm_id UUID;
    p_dev_id UUID;
    p_test_id UUID;

    -- Employee IDs (Primary Keys in employees table)
    e_admin_id UUID := 'e0000000-0000-0000-0000-000000000001';
    e_hr_id    UUID := 'e0000000-0000-0000-0000-000000000002';
    e_mng_id   UUID := 'e0000000-0000-0000-0000-000000000003';
    e_staff_id UUID := 'e0000000-0000-0000-0000-000000000004';
    
    -- Attendances
    att_late_id UUID;
    att_insuf_id UUID;

    curr_date DATE;
BEGIN
    -- 1. Maps/Ensure Users
    INSERT INTO users (email, password, role) VALUES ('admin@company.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'ADMIN') ON CONFLICT (email) DO NOTHING;
    SELECT id INTO u_admin_id FROM users WHERE email = 'admin@company.com';

    INSERT INTO users (email, password, role) VALUES ('hr@company.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'HR') ON CONFLICT (email) DO NOTHING;
    SELECT id INTO u_hr_id FROM users WHERE email = 'hr@company.com';

    INSERT INTO users (email, password, role) VALUES ('manager@company.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'MANAGER') ON CONFLICT (email) DO NOTHING;
    SELECT id INTO u_manager_id FROM users WHERE email = 'manager@company.com';

    INSERT INTO users (email, password, role) VALUES ('employee@company.com', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'EMPLOYEE') ON CONFLICT (email) DO NOTHING;
    SELECT id INTO u_staff_id FROM users WHERE email = 'employee@company.com';

    -- 2. Departments
    INSERT INTO departments (name) VALUES ('DEV1') ON CONFLICT (name) DO NOTHING;
    SELECT id INTO d_dev1_id FROM departments WHERE name = 'DEV1';
    INSERT INTO departments (name) VALUES ('BO') ON CONFLICT (name) DO NOTHING;
    SELECT id INTO d_bo_id FROM departments WHERE name = 'BO';

    -- 3. Positions
    INSERT INTO positions (name, description, is_locked) VALUES ('MNG', 'Manager', TRUE) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO p_mng_id FROM positions WHERE name = 'MNG';
    INSERT INTO positions (name, description, is_locked) VALUES ('HEAD', 'Head of Department', TRUE) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO p_head_id FROM positions WHERE name = 'HEAD';
    INSERT INTO positions (name, description, is_locked) VALUES ('DEV', 'Developer', FALSE) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO p_dev_id FROM positions WHERE name = 'DEV';

    -- 4. Employees
    INSERT INTO employees (id, user_id, full_name, email, status, contract_type, start_date, department_id, position_id, base_salary)
    VALUES (e_admin_id, u_admin_id, 'Nguyen Van Admin', 'admin@company.com', 'ACTIVE', 'FULL_TIME', '2020-01-01', d_bo_id, p_mng_id, 50000000)
    ON CONFLICT (email) DO NOTHING;
    INSERT INTO employees (id, user_id, full_name, email, status, contract_type, start_date, department_id, position_id, base_salary)
    VALUES (e_hr_id, u_hr_id, 'Tran Thi HR', 'hr@company.com', 'ACTIVE', 'FULL_TIME', '2021-06-01', d_bo_id, p_head_id, 35000000)
    ON CONFLICT (email) DO NOTHING;
    INSERT INTO employees (id, user_id, full_name, email, status, contract_type, start_date, department_id, position_id, base_salary)
    VALUES (e_mng_id, u_manager_id, 'Le Van Manager', 'manager@company.com', 'ACTIVE', 'FULL_TIME', '2022-01-01', d_dev1_id, p_mng_id, 45000000)
    ON CONFLICT (email) DO NOTHING;
    INSERT INTO employees (id, user_id, full_name, email, status, contract_type, start_date, department_id, position_id, base_salary)
    VALUES (e_staff_id, u_staff_id, 'Pham Minh Staff', 'employee@company.com', 'ACTIVE', 'CONTRACT', '2023-01-01', d_dev1_id, p_dev_id, 25000000)
    ON CONFLICT (email) DO NOTHING;

    -- 5. Attendance
    FOR i IN 1..26 LOOP
        curr_date := ('2026-03-' || LPAD(i::text, 2, '0'))::DATE;
        IF EXTRACT(DOW FROM curr_date) NOT IN (0, 6) THEN
           INSERT INTO attendances (employee_id, date, check_in, check_out, total_hours, status)
           VALUES (e_staff_id, curr_date, (curr_date || ' 08:30:00')::TIMESTAMP, (curr_date || ' 17:40:00')::TIMESTAMP, 8.1, 'ON_TIME')
           ON CONFLICT (employee_id, date) DO NOTHING;
        END IF;
    END LOOP;

    -- Clear today (27) to allow manual check-in test if needed
    DELETE FROM attendances WHERE date = '2026-03-27' AND employee_id = e_staff_id;

    -- Specific issue days
    INSERT INTO attendances (employee_id, date, check_in, check_out, status, total_hours)
    VALUES (e_staff_id, '2026-03-20', '2026-03-20 09:30:00', '2026-03-20 18:30:00', 'LATE', 8.0)
    ON CONFLICT (employee_id, date) DO UPDATE SET status = 'LATE', total_hours = 8.0;
    SELECT id INTO att_late_id FROM attendances WHERE employee_id = e_staff_id AND date = '2026-03-20';

    INSERT INTO attendances (employee_id, date, check_in, check_out, status, total_hours)
    VALUES (e_staff_id, '2026-03-12', '2026-03-12 11:12:00', '2026-03-12 17:54:00', 'INSUFFICIENT', 5.7)
    ON CONFLICT (employee_id, date) DO UPDATE SET status = 'INSUFFICIENT', total_hours = 5.7;
    SELECT id INTO att_insuf_id FROM attendances WHERE employee_id = e_staff_id AND date = '2026-03-12';

    -- 6. APOLOGIES, LEAVE, OT (Using employee_id consistently)
    INSERT INTO apologies (employee_id, attendance_id, type, reason, status)
    VALUES (e_staff_id, att_late_id, 'LATE', 'Ket xe nghiem trong.', 'PENDING') ON CONFLICT DO NOTHING;
    INSERT INTO apologies (employee_id, attendance_id, type, reason, status)
    VALUES (e_staff_id, att_insuf_id, 'INSUFFICIENT_HOURS', 'Di kham benh.', 'PENDING') ON CONFLICT DO NOTHING;

    INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status)
    VALUES (e_staff_id, 'ANNUAL', '2026-04-10', '2026-04-12', 'Du lich gia dinh.', 'PENDING') ON CONFLICT DO NOTHING;
    INSERT INTO ot_requests (employee_id, date, hours, reason, status)
    VALUES (e_staff_id, '2026-03-28', 4.0, 'Bao cao quy I.', 'PENDING') ON CONFLICT DO NOTHING;

END $$;
