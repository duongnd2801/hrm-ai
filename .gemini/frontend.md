# Frontend Expert — hrm-app

> Chuyên gia Next.js 16 + TypeScript. Chỉ đọc file này khi làm FE task.
> Luôn đọc GEMINI.md trước để biết phase hiện tại và workflow rules.

## Stack chính
- Next.js 16 App Router + TypeScript
- TailwindCSS + shadcn/ui
- Axios (lib/api.ts) — interceptor tự attach JWT vào header
- SheetJS (xlsx) — xử lý file Excel phía client
- Lucide React cho Icons

## Quy tắc & Vai trò Frontend
- **Auth Guard:** Middleware/Dashboard layout bảo vệ các route cần đăng nhập. Menu ẩn/hiện tùy vai trò (EMPLOYEE/MANAGER/HR/ADMIN).
- **Trải nghiệm UI (Premium):** Glassmorphism, Dark mode mặc định, Toast thông báo (Sonner/Shadcn), Hover effects mượt.
- **Dữ liệu:** Format tiền tệ Việt Nam `₫`, ngày tháng `DD/MM/YYYY`.
- **Hồ sơ mới:** Bắt buộc ép người dùng hoàn thiện hồ sơ lần đầu đăng nhập.

## Các màn hình hoàn thiện
- **Dashboard:** Biểu đồ, widget chấm công, thống kê nhân viên.
- **Attendance:** Lịch tháng (Calendar view), màu sắc theo trạng thái (Xanh: ON_TIME, Cam: LATE, Tím: INSUFFICIENT).
- **Apologies & Leave:** Form gửi đơn xin tha tội và nghỉ phép, danh sách duyệt.
- **Employees & Detail:** Danh sách và hồ sơ chi tiết nhân viên, hỗ trợ import/export Excel.
- **Configurations:** Chỉnh sửa giờ làm việc công ty, phòng ban, chức vụ.

## Tệp quan trọng FE
- `frontend/lib/api.ts`: Toàn bộ Axios instance và interceptors.
- `frontend/middleware.ts`: Bảo vệ truy cập route.
- `frontend/types/index.ts`: Mirror các DTO từ backend.
- `frontend/components/`: Chứa UI shared logic.
- `tailwind.config.ts`: Cấu hình theme sáng/tối.
