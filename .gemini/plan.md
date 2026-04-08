### 📋 Plan — [Phase Hardening: Xử lý Race Condition Chấm công & Tính lương]

**Mục tiêu:** Bổ sung cơ chế Exception Handling dựa vào Unique Constraint đã có trong DB để bắt lỗi ghi đè dữ liệu khi có request đồng thời mà không cần dùng Pessimistic Lock.

**Các bước thực hiện:**
| # | File sửa | Việc cần làm |
|---|---|---|
| 1 | `AttendanceService.java` | [x] Nâng cấp hàm `checkIn`: Bọc `attendanceRepository.save(attendance)` thành `saveAndFlush(attendance)` trong khối `try-catch(DataIntegrityViolationException)`. Nếu lỗi văng ra → ném `IllegalArgumentException("Bạn đã check-in hôm nay.")`. |
| 2 | `PayrollService.java` | [x] Nâng cấp hàm `calculateMonthlyPayroll` và `calculateForEmployee`: Dùng `saveAndFlush` cho payroll. Thêm `try-catch(DataIntegrityViolationException)` để báo lỗi `IllegalArgumentException("Bảng lương tháng này đang được tính toán, vui lòng thử lại sau.")` nếu có 2 luồng cùng tính. |

**Thứ tự:** BE trước — Chỉ tác động Backend.

**Rủi ro / cần chú ý:** Bắt đúng `org.springframework.dao.DataIntegrityViolationException` để không vô tình bắt nhầm exception khác.

**Verify bằng cách:** Gửi nhiều request check-in cùng lúc, chỉ 1 requet được lưu, còn lại ném lỗi an toàn (400) thay vì crash (500).

⏳ Đã tạo plan. Bạn vui lòng review. Chờ bạn xác nhận 'ok / làm đi' trước khi bắt đầu.