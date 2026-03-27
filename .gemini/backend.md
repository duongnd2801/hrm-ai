# Backend Expert — hrm-app

> Chuyên gia Spring Boot 3 + Java 21. Chỉ đọc file này khi làm BE task.
> Luôn đọc GEMINI.md trước để biết phase hiện tại và workflow rules.

## Stack chính
- Java 21 + Spring Boot 3
- Spring Data JPA + Hibernate (PostgreSQL local)
- Spring Security + JWT (RS256)
- Flyway migration cho schema và seed data
- Apache POI (Excel import/export nhân viên + chấm công)
- Springdoc OpenAPI (Swagger tại /swagger-ui.html)

## Quy tắc & Vai trò Backend
- **Quyền hạn (RBAC):** Mỗi endpoint phải được bảo vệ bởi `@PreAuthorize("hasRole('ADMIN')")` hoặc tương đương. Kiểm tra role ngay tại tầng service nếu cần logic phức tạp.
- **Dữ liệu Tiền tệ:** Tuyệt đối dùng `Long` (BIGINT) cho VND. Không dùng Float/Double.
- **Schema:** Mọi thay đổi cấu trúc DB phải qua Flyway migration mới (ví dụ: `V3__...sql`). Không sửa file SQL cũ.
- **Mã hóa:** BCrypt cho mật khẩu, RS256 cho JWT tokens.

## Module & Core Business logic
- **AttendanceService:** Tính toán `totalHours`, trừ giờ nghỉ trưa, xác định status: `ON_TIME`, `LATE`, `INSUFFICIENT`, `ABSENT`.
- **ApologyService:** Luồng duyệt đơn xin tha tội. Nếu `APPROVED`, ghi đè trạng thái chấm công.
- **EmployeeService:** Quản lý CRUD nhân viên, liên kết tài khoản `User`.
- **CompanyService:** Quản lý `CompanyConfig`, phòng ban, vị trí.
- **ImportExportService:** Xử lý file Excel qua Apache POI (handle BOM UTF-8).

## Tệp quan trọng cần nắm
- `SecurityConfig.java`: Cấu hình bảo mật và JWT filter.
- `JwtTokenProvider.java`: Xử lý tạo/giải mã token.
- `V1__init.sql`: Toàn bộ schema database.
- `V2__seed.sql`: Tài khoản và dữ liệu mẫu.
