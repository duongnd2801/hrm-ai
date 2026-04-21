-- V36__emp_view_team_permission.sql
-- Thêm permission EMP_VIEW_TEAM: xem nhân viên trong dự án mình tham gia
-- Gán cho MANAGER để PM xem được thành viên dự án mà không cần EMP_VIEW_ALL

INSERT INTO permissions (name, code, module)
VALUES ('Xem nhân viên cùng dự án', 'EMP_VIEW_TEAM', 'EMPLOYEE')
ON CONFLICT (code) DO NOTHING;

-- Gán EMP_VIEW_TEAM cho MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'MANAGER'
  AND p.code = 'EMP_VIEW_TEAM'
ON CONFLICT (role_id, permission_id) DO NOTHING;
