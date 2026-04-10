INSERT INTO permissions (name, code, module) VALUES
('Xem cấu hình công ty', 'COMP_VIEW', 'COMPANY'),
('Sửa cấu hình công ty', 'COMP_UPDATE', 'COMPANY'),
('Xem phòng ban', 'DEPT_VIEW', 'DEPARTMENT'),
('Tạo phòng ban', 'DEPT_CREATE', 'DEPARTMENT'),
('Sửa phòng ban', 'DEPT_UPDATE', 'DEPARTMENT'),
('Xóa phòng ban', 'DEPT_DELETE', 'DEPARTMENT'),
('Xem vị trí', 'POS_VIEW', 'POSITION'),
('Tạo vị trí', 'POS_CREATE', 'POSITION'),
('Sửa vị trí', 'POS_UPDATE', 'POSITION'),
('Xóa vị trí', 'POS_DELETE', 'POSITION')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('COMP_VIEW', 'DEPT_VIEW', 'POS_VIEW')
WHERE r.name IN ('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('COMP_UPDATE', 'DEPT_CREATE', 'DEPT_UPDATE', 'DEPT_DELETE', 'POS_CREATE', 'POS_UPDATE', 'POS_DELETE')
WHERE r.name IN ('HR', 'ADMIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.code = 'PRJ_VIEW'
WHERE p_old.code IN ('PROJ_VIEW', 'PROJ_MANAGE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_new.id
FROM role_permissions rp
JOIN permissions p_old ON p_old.id = rp.permission_id
JOIN permissions p_new ON p_new.code IN ('PRJ_CREATE', 'PRJ_UPDATE', 'PRJ_DELETE')
WHERE p_old.code = 'PROJ_MANAGE'
ON CONFLICT (role_id, permission_id) DO NOTHING;

DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE code IN ('PROJ_VIEW', 'PROJ_MANAGE')
);

DELETE FROM permissions
WHERE code IN ('PROJ_VIEW', 'PROJ_MANAGE');
