# Test Plan — HRM System Full Feature Testing

> Hệ thống: Next.js FE (localhost:3000) + Spring Boot BE (localhost:8080) 
> Database: PostgreSQL local
> Ngày tạo: 2026-04-06

---

## 1. AUTHENTICATION & AUTHORIZATION (Phase 0 & Hardening)

### 1.1 Login Flow
- [ ] Login với email + password hợp lệ → Nhận JWT token trong httpOnly cookie
- [ ] Login với email không tồn tại → Error "Email không tìm thấy"
- [ ] Login với password sai → Error "Mật khẩu không đúng"
- [ ] Token hết hạn (>24h) → Redirect về login
- [ ] CORS: FE gọi BE từ localhost:3000 → Thành công
- [ ] CORS: Gọi từ domain khác → Bị chặn

### 1.2 Role-based Access Control (RBAC)
- [ ] EMPLOYEE role: Không thấy menu "Quản lý nhân viên", "Tính lương"
- [ ] MANAGER role: Thấy menu "Chấm công team", "Duyệt phép"
- [ ] HR role: Thấy menu "Quản lý nhân viên", "Tính lương"
- [ ] ADMIN role: Thấy tất cả menu
- [ ] Thay đổi user.role db → FE không thấy menu cũ, thấy menu mới (sau login lại)

### 1.3 JWT & Security Headers
- [ ] Response header có `Authorization: Bearer <token>`
- [ ] httpOnly cookie set với secure flag trên HTTPS
- [ ] CSRF token trong form khi POST
- [ ] Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`

---

## 2. EMPLOYEE MANAGEMENT (Phase 3)

### 2.1 CRUD Employee (HR/Admin only)
- [ ] Tạo nhân viên mới:
  - Điền đầy đủ thông tin (tên, email, điện thoại, ngày sinh...)
  - → Sinh tài khoản email + tạo User role=EMPLOYEE
  - → Avatar tự gen từ tên (3 chữ cái đầu)
- [ ] Sửa nhân viên:
  - EMPLOYEE/MANAGER: Chỉ sửa được (phone, address, bio, gender, birth_date)
  - HR/ADMIN: Sửa được tất cả (tên, email, department, position, base_salary...)
- [ ] Xóa nhân viên: Chỉ ADMIN
  - Soft delete (set status=INACTIVE) không xóa database
- [ ] Lọc / Tìm kiếm: Theo department, position, status

### 2.2 Employee List & Avatar
- [ ] Mỗi employee row hiển thị: Avatar + Tên + Email + Dept + Position + Salary
- [ ] Avatar custom: NV "Nguyễn Đình Dương" → "NĐD", màu khác nhau theo ID
- [ ] Click row → Xem chi tiết → Sửa (nếu có quyền)

### 2.3 Import/Export Excel
- [ ] Export danh sách nhân viên → File Excel (Apache POI, UTF-8)
  - Columns: STT, Tên, Email, Điện thoại, Ngày sinh, Địa chỉ, Phòng ban, Vị trí, Lương CB
- [ ] Import từ Excel:
  - Upload file → Parse SHA256
  - Validation: Email duy nhất, điền đủ tên/email
  - Insert batch → Thành công? Error log?
  - Test dùng file .xlsx + file .csv

### 2.4 Pagination
- [ ] Danh sách nhân viên: 10 rows/page
- [ ] Navigation: [◀ 2 / 5 ▶] PAGE X / Y
- [ ] Change rows/page: 10, 15, 20 (if HR/ADMIN)

---

## 3. ATTENDANCE MANAGEMENT (Phase 4)

### 3.1 Check-in / Check-out
- [ ] Employee click "Check-in" → Ghi nhận timestamp
  - Backend: POST `/api/attendance/checkin` → Lưu vào attendance.check_in
  - UI: Hiển thị "Đã check-in lúc 08:32", nút thành "Check-out"
- [ ] Employee click "Check-out" → Ghi nhận checkout
  - Backend: PATCH `/api/attendance/:id/checkout`
  - UI: Hiển thị "08:32 → 17:45 (9h 13m)"
- [ ] Không thể check-in 2 lần trong 1 ngày (nếu đã check-in hôm nay)
- [ ] Ngày nghỉ phép (leave approved) → Nút check-in disable, hiển thị "Đang xin nghỉ"

### 3.2 Attendance Status Normalization
- [ ] ON_TIME: Check-in ≤ 08:30 + đủ 8h → Status = ON_TIME 🟢
- [ ] LATE: Check-in > 08:30 nhưng ≥ 8h → Status = LATE 🟠
- [ ] INSUFFICIENT: < 8 giờ, không có apology → Status = INSUFFICIENT 🟣
- [ ] APPROVED: apology APPROVED → Status = APPROVED ✅ (không trừ lương)
- [ ] Trừ lunch break (12:00-13:00) tự động

### 3.3 Calendar View Chấm công
- [ ] Hiển thị lịch tháng (Thứ 2 → CN)
- [ ] Mỗi ô ngày: 
  - "08:32 → 17:45" (giờ check-in → checkout)
  - Màu nền: 🟢 (ON_TIME), 🟠 (LATE), 🟣 (INSUFFICIENT), ✅ (APPROVED)
- [ ] Ngày T7/CN: Badge "Ngày nghỉ"
- [ ] Ngày có apology chờ duyệt: Badge "⏳ Chờ duyệt"
- [ ] Click ngày → Chi tiết + Form gửi apology (nếu cần)

### 3.4 Team Attendance View (Manager/HR)
- [ ] Manager: Xem lịch check-in/out của team mình
  - View theo: List (mỗi NV = 1 row) hoặc Grid (lịch tháng)
- [ ] HR: Xem tất cả nhân viên
- [ ] Filter: Theo ngày, theo status, theo NV

### 3.5 Import Máy Chấm Công
- [ ] Upload file CSV/Excel từ máy chấm → Parse timestamp
  - Format expected: EmployeeID | Date | Time | (Check-in/out)
- [ ] Validation:
  - Employee ID tồn tại
  - Timestamp hợp lệ
- [ ] Batch insert vào attendance table
- [ ] Log: Import thành công / Lỗi từng row

---

## 4. APOLOGY / XIN THA TỘI (Phase 5)

### 4.1 Submit Apology (Employee)
- [ ] NV có ngày LATE/INSUFFICIENT
  - Click ngày → Form "Gửi đơn xin tha tội"
  - Chọn loại: LATE, FORGOT_CHECKIN, FORGOT_CHECKOUT, INSUFFICIENT_HOURS
  - Điền lý do (text)
  - Tùy chọn: Upload file (hình ảnh / giấy tờ)
  - Submit → Backend: POST `/api/apologies`
- [ ] Apology status = PENDING (chờ duyệt)

### 4.2 Approve/Reject Apology (Manager/HR)
- [ ] Manager: Xem list "Đơn chờ duyệt" của team mình
  - Danh sách: Tên NV | Ngày | Loại | Lý do | [Duyệt] [Từ chối]
- [ ] Click "Duyệt":
  - Backend: PATCH `/api/apologies/:id` → status = APPROVED
  - Tự động: attendance.status = APPROVED (không trừ lương)
- [ ] Click "Từ chối":
  - status = REJECTED
  - Ghi note (optional: "Lý do từ chối")
  - attendance.status = LATE/INSUFFICIENT (trừ lương)
- [ ] HR: Xem tất cả apologies
- [ ] Audit: reviewed_by = current user, updated_at

### 4.3 Notification
- [ ] Khi apology được duyệt: NV nhận thông báo ✅
- [ ] Khi apology bị từ chối: NV nhận thông báo ❌

---

## 5. LEAVE REQUESTS (Phase 6)

### 5.1 Submit Leave Request (Employee)
- [ ] Employee: Menu "Xin nghỉ phép"
- [ ] Form:
  - Loại: ANNUAL | OT_LEAVE | SICK | UNPAID | HALF_DAY_AM | HALF_DAY_PM
  - Ngày bắt đầu / kết thúc
  - Lý do (optional)
  - Submit → POST `/api/leave-requests`
- [ ] Leave status = PENDING

### 5.2 Leave Balance
- [ ] GET `/api/leave-requests/balance?year=2026`
  - ANNUAL: X ngày (set bằng CompanyConfig hoặc cố định 12 ngày/năm)
  - OT_LEAVE: Y ngày (tích lũy từ OT hours)
  - Display: "Phép năm: 10 / 12 | OT: 5 / 20"

### 5.3 Approve/Reject Leave (Manager/HR)
- [ ] Manager: Duyệt đơn của team
- [ ] HR/ADMIN: Duyệt tất cả
- [ ] Duyệt → status = APPROVED → Cập nhật attendance các ngày leave (status = DAY_OFF)
- [ ] Từ chối → status = REJECTED

### 5.4 Leave on Calendar
- [ ] Attendance calendar: Ngày leave → Hiển thị "🏖 Nghỉ phép", không show check-in
- [ ] Badge "Approved" nếu đơn được duyệt

---

## 6. PAYROLL CALCULATION & EXPORT (Phase 7)

### 6.1 Calculate Payroll (HR/ADMIN only)
- [ ] Menu: "Tính lương" → Chọn tháng/năm → Click "TÍNH LƯƠNG"
  - Backend: POST `/api/payroll/calculate?month=4&year=2026`
  - Logic:
    - Duyệt tất cả employee có status=ACTIVE
    - Tính attendance days (count ON_TIME + LATE + APPROVED)
    - Tính OT hours (sum total_hours > 8)
    - Áp dụng công thức tính lương VN
    - Insert vào payroll table
  - Validation:
    - Lương đã tính tháng này? → Ask "Tính lại?"
- [ ] After calc: Show "✅ Đã tính lương cho 50 nhân viên"

### 6.2 Payroll List & Export
- [ ] Xem bảng lương tháng X/YYYY
  - Columns: STT | Tên | Lương CB | Công | OT | Tổng Thu | BHXH | Thuế | Thực nhận
  - Pagination: 10/15/20 rows
- [ ] Export to Excel:
  - Button: [📥 EXCEL]
  - File: `bang_luong_4_2026.xlsx`
  - Format: Header + Data rows + Summary row (Total, Average)
  - Encoding: UTF-8
- [ ] Export Individual Statement (PDF):
  - Per-employee: Button [📄 PDF]
  - Content: Logo + Tên NV + Tháng/Năm + Chi tiết lương + Chữ ký
  - PDF lib: pdf-lib hoặc native FE rendering → html2pdf

### 6.3 Personal Payroll View (Employee)
- [ ] Employee: Menu "Lương" → Xem lương tháng đó
  - Show: Base salary + Công thực + OT + Lương gộp + BHXH + Thuế + Thực nhận
  - Button: [PDF] Tải phiếu lương

### 6.4 Payroll Formula Validation
- [ ] Test case: NV có base_salary = 10,000,000, làm 22 ngày, OT 10h
  - dailyRate = 10M / 26 = 384,615
  - attendanceSalary = 22 * 384,615 = 8,461,530
  - otAmount = 10 * (384,615 / 8) * 1.5 = 722,165
  - grossSalary = 8,461,530 + 722,165 = 9,183,695
  - BHXH = 10M * 0.08 = 800,000
  - BHYT = 10M * 0.015 = 150,000
  - BHTN = 10M * 0.01 = 100,000
  - taxableIncome = 9,183,695 - 1,050,000 - 11,000,000 - 0 = Max(0, -2,866,305) = 0
  - incomeTax = 0
  - netSalary = 9,183,695 - 1,050,000 - 0 = 8,133,695
  - ✅ Verify từng bước

### 6.5 Recursive Brackets Tax
- [ ] Test với multiple income levels:
  - Income = 20M (applies multiple brackets)
  - Tax = bracket1 (5M) * 5% + bracket2 (5M) * 10% + bracket3 (10M) * 15%
  - = 250k + 500k + 1.5M = 2.25M ✅

---

## 7. COMPANY CONFIGURATION (Phase 2)

### 7.1 CompanyConfig (ADMIN only)
- [ ] Admin: Menu "Cấu hình"
- [ ] Form:
  - work_start_time: 09:00
  - work_end_time: 18:00
  - lunch_break: 12:00 - 13:00
  - early_check_in_minutes: 30
  - standard_hours: 8.0
  - standard_days_per_month: 26
  - OT rates: Weekday 1.5x, Weekend 2x, Holiday 3x
  - Save → Cập nhật DB
- [ ] Changes apply immediately (no cache)

### 7.2 Department CRUD
- [ ] Admin: "Quản lý phòng ban"
  - [ ] Add department: Tên (unique) → POST `/api/departments`
  - [ ] Edit: Tên department
  - [ ] Delete (soft): Không xóa NV trong phòng
  - [ ] List: All departments
- [ ] Filter employee by department

### 7.3 Position CRUD
- [ ] Admin: "Quản lý vị trí"
  - [ ] Add position:
    - Tên (unique)
    - Mô tả (optional)
    - Checkbox: "Khoá position" (chỉ admin mở)
    - Checkbox: "Cho phép nhiều người cùng vị trí"
  - [ ] Edit / Delete
  - [ ] Permission: Khoá = ADMIN only can assign
- [ ] Loại vị trị: MNG, HEAD, PM, DEV, QA, TEST, ...

---

## 8. DASHBOARD (Phase 8)

### 8.1 Dashboard Home
- [ ] Logged-in user thấy:
  - Hero: "Nhân viên" / "Quản lý" (tuỳ role)
  - Widget: "Check-in hôm nay" (nếu chưa check-in → [Clik để check-in])
  - Widget: "Lương tháng này"
  - Widget: "Phép còn lại"
  - Widget: Thời tiết (API openweathermap.org hoặc mock)
  - Widget: "Ngày lễ sắp tới"

### 8.2 Performance Stats (Manager/HR)
- [ ] Manager: Widget "Team Stats"
  - Số nhân viên: X
  - Hôm nay check-in: Y/X (%)
  - Đơn chờ duyệt: Z
  - Lương tháng: Tổng + TB
- [ ] HR/ADMIN: Tạo dashboard toàn công ty

### 8.3 Theme Toggle
- [ ] Dark/Light mode switch → Update CSS variables
- [ ] Persist setting in localStorage

---

## 9. PROJECT MANAGEMENT (Phase Project - 06/04/2026)

### 9.1 Project CRUD
- [ ] Admin/Manager: Menu "Dự án"
- [ ] Create:
  - Tên dự án (unique)
  - Mã dự án (unique, uppercase)
  - Mô tả
  - Trạng thái: ACTIVE | COMPLETED | ON_HOLD
  - Ngày bắt đầu / kết thúc
  - POST `/api/projects`
- [ ] Edit / Delete (soft)
- [ ] List projects
  - Pagination
  - Filter by status

### 9.2 Project Members (CRUD)
- [ ] Assign member to project:
  - Select employee
  - Select role: PM | DEV | QA | TESTER | BA | OTHER
  - POST `/api/projects/:id/members`
- [ ] Update member role
- [ ] Remove member from project

### 9.3 Project Members Query (Chat Feature)
- Test cases từ user request:
  - [ ] "Du an AI_UNIT co bao nhieu nguoi" → "Dự án AI_UNIT có 1 người."
  - [ ] "du an AI Chatbot Trợ Lý Mua Sắm có bao nhiều người" → "Dự án ... có 5 người."
  - [ ] "Du an AI_BOT co nhung ai" → List members
  - [ ] "Du an AI_BOT co so nguoi" → "Dự án ... có 5 người." (count not list)

---

## 10. CHAT FUNCTIONALITY (AI Chatbot)

### 10.1 Chat Widget
- [ ] Chat window visible trong app (bottom-right)
- [ ] User send message → POST `/api/chat/message`
- [ ] Backend nhận message → Xử lý intent + Gọi tool phù hợp

### 10.2 Chat Tools (Function Calling)
- [ ] getMyPayroll: "Lương tháng này bao nhiêu?"
- [ ] getMyAttendance: "Công thực tháng này?"
- [ ] getProjectMembers: "Dự án X có bao nhiêu người?"
- [ ] getProjects: "Có những dự án nào?"
- [ ] getMySummary: "Tóm tắt thông tin của tôi"
- [ ] getTeamStats: (Manager) "Team tôi như thế nào?"

### 10.3 Vietnamese Text Processing (Xữ lý NLP)
- [ ] Normalize Vietnamese diacritics (Trợ → tro, Cắm → cam)
- [ ] Extract meaningful keywords từ noisy queries
- [ ] Detect intent: count vs list vs specific query
- [ ] Test cases:
  - "du an HRM_2026 co bao nhieu nguoi" → Extract "HRM_2026", Detect count intent
  - "du an AI Chatbot Trợ Lý Mua Sắm có bao nhiều người" → Extract name, Find by normalization
  - "nhung ai lam trong du an AI_UNIT" → Extract "AI_UNIT", Detect member list intent

---

## 11. UI/UX & DESIGN

### 11.1 Layout
- [ ] Sidebar | Left navigation (collapsible)
- [ ] Header | Top bar (user profile, logout, theme toggle)
- [ ] Main content area | Right side
- [ ] Background | Gradient + image blur

### 11.2 Colors & Typography
- [ ] Status colors:
  - ON_TIME: 🟢 Emerald-500
  - LATE: 🟠 Amber-500
  - INSUFFICIENT: 🟣 Purple-500
  - APPROVED: ✅ Green-600
- [ ] Font: Inter / Geist, responsive

### 11.3 Responsive Design
- [ ] Desktop (1024px+): Full sidebar + main
- [ ] Tablet (768-1024): Collapsible sidebar
- [ ] Mobile (<768): Hamburger menu

### 11.4 Accessibility
- [ ] Tab navigation works
- [ ] Color contrast WCAG AA
- [ ] Form labels + aria-label
- [ ] Loading states

---

## 12. DATA VALIDATION & ERROR HANDLING

### 12.1 Input Validation (FE)
- [ ] Email format: valid@example.com
- [ ] Phone: digits only
- [ ] Date: valid date picker
- [ ] Number: >= 0, max length

### 12.2 Backend Validation (@Valid, custom validators)
- [ ] Duplicate email → 409 Conflict
- [ ] Invalid date range → 400 Bad Request
- [ ] Unauthorized access → 403 Forbidden
- [ ] Resource not found → 404 Not Found

### 12.3 Error Messages
- [ ] User-friendly error messages in Vietnamese
- [ ] Toast notifications for success/error/warning
- [ ] Validation error under form field

---

## 13. PERFORMANCE & OPTIMIZATION

### 13.1 Database
- [ ] Indexes on: employee.email, attendance.employee_id+date, payroll.employee_id+month+year
- [ ] Query: Get 1 employee attendance month → < 100ms
- [ ] Batch insert payroll 100 employees → < 2s

### 13.2 Frontend
- [ ] Bundle size: < 500KB (gzipped)
- [ ] First Contentful Paint: < 2s
- [ ] Lighthouse score: > 80

### 13.3 API Response Time
- [ ] GET /api/employees (pagination 10): < 500ms
- [ ] POST /api/payroll/calculate (100 emp): < 5s
- [ ] GET /api/attendance/calendar/:month: < 1s

---

## 14. SECURITY TESTING

### 14.1 Authentication & Authorization
- [ ] SQL Injection: Try `'; DROP TABLE users; --` → Safe
- [ ] XSS: Try `<script>alert('xss')</script>` in name field → Escaped
- [ ] CSRF: POST without token → Blocked
- [ ] JWT Expiry: Old token → Rejected, redirect login
- [ ] Token tampering: Modify payload → Invalid signature

### 14.2 Access Control
- [ ] Employee cannot view HR menu items
- [ ] Employee cannot access `/api/payroll` (HR only)
- [ ] Non-manager cannot view team attendance
- [ ] Soft-deleted employee not shown in list (status=INACTIVE)

### 14.3 Data Privacy
- [ ] Salary data: Encrypted in transit (HTTPS)
- [ ] Password: BCrypt hashed (not plaintext)
- [ ] Personal data: Only accessible by self / manager / HR / Admin
- [ ] Export Excel: Downloaded via browser, not stored server-side

---

## 15. MANUAL TEST CHECKLIST

### Run locally:
```bash
# Terminal 1: Backend
cd backend
mvn spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Database (if Docker)
docker-compose up postgres
```

### Create test data:
```sql
-- Insert test users + employees
INSERT INTO users (email, password, role) VALUES 
  ('emp1@test.com', '$2a$10$...', 'EMPLOYEE'),
  ('mgr1@test.com', '$2a$10$...', 'MANAGER'),
  ('hr1@test.com', '$2a$10$...', 'HR'),
  ('admin1@test.com', '$2a$10$...', 'ADMIN');

-- Insert employees with managers, departments, etc.
-- Insert attendance records for March → April
-- Insert payrolls for previous months
```

### Test scenarios by role:
1. **Login as EMPLOYEE:**
   - Check-in / Check-out today
   - View own attendance calendar
   - Submit apology
   - View own payroll
   - Request leave
   - NO: Cannot view other NV info

2. **Login as MANAGER:**
   - View team attendance
   - Approve apologies for team
   - NO: Cannot calculate payroll

3. **Login as HR:**
   - CRUD employees
   - View all payroll
   - Calculate payroll
   - Approve all apologies
   - Configuration

4. **Login as ADMIN:**
   - All features + Configure company settings

---

## 16. REGRESSION TESTING (After Updates)

After each fix/feature:
- [ ] Run unit tests: `mvn test`
- [ ] Manual smoke test: Login → Dashboard → Check-in → View calendar → Export payroll
- [ ] Check console for errors (BE logs + FE console)
- [ ] Database query performance (check slow queries)

---

## Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ⏳ | Pending manual test |
| Employee Management | ⏳ | Pending manual test |
| Attendance | ⏳ | Pending manual test |
| Apology/Leave | ⏳ | Pending manual test |
| Payroll | ⏳ | Pending manual test |
| Projects | ⏳ | Pending manual test |
| Chat | ⏳ | Pending manual test |
| Security | ⏳ | Pending security audit |
| Performance | ⏳ | Pending load testing |
| Responsive Design | ⏳ | Pending manual test |

---

## Notes
- Thử test từng feature 1 lần
- Report bugs → Update `.gemini/memory.md`
- Capture screenshots/videos nếu có issue
- Test trên multiple browsers (Chrome, Firefox, Safari)
- Test trên mobile device (iOS Safari, Android Chrome)
