### 📋 Plan — [Phase 4+: Attendance Fix & Dark Mode]

**Mục tiêu:** Sửa lỗi hiển thị trạng thái chấm công khi chưa check-out và bổ sung tính năng chuyển đổi giao diện Sáng/Tối theo hệ thống.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `AttendanceService.java` | [x] Cải thiện `normalizeStatus`: Nếu chưa check-out và là ngày hôm nay, giữ trạng thái PENDING/LATE, không tính là INSUFFICIENT. |
| 2 | `V4__fake_data.sql` | [x] Xóa dữ liệu mẫu của ngày hôm nay (27/03) để người dùng có thể test thực tế. |
| 3 | `AttendancePage.tsx` | [x] Cải thiện hiệu ứng tooltip và hiển thị trạng thái "Đang làm việc" (pulse) cho ngày hiện tại. |
| 4 | `ThemeToggle.tsx` | [x] Tạo component chuyển đổi giao diện (Sáng / Tối / Hệ thống). |
| 5 | `Header.tsx` | [x] Tích hợp nút chuyển đổi giao diện vào thanh công cụ. |
| 6 | `ThemeInitializer.tsx` | [x] Sửa lỗi chính tả media query hệ thống. |

**Thứ tự:** BE trước (logic) -> FE sau (giao diện).

**Rủi ro / cần chú ý:**
- Thay đổi logic BE có thể ảnh hưởng đến kết quả tính lương nếu không kiểm tra kỹ trạng thái INSUFFICIENT.
- Cần đảm bảo `next-themes` và `lucide-react` được cài đặt đúng.

**Verify bằng cách:**
- Check-in hôm nay: Lịch phải hiện trạng thái "Đang chờ" (Gray) hoặc "Đi muộn" (Amber) kèm hiệu ứng nháy (pulse), không được hiện "Thiếu giờ" (Purple/Orange).
- Click nút giao diện ở Header: Toàn bộ app phải đổi tone màu sang/tối mượt mà.

⏳ Đã tạo plan. Bạn vui lòng review. Chờ bạn xác nhận 'ok / làm đi' trước khi bắt đầu.
