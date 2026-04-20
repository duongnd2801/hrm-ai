# GEMINI.md — Vietnamese HRM System (hrm-app)

> Đọc file này vào đầu mỗi session. Snapshot cuối: **2026-04-17** — `Refinement & UX Patch Completed`.
> Runtime docs: plan → `.gemini/plan.md` | memory → `.gemini/memory.md`

---

## 🤖 Agentic Workflow (BẮT BUỘC)

Mọi task đều đi theo trình tự: **PLAN → APPROVE → CODE → TEST → MEMORY**

### Bước 0 — Khởi tạo ngữ cảnh
- Đọc file này để nắm context tổng thể.
- Đọc `## ✅ Phase Checklist` — xác nhận phase hiện tại, **không tự ý nhảy phase**.
- Đọc `.gemini/memory.md` để biết task đang dở, blockers chưa giải.

### Bước 1 — PLAN (lập kế hoạch)
- Lập kế hoạch chi tiết, in ra chat **và** lưu vào `.gemini/plan.md` theo format bên dưới.
- Kết thúc bằng: *"⏳ Đã tạo plan. Chờ bạn xác nhận 'ok / làm đi' trước khi bắt đầu."*
- **DỪNG — không viết code, không giải thích thêm.**

### Bước 2 — CODE & TEST
- Code từng bước theo đúng thứ tự plan. Sau mỗi bước: tick `[x]` vào `plan.md`, cập nhật `memory.md` (kèm timestamp), báo chat: *"✅ Xong [tên bước]. Tiếp theo: [bước kế]."*
- Không tự ý thay đổi scope — gặp vấn đề phát sinh → **DỪNG, báo human**.
- Sau khi code xong: liệt kê test cases (happy path + edge cases), viết unit test cho service quan trọng, liệt kê bước test manual. **Không sửa feature code trong bước này.**

### Bước 3 — MEMORY
- Cập nhật `.gemini/memory.md` (phase, status, next task, blockers, decisions).
- Tick `✅` vào Phase Checklist trong file này.
- Show diff để human copy lưu nếu cần.

---

### Plan Format

```
### 📋 Plan — [Phase X: Tên task]

**Mục tiêu:** [1 câu]

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | path/to/file | mô tả ngắn |

**Thứ tự:** BE trước / FE trước — [lý do]
**Rủi ro / cần chú ý:** [breaking changes, edge cases, dependency]
**Verify bằng cách:** [endpoint trả gì, UI hiện gì, test pass ra sao]

⏳ Chờ bạn xác nhận trước khi bắt đầu.
```

---

### Hard Rules

| # | Rule |
|---|---|
| 1 | KHÔNG viết code trước khi human xác nhận plan |
| 2 | KHÔNG tự ý thay đổi scope ngoài plan đã duyệt |
| 3 | KHÔNG thay đổi DB schema trực tiếp — phải tạo Flyway migration mới (`V3__...sql`) |
| 4 | KHÔNG simplify logic trong `PayrollService.java` và `AttendanceService.java` |
| 5 | KHÔNG dùng `Float` / `Double` cho tiền — luôn dùng `Long (BIGINT)` |
| 6 | KHÔNG sửa Flyway migration file đã chạy |
| 7 | KHÔNG tự chuyển phase — human phải confirm phase hiện tại chạy đúng trên local |
| 8 | KHÔNG thực hiện nhiều bước workflow trong cùng một lượt phản hồi |

### Kỹ thuật bắt buộc

- **Excel encoding:** Apache POI dùng `BOMInputStream` khi đọc, UTF-8 khi ghi.
- **CORS:** `CorsConfig.java` phải allow `http://localhost:3000`.
- **Spring Security:** mỗi endpoint cần `@PreAuthorize` hoặc check trong service.
- **JWT:** FE lưu token trong `httpOnly cookie` (hoặc `localStorage` cho local demo).

### Vai trò

| Human nói | AI làm |
|---|---|
| mặc định | fullstack (FE + BE) |
| "chỉ FE" | chỉ Next.js/TypeScript — bỏ qua BE context |
| "chỉ BE" | chỉ Spring Boot/Java — bỏ qua FE context |
| "QA" | chỉ viết test và review edge cases, không viết feature code |

---

## ✅ Phase Checklist

| Phase | Nội dung | Status | Notes |
|---|---|---|---|
| Phase 0 | Setup: Spring Boot 3 + Next.js 16 + Flyway schema + JWT auth | ✅ | No Docker — PostgreSQL local |
| Phase 1 | Layout FE: Sidebar + Header + Background + Login page | ✅ | |
| Phase 2 | Cấu hình công ty: CompanyConfig + Phòng ban + Vị trí (có khoá) | ✅ | |
| Phase 3 | Quản lý nhân viên: CRUD + Import/Export Excel + Avatar tự gen | ✅ | |
| Phase 4 | Chấm công: Check-in/out + Calendar view + Chuẩn hóa + Import máy chấm công | ✅ | |
| Phase 5 | Đơn xin tha tội: Tạo (NV) + Duyệt (Manager/HR) + Cập nhật status | ✅ | |
| Phase 6 | Nghỉ phép / OT: Đăng ký + Duyệt | ✅ | |
| Phase 7 | Tính lương: Công thức VN đầy đủ + Bảng lương + Export Excel/PDF | ✅ | |
| Phase 8 | Dashboard: Widget thời tiết + Check-in widget + Thống kê nhanh | ✅ | |
| Phase 9 | Phân quyền hoàn thiện: Menu FE động theo role + Spring Security guards | ✅ | |
| Phase Hardening | Bảo mật: HttpOnly Cookies, CSRF, Security Headers, HS256, @Valid | ✅ | 03/04/2026 |
| Phase Project | Quản lý dự án: CRUD Dự án + Gán nhân sự & Role trong dự án | ✅ | 06/04/2026 |
| Phase RBAC UI | RBAC UI: Permission read-only + CRUD Role + Matrix + Light/Dark theme | ✅ | 09/04/2026 |
| Phase EMP Access | Quyền EMPLOYEE: Chỉ xem & cập nhật thông tin bản thân | ✅ | 17/04/2026 |
| Phase Code Quality | GlobalExceptionHandler + DB Index + Audit Coverage + README JWT fix | ✅ | 17/04/2026 |
| Phase Refinement | UX (Error Boundary, Loading Skeleton), Test AttendanceService, CORS từ yml | ✅ | 17/04/2026 |
| Phase Performance | Redis Caching (Cache-Aside): Tối ưu hóa hiệu năng Config & Stats | ✅ | 20/04/2026 |

> **Rule:** Chỉ chuyển phase khi phase hiện tại chạy đúng trên local. AI không tự chuyển phase.

---

## What We're Building

HRM nội bộ cho công ty — môi trường **local demo**, không cần cloud/CI-CD.

- Quản lý nhân viên: CRUD, phân quyền theo role
- Chấm công theo ngày: calendar view, chuẩn hóa giờ làm
- Đơn xin tha tội: LATE/INSUFFICIENT → Manager duyệt → tính đủ công
- Tính lương tự động: BHXH, BHYT, BHTN, Thuế TNCN lũy tiến
- Import/Export: nhân viên và chấm công từ Excel/CSV
- Phân quyền 4 cấp: EMPLOYEE / MANAGER / HR / ADMIN
- Audit Logging: lưu vết các action nhạy cảm (tính lương, duyệt đơn...)
- Rate Limiting: block IP/Account sau 10 lần đăng nhập sai / 10 phút

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) + TailwindCSS + shadcn/ui |
| Backend | Java 21 + Spring Boot 3 |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL (local) |
| Cache / Rate Limit | Redis 7 (Docker) |
| Auth | Spring Security + JWT (HS256) + Dynamic RBAC |
| Audit Log | `AuditService` → bảng `audit_logs` |
| API Docs | Springdoc OpenAPI (`/swagger-ui.html`) |
| Import/Export FE | SheetJS (xlsx) + Papa Parse + pdf-lib |
| Import/Export BE | Apache POI (batch 100 rows/page) |
| DB Migration | Flyway |
| Build | Maven |
| Container | Docker Compose (Redis + RedisInsight) |

---

## Repository Structure

```
/hrm-app
  /frontend                         → Next.js 16 (TypeScript)
    /app
      /(auth)                       → Login page
      /(dashboard)                  → Các trang chính
        /page.tsx                   → Dashboard
        /employees/
        /attendance/
        /payroll/
        /company/
    /components
    /lib
      /api.ts                       → Axios client + JWT interceptor
      /auth.ts                      → NextAuth config
      /utils.ts                     → Format tiền VNĐ, ngày
    /types/index.ts                 → TypeScript types (mirror BE DTOs)
    /middleware.ts                  → Route guard theo role
    next.config.ts
    .env.local                      → NEXT_PUBLIC_API_URL=http://localhost:8080

  /backend                          → Spring Boot 3 (Java 21)
    /src/main/java/com/hrm
      /config
        /SecurityConfig.java
        /CorsConfig.java
      /controller                   → Auth, Employee, Attendance, Apology, Payroll, Company
      /service
        /AttendanceService.java     → ⚠️ Core logic chấm công
        /PayrollService.java        → ⚠️ Core logic lương VN
        /ApologyService.java
        /ImportExportService.java
      /repository
      /entity
      /dto
      /security
        /JwtTokenProvider.java
        /JwtAuthFilter.java
    /src/main/resources
      /application.yml
      /db/migration/                → V1__init.sql, V2__seed.sql, ...
    pom.xml

  /.gemini/
    settings.json
    frontend.md
    backend.md
    qa.md
    memory.md
  docker-compose.yml
  GEMINI.md
```

---

## Database Schema

```sql
-- RBAC
CREATE TABLE roles       (id UUID PK, name VARCHAR(50) UNIQUE);
CREATE TABLE permissions (id UUID PK, code VARCHAR(50) UNIQUE, module VARCHAR(50));

CREATE TABLE users (
  id UUID PK, email VARCHAR(255) UNIQUE, password VARCHAR(255),
  role_id UUID REFERENCES roles(id), created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (id UUID PK, name VARCHAR(100) UNIQUE);

CREATE TABLE positions (
  id UUID PK, name VARCHAR(100) UNIQUE, description TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  multi_per_dept BOOLEAN DEFAULT TRUE,
  standalone BOOLEAN DEFAULT TRUE
);

CREATE TABLE employees (
  id UUID PK, user_id UUID UNIQUE REFERENCES users(id),
  full_name VARCHAR(255), email VARCHAR(255) UNIQUE,
  phone VARCHAR(20), address TEXT, bio TEXT, gender gender_type,
  citizen_id VARCHAR(20), join_date DATE, birth_date DATE,
  status emp_status DEFAULT 'ACTIVE',
  contract_type contract_type DEFAULT 'FULL_TIME',
  start_date DATE NOT NULL, end_date DATE,
  department_id UUID REFERENCES departments(id),
  position_id   UUID REFERENCES positions(id),
  manager_id    UUID REFERENCES employees(id),   -- self-ref
  base_salary   BIGINT DEFAULT 0,                -- VNĐ
  tax_dependents INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE company_config (
  id VARCHAR(10) PK DEFAULT 'default',
  work_start_time TIME DEFAULT '09:00', work_end_time TIME DEFAULT '18:00',
  lunch_break_start TIME DEFAULT '12:00', lunch_break_end TIME DEFAULT '13:00',
  early_checkin_minutes INT DEFAULT 30,
  standard_hours DECIMAL(4,1) DEFAULT 8.0,
  standard_days_per_month INT DEFAULT 26, cutoff_day INT DEFAULT 10,
  ot_rate_weekday DECIMAL(3,1) DEFAULT 1.5,
  ot_rate_weekend DECIMAL(3,1) DEFAULT 2.0,
  ot_rate_holiday DECIMAL(3,1) DEFAULT 3.0,
  ot_rate_holiday_comp DECIMAL(3,1) DEFAULT 2.0,
  half_day_morning_rate DECIMAL(3,2) DEFAULT 0.4,
  half_day_afternoon_rate DECIMAL(3,2) DEFAULT 0.6,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendances (
  id UUID PK, employee_id UUID NOT NULL REFERENCES employees(id),
  date DATE NOT NULL, check_in TIMESTAMP, check_out TIMESTAMP,
  total_hours DECIMAL(5,2),
  status attendance_status DEFAULT 'PENDING',
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

CREATE TABLE apologies (
  id UUID PK, employee_id UUID NOT NULL REFERENCES employees(id),
  attendance_id UUID UNIQUE NOT NULL REFERENCES attendances(id),
  type apology_type NOT NULL, reason TEXT NOT NULL,
  file_url VARCHAR(500),
  status apology_status DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(id), review_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leave_requests (
  id UUID PK, employee_id UUID NOT NULL REFERENCES employees(id),
  type leave_type NOT NULL, start_date DATE, end_date DATE,
  reason TEXT, status apology_status DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payrolls (
  id UUID PK, employee_id UUID NOT NULL REFERENCES employees(id),
  month INT, year INT,
  base_salary BIGINT, standard_days INT,
  actual_days DECIMAL(5,2), ot_hours DECIMAL(6,2) DEFAULT 0,
  ot_amount BIGINT DEFAULT 0, allowance BIGINT DEFAULT 0,
  gross_salary BIGINT, bhxh BIGINT, bhyt BIGINT, bhtn BIGINT,
  taxable_income BIGINT, income_tax BIGINT, net_salary BIGINT,
  note TEXT, created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);
```

> Tất cả số tiền lưu `BIGINT` (đơn vị đồng VNĐ) — không dùng Float/Double.

---

## Phân quyền Role

| Quyền | EMP | MGR | HR | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Xem / sửa thông tin bản thân (phone, ngày sinh, địa chỉ, bio, giới tính) | ✅ | ✅ | ✅ | ✅ |
| Sửa tên / email | ❌ | ❌ | ✅ | ✅ |
| Check-in / Check-out | ✅ | ✅ | ✅ | ✅ |
| Xem lịch chấm công bản thân | ✅ | ✅ | ✅ | ✅ |
| Gửi đơn xin tha tội | ✅ | ✅ | ✅ | ✅ |
| Xem chấm công toàn team | ❌ | ✅ (team) | ✅ | ✅ |
| Duyệt đơn xin tha tội | ❌ | ✅ (team) | ✅ | ✅ |
| Xem lương bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem lương toàn bộ / Tính lương / Export | ❌ | ❌ | ✅ | ✅ |
| CRUD nhân viên / Import Excel | ❌ | ❌ | ✅ | ✅ |
| Tạo tài khoản mới | ❌ | ❌ | ❌ | ✅ |
| Xem lịch nghỉ lễ | ✅ | ✅ | ✅ | ✅ |
| Cấu hình ngày lễ | ❌ | ❌ | ✅ | ✅ |
| Cấu hình công ty / phòng ban / vị trí / khoá vị trí | ❌ | ❌ | ❌ | ✅ |

---

## Logic Nghiệp Vụ Quan Trọng

### Chuẩn hóa chấm công

```
totalHours = (checkOut - checkIn) - lunchBreakDuration

if totalHours >= standardHours:
    status = LATE      // check-in muộn hơn (workStartTime + earlyCheckinMinutes)
    status = ON_TIME   // ngược lại
if totalHours < standardHours:
    status = INSUFFICIENT
if apology.status == APPROVED:
    status = APPROVED  // ghi đè → tính đủ công

OT = max(0, totalHours - standardHours)
```

### Luồng đơn xin tha tội

```
NV (LATE / INSUFFICIENT) → tạo Apology (loại, lý do, file tuỳ chọn)
  → Manager/HR duyệt  → attendance.status = APPROVED → tính đủ công
  → Manager/HR từ chối → giữ nguyên LATE/INSUFFICIENT → trừ lương
```

### Tính lương (Việt Nam)

```typescript
const dailyRate    = baseSalary / standardDaysPerMonth
// actualDays: đếm ON_TIME + LATE + APPROVED; INSUFFICIENT tính theo tỉ lệ (giờ thực / 8)

const grossSalary  = actualDays * dailyRate + otHours * (dailyRate/8) * otRate + allowance

const bhxh = baseSalary * 0.08
const bhyt = baseSalary * 0.015
const bhtn = baseSalary * 0.01   // tổng BH = 10.5%

const taxableIncome = Math.max(0,
  grossSalary - (bhxh+bhyt+bhtn) - 11_000_000 - taxDependents * 4_400_000
)

// Thuế TNCN lũy tiến 7 bậc (5% → 35%)
const brackets = [
  { limit:  5_000_000, rate: 0.05 },
  { limit: 10_000_000, rate: 0.10 },
  { limit: 18_000_000, rate: 0.15 },
  { limit: 32_000_000, rate: 0.20 },
  { limit: 52_000_000, rate: 0.25 },
  { limit: 80_000_000, rate: 0.30 },
  { limit: Infinity,   rate: 0.35 },
]

const netSalary = grossSalary - (bhxh+bhyt+bhtn) - incomeTax
```

---

## UI / UX Guidelines

- **Theme:** Dark mode mặc định, glassmorphism cho card/widget
- **Font:** Inter hoặc Geist
- **Sidebar:** Collapsible, icon + label, hiển thị theo role
- **Background:** Ảnh phong cảnh mờ
- **Avatar:** Tự gen chữ cái đầu từ tên ("Nguyễn Đình Dương" → "NĐD"), màu theo seed tên
- **Số tiền:** `10.500.000 ₫` | **Ngày tháng:** `DD/MM/YYYY`
- **Calendar chấm công:**
  - Lịch tháng (Th2 → CN); mỗi ô: tổng giờ + `HH:mm → HH:mm`
  - Màu: 🟢 ON_TIME / 🟠 LATE / 🟣 INSUFFICIENT / ✅ APPROVED
  - Badge "✈ Đang xin tha tội" nếu apology PENDING
  - Chưa checkout: `08:32 → ~` | T7/CN: badge "Ngày nghỉ"

---

## Import / Export

| Loại | Mô tả |
|---|---|
| Import nhân viên | Template Excel, upload → validate từng dòng → preview → lưu. Encoding UTF-8 BOM. |
| Import chấm công | Cột `employee_id, date, check_in, check_out` → chuẩn hóa status tự động → báo cáo X/Y/Z |
| Export bảng lương | Excel tất cả nhân viên đầy đủ cột |
| Export phiếu lương | PDF cá nhân |
| Export nhân viên | Excel |

---

## Local Development

```bash
# PostgreSQL (nếu dùng Docker)
docker compose up -d postgres

# Backend
cd backend && ./mvnw spring-boot:run
# → http://localhost:8080  |  Swagger: /swagger-ui.html

# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:3000
```

### Seed accounts (V2__seed.sql)

| Email | Password | Role |
|---|---|---|
| admin@company.com | Admin@123 | ADMIN |
| hr@company.com | Hr@123 | HR |
| manager@company.com | Manager@123 | MANAGER |
| employee@company.com | Emp@123 | EMPLOYEE |

### application.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/hrm_db
    username: hrm_user
    password: hrm_pass
  flyway:
    enabled: true
    locations: classpath:db/migration
jwt:
  secret: your-secret-key-min-32-chars
  expiration: 86400000   # 24h
server:
  port: 8080
```

---

## API Endpoints

```
POST   /api/auth/login | /api/auth/refresh

GET    /api/employees                     HR/Admin
POST   /api/employees                     HR/Admin
GET    /api/employees/{id}
PUT    /api/employees/{id}                HR/Admin
PATCH  /api/employees/{id}/personal       chính mình
POST   /api/employees/import              HR/Admin
GET    /api/employees/export              HR/Admin
GET    /api/employees/template

POST   /api/attendance/checkin
POST   /api/attendance/checkout
GET    /api/attendance/my?month=&year=
GET    /api/attendance/{empId}?month=&year=    Manager+
POST   /api/attendance/import             HR/Admin

POST   /api/apologies
GET    /api/apologies/pending             Manager/HR
PATCH  /api/apologies/{id}/approve
PATCH  /api/apologies/{id}/reject

POST   /api/payroll/calculate?month=&year=    HR/Admin
GET    /api/payroll?month=&year=              HR/Admin
GET    /api/payroll/my?month=&year=
GET    /api/payroll/export?month=&year=       HR/Admin
GET    /api/payroll/{empId}/export-pdf

GET    /api/company/config
PUT    /api/company/config                Admin
GET    /api/company/departments
POST   /api/company/departments           Admin
GET    /api/company/positions
POST   /api/company/positions             Admin
```

---

## File Map

| File | Đọc khi nào |
|---|---|
| `AttendanceService.java` | Core logic chấm công — totalHours, status |
| `PayrollService.java` | Core logic lương VN — BH, thuế TNCN lũy tiến |
| `ApologyService.java` | Luồng duyệt đơn → cập nhật attendance status |
| `ImportExportService.java` | Apache POI Excel |
| `JwtTokenProvider.java` | Tạo + validate JWT |
| `SecurityConfig.java` | Spring Security + role-based endpoint |
| `V1__init.sql` | Full DB schema |
| `V2__seed.sql` | Seed dữ liệu mẫu |
| `frontend/lib/api.ts` | Axios client + JWT interceptor |
| `frontend/.../attendance/page.tsx` | Calendar chấm công |
| `frontend/.../payroll/page.tsx` | Bảng lương + export |

---

## .gemini/ Folder

```
/.gemini/
  settings.json   → workflow rules, hard rules
  frontend.md     → Next.js 16, TypeScript, UI patterns
  backend.md      → Spring Boot 3, Java, JPA, Security
  qa.md           → test cases, edge cases, payroll VN checklist
  memory.md       → session memory (luôn đọc ở Bước 0, luôn update ở Bước 3)
  plan.md         → checklist công việc hiện tại
  spec.md         → toàn bộ đặc tả dự án
```

| Human nói | Agent đọc thêm |
|---|---|
| mặc định | chỉ file này |
| "chỉ FE" | `frontend.md` |
| "chỉ BE" | `backend.md` |
| "QA" | `qa.md` |

---

*v3.2 — 2026-04-17*
