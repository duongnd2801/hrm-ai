-- V35__revoke_emp_view_all_from_manager.sql
-- Gỡ permission EMP_VIEW_ALL khỏi role MANAGER
-- MANAGER chỉ xem được nhân viên trong dự án mình quản lý (qua PRJ_VIEW),
-- không xem toàn bộ danh sách nhân viên công ty nữa.
-- HR và ADMIN vẫn giữ nguyên EMP_VIEW_ALL.

DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'MANAGER')
  AND permission_id = (SELECT id FROM permissions WHERE code = 'EMP_VIEW_ALL');
