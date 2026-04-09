-- Add OT permissions missing from the RBAC seed and assign them to built-in roles.

INSERT INTO permissions (name, code, module) VALUES
('Xem đơn tăng ca', 'OT_VIEW', 'OT'),
('Tạo đơn tăng ca', 'OT_CREATE', 'OT'),
('Duyệt đơn tăng ca', 'OT_APPROVE', 'OT'),
('Xóa đơn tăng ca', 'OT_DELETE', 'OT')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'EMPLOYEE'),
    id
FROM permissions
WHERE code IN ('OT_VIEW', 'OT_CREATE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'MANAGER'),
    id
FROM permissions
WHERE code IN ('OT_VIEW', 'OT_APPROVE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'HR'),
    id
FROM permissions
WHERE code IN ('OT_VIEW', 'OT_CREATE', 'OT_APPROVE', 'OT_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id
FROM permissions
WHERE code IN ('OT_VIEW', 'OT_CREATE', 'OT_APPROVE', 'OT_DELETE')
ON CONFLICT (role_id, permission_id) DO NOTHING;
