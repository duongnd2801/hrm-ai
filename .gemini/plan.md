### 📋 Plan — [Phase Hardening: Cập nhật Seed Data khu vực Hà Nội]

**Mục tiêu:** Cập nhật thông tin CCCD (mã tỉnh, nơi cấp) và các thông tin liên quan (trường đại học) trong dữ liệu mẫu để đồng bộ với khu vực Hà Nội.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm | Status |
|---|---|---|---|
| 1 | `backend/src/main/resources/db/migration/V27__update_cccd_hanoi_context.sql` | Tạo migration mới cập nhật `citizen_id` (001), `citizen_id_place` (Cục CS QLHC/HN) và `university` (HN). | [x] |

**Thứ tự:** BE trước — Đây là thay đổi tầng dữ liệu.

**Rủi ro / cần chú ý:** Đã tuân thủ quy tắc không sửa migration cũ.

**Verify bằng cách:**
- DB: `SELECT citizen_id, citizen_id_place, university FROM employees;`
- UI: Kiểm tra cột "Số CCCD" và "Nơi cấp" trong bảng Nhân sự hoặc file Export.

✅ Đã hoàn thành.