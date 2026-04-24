### 📋 Plan — [Phase Refactoring: Split ChatService]

**Mục tiêu:** Áp dụng Single Responsibility Principle (SRP) bằng cách tách `ChatService.java` (1453 dòng) thành 4 dịch vụ chuyên biệt nhỏ gọn hơn.

**Các bước thực hiện:**
| # | File tạo/sửa | Việc cần làm |
|---|---|---|
| 1 | `backend/src/main/java/com/hrm/service/LlmGateway.java` | [x] Tạo LlmGateway chịu trách nhiệm gọi HTTP đến LLM API (Gemini). |
| 2 | `backend/src/main/java/com/hrm/service/ToolPlannerService.java` | [x] Tạo ToolPlannerService xử lý xây dựng prompt, gọi LlmGateway và parse JSON để lên kế hoạch sử dụng tool. |
| 3 | `backend/src/main/java/com/hrm/service/ToolDispatcherService.java` | [x] Tạo ToolDispatcherService làm switch/case điều phối việc gọi 12 tools từ ChatToolService. |
| 4 | `backend/src/main/java/com/hrm/service/ChatHistoryService.java` | [x] Tạo ChatHistoryService chuyên đảm nhận lưu/lấy lịch sử hội thoại từ DB. |
| 5 | `backend/src/main/java/com/hrm/service/ChatService.java` | [x] Refactor ChatService để inject 4 service trên, đóng vai trò Orchestrator gọi qua lại các bước, xóa bỏ các code logic chi tiết. |

**Thứ tự:** BE trước — vì đây hoàn toàn là quá trình refactoring cấu trúc thư mục/class backend, không ảnh hưởng đến REST API hay FE.
**Rủi ro / cần chú ý:** Đảm bảo luồng data, JSON parsing, và các xử lý lỗi/fallback hiện có không bị gián đoạn. Cần cẩn thận khi di chuyển các bean dependencies `@Autowired` sang các service mới.
**Verify bằng cách:** Chatbot trên giao diện UI vẫn phản hồi trơn tru, gọi đúng tool, lấy dữ liệu chuẩn xác, và backend compile pass (mvn clean compile).

⏳ Chờ bạn xác nhận trước khi bắt đầu.
