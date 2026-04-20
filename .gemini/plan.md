### 📋 Plan — [Phase Performance: Data Caching with Redis]

**Mục tiêu:** Cấu hình Spring Cache để lưu trữ các dữ liệu tĩnh hoặc tần suất truy cập cao vào Redis, giúp giảm tải Database và tăng tốc độ phản hồi API (kiểu Cache-Aside).

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `backend/src/main/java/com/hrm/config/CacheConfig.java` | Khởi tạo `RedisCacheManager`, bật `@EnableCaching`, cấu hình TTL cho từng cache name (JSON Serialization). |
| 2 | `backend/src/main/java/com/hrm/dto/CompanyConfigDTO.java` | Implement `Serializable`. |
| 3 | `backend/src/main/java/com/hrm/dto/DepartmentDTO.java` | Implement `Serializable`. |
| 4 | `backend/src/main/java/com/hrm/dto/PositionDTO.java` | Implement `Serializable`. |
| 5 | `backend/src/main/java/com/hrm/dto/HolidayDTO.java` | Implement `Serializable`. |
| 6 | `backend/src/main/java/com/hrm/dto/RoleDTO.java` | Implement `Serializable`. |
| 7 | `backend/src/main/java/com/hrm/dto/PermissionDTO.java` | Implement `Serializable`. |
| 8 | `backend/src/main/java/com/hrm/dto/EmployeeStatsDTO.java` | Implement `Serializable`. |
| 9 | `backend/src/main/java/com/hrm/service/CompanyService.java` | Thêm `@Cacheable` cho `getConfig`, `getAllDepartments`, `getAllPositions`. Thêm `@CacheEvict` khi update/delete. |
| 10 | `backend/src/main/java/com/hrm/service/HolidayService.java` | Thêm `@Cacheable("holidays")` cho `getHolidaysByYear`. Xóa cache khi `saveHolidays`. |
| 11 | `backend/src/main/java/com/hrm/service/RoleService.java` | Thêm caching cho danh sách Role và Permission. |
| 12 | `backend/src/main/java/com/hrm/service/EmployeeService.java` | Thêm caching ngắn hạn cho `getStats`. |

**Thứ tự:** DTO -> Config -> Services.

**Rủi ro / cần chú ý:**
- **JSON Serialization:** Sử dụng Jackson để serialize object sang JSON trong Redis giúp dễ dàng debug hơn.
- **LocalTime handling:** Jackson cần module `jackson-datatype-jsr310` để handle `LocalTime`/`LocalDate`.

**Verify bằng cách:**
- Kiểm tra các key hiện hữu trong Redis: `KEYS hrm:cache:*`.
- Kiểm tra tốc độ phản hồi API.

⏳ Đã cập nhật plan. Tôi bắt đầu thực hiện bước 1.