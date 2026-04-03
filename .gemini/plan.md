# Canonical Plan Snapshot (2026-04-03)

### 📋 Plan — Bảo mật toàn diện: Chống XSS + SQL Injection + CSRF + Token Security

**Mục tiêu:** Tích hợp bảo mật toàn diện cho hệ thống HRM: chuyển JWT sang httpOnly cookie (chống XSS), thêm CSRF protection, hardening input validation (chống SQL Injection), thêm security headers, fix app crash khi token mất.

---

## 🔍 Kết quả kiểm tra bảo mật hiện tại

### ✅ Đã tốt (giữ nguyên)
| # | Hạng mục | Trạng thái |
|---|---|---|
| 1 | JPA parameterized queries | ✅ Tất cả query dùng `@Param` — không có SQL string concat |
| 2 | No `nativeQuery=true` | ✅ Không có raw SQL |
| 3 | No `dangerouslySetInnerHTML` | ✅ FE không render raw HTML |
| 4 | BCrypt password hashing | ✅ Đã dùng |
| 5 | CORS config restrict origin | ✅ Chỉ allow `localhost:3000` |
| 6 | GlobalExceptionHandler | ✅ Đã có, bắt tốt |
| 7 | Auth validation (`@Valid`) | ✅ Login/ChangePassword đã valid |

### 🔴 Cần fix (nghiêm trọng)
| # | Vấn đề | Mức độ |
|---|---|---|
| S1 | JWT lưu trong `localStorage` → XSS đọc được | 🔴 CRITICAL |
| S2 | Cookie `hrm_token` set bằng JS, không `HttpOnly` | 🔴 CRITICAL |
| S3 | CSRF disabled hoàn toàn (`.csrf(disable)`) mà chuyển sang cookie-auth | 🔴 HIGH |
| S4 | App crash/treo khi xóa token khỏi storage | 🔴 HIGH |
| S5 | 10+ controllers thiếu `@Valid` trên `@RequestBody` | 🟡 MEDIUM |
| S6 | DTOs thiếu validation annotations (`@NotNull`, `@NotBlank`, `@Size`) | 🟡 MEDIUM |
| S7 | Không có Security Headers (CSP, X-Frame, X-Content-Type, etc.) | 🟡 MEDIUM |
| S8 | Sensitive data trong error response (`ex.getMessage()` leak) | 🟡 MEDIUM |
| S9 | `application.yml` hardcode DB password và Gemini API key | 🟡 LOW (local demo) |

---

## Các bước thực hiện

### PHẦN A: Backend Security Hardening (Bước 1–7)

| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `SecurityConfig.java` | Thêm CSRF protection cho cookie-auth (CookieCsrfTokenRepository); Thêm Security headers filter (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) |
| 2 | `AuthController.java` | Login/Refresh: set `Set-Cookie` httpOnly cho accessToken + refreshToken. Thêm `GET /api/auth/me` (lấy session từ cookie). Thêm `POST /api/auth/logout` (xóa cookie server-side). |
| 3 | `JwtAuthFilter.java` | Đọc token từ Cookie `hrm_access` trước, fallback `Authorization` header. Thêm đọc refreshToken từ cookie `hrm_refresh`. |
| 4 | `GlobalExceptionHandler.java` | Thay `ex.getMessage()` trong RuntimeException handler bằng message generic — tránh leak stack trace/internal info. |
| 5 | DTOs: `EmployeeDTO`, `ApologyCreateRequest`, `LeaveCreateRequest`, `OTCreateRequest`, `ChatRequestDto`, `UpdateUserRoleRequest`, `PositionDTO`, `DepartmentDTO`, `CompanyConfigDTO` | Thêm `@NotBlank`, `@NotNull`, `@Size`, `@Email`, `@Min`, `@Max` validation annotations. |
| 6 | Controllers: `EmployeeController`, `ApologyController`, `LeaveRequestController`, `OTRequestController`, `ChatController`, `DepartmentController`, `PositionController`, `CompanyConfigController`, `UserManagementController` | Thêm `@Valid` trước `@RequestBody` ở tất cả endpoints. |
| 7 | Tạo `config/SecurityHeadersConfig.java` | Filter thêm security headers cho mọi response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy: strict-origin-when-cross-origin` |

### PHẦN B: Frontend Token Security + Crash Fix (Bước 8–14)

| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 8 | `types/index.ts` | Bỏ `token` + `refreshToken` khỏi `UserSession` — chỉ giữ metadata (email, role, employeeId, profileCompleted) |
| 9 | `lib/auth.ts` | Bỏ lưu token vào localStorage. Thêm `redirectToLogin()` singleton function với flag `isRedirecting` chống race condition. Thêm `fetchMe()` gọi `/api/auth/me` để verify session. |
| 10 | `lib/api.ts` | `withCredentials: true`. Bỏ manual `Authorization` header gắn thủ công. Sửa interceptor 401 dùng singleton redirect. Bỏ toàn bộ `document.cookie` manipulation. CSRF: thêm interceptor đọc `XSRF-TOKEN` cookie gửi kèm header `X-XSRF-TOKEN`. |
| 11 | `app/(auth)/login/page.tsx` | Bỏ `document.cookie`. Sau login BE đã set cookie → chỉ lưu metadata vào localStorage. |
| 12 | `app/(dashboard)/layout.tsx` | Bỏ `document.cookie` clear/set. Dùng `/api/auth/me` fallback nếu localStorage metadata mất. Singleton redirect guard. |
| 13 | `components/Header.tsx` | Logout gọi `POST /api/auth/logout` (BE xóa cookie). Bỏ `document.cookie` clear. Notification fetch dùng `api` instance (có withCredentials) thay vì trực tiếp axios + `session.token`. |
| 14 | Cleanup: `proxy.ts`, ChatWidget, mọi nơi dùng `session.token` trực tiếp | Đổi sang dùng `api` instance. Bỏ proxy.ts nếu không dùng hoặc cập nhật đọc cookie httpOnly. |

### PHẦN C: Verify & Test (Bước 15)

| # | Việc cần làm |
|---|---|
| 15a | Login → DevTools → Cookies: `hrm_access` có `HttpOnly=true`, `SameSite=Lax` |
| 15b | `localStorage` không còn chứa `token` / `refreshToken` |
| 15c | Console: `document.cookie` không hiện JWT |
| 15d | Xóa localStorage trong DevTools → app redirect `/login` mượt mà, không crash/treo |
| 15e | `GET /api/auth/me` trả đúng email + role khi có cookie hợp lệ |
| 15f | CSRF: POST/PUT/DELETE request có gửi `X-XSRF-TOKEN` header |
| 15g | Response headers có `X-Content-Type-Options`, `X-Frame-Options`, etc. |
| 15h | Gửi request không có `@Valid` data → trả 400 thay vì 500 |

---

**Thứ tự:** BE (Phần A bước 1-7) trước → FE (Phần B bước 8-14) sau → Verify (Phần C)

**Rủi ro / cần chú ý:**
- CSRF + cookie-auth: SPA thường dùng `CookieCsrfTokenRepository.withHttpOnlyFalse()` để JS đọc XSRF-TOKEN cookie rồi gửi lại header
- Dev localhost dùng HTTP → bỏ flag `Secure` trên cookie (sẽ bật khi deploy HTTPS)
- Header.tsx notification gọi trực tiếp `axios.get` với `session.token` → phải đổi sang dùng `api` instance
- RefreshToken flow: BE đọc refresh token từ cookie `hrm_refresh`, tự động gửi lại kèm request
- Không thay đổi DB schema — không cần Flyway migration mới

⏳ Đã tạo plan. Bạn vui lòng review. Chờ bạn xác nhận 'ok / làm đi' trước khi bắt đầu.
