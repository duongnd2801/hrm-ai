### 📋 Plan — [Phase Refinement: UX, Test & CORS]

**Mục tiêu:** Vá các hạng mục còn thiếu theo đánh giá: bổ sung Error Boundary & Loading UI (tránh crash FE) và viết Unit Test cho Attendance logic để đảm bảo an toàn. Đưa cấu hình CORS ra file YAML.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm | Trạng thái |
|---|---|---|---|
| 1 | `frontend/app/(dashboard)/error.tsx` | Tạo Global Error Boundary bắt lỗi React Client-side. | [x] Xong |
| 2 | `frontend/app/(dashboard)/loading.tsx` | Tạo Loading Skeleton UI (giảm giật trang khi Next.js đổi Route). | [x] Xong |
| 3 | `src/test/.../AttendanceServiceTest.java` | Setup Unit Test (Mockito) check nhanh logic báo LATE, INSUFFICIENT, ON_TIME của `AttendanceService`. | [x] Xong |
| 4 | `application.yml` & `CorsConfig.java` | Đưa CORS URL vào biến `@Value("${app.cors.allowed-origins}")` để không hardcode. | [x] Xong |

**Thứ tự:** FE (UX) trước -> BE Test -> BE CORS config.

**Verify bằng cách:**
- Về trang Dash, tải lại, có skeleton nhấp nháy ko.
- Gọi test BE: `mvn test -Dtest=AttendanceServiceTest` -> pass.