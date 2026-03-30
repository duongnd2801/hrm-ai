-- V6__mass_fake_data.sql - Mass Generate Fake Data for Payroll Testing

DO $$
DECLARE
    i INT;
    random_user_uuid  UUID;
    random_emp_uuid   UUID;
    m INT;
    d INT;
    curr_date DATE;
    rand_status VARCHAR; -- using VARCHAR instead of enum directly for casting safety
    rand_checkin TIMESTAMP;
    rand_checkout TIMESTAMP;
    rand_val FLOAT;
    rand_dept UUID;
    rand_pos UUID;
    r_salary BIGINT;
    r_name VARCHAR;
    r_email VARCHAR;
    is_inserted BOOLEAN;
BEGIN
    FOR i IN 1..10 LOOP
        random_user_uuid := gen_random_uuid();
        random_emp_uuid := gen_random_uuid();
        r_name := 'Nhân Viên Ảo Số ' || i;
        r_email := 'test_mass_emp_' || i || '@company.com';
        r_salary := (FLOOR(RANDOM() * 30 + 10) * 1000000)::BIGINT; -- 10M to 40M VNĐ

        -- Picks a random department from existing ones
        SELECT id INTO rand_dept FROM departments ORDER BY RANDOM() LIMIT 1;
        -- Picks a random position from existing ones
        SELECT id INTO rand_pos FROM positions ORDER BY RANDOM() LIMIT 1;

        is_inserted := FALSE;

        -- Attempt to insert User
        BEGIN
            INSERT INTO users (id, email, password, role)
            VALUES (random_user_uuid, r_email, '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07IxS17SQJXPByhw06', 'EMPLOYEE')
            ON CONFLICT (email) DO NOTHING;
            
            -- If inserted, we flag as true
            -- In postgres, DO NOTHING doesn't throw, but we can check if it exists:
            IF EXISTS (SELECT 1 FROM users WHERE id = random_user_uuid) THEN
                is_inserted := TRUE;
            END IF;
        END;

        IF is_inserted THEN
            -- Insert Employee
            INSERT INTO employees (id, user_id, full_name, email, status, contract_type, start_date, department_id, position_id, base_salary)
            VALUES (random_emp_uuid, random_user_uuid, r_name, r_email, 'ACTIVE', 'FULL_TIME', '2025-01-01', rand_dept, rand_pos, r_salary)
            ON CONFLICT (email) DO NOTHING;

            -- Generate Attendances for Feb and Mar 2026
            FOR m IN 2..3 LOOP
                FOR d IN 1..31 LOOP
                    BEGIN
                        curr_date := ('2026-' || LPAD(m::text, 2, '0') || '-' || LPAD(d::text, 2, '0'))::DATE;

                        -- Skip Sundays (0=Sunday in PostgreSQL EXTRACT DOW)
                        IF EXTRACT(DOW FROM curr_date) <> 0 THEN
                            rand_val := RANDOM();
                            IF rand_val < 0.7 THEN
                                -- 70% ON_TIME (08:30 - 18:00) -> 8.5 total inside office, -1 lunch = 7.5 (Wait, 8:30 to 18:00 is 9.5 hours, minus 1 is 8.5)
                                rand_status := 'ON_TIME';
                                rand_checkin := (curr_date || ' 08:30:00')::TIMESTAMP;
                                rand_checkout := (curr_date || ' 18:00:00')::TIMESTAMP;
                            ELSIF rand_val < 0.85 THEN
                                -- 15% LATE (09:45 - 18:00) 
                                rand_status := 'LATE';
                                rand_checkin := (curr_date || ' 09:45:00')::TIMESTAMP;
                                rand_checkout := (curr_date || ' 18:00:00')::TIMESTAMP;
                            ELSIF rand_val < 0.95 THEN
                                -- 10% INSUFFICIENT (08:30 - 15:30) 
                                rand_status := 'INSUFFICIENT';
                                rand_checkin := (curr_date || ' 08:30:00')::TIMESTAMP;
                                rand_checkout := (curr_date || ' 15:30:00')::TIMESTAMP;
                            ELSE
                                -- 5% ABSENT
                                rand_status := 'ABSENT';
                                rand_checkin := NULL;
                                rand_checkout := NULL;
                            END IF;

                            INSERT INTO attendances (employee_id, date, check_in, check_out, total_hours, status)
                            VALUES (
                                random_emp_uuid,
                                curr_date,
                                rand_checkin,
                                rand_checkout,
                                CASE WHEN rand_checkin IS NULL THEN 0 ELSE 
                                    (EXTRACT(EPOCH FROM (rand_checkout - rand_checkin)) / 3600) - 1.0
                                END,
                                rand_status::attendance_status
                            ) ON CONFLICT (employee_id, date) DO NOTHING;
                        END IF;
                    EXCEPTION WHEN datetime_field_overflow THEN
                        -- Ignore invalid dates like Feb 30, 31
                    END;
                END LOOP;
            END LOOP;
            
        END IF;

    END LOOP;
END $$;
