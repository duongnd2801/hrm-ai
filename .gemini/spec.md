# Spec ngắn - HRM AI

Mục tiêu: xây dựng hệ thống HRM nội bộ có thể chạy local ổn định, hỗ trợ chấm công, quản lý nhân sự, đơn từ và cấu hình công ty.

## Phạm vi hiện tại
- Đăng nhập JWT + phân quyền EMPLOYEE/MANAGER/HR/ADMIN.
- Quản lý nhân viên: danh sách, chi tiết, cập nhật hồ sơ cá nhân.
- Chấm công: check-in/check-out, lịch tháng.
- Đơn xin tha tội và đơn nghỉ phép/OT: gửi + duyệt.
- Cấu hình công ty, phòng ban, chức vụ.
- Dashboard tổng quan và giao diện hiện đại.

## Quy tắc dữ liệu
- Tiền lương lưu kiểu số nguyên (VND) ở backend.
- API trả JSON nhất quán, thông báo lỗi rõ ràng.
- Text hiển thị tiếng Việt có dấu chuẩn UTF-8.

## Ưu tiên kỹ thuật
1. Tính đúng nghiệp vụ trước.
2. UI/UX dễ dùng theo role.
3. Validation đầy đủ ở FE + BE.
4. Không phá vỡ luồng cũ đang chạy.
