## Canonical Project Snapshot (2026-04-03)

Mục tiêu phần này: đọc nhanh trạng thái dự án mà không thay đổi spec gốc.
Toàn bộ nội dung chi tiết bên dưới vẫn được giữ nguyên.

- Project status: `Hardening & Security Phase Completed`
- Current focus:
  - Vận hành ổn định với bảo mật cao (HttpOnly Cookies, CSRF, Security Headers)
  - Hoàn thiện backlog `D14` (import chấm công máy chấm công)
  - Theo dõi phản hồi người dùng sau đợt cập nhật bảo mật
- Canonical runtime docs:
  - Active plan: `.gemini/plan.md` (mục `Canonical Plan Snapshot`)
  - Session memory: `.gemini/memory.md` (mục `Canonical Memory Snapshot`)

---

# GEMINI.md — Vietnamese HRM System (hrm-app)

> File này chứa toàn bộ context của dự án. Đọc file này vào đầu mỗi session.

---

## 🤖 Agent Instructions (ĐỌC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ)

### 📂 THE AGENTIC ROADMAP (QUY TRÌNH BẮT BUỘC)

Dự án này áp dụng mô hình "Lộ trình Agentic" kết hợp Workflow chuẩn (`PLAN → APPROVE → CODE → TEST → MEMORY`). AI PHẢI tuân thủ nghiêm ngặt trình tự này cho mọi task:

**Bước 0: Khởi tạo ngữ cảnh (GEMINI.md & Meta files)**
- Đọc file `GEMINI.md` (chính là file này) để hiểu context tổng thể.
- Đọc `## ✅ Phase Checklist` — xác nhận phase hiện tại, KHÔNG tự ý nhảy phase.
- Đọc bộ nhớ cuối cùng từ file `.gemini/memory.md` để biết đang ở phase nào, task nào còn dở, blocker nào chưa giải. Đọc phần context liên quan đến task sắp làm (schema, API, logic nghiệp vụ).

**Bước 1: OpenSpec (Lập kế hoạch - PLAN & APPROVE)**
- **[PLAN]** AI PHẢI lập kế hoạch chi tiết trước khi làm bất kỳ việc gì. AI in plan ra chat và TẠO FILE `.gemini/plan.md` để lưu lại. Dùng đúng **Plan Format** bên dưới.
- (Lưu ý: file `.gemini/spec.md` là nơi lưu toàn bộ đặc tả/specification của cả dự án, còn `.gemini/plan.md` là check-list công việc hiện tại).
- Sau khi đưa ra plan, AI kết thúc phần trả lời bằng dòng: "⏳ Đã tạo plan. Bạn vui lòng review. Chờ bạn xác nhận 'ok / làm đi' trước khi bắt đầu."
- **AI DỪNG LẠI** — không được viết code, không được giải thích thêm.
  - *↓ Human đọc plan, góp ý / yêu cầu chỉnh nếu cần*
  - *↓ Human nói "ok" / "làm đi" / "approved" để tiếp tục Bước 2*

**Bước 2: Superpowers (Thực thi Chất lượng - CODE & TEST)**
- **[CODE]** AI bắt đầu code từng bước theo đúng thứ tự đã plan ở Bước 1.
- SAU MỖI BƯỚC HOÀN THÀNH: AI phải tích dấu `[x]` vào file `.gemini/plan.md`, đồng thời CẬP NHẬT TRẠNG THÁI vào file `.gemini/memory.md` KÈM THEO THỜI GIAN (timestamp) hiện hành, rồi báo ngắn gọn ở chat: "✅ Xong [tên bước]. Tiếp theo: [bước kế]."
- Tránh thay đổi scope. Nếu gặp vấn đề phát sinh ngoài plan → DỪNG, báo human, không tự ý thay đổi scope.
  - *↓ Human verify từng bước hoặc nói "tiếp" để AI làm bước kế*
- **[TEST]** Sau khi code xong toàn bộ phase/task → chuyển sang test mode.
- AI liệt kê test cases (happy path + edge cases).
- AI viết unit test cho service quan trọng nếu liên quan.
- AI liệt kê các bước test manual để human verify trên local.
- AI KHÔNG sửa feature code trong bước này — chỉ viết test.
  - *↓ Human chạy test local, báo kết quả*

**Bước 3: Beads (Bộ Nhớ Dài Hạn - MEMORY)**
- **[MEMORY]** AI cập nhật file `.gemini/memory.md` (giống như đính thêm 1 hạt cườm vào chuỗi bộ nhớ dài ngày) — phase, status, next task, blockers, decisions, issues.
- Cập nhật dấu `✅` vào bảng Phase Checklist nằm ngay trong file `GEMINI.md` này.
- AI show diff phần đã thay đổi để human copy lưu lại nếu cần.

---

### Plan Format — AI phải dùng đúng format này

```
### 📋 Plan — [Phase X: Tên task]

**Mục tiêu:** [1 câu]

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | path/to/file | mô tả ngắn |
| 2 | ... | ... |

**Thứ tự:** BE trước / FE trước — [lý do]

**Rủi ro / cần chú ý:** [breaking changes, edge cases, dependency]

**Verify bằng cách:** [endpoint trả gì, UI hiện gì, test pass ra sao]

⏳ Chờ bạn xác nhận trước khi bắt đầu.
```

---

### Hard rules — KHÔNG được vi phạm dù bất kỳ lý do gì

- KHÔNG viết code trước khi human xác nhận plan
- KHÔNG tự ý thay đổi scope ngoài plan đã duyệt — phải báo và chờ confirm
- KHÔNG thay đổi DB schema — mọi thay đổi phải tạo Flyway migration mới (`V3__...sql`)
- KHÔNG simplify logic trong `PayrollService.java` và `AttendanceService.java`
- KHÔNG dùng `Float` / `Double` cho tiền — luôn dùng `Long (BIGINT)`
- KHÔNG sửa Flyway migration file đã chạy — chỉ tạo file mới
- KHÔNG tự chuyển sang phase tiếp — human phải confirm phase hiện tại chạy đúng local

### Kỹ thuật bắt buộc

- Excel encoding: Apache POI dùng `BOMInputStream` khi đọc, UTF-8 khi ghi
- CORS: `CorsConfig.java` phải allow `http://localhost:3000`
- Spring Security: mỗi endpoint cần `@PreAuthorize` hoặc check trong service
- JWT: FE lưu token trong `httpOnly cookie` (hoặc `localStorage` cho local demo)

### Vai trò

- **Mặc định:** fullstack (cả FE + BE)
- Nếu human nói **"chỉ FE"** → bỏ qua BE context, chỉ làm Next.js/TypeScript
- Nếu human nói **"chỉ BE"** → bỏ qua FE context, chỉ làm Spring Boot/Java
- Nếu human nói **"QA"** → chỉ viết test và review edge cases, không viết feature code

---

## 📍 Session Memory / Beads

> Kể từ Phase 0 hoàn tất, nội dung này hoàn toàn được move sang file `.gemini/memory.md`. 
> AI hãy luôn đọc file `.gemini/memory.md` ở Bước 0, và luôn update vào đó khi hoàn thành task ở Bước 3.

---

## ✅ Phase Checklist (AI tick khi done — human verify trước khi chuyển phase tiếp)

| Phase | Nội dung | Status | Notes |
|---|---|---|---|
| Phase 0 | Setup: Spring Boot 3 + Next.js 16 + Flyway schema + JWT auth | ✅ | No Docker — PostgreSQL local |
| Phase 1 | Layout FE: Sidebar + Header + Background + Login page (gọi BE /auth/login) | ✅ | |
| Phase 2 | Cấu hình công ty: CompanyConfig + Phòng ban + Vị trí (có khoá) | ✅ | |
| Phase 3 | Quản lý nhân viên: CRUD + Import/Export Excel (Apache POI) + Avatar tự gen | ✅ | |
| Phase 4 | Chấm công: Check-in/out + Calendar view + Chuẩn hóa + Import máy chấm công | ✅ | |
| Phase 5 | Đơn xin tha tội: Tạo đơn (NV) + Duyệt đơn (Manager/HR) + Cập nhật status | ✅ | |
| Phase 6 | Nghỉ phép / OT: Đăng ký + Duyệt | ✅ | |
| Phase 7 | Tính lương: Công thức VN đầy đủ + Bảng lương + Export Excel/PDF | ✅ | |
| Phase 8 | Trang chủ Dashboard: Widget thời tiết + Check-in widget + Thống kê nhanh | ✅ | |
| Phase 9 | Phân quyền hoàn thiện: Menu FE động theo role + Spring Security endpoint guards | ✅ | |
| Phase Hardening | Bảo mật chuyên sâu: HttpOnly Cookies, CSRF, Security Headers, RS256, @Valid | ✅ | Đã hoàn thành 03/04/2026 |
| Phase Project | Quản lý dự án: CRUD Dự án + Gán nhân sự & Role trong dự án (PM, Dev, QA...) | ✅ | Đã hoàn thành 06/04/2026 |
| Phase RBAC UI | RBAC UI Redesign: Permission read-only + CRUD Role + Matrix + Light/Dark theme | ✅ | Đã hoàn thành 09/04/2026 |

**Rule:** Chỉ chuyển phase tiếp khi phase hiện tại chạy đúng local. AI không tự chuyển phase — human confirm.

---

## What We're Building

Một hệ thống quản trị nhân sự (HRM) nội bộ cho công ty, bao gồm:
- Quản lý thông tin nhân viên (CRUD, phân quyền theo role)
- Chấm công theo ngày với calendar view, chuẩn hóa giờ làm
- Xử lý ngoại lệ chấm công: đơn xin tha tội (muộn/thiếu giờ) → Manager duyệt → tự động tính đủ công
- Tính lương tự động theo quy định Việt Nam (BHXH, BHYT, BHTN, Thuế TNCN lũy tiến)
- Import/Export nhân viên và dữ liệu chấm công từ file Excel/CSV
- Phân quyền 4 cấp: Nhân viên / Manager / HR / Admin

**Môi trường hiện tại: Local demo — không cần infra cloud, không cần CI/CD.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) + TailwindCSS + shadcn/ui |
| Backend | Java 21 + Spring Boot 3 (REST API) |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL (Docker local) |
| Auth | Spring Security + JWT (RS256), 4 roles |
| API Docs | Springdoc OpenAPI (Swagger UI tại `/swagger-ui.html`) |
| Import/Export FE | xlsx (SheetJS) + Papa Parse (CSV) + pdf-lib (xuất phiếu lương PDF) |
| Import/Export BE | Apache POI (đọc/ghi Excel server-side) |
| DB Migration | Flyway |
| Build BE | Maven |
| Container | Docker Compose (PostgreSQL + Spring Boot BE + Next.js FE) |

**Lý do tách FE/BE:** Next.js thuần UI, gọi API Spring Boot qua REST. Dễ phát triển độc lập, đúng kiến trúc thực tế.
**Lý do Spring Boot:** Quen Java 10 năm, Spring ecosystem mạnh, JPA/Hibernate handle quan hệ DB tốt.
**Lý do PostgreSQL + Flyway:** Phù hợp dữ liệu quan hệ, migration có version control rõ ràng.

---

## Repository Structure

```
/hrm-app
  /frontend                     → Next.js 16 (TypeScript)
    /app
      /(auth)                   → Login page
      /(dashboard)              → Các trang chính (bảo vệ bởi middleware)
        /page.tsx               → Trang chủ dashboard
        /employees/             → Danh sách + chi tiết nhân viên
        /attendance/            → Calendar chấm công
        /payroll/               → Bảng lương
        /company/               → Cấu hình công ty
    /components                 → Shared UI components
    /lib
      /api.ts                   → Axios client + interceptors (attach JWT)
      /auth.ts                  → NextAuth config (JWT từ Spring BE)
      /utils.ts                 → Format tiền VNĐ, ngày tháng
    /types
      /index.ts                 → TypeScript types (mirror BE DTOs)
    /middleware.ts              → Bảo vệ route theo role
    next.config.ts
    .env.local                  → NEXT_PUBLIC_API_URL=http://localhost:8080

  /backend                      → Spring Boot 3 (Java 21)
    /src/main/java/com/hrm
      /config
        /SecurityConfig.java    → Spring Security + JWT filter
        /CorsConfig.java        → Allow localhost:3000
      /controller
        /AuthController.java
        /EmployeeController.java
        /AttendanceController.java
        /ApologyController.java
        /PayrollController.java
        /CompanyController.java
      /service
        /AttendanceService.java     → Logic chuẩn hóa chấm công
        /PayrollService.java        → Công thức tính lương VN
        /ApologyService.java        → Luồng duyệt đơn xin tha tội
        /ImportExportService.java   → Apache POI Excel
      /repository                   → Spring Data JPA repositories
      /entity                       → JPA entities (@Entity)
      /dto                          → Request/Response DTOs
      /security
        /JwtTokenProvider.java
        /JwtAuthFilter.java
    /src/main/resources
      /application.yml
      /db/migration/                → Flyway SQL (V1__init.sql, V2__seed.sql...)
    pom.xml

  docker-compose.yml              → PostgreSQL + BE (8080) + FE (3000)
  .env.example
  GEMINI.md
```

---

## Database Schema (JPA Entities — Flyway SQL)

```sql
-- V1__init.sql

CREATE TYPE role_type AS ENUM ('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN');
CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE emp_status AS ENUM ('ACTIVE', 'INACTIVE', 'CONTRACT', 'PROBATION', 'COLLABORATOR');
CREATE TYPE contract_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'PROBATION', 'COLLABORATOR');
CREATE TYPE attendance_status AS ENUM ('PENDING','ON_TIME','LATE','INSUFFICIENT','ABSENT','APPROVED','DAY_OFF');
CREATE TYPE apology_type AS ENUM ('LATE','FORGOT_CHECKIN','FORGOT_CHECKOUT','INSUFFICIENT_HOURS');
CREATE TYPE apology_status AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE leave_type AS ENUM ('ANNUAL','OT_LEAVE','SICK','UNPAID','HALF_DAY_AM','HALF_DAY_PM');

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,       -- BCrypt hashed
  role       role_type NOT NULL DEFAULT 'EMPLOYEE',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL      -- DEV1, DEV2, BO, ...
);

CREATE TABLE positions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) UNIQUE NOT NULL,  -- MNG, HEAD, PM, DEV, TEST, ...
  description    TEXT,
  is_locked      BOOLEAN DEFAULT FALSE,          -- chỉ Admin quản lý
  multi_per_dept BOOLEAN DEFAULT TRUE,           -- nhiều người cùng vị trí trong 1 phòng
  standalone     BOOLEAN DEFAULT TRUE            -- có thể không thuộc phòng ban
);

CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id),
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  address         TEXT,
  bio             TEXT,
  gender          gender_type,
  birth_date      DATE,
  status          emp_status DEFAULT 'ACTIVE',
  contract_type   contract_type DEFAULT 'FULL_TIME',
  start_date      DATE NOT NULL,
  end_date        DATE,
  department_id   UUID REFERENCES departments(id),
  position_id     UUID REFERENCES positions(id),
  manager_id      UUID REFERENCES employees(id),  -- self-ref
  base_salary     BIGINT DEFAULT 0,               -- VNĐ, lưu dạng Long
  tax_dependents  INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE company_config (
  id                      VARCHAR(10) PRIMARY KEY DEFAULT 'default',
  work_start_time         TIME DEFAULT '09:00',
  work_end_time           TIME DEFAULT '18:00',
  lunch_break_start       TIME DEFAULT '12:00',
  lunch_break_end         TIME DEFAULT '13:00',
  early_checkin_minutes   INT DEFAULT 30,
  standard_hours          DECIMAL(4,1) DEFAULT 8.0,
  standard_days_per_month INT DEFAULT 26,
  cutoff_day              INT DEFAULT 10,
  ot_rate_weekday         DECIMAL(3,1) DEFAULT 1.5,
  ot_rate_weekend         DECIMAL(3,1) DEFAULT 2.0,
  ot_rate_holiday         DECIMAL(3,1) DEFAULT 3.0,
  ot_rate_holiday_comp    DECIMAL(3,1) DEFAULT 2.0,
  half_day_morning_rate   DECIMAL(3,2) DEFAULT 0.4,
  half_day_afternoon_rate DECIMAL(3,2) DEFAULT 0.6,
  updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  date         DATE NOT NULL,
  check_in     TIMESTAMP,
  check_out    TIMESTAMP,
  total_hours  DECIMAL(5,2),
  status       attendance_status DEFAULT 'PENDING',
  note         TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

CREATE TABLE apologies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES employees(id),
  attendance_id  UUID UNIQUE NOT NULL REFERENCES attendances(id),
  type           apology_type NOT NULL,
  reason         TEXT NOT NULL,
  file_url       VARCHAR(500),
  status         apology_status DEFAULT 'PENDING',
  reviewed_by    UUID REFERENCES users(id),
  review_note    TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leave_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES employees(id),
  type         leave_type NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  reason       TEXT,
  status       apology_status DEFAULT 'PENDING',
  reviewed_by  UUID REFERENCES users(id),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payrolls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id),
  month           INT NOT NULL,                 -- 1-12
  year            INT NOT NULL,
  base_salary     BIGINT NOT NULL,              -- VNĐ
  standard_days   INT NOT NULL,
  actual_days     DECIMAL(5,2) NOT NULL,
  ot_hours        DECIMAL(6,2) DEFAULT 0,
  ot_amount       BIGINT DEFAULT 0,
  allowance       BIGINT DEFAULT 0,
  gross_salary    BIGINT NOT NULL,
  bhxh            BIGINT NOT NULL,
  bhyt            BIGINT NOT NULL,
  bhtn            BIGINT NOT NULL,
  taxable_income  BIGINT NOT NULL,
  income_tax      BIGINT NOT NULL,
  net_salary      BIGINT NOT NULL,
  note            TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);
```

> **Lưu ý:** Tất cả số tiền lưu dạng `BIGINT` (đơn vị đồng VNĐ), không dùng Float/Double để tránh lỗi làm tròn.

---

## Phân quyền Role

| Quyền | EMPLOYEE | MANAGER | HR | ADMIN |
|---|---|---|---|---|
| Xem thông tin bản thân | ✅ | ✅ | ✅ | ✅ |
| Sửa thông tin cá nhân (phone, ngày sinh, địa chỉ, bio, giới tính) | ✅ | ✅ | ✅ | ✅ |
| Sửa tên / email | ❌ | ❌ | ✅ | ✅ |
| Check-in / Check-out | ✅ | ✅ | ✅ | ✅ |
| Xem lịch chấm công bản thân | ✅ | ✅ | ✅ | ✅ |
| Gửi đơn xin tha tội | ✅ | ✅ | ✅ | ✅ |
| Xem chấm công toàn team | ❌ | ✅ (team mình) | ✅ | ✅ |
| Duyệt đơn xin tha tội | ❌ | ✅ (team mình) | ✅ | ✅ |
| Xem lương bản thân | ✅ | ✅ | ✅ | ✅ |
| Xem lương toàn bộ nhân viên | ❌ | ❌ | ✅ | ✅ |
| Tính lương / chạy payroll | ❌ | ❌ | ✅ | ✅ |
| Export bảng lương Excel / PDF | ❌ | ❌ | ✅ | ✅ |
| CRUD nhân viên | ❌ | ❌ | ✅ | ✅ |
| Import nhân viên từ Excel | ❌ | ❌ | ✅ | ✅ |
| Tạo tài khoản mới | ❌ | ❌ | ❌ | ✅ |
| Cấu hình công ty / phòng ban / vị trí | ❌ | ❌ | ❌ | ✅ |
| Khoá/mở vị trí (Position locked) | ❌ | ❌ | ❌ | ✅ |

---

## Logic Nghiệp Vụ Quan Trọng

### Chuẩn hóa chấm công

```
totalHours = (checkOut - checkIn) - lunchBreakDuration

if totalHours >= standardHours (8.0):
  if checkIn > workStartTime + earlyCheckinMinutes:
    status = LATE       // cam — đủ giờ nhưng đến muộn
  else:
    status = ON_TIME    // xanh

if totalHours < standardHours:
  status = INSUFFICIENT // tím

if apology.status == APPROVED:
  status = APPROVED     // ghi đè → tính như đủ công

OT hours = max(0, totalHours - standardHours)
```

### Luồng đơn xin tha tội

```
NV có ngày LATE hoặc INSUFFICIENT
  → Tạo Apology (loại, lý do, file đính kèm tùy chọn)
  → Manager/HR nhận list đơn chờ duyệt
  → Duyệt (APPROVED) → attendance.status = APPROVED → tính đủ công khi tính lương
  → Từ chối (REJECTED) → giữ nguyên LATE/INSUFFICIENT → trừ lương
```

### Tính lương (Việt Nam)

```typescript
// 1. Lương ngày
const dailyRate = baseSalary / standardDaysPerMonth  // VD: 10,000,000 / 26

// 2. Số ngày công thực tế
// Đếm ngày có status = ON_TIME | LATE | APPROVED
// LATE vẫn tính đủ 1 ngày (chỉ cảnh báo, không trừ nếu không có đơn)
// INSUFFICIENT không có đơn → tính theo tỉ lệ giờ thực / 8

// 3. Lương chấm công
const attendanceSalary = actualDays * dailyRate

// 4. Lương OT
const otSalary = otHours * (dailyRate / 8) * otRate

// 5. Tổng thu nhập gộp
const grossSalary = attendanceSalary + otSalary + allowance

// 6. BHXH / BHYT / BHTN (tính trên lương đóng BH = baseSalary)
const bhxh = baseSalary * 0.08
const bhyt = baseSalary * 0.015
const bhtn = baseSalary * 0.01
const totalBH = bhxh + bhyt + bhtn  // 10.5%

// 7. Thu nhập tính thuế
const personalDeduction = 11_000_000
const dependentDeduction = taxDependents * 4_400_000
const taxableIncome = Math.max(0, grossSalary - totalBH - personalDeduction - dependentDeduction)

// 8. Thuế TNCN lũy tiến
function calcIncomeTax(income: number): number {
  const brackets = [
    { limit: 5_000_000,  rate: 0.05 },
    { limit: 10_000_000, rate: 0.10 },
    { limit: 18_000_000, rate: 0.15 },
    { limit: 32_000_000, rate: 0.20 },
    { limit: 52_000_000, rate: 0.25 },
    { limit: 80_000_000, rate: 0.30 },
    { limit: Infinity,   rate: 0.35 },
  ]
  // tính lũy tiến từng bậc
}

// 9. Lương thực nhận
const netSalary = grossSalary - totalBH - incomeTax
```

---

## UI / UX Guidelines

- **Theme:** Dark mode mặc định, glassmorphism cho card/widget
- **Font:** Inter hoặc Geist
- **Sidebar:** Collapsible, icon + label, menu item hiển thị theo role
- **Background:** Ảnh phong cảnh mờ (như app mẫu)
- **Avatar:** Tự gen chữ cái đầu từ tên (VD: "Nguyễn Đình Dương" → "NĐD"), màu ngẫu nhiên theo seed tên
- **Calendar chấm công:**
  - Dạng lịch tháng (Th2 → CN)
  - Mỗi ô: số giờ làm + `HH:mm → HH:mm`
  - Màu chấm: 🟢 xanh / 🟠 cam / 🟣 tím
  - Badge "✈ Đang xin tha tội" nếu có đơn PENDING
  - Ngày chưa checkout: `08:32 → ~`
  - T7/CN: badge "Ngày nghỉ"
- **Số tiền:** Format VNĐ — VD: `10.500.000 ₫`
- **Ngày tháng:** Format DD/MM/YYYY

---

## Import / Export

### Import nhân viên (Excel/CSV)
- Download file template mẫu
- Upload → validate từng dòng (báo lỗi cụ thể)
- Preview bảng trước khi lưu
- Encoding: UTF-8 BOM cho Excel tiếng Việt

### Import chấm công (từ máy chấm công)
- File Excel/CSV: cột `employee_id, date, check_in, check_out`
- Tự động chuẩn hóa status sau import
- Báo cáo: X ngày đủ, Y ngày muộn, Z ngày thiếu giờ

### Export
- Bảng lương tháng → Excel (tất cả nhân viên, đầy đủ cột)
- Phiếu lương cá nhân → PDF
- Danh sách nhân viên → Excel

---

## Local Development

```bash
# Start PostgreSQL
docker compose up -d postgres

# Start backend (Spring Boot)
cd backend
./mvnw spring-boot:run
# → http://localhost:8080
# → Swagger UI: http://localhost:8080/swagger-ui.html

# Start frontend (Next.js)
cd frontend
npm install && npm run dev
# → http://localhost:3000
```

### Tài khoản seed mặc định (V2__seed.sql)

| Email | Password | Role |
|---|---|---|
| admin@company.com | Admin@123 | ADMIN |
| hr@company.com | Hr@123 | HR |
| manager@company.com | Manager@123 | MANAGER |
| employee@company.com | Emp@123 | EMPLOYEE |

### application.yml (local)

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
  expiration: 86400000   # 24h ms
server:
  port: 8080
```

---

## API Endpoints (Spring Boot)

```
POST   /api/auth/login               → trả về JWT token
POST   /api/auth/refresh

GET    /api/employees                → list (HR/Admin)
POST   /api/employees                → tạo mới (HR/Admin)
GET    /api/employees/{id}           → chi tiết
PUT    /api/employees/{id}           → sửa (HR/Admin)
PATCH  /api/employees/{id}/personal  → sửa thông tin cá nhân (chính mình)
POST   /api/employees/import         → import Excel (HR/Admin)
GET    /api/employees/export         → export Excel (HR/Admin)
GET    /api/employees/template       → download file mẫu

POST   /api/attendance/checkin       → check-in
POST   /api/attendance/checkout      → check-out
GET    /api/attendance/my?month=&year=        → lịch của mình
GET    /api/attendance/{empId}?month=&year=   → lịch nhân viên (Manager+)
POST   /api/attendance/import        → import từ máy chấm công (HR/Admin)

POST   /api/apologies                → tạo đơn xin tha tội
GET    /api/apologies/pending        → list đơn chờ duyệt (Manager/HR)
PATCH  /api/apologies/{id}/approve   → duyệt
PATCH  /api/apologies/{id}/reject    → từ chối

POST   /api/payroll/calculate?month=&year=  → tính lương tháng (HR/Admin)
GET    /api/payroll?month=&year=            → bảng lương (HR/Admin)
GET    /api/payroll/my?month=&year=         → lương của mình
GET    /api/payroll/export?month=&year=     → export Excel
GET    /api/payroll/{empId}/export-pdf      → phiếu lương PDF

GET    /api/company/config           → lấy config
PUT    /api/company/config           → cập nhật (Admin)
GET    /api/company/departments
POST   /api/company/departments      → tạo phòng ban (Admin)
GET    /api/company/positions
POST   /api/company/positions        → tạo vị trí (Admin)
```

---

## File Map — AI quan tâm file nào khi làm task gì

| File | Khi nào cần đọc |
|---|---|
| `backend/src/.../service/AttendanceService.java` | **Core logic chấm công** — tính totalHours, xác định status |
| `backend/src/.../service/PayrollService.java` | **Core logic lương VN** — BHXH, BHYT, BHTN, Thuế TNCN lũy tiến |
| `backend/src/.../service/ApologyService.java` | Luồng duyệt đơn xin tha tội → cập nhật attendance status |
| `backend/src/.../service/ImportExportService.java` | Apache POI: đọc/ghi Excel nhân viên + chấm công |
| `backend/src/.../security/JwtTokenProvider.java` | Tạo + validate JWT token |
| `backend/src/.../config/SecurityConfig.java` | Spring Security + role-based endpoint protection |
| `backend/src/main/resources/db/migration/V1__init.sql` | Toàn bộ DB schema (Flyway) |
| `backend/src/main/resources/db/migration/V2__seed.sql` | Seed dữ liệu mẫu |
| `frontend/lib/api.ts` | Axios client + JWT interceptor |
| `frontend/app/(dashboard)/attendance/page.tsx` | Calendar chấm công |
| `frontend/app/(dashboard)/payroll/page.tsx` | Bảng lương + export |

---


---

## 🗂️ .gemini/ Folder — Role Files

Folder `.gemini/` nằm ở root project, chứa context riêng cho từng role. Agent đọc đúng file theo role được assign — không load file của role khác để tiết kiệm context window.

```
/hrm-app
  /.gemini/
    settings.json     → cấu hình chung: model, default role, workflow rules
    frontend.md       → chuyên gia FE: Next.js 16, TypeScript, UI patterns, shadcn
    backend.md        → chuyên gia BE: Spring Boot 3, Java, JPA, Security
    qa.md             → chuyên gia QA: test cases, edge cases, payroll VN checklist
    memory.md        ← ✅ NEW (lưu session memory)
  GEMINI.md           → project overview
```

**Quy tắc load file theo role:**

| Khi human nói... | Agent đọc |
|---|---|
| mặc định / fullstack | GEMINI.md (file này) |
| "chỉ FE" / "frontend" | GEMINI.md + `.gemini/frontend.md` |
| "chỉ BE" / "backend" | GEMINI.md + `.gemini/backend.md` |
| "QA" / "viết test" | GEMINI.md + `.gemini/qa.md` |

---

## 🚀 Phase 0 Bootstrap — Task cuối: Tự generate .gemini/ folder

Sau khi setup Spring Boot + Next.js + Docker Compose xong, **task cuối bắt buộc của Phase 0** là agent tự generate toàn bộ `.gemini/` folder. Agent phải tạo đủ 5 files sau với nội dung được định nghĩa bên dưới. Đây là một bước trong plan Phase 0, phải được human approve trước khi thực hiện.

---

### `.gemini/settings.json`

```json
{
  "project": "hrm-app",
  "version": "1.0",
  "defaultRole": "fullstack",
  "workflow": ["plan", "approve", "code", "test", "memory"],
  "approvalRequired": true,
  "roles": {
    "frontend": ".gemini/frontend.md",
    "backend": ".gemini/backend.md",
    "qa": ".gemini/qa.md",
  },
  "hardRules": [
    "No code before human approves plan",
    "No schema change without new Flyway migration",
    "No Float/Double for money — Long only",
    "No simplify PayrollService or AttendanceService",
    "No edit existing Flyway migration files"
  ]
}
```

---

### `.gemini/frontend.md`

```markdown
# Frontend Expert — hrm-app

> Chuyên gia Next.js 16 + TypeScript. Chỉ đọc file này khi làm FE task.
> Luôn đọc GEMINI.md trước để biết phase hiện tại và workflow rules.

## Stack
- Next.js 16 App Router + TypeScript
- TailwindCSS + shadcn/ui
- Axios (lib/api.ts) — JWT attach qua interceptor
- SheetJS (xlsx) — export Excel phía FE
- pdf-lib — xuất phiếu lương PDF
- Papa Parse — đọc CSV

## Patterns bắt buộc

### Gọi API
- Dùng `lib/api.ts` (Axios instance đã có JWT interceptor) — không gọi fetch trực tiếp
- Xử lý 401 → redirect login, 403 → show "Không có quyền"
- Base URL: `NEXT_PUBLIC_API_URL=http://localhost:8080`

### Auth / Role guard
- Middleware (`middleware.ts`) bảo vệ route `/(dashboard)/*`
- Menu sidebar hiển thị/ẩn theo role từ JWT payload
- Role: EMPLOYEE < MANAGER < HR < ADMIN

### Format dữ liệu
- Tiền VNĐ: `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`
- Ngày tháng: `DD/MM/YYYY`
- Avatar: tự gen chữ cái đầu từ tên (VD: "Nguyễn Đình Dương" → "NĐD"), màu theo seed tên

### UI / UX
- Dark mode mặc định, glassmorphism cho card/widget
- Font: Inter hoặc Geist
- Sidebar: collapsible, icon + label
- Background: ảnh phong cảnh mờ

## Calendar chấm công (quan trọng)
- Dạng lịch tháng (Th2 → CN)
- Mỗi ô: tổng giờ + `HH:mm → HH:mm`
- Màu: 🟢 ON_TIME / 🟠 LATE / 🟣 INSUFFICIENT / ✅ APPROVED
- Badge "✈ Đang xin tha tội" nếu apology status = PENDING
- Ngày chưa checkout: `08:32 → ~`
- T7/CN: badge "Ngày nghỉ"

## Files quan trọng FE
- `frontend/lib/api.ts` — Axios client
- `frontend/lib/auth.ts` — NextAuth config
- `frontend/lib/utils.ts` — format tiền, ngày
- `frontend/types/index.ts` — TypeScript types (mirror BE DTOs)
- `frontend/middleware.ts` — route guard theo role
- `frontend/app/(dashboard)/attendance/page.tsx` — calendar chấm công
- `frontend/app/(dashboard)/payroll/page.tsx` — bảng lương + export
```

---

### `.gemini/backend.md`

```markdown
# Backend Expert — hrm-app

> Chuyên gia Spring Boot 3 + Java 21. Chỉ đọc file này khi làm BE task.
> Luôn đọc GEMINI.md trước để biết phase hiện tại và workflow rules.

## Stack
- Java 21 + Spring Boot 3
- Spring Data JPA + Hibernate
- Spring Security + JWT (RS256)
- Flyway migration
- Apache POI (Excel import/export)
- Springdoc OpenAPI (Swagger tại /swagger-ui.html)
- Maven

## Rules bắt buộc

### Tiền / số
- Tất cả số tiền VNĐ: `Long (BIGINT)` — tuyệt đối không dùng Float/Double
- Tính toán lương xong → round về Long trước khi lưu

### Database
- KHÔNG sửa Flyway file cũ đã chạy
- Mọi thay đổi schema → tạo file mới: `V3__...sql`, `V4__...sql`...
- UUID cho tất cả primary key: `gen_random_uuid()`

### Security
- Mỗi endpoint phải có `@PreAuthorize("hasRole('HR')")` hoặc check role trong service
- JWT filter: `JwtAuthFilter.java` validate token trước mọi request
- CORS: `CorsConfig.java` allow `http://localhost:3000`

### Excel (Apache POI)
- Đọc file: dùng `new BOMInputStream(inputStream)` để handle UTF-8 BOM
- Ghi file: set encoding UTF-8, include BOM cho Excel tiếng Việt

## Core services — KHÔNG được simplify

### AttendanceService.java
- Tính `totalHours = (checkOut - checkIn) - lunchBreakDuration`
- Xác định status: ON_TIME / LATE / INSUFFICIENT / APPROVED
- OT = max(0, totalHours - standardHours)
- Khi apology APPROVED → ghi đè status = APPROVED

### PayrollService.java
- Tính đủ: dailyRate, actualDays, OT, grossSalary
- Trừ BHXH 8% + BHYT 1.5% + BHTN 1% (tính trên baseSalary)
- Giảm trừ bản thân 11tr + người phụ thuộc 4.4tr/người
- Thuế TNCN lũy tiến 7 bậc (5% → 35%)
- netSalary = grossSalary - totalBH - incomeTax

## Files quan trọng BE
- `SecurityConfig.java` — Spring Security + JWT filter chain
- `CorsConfig.java` — allow localhost:3000
- `JwtTokenProvider.java` — tạo + validate JWT
- `AttendanceService.java` — ⚠️ core logic chấm công
- `PayrollService.java` — ⚠️ core logic lương VN
- `ApologyService.java` — luồng duyệt đơn → cập nhật attendance
- `ImportExportService.java` — Apache POI Excel
- `db/migration/V1__init.sql` — full schema
- `db/migration/V2__seed.sql` — seed accounts
```

---

### `.gemini/qa.md`

```markdown
# QA Expert — hrm-app

> Chuyên gia test. Chỉ viết test và review edge cases — không viết feature code.
> Luôn đọc GEMINI.md trước để biết phase hiện tại.

## Nguyên tắc
- Viết unit test cho service trước, integration test sau
- Mỗi phase phải có test checklist riêng trước khi chuyển phase
- Edge cases VN payroll phải test đầy đủ

## Test checklist theo phase

### Phase 0 — Setup
- [ ] Docker Compose up: PostgreSQL, BE, FE đều healthy
- [ ] Flyway migration chạy không lỗi
- [ ] Login với 4 tài khoản seed → nhận JWT hợp lệ
- [ ] Swagger UI accessible tại /swagger-ui.html

### Phase 4 — Chấm công
- [ ] Check-in đúng giờ → status ON_TIME
- [ ] Check-in muộn hơn 30 phút → status LATE
- [ ] Check-out sớm (dưới 8 giờ) → status INSUFFICIENT
- [ ] Chưa checkout → total_hours = null, hiển thị `HH:mm → ~`
- [ ] T7/CN → status DAY_OFF, không cho check-in

### Phase 5 — Đơn xin tha tội
- [ ] NV tạo đơn cho ngày LATE → status PENDING
- [ ] Manager duyệt → attendance.status = APPROVED
- [ ] Manager từ chối → attendance.status giữ nguyên LATE
- [ ] NV không được duyệt đơn của chính mình

### Phase 7 — Tính lương (edge cases VN)
- [ ] Lương cơ bản = 0 → không tính BH, không tính thuế
- [ ] Thu nhập tính thuế âm (sau giảm trừ) → thuế = 0
- [ ] Người phụ thuộc = 3 → giảm trừ 3 × 4.4tr = 13.2tr
- [ ] Ngày công thực tế có OT ngày thường → OT rate 1.5
- [ ] INSUFFICIENT không có đơn → tính theo tỉ lệ giờ thực / 8
- [ ] LATE có đơn APPROVED → tính đủ 1 ngày công
- [ ] Net salary không được âm trong bất kỳ edge case nào

## Unit test template (JUnit 5 + Mockito)
- Test đặt tại: `src/test/java/com/hrm/service/`
- Mock repository bằng `@MockBean` hoặc `Mockito.mock()`
- Assert tiền bằng `assertEquals(expectedLong, actual)` — không dùng delta
```


---

## ⚠️ Quy tắc Chống Bị Đơ (RẤT QUAN TRỌNG)

- KHÔNG BAO GIỜ thực hiện nhiều bước workflow trong cùng một lượt phản hồi
- TUÂN THỦ NGHIÊM NGẶT:
  - LẬP PLAN → DỪNG LẠI (chờ duyệt)
  - CODE → thực hiện từng bước một
  - MEMORY → chỉ cập nhật ở bước cuối cùng

- Bước PLAN (Lập kế hoạch):
  - In plan ra chat để chờ duyệt
  - KHÔNG thay đổi các file code nào khác

- Bước CODE:
  - Chỉ làm 1 task một lúc
  - Thay đổi càng ít file càng tốt (tối đa 10 file)

- Nếu yêu cầu mập mờ (vừa bảo lập plan vừa bảo code) → mặc định CHỈ LẬP PLAN
- Nếu task quá lớn → PHẢI chia nhỏ thành các plan nhỏ hơn trước khi code

---

*Version 3.1 — 26/03/2026 — Agentic AI edition với .gemini/*
