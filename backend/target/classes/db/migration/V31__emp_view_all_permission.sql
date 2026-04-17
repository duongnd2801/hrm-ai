-- V31__emp_view_all_permission.sql
-- Thêm permission EMP_VIEW_ALL: xem toàn bộ danh sách nhân viên
-- EMPLOYEE chỉ có EMP_VIEW (xem bản thân), không có EMP_VIEW_ALL

INSERT INTO permissions (name, code, module)
VALUES ('Xem toàn bộ nhân viên', 'EMP_VIEW_ALL', 'EMPLOYEE')
ON CONFLICT (code) DO NOTHING;

-- Gán EMP_VIEW_ALL cho MANAGER, HR, ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('MANAGER', 'HR', 'ADMIN')
  AND p.code = 'EMP_VIEW_ALL'
ON CONFLICT (role_id, permission_id) DO NOTHING;
