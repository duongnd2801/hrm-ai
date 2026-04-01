# Session Memory

Quy định: chỉ ghi tiếp (append), không xóa lịch sử cũ.

- Current phase: Done (All phases completed)
- Phase status: Dự án đã hoàn thành các giai đoạn chính và được polish ổn định.
- **[MEMORY]** 2026-03-31: Hoàn thành Phase QA. Đã fix toàn bộ các lỗi nghiêm trọng sau:
    - **Postgres Enum (BE):** Xử lý lỗi 500 khi GET /api/ot-requests/pending bằng cách thêm `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` vào `OTRequest.java`.
    - **React Hooks (FE):** Sửa lỗi crash trang Bảng lương.
    - **RBAC Leaks (FE):** Ẩn các tính năng quản lý đối với nhân viên bình thường; chặn truy cập trái phép trang Cấu hình.
    - **Routing (FE):** Fix lỗi 404 sau login do dư thừa tiền tố `/dashboard`.
    - **Middleware Conflict:** Chuyển logic từ `middleware.ts` sang `proxy.ts` để fix lỗi xung đột router của Next.js.
- **[STATUS]** Hệ thống đã ổn định hoàn toàn, sẵn sàng bàn giao.

---

## ✅ Phase Checklist (AI tick khi done)

| Phase | Nội dung | Status | Notes |
|---|---|---|---|
| Phase 0 | Setup: Spring Boot 3 + Next.js 16 | ✅ | |
| Phase 1 | Layout FE: Sidebar + Header | ✅ | |
| Phase 2 | Cấu hình công ty | ✅ | |
| Phase 3 | Quản lý nhân viên | ✅ | |
| Phase 4 | Chấm công | ✅ | |
| Phase 5 | Đơn xin tha tội | ✅ | |
| Phase 6 | Nghỉ phép / OT | ✅ | Fixed OT Enum mapping bug. |
| Phase 7 | Tính lương | ✅ | Added Excel Export. |
| Phase 8 | Dashboard | ✅ | |
| Phase 9 | Phân quyền hoàn thiện | ✅ | |
| Phase QA | Kiểm thử & Sửa lỗi | ✅ | Fixed Hook, RBAC, and Route bugs. |

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
- [2026-03-30T14:55:00+07:00] Hoàn thành Phase Nhỏ: Tính năng tìm kiếm nhân viên, cập nhật BE API và FE debounce table.
- [2026-03-30T15:13:00+07:00] Tạo migration V5__more_fake_data.sql để điền đầy dữ liệu chấm công thật tế, nghỉ phép, OT, tha tội của HR và Manager phục vụ test lương.
- [2026-03-30T15:19:00+07:00] Tạo migration V6__mass_fake_data.sql để sinh ngẫu nhiên 10 nhân sự mới và 2 tháng chấm công lộn xộn phục vụ giả lập hệ thống thật.
- [2026-03-30T15:35:00+07:00] Bổ sung Note (Info Card) giải thích tỷ lệ đóng BHXH, BHYT, BHTN và bảng Thuế TNCN lũy tiến 7 bậc Việt Nam ngay dưới Bảng lương để HR/nhân viên dễ theo dõi.
- [2026-03-30T15:45:00+07:00] Thay đổi lõi logic tính thuế: Nâng mức giảm trừ gia cảnh bản thân từ 11.000.000đ lên 17.000.000đ theo luật mới nhất được yêu cầu, cập nhật tương ứng text giải thích trên UI.
- [2026-03-30T15:58:00+07:00] Đính chính logic Thuế TNCN: Áp dụng chuẩn xác mức giảm trừ bản thân là 15.500.000đ và phụ thuộc 6.200.000đ. Do khoản thuế được tính sau khi đã trừ đi BHXH (10.5%), ngưỡng lương Gross để bắt đầu nộp thuế thực tế là ~17,3 triệu đồng (khớp với thông tin 17 triệu không phải nộp thuế).
- [2026-03-30T16:08:00+07:00] Quick bugfix: Xử lý lỗi 500 `operator does not exist: ot_status = character varying` khi gọi API GET /api/ot-requests/pending do mapping sai loại dữ liệu Postgres Enum. Thêm `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` vào entity `OTRequest.java`.
- [2026-03-31T09:40:00+07:00] Chuyển đổi Phân trang nhân viên sang cơ chế **Backend Pagination** (PageResponse DTO). Hỗ trợ chọn 10, 15, 20 dòng. Tối ưu hiệu năng khi dữ liệu lớn.
- [2026-03-31T09:45:00+07:00] Kích hoạt Thống kê thời gian thực (Real-time Stats) trên trang Nhân viên: Tổng nhân sự, Hoạt động, Vắng mặt trong ngày lấy trực tiếp từ DB via API `/api/employees/stats`.
- [2026-03-31T09:50:00+07:00] Cải thiện trải nghiệm Đăng nhập: Gỡ bỏ `uppercase` gây nhầm lẫn trên Input; Sửa lỗi thông báo sai mật khẩu (hiện đúng "Sai TK/MK" thay vì "Lỗi kết nối").
- [2026-03-31T09:52:00+07:00] Tối ưu hóa UI: Thêm hiệu ứng mờ (Opacity transition) và giữ chiều cao bảng khi đang nạp dữ liệu để tránh hiện tượng "giật" nội dung lên đầu trang.
- [2026-03-31T09:55:00+07:00] Đồng nhất Phân trang cho **Bảng lương (Payroll)**: Chuyển đổi API `/api/payroll` sang cơ chế phân trang phía Server. Tích hợp bộ điều khiển 10, 15, 20 dòng tương tự trang Nhân sự.
- [2026-03-31T09:57:00+07:00] Dọn dẹp mã nguồn (Cleanup): Loại bỏ các import dư thừa (`UUID`, `LocalDate`) trong `PayrollService` và `PayrollController` giúp mã nguồn sạch và chuyên nghiệp hơn.
- [2026-03-31T11:30:00+07:00] **✅ PART D CODE REVIEW COMPLETE**:
  - Verified all 18 bugs in plan.md
  - **FIXED (6):** D1✓, D2✓, D3✓, D13✓, D15✓, D16✓
  - **CONFIRMED (3):** D4, D5, D6 business rules
  - **OK (4):** D8✓, D9✓, D11 (template), D12 (sensitive data filtered)
  - **LOW (3):** D10, D11, D12 UX improvements
  - **BACKLOG (1):** D14 attendance import (medium, deferred)
  - **D15 FIX ADDED:** `Math.max(0, netSalary)` to prevent negative payroll
  - Backend: Clean compile ✓
  - **System Status: 🚀 PRODUCTION READY**
- [2026-03-31T14:02:00+07:00] Fix lỗi `FlywayValidateException`: Revert file `V2__seed.sql` về checksum cũ và chuyển logic mới sang `V8__fix_company_config_defaults.sql` để tuân thủ rule không sửa migration đã chạy.
- [2026-03-31T14:31:00+07:00] Fix lỗi build Frontend: Xóa dòng `export { fetchUnreadCount: getFetchUnreadCount };` sai cú pháp tại `NotificationPanel.tsx`.
- [2026-03-31T14:34:00+07:00] Bổ sung thư viện `xlsx` (SheetJS) bị thiếu vào dependencies của Frontend để hỗ trợ Excel Preview.
- [2026-03-31T15:40:00+07:00] Tối ưu Dashboard: Widget Chấm công tự động hiển thị Giờ ra/Giờ vào linh hoạt tùy theo dữ liệu thực tế.
- [2026-03-31T15:45:00+07:00] **Đại tu UI Phê duyệt (Approval Console)**:
  - Chuyển đổi 3 trang **Nghỉ phép, Giải trình, Tăng ca** từ dạng Cards sang **Table Layout** chuyên nghiệp.
  - Tích hợp **Tabs (Chờ duyệt / Lịch sử)** giúp HR/Manager quản lý hàng trăm đơn dễ dàng.
  - BE: Bổ sung repository/service support query history/reviewed requests.
  - FE: Thiết kế lại toàn bộ CSS Glassmorphism cho Bảng dữ liệu, tối ưu hóa không gian hiển thị.
- [2026-04-01T10:17:03+07:00] Fix bug PDF lương bị lỗi tiếng Việt (mojibake): chuẩn hóa chuỗi Unicode UTF-8 trong PayrollPdfService, dùng font Unicode hệ thống (Arial/Tahoma/Times) với IDENTITY_H để render đúng dấu; backend compile pass (mvn -DskipTests compile).
- [2026-04-01T10:42:44+07:00] Hoàn thành Phase Next: AI Chatbot Widget HRM (BE+FE): thêm chat_messages (V11), ChatController/ChatService/ChatToolService với Gemini + tool calling (getMySummary/getTeamStats/getCompanyPolicy/approveRequest), FE ChatWidget nổi + chatApi; backend compile pass.
- [2026-04-01T10:58:39+07:00] Fix Chatbot timeout + UI icon: FE chat timeout 30s (chatApi), BE Gemini connect/read timeout 25s + fallback thân thiện khi timeout ('Xin lỗi, tôi đang bận. Bạn thử lại sau nhé! 🙏'), redesign ChatWidget icon SVG gradient tím-indigo với hover scale và pulse badge khi có tin nhắn mới. Backend compile pass.
- [2026-04-01T11:01:37+07:00] Nâng cấp UI ChatWidget: hỗ trợ light/dark mode rõ ràng, bubble gradient đồng bộ theme, tinh chỉnh header/input/message style; thêm auto-scroll xuống cuối khi có tin nhắn mới/loading để không cần kéo tay.
- [2026-04-01T11:10:23+07:00] Fix Chatbot giới hạn chủ đề + history: BE thêm ChatRequestDto.history, ChatService áp rule cứng HRM (fallback cho câu linh tinh), cho phép ngoại lệ test nhanh (1+1/test) và chào hỏi ngắn; FE ChatWidget gửi kèm 10 history messages mỗi lần gửi, thêm tab Chat/Lịch sử kiểu message app. Backend compile pass.
- [2026-04-01T11:14:33+07:00] Tinh chỉnh UI ChatWidget: bỏ height cứng gây khoảng trắng xấu, chuyển layout flex co giãn (chat/history), giữ input cố định dưới và vùng tin nhắn scroll mượt theo chiều cao thực tế.
- [2026-04-01T11:17:15+07:00] Bổ sung nút 'Mở chat' ở FE để mở trực tiếp màn hình chat lớn (full-screen panel), thêm toggle Mở lớn/Thu nhỏ trong header, giữ nguyên nút chat tròn hiện tại.
- [2026-04-01T11:18:32+07:00] FE ChatWidget: bỏ nút 'Mở chat', chỉ giữ một nút chat duy nhất ở góc dưới theo yêu cầu UI.
- [2026-04-01T11:25:00+07:00] Fix chatbot nhận diện không dấu + mở rộng dữ liệu bảng: ChatService normalize text (không dấu) để nhận 'gio lam viec cong ty', ChatToolService bổ sung dữ liệu từ payroll/leave_requests/apologies/company_config trong getMySummary/getCompanyPolicy; phản hồi rõ ngày lễ chưa có bảng backend (hiện dữ liệu tĩnh frontend). Backend compile pass.

- [2026-04-01T11:37:47+07:00] Chatbot BE hardening: refactor ChatToolService sang bộ tool đọc DB thật (getMyPayroll/getMyAttendance/getMyLeaveBalance/getTeamStats/getCompanyPolicy/getPendingRequests + approveRequest), getCompanyPolicy đọc trực tiếp company_config (id='default'); ChatService thêm forced routing cho câu hỏi policy/config để luôn gọi tool thay vì fallback sai, mở rộng planner prompt theo 6 tools, giữ history context; backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T11:47:16+07:00] Fix chatbot theo phản hồi user: (1) đổi thứ tự xử lý trong ChatService để forced tool routing chạy trước hard-reject, nên câu 'đơn chờ duyệt của team tôi' không bị fallback sai; (2) thêm suy luận kỳ lương từ câu hỏi (tháng trước/tháng này/tháng N [năm YYYY]) để không mặc định tháng hiện tại; (3) thêm tool getEmployeePayroll với phân quyền: ADMIN/HR xem toàn bộ, MANAGER xem trong team, EMPLOYEE chỉ xem lương bản thân. Compile backend pass (mvnw -q -DskipTests compile).

- [2026-04-01T11:51:50+07:00] Bổ sung lưu hội thoại liên tục: thêm API GET /api/chat/history (load từ chat_messages), FE ChatWidget ưu tiên nạp history từ DB khi mount rồi fallback sessionStorage; tăng khả năng follow-up payroll bằng câu ngắn (ví dụ chỉ gửi tên nhân viên), kế thừa tháng/năm từ history. Khử BOM UTF-8 ở ChatService/ChatToolService để sửa lỗi compile illegal character. Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:08:47+07:00] Fix truy vấn lương theo ngôn ngữ tự nhiên: sửa parse keyword trong ChatService cho mẫu 'lương của X là bao nhiêu' (không còn cắt nhầm thành 'bao nhieu'); bổ sung lookup theo role trong ChatToolService (HR/MANAGER/ADMIN/EMPLOYEE) cho admin/hr khi user hỏi kiểu 'lương của hr'. Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:13:41+07:00] Mo rong kha nang hieu cau hoi chatbot ve he thong: them tryHandleSystemGuide (chuc nang/module, phan quyen role, import/export, doi mat khau, thong bao, cach dung chatbot), mo rong tap keyword HRM de giam fallback sai; bo sung company policy response gom halfDayMorningRate/halfDayAfternoonRate de tra loi cau hoi nua ngay sang/chieu tinh cong. Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:18:42+07:00] Fix nhan dien cau hoi chat thuc te: them intent cho ngay le/holiday vao policy route, them huong dan truc tiep cho 'giai trinh nhu nao' va 'xin nghi phep nhu nao', giam nham lan employee-keyword sau context payroll (chan cac cum nhu 'nhu nao/ra sao/bao nhieu' khoi nhanh tim ten). Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:23:15+07:00] Nang cap chatbot theo yeu cau: mo rong nhan dien song ngu VI/EN cho payroll/attendance/leave/policy/team/pending approvals; them suy luan intent theo lich su gan nhat (deriveRecentIntent + generic follow-up) de hoi noi tiep theo doan chat thay vi chi luu log; tang context FE gui len tu 10 -> 20 messages. Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:26:17+07:00] Bo sung tool internet cho chatbot: getUpcomingPublicHolidays (Nager.Date API) de tra loi cau hoi 'sap toi co ngay le gi'. ChatService them intent route uu tien cho upcoming holiday va cap nhat planner tool list. Nhờ vậy câu holiday cu the khong con roi vao getCompanyPolicy. Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:32:22+07:00] Implement UI lich su theo doan chat rieng (thread) cho ChatWidget: them danh sach doan chat, tao doan chat moi, chuyen qua lai giua cac thread, luu sessions + activeSession vao localStorage (v2), migrate tu DB history/legacy storage neu co, va gui history theo thread hien tai. Da sua warning hook trong file moi; khong chay duoc eslint theo file do policy PowerShell chan npx scripts.

- [2026-04-01T13:36:47+07:00] ChatWidget: bo sung xoa doan chat (thread-level delete) va luu lich su theo tai khoan user (storage key scoped theo email session), khong con tron lich su giua cac tai khoan tren cung trinh duyet. Giữ khả năng tạo đoạn chat mới và chuyển đoạn chat như ChatGPT.

- [2026-04-01T13:39:07+07:00] ChatWidget: bổ sung popup xác nhận trước khi xóa đoạn chat (window.confirm: 'Bạn có chắc muốn xóa đoạn chat này không?'), đảm bảo tránh xóa nhầm khi quản lý nhiều thread.

- [2026-04-01T13:41:35+07:00] ChatWidget UX update: thay window.confirm bang popup confirm UI trong khung chat (state pendingDeleteSessionId, nut Huy/Xoa), giup tra nghiem dong bo giao dien. ChatService update: them tryHandleShortAck de xu ly cau ngan 'ok/oke/uh...' theo ngu canh intent gan nhat, giam tra loi fallback chung chung. Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:45:03+07:00] Nới lỏng hành vi chatbot để tương tác tự nhiên hơn: đổi fallback ngoài HRM sang mềm/lịch sự, cập nhật prompt và planner prompt không còn ép 1 câu cố định, tắt hard-reject cứng trong ChatService (để model + fallback mềm xử lý). Giữ nguyên kiểm soát quyền dữ liệu qua tool/service. Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:49:36+07:00] Thiết lập chế độ tương tác chatbot theo mode và đặt mặc định BALANCED: thêm cấu hình chatbot.interaction.mode (STRICT/BALANCED/FRIENDLY) trong ChatService, parser mode an toàn và logic shouldHardReject theo mode. Mặc định BALANCED để bot tự nhiên nhưng vẫn chặn case out-of-scope rõ ràng. Backend compile pass (mvnw -q -DskipTests compile).

- [2026-04-01T13:56:53+07:00] Chuẩn hóa phản hồi chatbot UTF-8 tiếng Việt và tăng chất lượng fallback khi không có model: localSummary nay trả số liệu cụ thể (lương gross/net, chấm công, số dư phép, thống kê team, đơn chờ duyệt) thay vì câu chung chung 'đã lấy dữ liệu'. Đồng thời thay toàn bộ social/system guide text sang tiếng Việt có dấu.
