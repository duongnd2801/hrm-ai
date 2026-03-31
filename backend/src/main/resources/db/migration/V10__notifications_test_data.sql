-- V10__notifications_test_data.sql — Test notifications for demonstration

-- Insert test notifications for admin user
-- Assuming admin@company.com user exists from previous seeds

INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
) SELECT 
    u.id,
    'Đơn xin phép được duyệt',
    'Đơn xin phép ngày 30/03/2026 của bạn đã được quản lý duyệt',
    'REQUEST_APPROVED',
    FALSE,
    NOW() - INTERVAL '2 hours'
FROM users u WHERE u.email = 'admin@company.com'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
) SELECT 
    u.id,
    'Chào mừng bạn đến HRM System',
    'Hệ thống quản lý nhân sự mới đã sẵn sàng! Vui lòng hoàn tất hồ sơ cá nhân.',
    'INFO',
    TRUE,
    NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'admin@company.com'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
) SELECT 
    u.id,
    'Đơn xin phép mới chờ xử lý',
    'Có 1 đơn xin phép từ nhân viên chờ phê duyệt',
    'REQUEST_PENDING',
    FALSE,
    NOW() - INTERVAL '30 minutes'
FROM users u WHERE u.email = 'admin@company.com'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
) SELECT 
    u.id,
    '⚠️ Cảnh báo: Thiếu tờ khai',
    'Bạn chưa điền tờ khai OT cho ngày 29/03/2026',
    'WARNING',
    FALSE,
    NOW() - INTERVAL '4 hours'
FROM users u WHERE u.email = 'admin@company.com'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
) SELECT 
    u.id,
    '❌ Lỗi: Dữ liệu không hợp lệ',
    'File import Excel không đúng định dạng. Vui lòng kiểm tra lại.',
    'ERROR',
    FALSE,
    NOW() - INTERVAL '1 hour'
FROM users u WHERE u.email = 'admin@company.com'
ON CONFLICT DO NOTHING;

-- Insert notifications for employees (if exist)
INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
) SELECT 
    u.id,
    'Đơn xin phép của bạn bị từ chối',
    'Quản lý vừa từ chối đơn xin phép ngày 28/03/2026. Vui lòng kiểm tra lý do.',
    'REQUEST_REJECTED',
    FALSE,
    NOW() - INTERVAL '6 hours'
FROM users u WHERE u.email != 'admin@company.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
) SELECT 
    u.id,
    '✅ Tờ khai OT được duyệt',
    'Tờ khai OT ngày 27/03/2026 của bạn đã được phê duyệt (5 giờ)',
    'SUCCESS',
    TRUE,
    NOW() - INTERVAL '2 days'
FROM users u WHERE u.email != 'admin@company.com'
LIMIT 1
ON CONFLICT DO NOTHING;
