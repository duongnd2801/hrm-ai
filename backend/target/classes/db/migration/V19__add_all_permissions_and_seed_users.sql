-- V19__add_all_permissions_and_seed_users.sql
-- Add comprehensive permissions cho tất cả modules + seed test ADMIN user

-- ADD PERMISSIONS FOR LEAVE
INSERT INTO permissions (name, code, module) VALUES 
('Xem đơn nghỉ', 'LEAVE_VIEW', 'LEAVE'),
('Tạo đơn nghỉ', 'LEAVE_CREATE', 'LEAVE'),
('Duyệt đơn nghỉ', 'LEAVE_APPROVE', 'LEAVE'),
('Xóa đơn nghỉ', 'LEAVE_DELETE', 'LEAVE')
ON CONFLICT (code) DO NOTHING;

-- ADD PERMISSIONS FOR USERS
INSERT INTO permissions (name, code, module) VALUES 
('Xem người dùng', 'USER_VIEW', 'USER'),
('Tạo người dùng', 'USER_CREATE', 'USER'),
('Sửa người dùng', 'USER_UPDATE', 'USER'),
('Xóa người dùng', 'USER_DELETE', 'USER')
ON CONFLICT (code) DO NOTHING;

-- ADD PERMISSIONS FOR EMPLOYEES
INSERT INTO permissions (name, code, module) VALUES 
('Xem nhân viên', 'EMP_VIEW', 'EMPLOYEE'),
('Tạo nhân viên', 'EMP_CREATE', 'EMPLOYEE'),
('Sửa nhân viên', 'EMP_UPDATE', 'EMPLOYEE'),
('Xóa nhân viên', 'EMP_DELETE', 'EMPLOYEE'),
('Import nhân viên', 'EMP_IMPORT', 'EMPLOYEE'),
('Export nhân viên', 'EMP_EXPORT', 'EMPLOYEE')
ON CONFLICT (code) DO NOTHING;

-- ADD PERMISSIONS FOR ATTENDANCE
INSERT INTO permissions (name, code, module) VALUES 
('Xem chấm công', 'ATT_VIEW', 'ATTENDANCE'),
('Check-in/out', 'ATT_CHECKIN', 'ATTENDANCE'),
('Xem chấm công team', 'ATT_TEAM_VIEW', 'ATTENDANCE'),
('Duyệt chấm công', 'ATT_APPROVE', 'ATTENDANCE'),
('Import chấm công', 'ATT_IMPORT', 'ATTENDANCE')
ON CONFLICT (code) DO NOTHING;

-- ADD PERMISSIONS FOR APOLOGIES (XIN THA TỘI)
INSERT INTO permissions (name, code, module) VALUES 
('Xem đơn xin tha tội', 'APOLOGY_VIEW', 'APOLOGY'),
('Gửi đơn xin tha tội', 'APOLOGY_CREATE', 'APOLOGY'),
('Duyệt đơn xin tha tội', 'APOLOGY_APPROVE', 'APOLOGY')
ON CONFLICT (code) DO NOTHING;

-- ADD PERMISSIONS FOR PAYROLL
INSERT INTO permissions (name, code, module) VALUES 
('Xem lương', 'PAY_VIEW', 'PAYROLL'),
('Tính lương', 'PAY_CALC', 'PAYROLL'),
('Duyệt lương', 'PAY_APPROVE', 'PAYROLL')
ON CONFLICT (code) DO NOTHING;

-- ADD PERMISSIONS FOR PROJECTS
INSERT INTO permissions (name, code, module) VALUES 
('Xem dự án', 'PRJ_VIEW', 'PROJECT'),
('Tạo dự án', 'PRJ_CREATE', 'PROJECT'),
('Sửa dự án', 'PRJ_UPDATE', 'PROJECT'),
('Xóa dự án', 'PRJ_DELETE', 'PROJECT')
ON CONFLICT (code) DO NOTHING;

-- ASSIGN ALL PERMISSIONS TO ADMIN ROLE
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id 
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ASSIGN BASIC PERMISSIONS TO EMPLOYEE ROLE (self-service)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'EMPLOYEE'),
    id
FROM permissions
WHERE code IN (
    'EMP_VIEW',                                    -- Xem thông tin bản thân
    'LEAVE_CREATE', 'LEAVE_VIEW',                 -- Đăng ký & xem đơn nghỉ
    'ATT_CHECKIN', 'ATT_VIEW',                    -- Check-in & xem chấm công
    'PAY_VIEW',                                   -- Xem lương
    'APOLOGY_CREATE', 'APOLOGY_VIEW',            -- Gửi & xem đơn xin tha tội
    'PRJ_VIEW',                                   -- Xem dự án
    'PERM_VIEW', 'ROLE_VIEW'                     -- Xem quyền & role
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ASSIGN MANAGER PERMISSIONS (team management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'MANAGER'),
    id
FROM permissions
WHERE code IN (
    'EMP_VIEW',                                    -- Xem nhân viên
    'LEAVE_VIEW', 'LEAVE_APPROVE',               -- Duyệt đơn nghỉ
    'ATT_CHECKIN', 'ATT_VIEW', 'ATT_TEAM_VIEW', 'ATT_APPROVE',  -- Quản lý chấm công team
    'APOLOGY_VIEW', 'APOLOGY_APPROVE',           -- Duyệt đơn xin tha tội
    'PAY_VIEW',                                   -- Xem lương team
    'PRJ_VIEW', 'PRJ_CREATE', 'PRJ_UPDATE',      -- Quản lý dự án
    'PERM_VIEW', 'ROLE_VIEW'                     -- Xem quyền & role
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ASSIGN HR PERMISSIONS (HR management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'HR'),
    id
FROM permissions
WHERE code IN (
    'USER_VIEW', 'USER_CREATE', 'USER_UPDATE',  -- Tạo tài khoản
    'EMP_VIEW', 'EMP_CREATE', 'EMP_UPDATE', 'EMP_DELETE', 'EMP_IMPORT', 'EMP_EXPORT',  -- CRUD nhân viên
    'LEAVE_VIEW', 'LEAVE_CREATE', 'LEAVE_APPROVE', 'LEAVE_DELETE',  -- Quản lý đơn nghỉ
    'ATT_VIEW', 'ATT_CHECKIN', 'ATT_TEAM_VIEW', 'ATT_APPROVE', 'ATT_IMPORT',  -- Quản lý chấm công
    'APOLOGY_VIEW', 'APOLOGY_CREATE', 'APOLOGY_APPROVE',  -- Quản lý đơn xin tha tội
    'PAY_VIEW', 'PAY_CALC', 'PAY_APPROVE',       -- Tính lương
    'PRJ_VIEW', 'PRJ_CREATE', 'PRJ_UPDATE',      -- Quản lý dự án
    'PERM_VIEW', 'ROLE_VIEW'                     -- Xem quyền & role
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- SEED TEST USERS - Will be done in V20 after role_id migration
-- This is done AFTER V20 migrates users.role to users.role_id
-- See V20__migrate_users_role_to_foreign_key.sql for user creation
