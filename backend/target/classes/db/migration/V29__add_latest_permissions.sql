-- V28__add_system_permissions.sql
-- Thêm các quyền xuất file/nhập file còn thiếu

INSERT INTO permissions (name, code, module) VALUES 
('Export chấm công', 'ATT_EXPORT', 'ATTENDANCE'),
('Xuất bảng lương', 'PAY_EXPORT', 'PAYROLL')
ON CONFLICT (code) DO NOTHING;

-- Đảm bảo ADMIN có đầy đủ mọi quyền (bao gồm cả Import đã có từ V19)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    id 
FROM permissions
WHERE code IN ('ATT_EXPORT', 'PAY_EXPORT', 'ATT_IMPORT', 'EMP_IMPORT')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Gán quyền cho HR (Xuất nhập nhân sự và chấm công, lương)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'HR'),
    id 
FROM permissions
WHERE code IN ('ATT_EXPORT', 'PAY_EXPORT', 'ATT_IMPORT', 'EMP_IMPORT')
ON CONFLICT (role_id, permission_id) DO NOTHING;
