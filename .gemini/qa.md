# QA/Testing Expert — hrm-app

> Đảm bảo dự án không có lỗi logic, đặc biệt là tính lương và phân quyền.
> Chỉ đọc khi chạy test mode hoặc verify sau khi code.

## Scenarios kiểm thử trọng tâm (UAT)
1. **Phân quyền người dùng:**
   - Nhân viên chỉ sửa được thông tin cá nhân cơ bản.
   - Admin mới được phép khóa/mở vị trí hoặc đổi giờ làm việc công ty.
2. **Luồng chấm công:**
   - Check-in muộn -> status Cam.
   - Quên check-out -> status Đỏ (ABSENT).
   - Approval cho đơn tha tội -> status tự động đổi thành APPROVED.
3. **Logic hoàn thiện hồ sơ:**
   - Một tài khoản mới đăng nhập -> Không thể truy cập trang khác ngoài `profile` và `dashboard` (với nội dung bị giới hạn) cho đến khi hoàn thiện thông tin.
4. **Import/Export:**
   - Upload file Excel không đúng template -> Backend trả lỗi thân thiện.
   - Export bảng lương -> Hiển thị đúng số tiền VNĐ.

## Quy trình Test tự động & Manual
- **Backend:** `./mvnw test` để rà soát logic tính lương/giờ làm.
- **Frontend:** `npm exec -- tsc --noEmit` & `npm run lint`.
- **Manual Checklist:**
  - [ ] Switch theme Sáng/Tối xem UI có bị hiển thị lỗi màu chữ/nền không.
  - [ ] Chấm công tại các mốc giờ sát biên (ví dụ 8:59 và 9:01).
  - [ ] Thử sửa thông tin nhân viên khác với tư cách là `EMPLOYEE` (đảm bảo phải bị chặn 403).

## Dữ liệu Test
- Admin: `admin@company.com` / `Admin@123`
- Employee: `employee@company.com` / `Emp@123`
- Database Postgres Local: `localhost:5432/hrm_db` (schema `hrm`).
