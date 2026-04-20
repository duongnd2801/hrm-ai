# HRM System — Hệ thống Quản trị Nhân sự Nội bộ

> Hệ thống HRM (Human Resource Management) nội bộ được xây dựng cho doanh nghiệp Việt Nam, hỗ trợ quản lý nhân viên, chấm công, tính lương theo quy định Việt Nam, phê duyệt đơn từ, và phân quyền RBAC động.

---

## 📋 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Tech Stack](#-tech-stack)
- [Yêu cầu môi trường](#-yêu-cầu-môi-trường)
- [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Phân quyền](#-phân-quyền)
- [API Docs](#-api-docs)
- [Biến môi trường](#-biến-môi-trường)

---

## ✨ Tính năng chính

| Module | Mô tả |
|---|---|
| 🔐 **Xác thực** | JWT (HS256) + HttpOnly Cookie, refresh token, quản lý session đa thiết bị, Rate Limiting chống Brute Force (Redis) |
| 👥 **Nhân viên** | CRUD, Import/Export Excel, avatar tự động, thông tin mở rộng (CCCD, người thân...) |
| 🕐 **Chấm công** | Check-in/out, Calendar view, chuẩn hóa giờ tự động, Import từ máy chấm công |
| 📝 **Giải trình** | Nhân viên tạo đơn xin giải trình → Manager/HR duyệt → tự động tính đủ công |
| 🌴 **Nghỉ phép & OT** | Đăng ký nghỉ phép, tăng ca → phê duyệt theo luồng |
| 💰 **Tính lương** | Công thức chuẩn VN: BHXH 8%, BHYT 1.5%, BHTN 1%, Thuế TNCN lũy tiến 7 bậc |
| 📊 **Dashboard** | Widget thời tiết, check-in nhanh, thống kê tổng quan |
| 🏗️ **Dự án** | Quản lý project, gán nhân sự & role (PM, Dev, QA...) |
| 🛡️ **RBAC & Security** | Phân quyền động, giao diện quản lý matrix, Audit Log theo dõi rủi ro nghiệp vụ lớn |
| 🛡️ **UX & Resilience** | Cơ chế Next.js Loading Skeleton, Global Error Boundary và Spring Boot ControllerAdvice |
| 🤖 **AI Chatbot** | Trợ lý HRM tích hợp Gemini AI — hỏi lương, chấm công, đơn chờ duyệt |

---

## 🛠 Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) + TailwindCSS + shadcn/ui |
| Backend | Java 21 + Spring Boot 3.2.3 |
| Database | PostgreSQL (local service) |
| Cache / Session | Redis 7 (Docker) — Rate limit & block brute force |
| ORM | Spring Data JPA + Hibernate |
| Auth | Spring Security + JWT HS256 + Dynamic RBAC |
| Migration | Flyway |
| API Docs | Springdoc OpenAPI (Swagger UI) |
| Import/Export FE | SheetJS (xlsx) + Papa Parse + pdf-lib |
| Import/Export BE | Apache POI (batch chunk 1000 rows) |
| AI | Google Gemini API |
| Build BE | Maven (Maven Wrapper) |

---

## 💻 Yêu cầu môi trường

| Công cụ | Phiên bản tối thiểu |
|---|---|
| **Java JDK** | 21+ |
| **Node.js** | 18+ |
| **PostgreSQL** | 14+ (chạy local hoặc Docker) |
| **Docker Desktop** | Bất kỳ (để chạy Redis) |
| **Maven** | Không cần cài — dùng `./mvnw` có sẵn |

> ⚠️ **Quan trọng:** PostgreSQL phải được cài và chạy **trên máy local** (không chạy qua Docker). Chỉ Redis chạy qua Docker Compose.

---

## 🚀 Cài đặt & Khởi chạy

### Bước 1 — Clone dự án

```bash
git clone <repository-url>
cd hrm-ai
```

### Bước 2 — Chuẩn bị PostgreSQL

Tạo database và user trong PostgreSQL:

```sql
-- Chạy với quyền superuser (postgres)
CREATE DATABASE hrm_db;
CREATE USER postgres WITH PASSWORD '1234$';
GRANT ALL PRIVILEGES ON DATABASE hrm_db TO postgres;
```

> Hoặc dùng pgAdmin / DBeaver để tạo nhanh hơn.

### Bước 3 — Khởi động Redis (Docker)

```bash
docker compose up -d
```

Lệnh này sẽ khởi động:
- **Redis 7** tại `localhost:6379` (password: `1234$`)
- **RedisInsight** (UI quản lý Redis) tại `http://localhost:8001`

### Bước 4 — Khởi động Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

- Backend chạy tại: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Flyway tự động chạy migration khi khởi động lần đầu

> **Lần đầu chạy:** Flyway sẽ tự tạo schema, bảng, dữ liệu seed (31 migration files). Chờ khoảng 30-60 giây.

### Bước 5 — Khởi động Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

- Frontend chạy tại: `http://localhost:3000`

---

## 🔑 Tài khoản mặc định

| Email | Password | Vai trò |
|---|---|---|
| `admin@company.com` | `Admin@123` | ADMIN — Toàn quyền hệ thống |
| `hr@company.com` | `Hr@123` | HR — Quản lý nhân sự, lương |
| `manager@company.com` | `Manager@123` | MANAGER — Duyệt đơn team |
| `employee@company.com` | `Emp@123` | EMPLOYEE — Tự phục vụ |

> Tất cả nhân viên mới được tạo đều có mật khẩu mặc định: `Emp@123`

---

## 📁 Cấu trúc dự án

```
hrm-ai/
├── backend/                          # Spring Boot 3 (Java 21)
│   ├── src/main/java/com/hrm/
│   │   ├── config/                   # SecurityConfig, CorsConfig
│   │   ├── controller/               # REST Controllers
│   │   ├── service/                  # Business Logic
│   │   │   ├── AttendanceService.java    # Logic chuẩn hóa chấm công
│   │   │   ├── PayrollService.java       # Tính lương theo chuẩn VN
│   │   │   ├── ApologyService.java       # Luồng duyệt giải trình
│   │   │   └── ImportExportService.java  # Apache POI Excel
│   │   ├── entity/                   # JPA Entities
│   │   ├── dto/                      # Request/Response DTOs
│   │   ├── repository/               # Spring Data JPA Repositories
│   │   └── security/                 # JWT Filter, UserDetails
│   └── src/main/resources/
│       ├── application.yml           # Cấu hình chính
│       └── db/migration/             # Flyway SQL (V1 → V31)
│
├── frontend/                         # Next.js 16 (TypeScript)
│   ├── app/
│   │   ├── (auth)/                   # Trang đăng nhập
│   │   └── (dashboard)/              # Các trang chính (bảo vệ bởi middleware)
│   │       ├── page.tsx              # Dashboard tổng quan
│   │       ├── employees/            # Quản lý nhân viên
│   │       ├── attendance/           # Chấm công
│   │       ├── payroll/              # Bảng lương
│   │       ├── projects/             # Quản lý dự án
│   │       └── company/             # Cấu hình công ty
│   ├── components/                   # Shared UI Components
│   ├── lib/
│   │   ├── api.ts                    # Axios client (withCredentials, interceptors)
│   │   └── utils.ts                  # Format tiền VNĐ, ngày DD/MM/YYYY
│   └── types/index.ts                # TypeScript types (mirror BE DTOs)
│
├── docker-compose.yml                # Redis + RedisInsight
└── README.md
```

---

## 🛡️ Phân quyền

Hệ thống dùng **Permission-Based RBAC** — mỗi action kiểm tra permission code cụ thể (không chỉ role).

| Permission | EMPLOYEE | MANAGER | HR | ADMIN |
|---|:---:|:---:|:---:|:---:|
| `EMP_VIEW` — Xem profile bản thân | ✅ | ✅ | ✅ | ✅ |
| `EMP_VIEW_ALL` — Xem toàn bộ danh sách | ❌ | ✅ | ✅ | ✅ |
| `EMP_CREATE/UPDATE/DELETE` — CRUD nhân viên | ❌ | ❌ | ✅ | ✅ |
| `EMP_IMPORT/EXPORT` — Import/Export Excel | ❌ | ❌ | ✅ | ✅ |
| `ATT_CHECKIN` / `ATT_VIEW` — Chấm công cá nhân | ✅ | ✅ | ✅ | ✅ |
| `ATT_TEAM_VIEW` / `ATT_APPROVE` — Quản lý team | ❌ | ✅ | ✅ | ✅ |
| `ATT_IMPORT` — Import máy chấm công | ❌ | ❌ | ✅ | ✅ |
| `APOLOGY_CREATE/VIEW` — Tạo & xem giải trình | ✅ | ✅ | ✅ | ✅ |
| `APOLOGY_APPROVE` — Duyệt giải trình | ❌ | ✅ | ✅ | ✅ |
| `PAY_VIEW` — Xem lương bản thân | ✅ | ✅ | ✅ | ✅ |
| `PAY_CALC/APPROVE` — Tính & duyệt lương | ❌ | ❌ | ✅ | ✅ |
| `LEAVE_CREATE/VIEW` — Đăng ký nghỉ phép | ✅ | ✅ | ✅ | ✅ |
| `LEAVE_APPROVE` — Duyệt nghỉ phép | ❌ | ✅ | ✅ | ✅ |
| `PRJ_VIEW` — Xem dự án | ✅ | ✅ | ✅ | ✅ |
| `PRJ_CREATE/UPDATE` — Quản lý dự án | ❌ | ✅ | ✅ | ✅ |
| `USER_CREATE` — Tạo tài khoản mới | ❌ | ❌ | ❌ | ✅ |
| `ROLE_VIEW/PERM_VIEW` — Xem RBAC | ✅ | ✅ | ✅ | ✅ |

> Admin có thể tùy chỉnh permission cho từng role qua giao diện **Role > Permission Matrix**.

---

## 📡 API Docs

Swagger UI: `http://localhost:8080/swagger-ui.html`

Một số endpoint thường dùng:

```
POST   /api/auth/login              → Đăng nhập, trả về JWT cookie
POST   /api/auth/logout             → Đăng xuất, xóa cookie
GET    /api/auth/me                 → Lấy thông tin user hiện tại

GET    /api/employees               → Danh sách nhân viên [EMP_VIEW_ALL]
GET    /api/employees/{id}          → Chi tiết nhân viên [EMP_VIEW + ownership]
POST   /api/employees               → Tạo nhân viên [EMP_CREATE]
PATCH  /api/employees/{id}/personal → Cập nhật thông tin cá nhân (chính mình)
GET    /api/employees/export        → Export Excel [EMP_EXPORT]
POST   /api/employees/import        → Import Excel [EMP_IMPORT]

POST   /api/attendance/checkin      → Check-in [ATT_CHECKIN]
POST   /api/attendance/checkout     → Check-out [ATT_CHECKIN]
GET    /api/attendance/my           → Lịch chấm công cá nhân [ATT_VIEW]
GET    /api/attendance/team/summary → Tổng hợp team [ATT_TEAM_VIEW]
POST   /api/attendance/recalculate  → Tính lại chấm công [ATT_IMPORT]

GET    /api/payroll                 → Danh sách lương [PAY_VIEW]
POST   /api/payroll/calculate       → Tính lương tháng [PAY_CALC]

GET    /api/apologies               → Danh sách giải trình
POST   /api/apologies               → Tạo đơn giải trình [APOLOGY_CREATE]
PATCH  /api/apologies/{id}/review   → Duyệt/từ chối [APOLOGY_APPROVE]
```

---

## ⚙️ Biến môi trường

### Backend (`backend/src/main/resources/application.yml`)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/hrm_db?reWriteBatchedInserts=true
    username: postgres
    password: "1234$"
  data:
    redis:
      host: localhost
      port: 6379
      password: "1234$"

jwt:
  secret: hrm-jwt-secret-key-for-local-development-2024-min32chars
  expiration: 86400000        # 24h
  refresh-expiration: 604800000  # 7 ngày

gemini:
  api:
    key: ${GEMINI_API_KEY:your-gemini-api-key-here}
    model: gemini-3-flash
```

> **Gemini API Key:** Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/). Set biến môi trường `GEMINI_API_KEY` hoặc sửa trực tiếp trong `application.yml`.

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 🧪 Quy trình test thủ công

### Test check-in / check-out

1. Login bằng tài khoản nhân viên bất kỳ
2. Vào **Dashboard** → Click **"Chấm công vào"**
3. Kiểm tra trạng thái đổi thành đang làm việc
4. Click **"Chấm công ra"** → Xem tổng giờ làm

### Test giải trình

1. Login nhân viên → Vào **Giải trình** → Tạo đơn
2. Login manager → Vào **Giải trình** → Tab "Chờ duyệt" → Phê duyệt
3. Ngày chấm công tương ứng sẽ chuyển sang trạng thái `APPROVED`

### Test tính lương

1. Login HR → Vào **Bảng lương** → Chọn tháng/năm → Click **"Tính lương"**
2. Kiểm tra phiếu lương của từng nhân viên
3. Export Excel hoặc PDF phiếu lương cá nhân

---

## 🐛 Troubleshooting

### Flyway validation error khi khởi động BE

```
FlywayValidateException: Validate failed ...
```

**Giải pháp:** File migration đã chạy bị thay đổi. Không sửa file migration cũ — chỉ tạo file V{n+1}_ mới.

### CORS error trên Frontend

Kiểm tra `CorsConfig.java` cho phép `http://localhost:3000`. Không thay đổi port FE nếu không cập nhật CORS.

### Redis connection refused

```bash
docker compose up -d  # Đảm bảo Redis đang chạy
docker compose ps     # Kiểm tra status
```

### PostgreSQL authentication failed

Đảm bảo PostgreSQL đang chạy và thông tin trong `application.yml` khớp với database đã tạo.

---

## 📦 Import dữ liệu máy chấm công

File Excel cần có đúng format:

| Cột | Mô tả | Ví dụ |
|---|---|---|
| `employee_id` | UUID nhân viên | `550e8400-e29b-41d4...` |
| `date` | Ngày chấm công | `2024-03-15` |
| `check_in` | Giờ vào | `08:32:00` hoặc `0.354166...` (số thực Excel) |
| `check_out` | Giờ ra | `17:45:00` |

Download file mẫu: **Nhân viên → Import Excel → Tải template mẫu**

---

## 📌 Lưu ý quan trọng

- **Số tiền** — Tất cả lưu dạng `BIGINT` (đơn vị đồng VNĐ), **không dùng Float/Double**.
- **Migration** — Không bao giờ sửa file `V{n}__*.sql` đã chạy. Chỉ tạo file mới.
- **Cookie** — JWT lưu trong `httpOnly cookie`, không dùng `localStorage`.
- **Lương** — Mức giảm trừ gia cảnh: 15.500.000đ/tháng (bản thân) + 6.200.000đ/người phụ thuộc.
- **Chấm công** — Trạng thái `LATE` vẫn tính đủ 1 công (chỉ cảnh báo, không trừ lương trực tiếp).

---

## 🏗️ Môi trường phát triển được kiểm thử trên

- Windows 11
- Java 21 (Temurin/Adoptium)
- Node.js 24.15.0 LTS
- PostgreSQL 16
- Docker Desktop 4.x
