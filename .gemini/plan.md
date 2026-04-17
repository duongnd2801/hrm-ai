### 📋 Plan — [Phase Holiday: Quản lý ngày Lễ / Tết VN]

**Mục tiêu:** Tạo bảng lưu trữ linh động ngày lễ theo năm, hiển thị lịch Âm Dương bằng thư viện và cho phép HR tick nghỉ bù thủ công trên UI. (Chỉ làm riêng giải pháp quản lý ngày lễ, không can thiệp logic Attendance).

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm | Trạng thái |
|---|---|---|---|
| 1 | `V33__add_holidays.sql` | BE: DB Flyway tạo bảng `company_holidays` (id, date, name, year). | [x] Xong |
| 2 | `Holiday.java` + Repo | BE: Cấu trúc tầng Entity JPA và Repository. | [x] Xong |
| 3 | `CompanyController/Service.java` | BE: Bổ sung 2 endpoint `GET /api/holidays/{year}` và `PUT /api/holidays/{year}` ghi đè mảng. Bổ sung `HolidayDTO`. | [x] Xong |
| 4 | `npm install lunar-typescript` | FE: Cài đặt thư viện parse Lịch Âm của JS `lunar-typescript`. | [x] Xong |
| 5 | `frontend/app/(dashboard)/holidays/...` | FE: Dựng giao diện Calendar nguyên 1 năm (tái sử dụng component grid), logic fetch API & auto generate. | [x] Xong |

**Thứ tự ưu tiên:** BE tạo DB và API trước → Xong mới sang FE cài đặt thư viện và dựng UI lịch theo năm.

**Verify bằng cách:**
- DB Flyway chạy tạo `V33`.
- Bấm GET `localhost:8080/api/holidays/2026` ra mảng rỗng `[]`. Bấm PUT để save thành mảng có chứa data.
- UI render được 12 tháng với chấm đỏ cho các ngày đặc biệt. Đổi năm và render tự động.