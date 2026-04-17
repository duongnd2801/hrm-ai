### 📋 Plan — [Phase Advanced Security: Rate Limiting & Audit Log]

**Mục tiêu:** Tăng cường lớp bảo mật cho các thao tác nhạy cảm (Đăng nhập, Sửa lương, Chỉnh sửa hồ sơ) bằng cách giới hạn tần suất request và lưu vết mọi thay đổi dữ liệu.

**Các bước thực hiện:**

| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `backend/pom.xml` | Thêm dependency `bucket4j` và `spring-boot-starter-data-redis` (đã có sẵn cấu hình Redis). |
| 2 | `V30__create_audit_logs.sql` | Tạo Flyway migration mới cho bảng `audit_logs` (id, user_id, action, target_table, record_id, old_values, new_values, timestamp). |
| 3 | `entity/AuditLog.java` | Khai báo Entity để map với bảng database. |
| 4 | `RateLimitFilter.java` | Triển khai Filter giới hạn request login (VD: 5 lần/phút/IP) để chống brute-force. |
| 5 | `AuditService.java` | Viết service xử lý ghi log bất đồng bộ (`@Async`) để không ảnh hưởng đến hiệu năng request. |
| 6 | `EmployeeService.java` | Tích hợp ghi log khi thực hiện `Update` nhân viên hoặc `Import` hàng loạt. |
| 7 | `PayrollService.java` | Tích hợp ghi log khi tính lương hoặc thay đổi lương cơ bản. |

**Thứ tự:** Backend — Triển khai hạ tầng ghi log và filter trước.

**Rủi ro / cần chú ý:**
- Dữ liệu `old_values` và `new_values` nên lưu dưới dạng JSON để linh hoạt.
- Cần dọn dẹp (rotate) log cũ định kỳ nếu lượng truy cập lớn.

**Verify bằng cách:**
- Dùng Postman gọi API Login liên tục -> nhận về 429.
- Thực hiện sửa một trường thông tin nhân viên -> Check DB bảng `audit_logs` có bản ghi tương ứng không.

⏳ Đã tạo plan. Bạn vui lòng review. Chờ bạn xác nhận 'ok / làm đi' trước khi bắt đầu.