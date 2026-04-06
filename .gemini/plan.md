### 📋 Plan — [Phase: Comprehensive QA & Testing]

**Mục tiêu:** Kiểm tra toàn bộ hệ thống (E2E & Unit Test) dựa trên đặc tả trong GEMINI.md sau khi đã fix encoding.

**Các bước thực hiện:**
| # | Module | Việc cần làm |
|---|---|---|
| 1 | **BE Build** | Chạy `mvnw clean compile` để đảm bảo không lỗi cú pháp sau khi fix encoding. |
| 2 | **Auth & Security** | Kiểm tra Login (Admin/HR/Manager/Employee), HttpOnly cookie (hrm_access/hrm_refresh). |
| 3 | **Employee & Import** | Test Import Excel (file template) -> kiểm tra logic UTF-8 trong DB và preview. |
| 4 | **Attendance** | Check-in/out -> xem Calendar. Giải trình (Apology) -> Approved -> xem status thay đổi. |
| 5 | **Payroll** | Tính lương tháng hiện tại (VND) -> Export Excel & PDF (kiểm tra font tiếng Việt PDF). |
| 6 | **Projects** | CRUD dự án -> Gán thành viên -> Kiểm tra chatbot có hiểu dự án đó không. |
| 7 | **RBAC** | Dùng acc Employee truy cập trang Admin -> đảm bảo bị chặn (403/Redirect). |
| 8 | **Unit Tests** | Viết/Cập nhật Unit Test cho `PayrollService` (thuế TNCN mới) và `AttendanceService`. |

**Thứ tự:** Verify BE Build -> Smoke test các module cốt lõi -> Rà soát sâu (Edge cases).

**Báo cáo kết quả:** Tạo artifact `full_qa_report.md` chi tiết.

**Rủi ro / cần chú ý:** Dữ liệu mẫu (Seed) có sẵn trong DBMS local.

⏳ Chờ bạn xác nhận trước khi bắt đầu.