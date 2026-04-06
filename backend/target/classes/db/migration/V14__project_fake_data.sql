-- V14__project_fake_data.sql
-- Thêm dữ liệu dự án mẫu (Fake Data)
INSERT INTO projects (id, name, code, color, description, start_date, end_date, status, type) VALUES
(gen_random_uuid(), 'Phát triển Hệ thống HRM 2.0', 'HRM_2026', '#a78bfa', 'Dự án nội bộ nâng cấp hệ thống quản trị nhân sự', '2025-01-01', '2025-12-31', 'OVERDUE', 'PRODUCT_DEVELOPMENT'),
(gen_random_uuid(), 'Website TMĐT Khách Hàng A', 'ECOMM_A', '#ddd6fe', 'Khách hàng A - Nhật Bản', '2025-01-01', '2025-12-31', 'OVERDUE', 'OUTSOURCING'),
(gen_random_uuid(), 'App Mobile Giao Hàng Siêu Tốc', 'DELIVERY_APP', '#2dd4bf', 'App cross-platform bằng React Native', '2025-07-01', NULL, 'ACTIVE', 'PRODUCT_DEVELOPMENT'),
(gen_random_uuid(), 'Core Banking Extension', 'CORE_BANK', '#fb7185', 'Nâng cấp core module', '2025-07-01', NULL, 'ACTIVE', 'MAINTENANCE'),
(gen_random_uuid(), 'Hệ thống Quản lý Kho Y Tế', 'MED_WARE', '#fcd34d', 'Phần mềm quản lý chuỗi cung ứng', '2025-07-01', NULL, 'ACTIVE', 'PRODUCT_DEVELOPMENT'),
(gen_random_uuid(), 'Công cụ Auto QA', 'AUTO_QA', '#5eead4', 'Automation tool cho Tester', '2025-09-01', NULL, 'ACTIVE', 'INTERNAL'),
(gen_random_uuid(), 'Ví Điện Tử X-Pay', 'XPAY_2025', '#d6d3d1', 'Tích hợp thanh toán QR', '2025-10-14', '2026-12-31', 'ACTIVE', 'PRODUCT_DEVELOPMENT'),
(gen_random_uuid(), 'CRM Khách Hàng Bán Lẻ', 'RETAIL_CRM', '#86efac', 'Dự án cho đối tác nước ngoài', '2025-11-01', NULL, 'ACTIVE', 'OUTSOURCING'),
(gen_random_uuid(), 'AI Chatbot Trợ Lý Mua Sắm', 'AI_BOT', '#fef08a', 'Tích hợp LLM vào ứng dụng chatbot', '2026-01-01', NULL, 'ACTIVE', 'PRODUCT_DEVELOPMENT'),
(gen_random_uuid(), 'Nền Tảng Đặt Vé Máy Bay', 'TICKET_PLAT', '#93c5fd', 'Website bán vé B2C', '2026-02-01', '2026-12-31', 'ACTIVE', 'PRODUCT_DEVELOPMENT');

-- Gán ngẫu nhiên một vài nhân viên vào các dự án với nhiều tài khoản thật có trong DB (từ screenshot)
DO $$
DECLARE
    proj_hrm    UUID;
    proj_app    UUID;
    proj_ai     UUID;
    
    emp_admin   UUID;
    emp_hr      UUID;
    emp_manager UUID;
    emp_b       UUID;
    emp_c       UUID;
    emp_d       UUID;
    emp_e       UUID;
    emp_r       UUID;
    emp_excel1  UUID;
    emp_excel2  UUID;
BEGIN
    -- Lấy ID một vài dự án để insert
    SELECT id INTO proj_hrm FROM projects WHERE code = 'HRM_2026' LIMIT 1;
    SELECT id INTO proj_app FROM projects WHERE code = 'DELIVERY_APP' LIMIT 1;
    SELECT id INTO proj_ai  FROM projects WHERE code = 'AI_BOT' LIMIT 1;

    -- Lấy Employee ID tiêu biểu dựa trên screenshot
    SELECT id INTO emp_admin   FROM employees WHERE email = 'admin@company.com' LIMIT 1;
    SELECT id INTO emp_hr      FROM employees WHERE email = 'hr@company.com' LIMIT 1;
    SELECT id INTO emp_manager FROM employees WHERE email = 'manager@company.com' LIMIT 1;
    
    SELECT id INTO emp_b FROM employees WHERE email = 'bnv@gmail.com' LIMIT 1;
    SELECT id INTO emp_c FROM employees WHERE email = 'cnv@gmail.com' LIMIT 1;
    SELECT id INTO emp_d FROM employees WHERE email = 'dnv@gmail.com' LIMIT 1;
    SELECT id INTO emp_e FROM employees WHERE email = 'env@gmail.com' LIMIT 1;
    SELECT id INTO emp_r FROM employees WHERE email = 'rnv@gmail.com' LIMIT 1;
    SELECT id INTO emp_excel1 FROM employees WHERE email = 'excel1@company.com' LIMIT 1;
    SELECT id INTO emp_excel2 FROM employees WHERE email = 'excel2@company.com' LIMIT 1;

    -- Gán vô dự án Phát triển Hệ thống HRM 2.0 (Overdue, dự án nội bộ team to)
    IF emp_manager IS NOT NULL THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_hrm, emp_manager, 'PM', '2025-01-01'); END IF;
    IF emp_admin IS NOT NULL   THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_hrm, emp_admin, 'BA', '2025-01-01'); END IF;
    IF emp_b IS NOT NULL       THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_hrm, emp_b, 'DEV', '2025-01-05'); END IF;
    IF emp_c IS NOT NULL       THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_hrm, emp_c, 'DEV', '2025-01-05'); END IF;
    IF emp_r IS NOT NULL       THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_hrm, emp_r, 'QA', '2025-01-10'); END IF;
    IF emp_excel1 IS NOT NULL  THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_hrm, emp_excel1, 'TESTER', '2025-01-15'); END IF;

    -- Gán vô dự án App Mobile Giao Hàng Siêu Tốc (Dự án cross-functional)
    IF emp_admin IS NOT NULL THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_app, emp_admin, 'PM', '2025-07-01'); END IF;
    IF emp_d IS NOT NULL     THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_app, emp_d, 'DEV', '2025-07-05'); END IF;
    IF emp_e IS NOT NULL     THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_app, emp_e, 'DEV', '2025-07-05'); END IF;
    IF emp_excel2 IS NOT NULL THEN INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_app, emp_excel2, 'TESTER', '2025-07-10'); END IF;

    -- Gán vô dự án AI Chatbot
    IF emp_hr IS NOT NULL THEN  INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_ai, emp_hr, 'PM', '2026-01-01'); END IF;
    IF emp_c IS NOT NULL  THEN  INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_ai, emp_c, 'BA', '2026-01-05'); END IF;
    IF emp_b IS NOT NULL  THEN  INSERT INTO project_members (project_id, employee_id, role, joined_at) VALUES (proj_ai, emp_b, 'QA', '2026-01-15'); END IF;

END $$;
