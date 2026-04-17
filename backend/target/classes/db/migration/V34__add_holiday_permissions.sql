-- Thêm quyền quản lý ngày lễ
INSERT INTO permissions (name, code, module) VALUES 
('Xem lịch nghỉ lễ', 'HOLIDAY_VIEW', 'SYSTEM'),
('Cấu hình ngày lễ', 'HOLIDAY_MANAGE', 'SYSTEM');

-- Gán quyền HOLIDAY_VIEW cho toàn bộ Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE p.code = 'HOLIDAY_VIEW'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gán quyền HOLIDAY_MANAGE cho HR và ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE p.code = 'HOLIDAY_MANAGE' AND r.name IN ('HR', 'ADMIN')
ON CONFLICT (role_id, permission_id) DO NOTHING;
