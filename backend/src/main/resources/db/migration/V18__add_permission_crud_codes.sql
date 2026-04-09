-- V15__add_permission_crud_codes.sql
-- Thêm các permission codes cho CRUD Role và Permission

INSERT INTO permissions (name, code, module) VALUES 
('Xem quyền', 'PERM_VIEW', 'PERMISSION'),
('Tạo quyền', 'PERM_CREATE', 'PERMISSION'),
('Sửa quyền', 'PERM_UPDATE', 'PERMISSION'),
('Xóa quyền', 'PERM_DELETE', 'PERMISSION'),
('Xem role', 'ROLE_VIEW', 'ROLE'),
('Tạo role', 'ROLE_CREATE', 'ROLE'),
('Sửa role', 'ROLE_UPDATE', 'ROLE'),
('Xóa role', 'ROLE_DELETE', 'ROLE');

-- Auto-assign all new permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id 
FROM permissions 
WHERE code IN ('PERM_VIEW', 'PERM_CREATE', 'PERM_UPDATE', 'PERM_DELETE', 'ROLE_VIEW', 'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE');
