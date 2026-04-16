### 📋 Plan — [Phase Hardening: Optimizing Attendance Service]

**Mục tiêu:** Khắc phục các lỗi nghiêm trọng về hiệu năng, phân quyền và logic trong AttendanceService và ImportExportService.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `AttendanceService.java` | **[4] [7]** Xoá dòng gọi `recalculateMonthlyAttendance` trong `getTeamMatrix` và `getTeamSummary`. [x] |
| 2 | `AttendanceService.java` | **[5]** Trong `getTeamMatrix`, thay `findAll()` bằng `findAllActiveEmployees()` (hoặc query filter `ACTIVE`). [x] |
| 3 | `AttendanceService.java` | **[9]** Trong `getTeamMatrix`, thêm `lateCount++` vào case `LATE`. [x] |
| 4 | `AttendanceService.java` | **[8]** Trong `recalculateMonthlyAttendance`, thay `attendanceRepository.saveAll()` bằng `batchUpsertAttendances()`. [x] |
| 5 | `ImportExportService.java` | **[10]** Chỉnh lại vị trí `totalRows++` để đảm bảo `totalRows = successCount + failureCount` (trừ các dòng skip do không có punch). [x] |

**Thứ tự:** BE trước (logic lõi).

**Rủi ro / cần chú ý:**
- User cần biết là sau khi import hoặc cấu hình thay đổi, họ phải chủ động bấm "Tính toán lại" (recalculate) nếu muốn data preview cập nhật ngay (thực tế máy chấm công import xong cũng đã tự gọi normalize rồi).
- Đảm bảo `EmpStatus.ACTIVE` được import đúng enum.

**Verify bằng cách:**
- Login bằng user chỉ có quyền `ATT_TEAM_VIEW` (Manager) -> xem Matrix/Summary không bị 403.
- Kiểm tra log SQL: `getTeamMatrix` không sinh ra hàng nghìn câu lệnh UPDATE/INSERT.
- Kiểm tra `lateCount` trên UI sau khi fix.
- Import file Excel: check `totalRows` có khớp với tổng thành công + lỗi không.

⏳ Đã tạo plan. Bạn vui lòng review. Chờ bạn xác nhận 'ok / làm đi' trước khi bắt đầu.