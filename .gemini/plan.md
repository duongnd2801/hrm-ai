### 📋 Plan — [Phase 3: Cập nhật Import nhân viên theo mẫu template mới]

**Mục tiêu:** Nâng cấp tính năng Import từ Excel (BE parser và FE preview) để đồng bộ 100% với định dạng 30 cột và cấu trúc Header 2 tầng (chứa các Merge Cells Nhóm Hợp đồng, Nhóm Cá nhân...) y hệt như bản xuất Excel hoặc hình ảnh tham chiếu, đảm bảo dễ thao tác và đồng nhất hai chiều.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| [x] | `backend/src/main/java/com/hrm/service/ImportExportService.java` | Refactor `generateTemplate()` để xuất đúng 30 cột 2 dòng header. (Có dòng data mẫu). |
| [x] | `backend/src/main/java/com/hrm/service/ImportExportService.java` | Thay đổi `parseEmployeeExcelWithValidation` / `parseEmployeeExcel`. Data từ dòng 3 (index 2). Cột 30. Tự generate Email theo họ tên (vd: nguyen van tuan -> tuannv@company.com), set Default lương = 0, mặc định nhập email cá nhân vào cột 17 v.v.. |
| [x] | `frontend/app/(dashboard)/employees/components/ImportExcelModal.tsx` | Cập nhật preview parsing map index lại cho chuẩn 30 cột, sửa logic check email vì giờ server tự tạo email. Kiểm tra FE lỗi để upload báo đúng cột. |

**Thứ tự:** BE trước / FE trước — Thiết lập cấu trúc Template ở BE trước rồi mới cập nhật logic validate và Preview ở FE theo index tương ứng, cuối cùng là parse ở BE để lưu.

**Rủi ro / cần chú ý:** 
- Break API với mẫu template cũ (chỉ 1 dòng header 26 cột). Người dùng bắt buộc phải dùng lệnh `Tải file mẫu` mới sau khi cập nhật.
- File export hiện tại dường như không có "Mật khẩu", "Email hệ thống (để login)" và "Lương cơ bản". Mặc định hệ thống cần "Email" để tạo user. Xin Human làm rõ: *Sẽ gộp cột Email cá nhân làm Email login, hay thêm cột riêng vào khuôn mẫu?* 

**Verify bằng cách:** 
- Tải file template mới thấy định dạng chia nhóm (Header 2 tầng, màu sắc y hệt hình).
- FE: Upload file thấy hiển thị Preview bóc tách đúng thông tin (chuẩn validate Họ tên, Email, số CCCD).
- BE: Import báo xanh, parse chuẩn thông tin ngày tháng, chức vụ, quản lý. Mở cơ sở dữ liệu `employees` hiển thị 100% cột chính xác. Mở UI hiển thị đầy đủ data mở rộng.