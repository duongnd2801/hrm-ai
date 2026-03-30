### 📋 Plan — [Phase Nhỏ: Thêm dữ liệu giả]

**Mục tiêu:** Tạo file migration database mới để cung cấp thêm nhiều dữ liệu giả (fake data) phục vụ test các tính năng chấm công, đơn xin tha tội, nghỉ phép, OT và tính lương (cho trường hợp người làm đủ công và người thiếu giờ).

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `backend/src/main/resources/db/migration/V5__more_fake_data.sql` | [x] Tạo script SQL Flyway mới (không sửa các V cũ để tránh lỗi checksum). |
| 2 | Trong SQL `V5` | [x] Thêm dữ liệu chấm công tháng 2 và 3/2026 cho `Manager` (đóng vai người làm đủ 100% công). |
| 3 | Trong SQL `V5` | [x] Thêm dữ liệu chấm công tháng 2 và 3/2026 cho `HR` (đóng vai người hay đi muộn, thiếu giờ, nghỉ nhiều). |
| 4 | Trong SQL `V5` | [x] Thêm nhiều đơn xin tha tội, nghỉ phép, đăng ký OT với các trạng thái khác nhau (PENDING, APPROVED, REJECTED) cho các nhân viên này. |

**Thứ tự:** BE (Database) — Không ảnh hưởng UI Frontend.

**Rủi ro / cần chú ý:** 
- Ensure constraint UNIQUE `(employee_id, date)` ở bảng bảng `attendances` không bị vi phạm (dùng `ON CONFLICT DO NOTHING`).
- Tham chiếu đúng `employee_id` từ `V4__fake_data.sql`.

**Verify bằng cách:** 
- Chạy lại app để Flyway execute bản `V5__more_fake_data.sql`.
- Vào giao diện Lương (Payroll), bấm tính lương tháng 3 năm 2026 và kiểm chứng dữ liệu người đủ công / thiếu công.

⏳ Chờ bạn xác nhận trước khi bắt đầu. (Đã hoàn thành)

---

### 📋 Plan — [Phase Nhỏ: Thêm dữ liệu hàng loạt (Mass Seed)]

**Mục tiêu:** Tạo thêm khoảng 10 nhân sự mới, kèm theo 2 tháng chấm công (Feb & Mar 2026) với dữ liệu ngẫu nhiên (có đi đúng giờ, đi trễ, nghỉ phép, thiếu giờ) để giao diện bảng tính lương phong phú và giống thật hơn.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `backend/src/main/resources/db/migration/V6__mass_fake_data.sql` | [x] Tạo script SQL Flyway mới. |
| 2 | Trong SQL `V6` | [x] Dùng block PL/pgSQL sinh tự động 10 Users và 10 Employees. |
| 3 | Trong SQL `V6` | [x] Random phòng ban, chức vụ, và mức lương `base_salary` cho 10 người. |
| 4 | Trong SQL `V6` | [x] Chạy vòng lặp tạo Attendances cho toàn bộ 10 người trong Tháng 2 và 3/2026 với trạng thái random (chủ yếu là ON_TIME, thỉnh thoảng LATE, INSUFFICIENT). |

**Thứ tự:** BE (Database Migration) — Không động vào code UI.

**Rủi ro / cần chú ý:** 
- Script SQL dùng random có rủi ro tạo duplicate email/user nếu không xử lý ON CONFLICT.
- PL/pgSQL vòng lặp đôi cần viết cẩn thận để tránh deadloop hoặc timeout.

**Verify bằng cách:** 
- Chạy lại BE để Flyway execute V6.
- Vào trang Tính lương (Payroll) tháng 3/2026, kì vọng xuất hiện khoảng 14 nhân viên với các khoản thu nhập / khấu trừ đa dạng.

⏳ Chờ bạn xác nhận trước khi bắt đầu. (Đã hoàn thành)

---

### 📋 Plan — [Phase Nhỏ: Ghi chú thông tin Thuế & Bảo hiểm]

**Mục tiêu:** Thêm một thẻ ghi chú (Info Card) ở cuối trang Tính lương (Payroll) để minh bạch hóa các công thức tính thuế TNCN và Bảo hiểm theo luật hiện hành của Việt Nam. Điều này giúp nhân sự và HR dễ dàng đối chiếu.

**Các bước thực hiện:**
| # | File sửa | Việc cần làm |
|---|---|---|
| 1 | `frontend/app/(dashboard)/payroll/page.tsx` | [x] Tạo một Component thông tin dạng thẻ đặt dưới cùng (hoặc ngay dưới bảng lương). |
| 2 | Dữ liệu nội dung | [x] Liệt kê chi tiết tỷ lệ đóng Bảo hiểm (BHXH 8%, BHYT 1.5%, BHTN 1% = 10.5%). |
| 3 | Dữ liệu nội dung | [x] Thêm block ghi chú Giảm trừ gia cảnh: 11.000.000đ/bản thân và 4.400.000đ/người phụ thuộc. |
| 4 | Dữ liệu nội dung | [x] Trình bày trực quan 7 Bậc Thuế thu nhập cá nhân lũy tiến (5% -> 35%). |

---

### 📋 Plan — [Phase Nhỏ: Thay đổi Luật Thuế Mới - 17 Triệu]

**Mục tiêu:** Nâng mức giảm trừ gia cảnh bản thân lên 17.000.000đ theo yêu cầu (ngưỡng trên 17 triệu mới chịu thuế) và đồng bộ cả logic tính toán Backend lẫn giao diện Frontend.

**Các bước thực hiện:**
| # | File sửa | Việc cần làm |
|---|---|---|
| 1 | `backend/src/main/java/com/hrm/service/PayrollService.java` | [x] Tự động nâng hằng số `personalDeduction` từ 11.000.000đ lên 17.000.000đ. |
| 2 | `frontend/app/(dashboard)/payroll/page.tsx` | [x] Cập nhật mục hiển thị thẻ Info "Đối với bản thân": chuyển thành 17.000.000 đ/tháng. Nhấn mạnh việc lương >= 17 triệu mới bắt đầu bị xét thuế. |

**Thứ tự:** Sửa BE (Service) -> Sửa FE (Card Info).

**Rủi ro / cần chú ý:** 
- Đảm bảo công thức thuế ở BE vẫn chạy đúng cho người > 17tr. 

**Verify bằng cách:** 
- Bấm "TÍNH LƯƠNG" cho tháng 3/2026. Bảng lương cũ sẽ được tính lại dựa trên quy định giảm trừ 17tr. HR (lương < 17tr do đi làm thiếu/vắng/lương ban đầu thấp) sẽ không còn bị trừ 1 đồng nào Thuế TNCN nữa, chỉ bị trừ bảo hiểm.

⏳ Chờ bạn xác nhận trước khi bắt đầu. (Đã hoàn thành)

---

### 📋 Plan — [Phase Nhỏ: Đính chính Luật Thuế 15.5 Triệu]

**Mục tiêu:** Cập nhật lại chính xác các mức giảm trừ dựa trên luật mới nhất: Giảm trừ bản thân `15.500.000 đ`, và giảm trừ người phụ thuộc `6.200.000 đ`. Sửa lại giải thích trên UI để làm rõ tại sao người dùng "có thu nhập 17 triệu thì không phải nộp thuế".

**Các bước thực hiện:**
| # | File sửa | Việc cần làm |
|---|---|---|
| 1 | `backend/src/main/java/com/hrm/service/PayrollService.java` | [x] Đổi `personalDeduction = 15500000L` và `dependentDeduction = ... * 6200000L`. |
| 2 | `frontend/app/(dashboard)/payroll/page.tsx` | [x] Sửa text Giảm trừ bản thân là `15.500.000 đ` và Người phụ thuộc là `6.200.000 đ`. Giải thích logic: Thu nhập tính thuế = Thu nhập - Bảo hiểm (10.5%) - Giảm trừ; nên lương 17tr gross chưa phải nộp thuế. |

⏳ Chờ bạn xác nhận trước khi bắt đầu.

**Thứ tự:** Thuần FE/UI — Không thay đổi database.

**Rủi ro / cần chú ý:** 
- Giao diện cần hiện đại, hài hòa với phong cách chung (hiệu ứng Glassmorphism) và chuẩn Responsive.

**Verify bằng cách:** 
- Truy cập vào màn hình Payroll, cuộn xuống dưới cùng sẽ thấy một hộp thông tin đẹp mắt tóm tắt các chính sách thuế hiện tại theo pháp luật Việt Nam.

⏳ Chờ bạn xác nhận trước khi bắt đầu.
