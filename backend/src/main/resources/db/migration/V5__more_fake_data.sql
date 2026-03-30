-- V5__more_fake_data.sql - Additional fake data for testing features

DO $$
DECLARE
    -- known Employee IDs from V4
    e_admin_id UUID := 'e0000000-0000-0000-0000-000000000001';
    e_hr_id    UUID := 'e0000000-0000-0000-0000-000000000002';
    e_mng_id   UUID := 'e0000000-0000-0000-0000-000000000003';
    e_staff_id UUID := 'e0000000-0000-0000-0000-000000000004';
    
    curr_date DATE;
    att_late_hr_id UUID;
    att_insuf_hr_id UUID;
    att_late_mng_id UUID;
    hr_user UUID;
BEGIN

    -- Get corresponding User ID for HR to use as reviewer
    SELECT user_id INTO hr_user FROM employees WHERE id = e_hr_id;

    -- 1. Attendances for Manager (Perfect Attendance for Feb, Mar 2026)
    FOR m IN 2..3 LOOP
        FOR d IN 1..31 LOOP
            BEGIN
                curr_date := ('2026-' || LPAD(m::text, 2, '0') || '-' || LPAD(d::text, 2, '0'))::DATE;
                -- Skip Sundays (0)
                IF EXTRACT(DOW FROM curr_date) NOT IN (0) THEN
                   INSERT INTO attendances (employee_id, date, check_in, check_out, total_hours, status)
                   VALUES (
                       e_mng_id,
                       curr_date,
                       (curr_date || ' 08:30:00')::TIMESTAMP,
                       (curr_date || ' 17:40:00')::TIMESTAMP,
                       8.16,
                       'ON_TIME'
                   )
                   ON CONFLICT (employee_id, date) DO NOTHING;
                END IF;
            EXCEPTION WHEN datetime_field_overflow THEN
                -- Safe ignore for invalid dates like Feb 30, 31
            END;
        END LOOP;
    END LOOP;

    -- 2. Attendances for HR (Missing days, late, early exit in Feb, Mar 2026)
    FOR m IN 2..3 LOOP
        FOR d IN 1..31 LOOP
            BEGIN
                curr_date := ('2026-' || LPAD(m::text, 2, '0') || '-' || LPAD(d::text, 2, '0'))::DATE;
                IF EXTRACT(DOW FROM curr_date) NOT IN (0) THEN
                    -- HR is late on Mondays
                    IF EXTRACT(DOW FROM curr_date) = 1 THEN
                       INSERT INTO attendances (employee_id, date, check_in, check_out, total_hours, status)
                       VALUES (
                           e_hr_id,
                           curr_date,
                           (curr_date || ' 09:45:00')::TIMESTAMP,
                           (curr_date || ' 18:00:00')::TIMESTAMP,
                           7.25,
                           'LATE'
                       ) ON CONFLICT (employee_id, date) DO NOTHING;
                    -- HR lacks hours on Fridays
                    ELSIF EXTRACT(DOW FROM curr_date) = 5 THEN
                       INSERT INTO attendances (employee_id, date, check_in, check_out, total_hours, status)
                       VALUES (
                           e_hr_id,
                           curr_date,
                           (curr_date || ' 09:00:00')::TIMESTAMP,
                           (curr_date || ' 15:30:00')::TIMESTAMP,
                           5.5,
                           'INSUFFICIENT'
                       ) ON CONFLICT (employee_id, date) DO NOTHING;
                    -- HR was completely absent on the 10th
                    ELSIF d = 10 THEN
                       INSERT INTO attendances (employee_id, date, check_in, check_out, total_hours, status)
                       VALUES (
                           e_hr_id,
                           curr_date,
                           NULL,
                           NULL,
                           0,
                           'ABSENT'
                       ) ON CONFLICT (employee_id, date) DO NOTHING;
                    -- Normal on other days
                    ELSE
                       INSERT INTO attendances (employee_id, date, check_in, check_out, total_hours, status)
                       VALUES (
                           e_hr_id,
                           curr_date,
                           (curr_date || ' 08:50:00')::TIMESTAMP,
                           (curr_date || ' 18:00:00')::TIMESTAMP,
                           8.16,
                           'ON_TIME'
                       ) ON CONFLICT (employee_id, date) DO NOTHING;
                    END IF;
                END IF;
            EXCEPTION WHEN datetime_field_overflow THEN
                -- Safe ignore for invalid dates
            END;
        END LOOP;
    END LOOP;

    -- 3. Prepare some Apologies for the problematic attendance records of HR
    SELECT id INTO att_late_hr_id FROM attendances WHERE employee_id = e_hr_id AND status = 'LATE' LIMIT 1;
    SELECT id INTO att_insuf_hr_id FROM attendances WHERE employee_id = e_hr_id AND status = 'INSUFFICIENT' LIMIT 1;

    IF att_late_hr_id IS NOT NULL THEN
        -- Approved Apology
        INSERT INTO apologies (employee_id, attendance_id, type, reason, status, reviewed_by)
        VALUES (e_hr_id, att_late_hr_id, 'LATE', 'Kẹt xe nghiêm trọng khu vực ngã tư.', 'APPROVED', hr_user) 
        ON CONFLICT (attendance_id) DO NOTHING;
    END IF;

    IF att_insuf_hr_id IS NOT NULL THEN
        -- Pending Apology
        INSERT INTO apologies (employee_id, attendance_id, type, reason, status)
        VALUES (e_hr_id, att_insuf_hr_id, 'INSUFFICIENT_HOURS', 'Sếp gọi đi gặp chốt hợp đồng với đối tác.', 'PENDING') 
        ON CONFLICT (attendance_id) DO NOTHING;
    END IF;

    -- 4. Create LEAVE requests (vắng, nghỉ phép)
    INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status)
    VALUES (e_mng_id, 'SICK', '2026-03-25', '2026-03-26', 'Xin nghỉ do ốm sốt vi-rút', 'APPROVED') 
    ON CONFLICT DO NOTHING;

    INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status)
    VALUES (e_hr_id, 'UNPAID', '2026-03-10', '2026-03-10', 'Xin nghỉ có việc riêng gia đình không lương', 'APPROVED') 
    ON CONFLICT DO NOTHING;

    INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason, status)
    VALUES (e_admin_id, 'ANNUAL', '2026-04-01', '2026-04-05', 'Nghỉ bù thường niên đi du lịch', 'PENDING') 
    ON CONFLICT DO NOTHING;

    -- 5. Create OT requests
    INSERT INTO ot_requests (employee_id, date, hours, reason, status, reviewed_by)
    VALUES (e_mng_id, '2026-03-15', 3.5, 'OT fix bug critical lúc nửa đêm cho dự án', 'APPROVED', hr_user) 
    ON CONFLICT DO NOTHING;

    INSERT INTO ot_requests (employee_id, date, hours, reason, status)
    VALUES (e_hr_id, '2026-03-22', 2.0, 'Kiểm tra bảng lương nhân viên cuối tháng', 'PENDING') 
    ON CONFLICT DO NOTHING;

    INSERT INTO ot_requests (employee_id, date, hours, reason, status)
    VALUES (e_staff_id, '2026-03-14', 4.0, 'Trực deploy dự án lên môi trường live', 'REJECTED') 
    ON CONFLICT DO NOTHING;
    
    INSERT INTO ot_requests (employee_id, date, hours, reason, status, reviewed_by)
    VALUES (e_admin_id, '2026-02-15', 5.0, 'Setup cụm server mới cho CSDL', 'APPROVED', hr_user) 
    ON CONFLICT DO NOTHING;

END $$;
