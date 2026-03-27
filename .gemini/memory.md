# Session Memory

Quy định: chỉ ghi tiếp (append), không xóa lịch sử cũ.

- Current phase: Done (All phases completed)
- Phase status: Dự án đã hoàn thành các giai đoạn chính và được polish ổn định.
- [Phase 10] Auth Provider & Client Session Synchronization (2026-03-27): Đã tạo AuthProvider, bọc DashboardLayout và chuyển đổi toàn bộ các trang sang useSession để giải quyết lỗi Module Not Found và đồng bộ trạng thái đăng nhập.
- [Phase 7+] Premium UI Overhaul (2026-03-27): Đã cập nhật giao diện "Glass & Glow" cho toàn bộ các trang (Dashboard, Employees, Payroll, Leave, Apologies).
- Next task: Theo dõi phản hồi người dùng hoặc thực hiện bảo trì hệ thống.
- Blockers: Không còn blocker nào đáng kể.

## Decisions log
- Phase 1, 2, 3: đã ổn định.
- Phase 4: đã chạy core check-in/check-out, tạm bỏ import máy chấm công.
- Phase 5, 6, 8: đã có API + UI core.
- Mở quyền xem danh sách nhân viên cho toàn bộ role đã đăng nhập.
- Tài khoản cá nhân chỉ được cập nhật hồ sơ của chính mình.
- Nhân viên đăng nhập lần đầu bắt buộc hoàn thiện hồ sơ cá nhân.

## Activity log
- [2026-03-26T14:18:21+07:00] Thiết lập quy tắc ghi log vào `.gemini/memory.md` và `.gemini/plan.md`.
- [2026-03-26T14:33:21+07:00] Hoàn thành backend Phase 2 (CompanyConfig, Department, Position).
- [2026-03-26T16:16:33+07:00] Hoàn thành frontend Phase 3 (nhân viên, import modal, trang chi tiết).
- [2026-03-27T10:16:22+07:00] Hoàn thành Phase 4 core (chấm công).
- [2026-03-27T10:33:00+07:00] Hoàn thành core Phase 5, 6, 8.
- [2026-03-27T10:58:00+07:00] Nâng cấp UX: một nút chấm công, toast, role-based section, hover info.
- [2026-03-27T11:12:13+07:00] Hoàn thiện quyền xem danh sách nhân viên + ép hoàn thiện hồ sơ lần đầu đăng nhập.
- [2026-03-27T11:18:47+07:00] Khóa cập nhật hồ sơ cá nhân theo đúng chủ tài khoản.
- [2026-03-27T11:41:00+07:00] Chuẩn hóa lại tài liệu `.md` sang UTF-8 tiếng Việt rõ ràng.
- [2026-03-27T13:10:00+07:00] Hoàn thành toàn bộ dự án (Phases 0-9), cập nhật GEMINI.md và .gemini để kết thúc phiên làm việc.
- [2026-03-27T13:20:00+07:00] Nâng cấp giao diện Premium (Slate & Indigo Palette), sửa lỗi typo theme và tối ưu Glassmorphism.
- [2026-03-28T10:00:00+07:00] Đại tu toàn bộ UI/UX theo phong cách "Glass & Glow" với lưới lịch 12 tháng, Sidebar mỏng, Header dạng Pills và sửa lỗi Tiếng Việt có dấu toàn hệ thống.
- [2026-03-28T16:20:00+07:00] Sửa lỗi logic chấm công: Không đánh dấu 'Thiếu giờ' nếu chưa check-out ngày hiện tại. Tích hợp ThemeToggle hỗ trợ chuyển đổi giao diện Sáng/Tối/Hệ thống trơn tru.

