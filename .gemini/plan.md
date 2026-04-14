### 📋 Plan — [Phase 4: Import dữ liệu máy chấm công (D14)]

**Mục tiêu:** Xây dựng tính năng Import file Excel xuất trực tiếp từ máy chấm công. Sử dụng file `cham_cong_nhan_vien.xlsx` đã chuẩn hóa (377 dòng, dùng Full UUID) làm chuẩn. Sau đó nâng cấp UI để quản lý dễ dàng kiểm soát ai chưa chấm công đủ.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `ImportExportService.java` | [IN PROGRESS] Viết hàm `parseMachineAttendanceExcel()`. Đọc file Excel từ dòng 6. Map Cột B (Full ID UUID) với `id` trong DB. Lấy "Ngày", "Giờ vào", "Giờ ra". Xử lý format Date/Time. |
| 2 | `AttendanceService.java` | Xử lý lưu dữ liệu: Cập nhật hoặc ghi đè `check_in`/`check_out`. Tự động tính `total_hours` và `status` (ON_TIME/LATE/INSUFFICIENT). |
| 3 | `AttendanceController.java` | Bổ sung API `POST /api/attendances/import-machine`. |
| 4 | `ImportMachineModal.tsx` | UI kéo thả file Excel máy chấm công tại màn hình Attendance. |
| 5 | `Attendance Supervision View` | (Yêu cầu mới) Thêm giao diện Dashboard/Filter cho HR/Manager để phát hiện nhanh: "Thiếu chấm công", "Quên checkout", "Nghỉ không phép". |

**Thứ tự thực hiện:**
1. BE: Xây dựng logic Parsing & API.
2. FE: UI Import & Preview.
3. FE: UI Giám sát (Supervision Dashboard).

**Ghi chú:**
- Đã dọn dẹp "Final Test 4" và đã map toàn bộ 377 nhân viên trong file Excel với UUID thật trong DB.
- Logic mapping hiện tại là 100% khớp UUID.

⏳ Chờ bạn xác nhận 'ok' trên implementation_plan.md để tôi bắt đầu thực hiện Phase 4.