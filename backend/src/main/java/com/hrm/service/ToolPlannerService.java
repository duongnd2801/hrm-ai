package com.hrm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hrm.dto.ChatRequestDto;
import com.hrm.entity.ChatMessage;
import com.hrm.entity.User;
import com.hrm.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Xây dựng prompt cho tool-planner, gọi LlmGateway, parse JSON kế hoạch.
 */
@Service
@RequiredArgsConstructor
public class ToolPlannerService {

    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý HRM nội bộ của công ty. Nhiệm vụ duy nhất của bạn là hỗ trợ các vấn đề nhân sự.
            Chỉ trả lời các chủ đề sau:
            - Lương, thưởng, phụ cấp, bảo hiểm, thuế TNCN
            - Chấm công, ngày công, giờ làm, OT
            - Nghỉ phép, đơn xin nghỉ, giải trình
            - Quản lý dự án, thành viên dự án, vai trò dự án
            - Chính sách công ty (giờ làm, quy định, OT rate)
            - Duyệt/từ chối đơn (nếu có quyền)

            Nếu câu hỏi không thuộc HRM, bạn có thể phản hồi ngắn gọn, lịch sự,
            sau đó chủ động kéo lại các chủ đề HRM.
            Trả lời bằng tiếng Việt, ngắn gọn, chuyên nghiệp.
            """;

    private static final String TOOL_PLANNER_PROMPT = """
        Bạn là trợ lý HRM thông minh. Nhiệm vụ: quyết định có cần gọi tool hay tự trả lời.
        
        CHỈ trả về JSON đúng schema, KHÔNG thêm markdown, KHÔNG giải thích.
        {
          "needTool": true|false,
          "tool": "getMyPayroll|getEmployeePayroll|getMyAttendance|getMyLeaveBalance|getTeamStats|getCompanyPolicy|getUpcomingPublicHolidays|getPendingRequests|getProjects|getProjectMembers|approveRequest|getMySummary|none",
          "arguments": {
            "month": number,
            "year": number,
            "type": "LEAVE|APOLOGY|OT",
            "id": "uuid",
            "action": "APPROVE|REJECT",
            "projectKeyword": "string",
            "employeeKeyword": "string",
            "onlyMyProjects": boolean
          },
          "response": "Trả lời trực tiếp nếu không cần tool."
        }

        ƯU TIÊN TỰ TRẢ LỜI (needTool=false) khi:
        - Câu hỏi mang tính giải thích, hướng dẫn, khái niệm (ví dụ: "OT rate là gì?", "phép năm tính thế nào?")
        - Câu hỏi về quy trình, cách làm (ví dụ: "làm thế nào để xin nghỉ?", "cách giải trình công?")
        - Câu hỏi chung về HRM không cần số liệu cụ thể
        - Câu chào hỏi, hỏi về chatbot, hỏi ngày giờ, tính toán đơn giản
        - Câu follow-up mang tính làm rõ hoặc xác nhận
        - Câu hỏi mà lịch sử hội thoại đã có đủ thông tin để trả lời
        - Câu hỏi về chính sách mà KHÔNG cần số liệu thực tế từ DB (ví dụ: "OT ngày lễ tính thế nào?" → giải thích công thức, không cần gọi tool)

        CHỈ gọi tool khi user cần SỐ LIỆU THỰC TẾ từ hệ thống:
        - Lương/Payroll cụ thể của ai đó → getMyPayroll / getEmployeePayroll
        - Chấm công thực tế tháng nào đó → getMyAttendance
        - Số ngày phép còn lại → getMyLeaveBalance
        - Thống kê team → getTeamStats
        - Cấu hình công ty (giờ làm, OT rate số cụ thể) → getCompanyPolicy
        - Ngày lễ sắp tới → getUpcomingPublicHolidays
        - Đơn chờ duyệt → getPendingRequests
        - Danh sách / thành viên dự án → getProjects / getProjectMembers
        - Duyệt/từ chối đơn → approveRequest

        Hướng dẫn chọn tool (khi bắt buộc phải gọi):
        - Lương cá nhân → getMyPayroll
        - Lương người khác (ADMIN/HR/MANAGER, cần employeeKeyword) → getEmployeePayroll
        - Chấm công cá nhân → getMyAttendance
        - Số dư phép → getMyLeaveBalance
        - Thống kê team → getTeamStats
        - Cấu hình/chính sách số liệu → getCompanyPolicy
        - Ngày lễ → getUpcomingPublicHolidays
        - Đơn chờ duyệt → getPendingRequests
        - Danh sách dự án → getProjects (onlyMyProjects=true nếu hỏi "dự án của tôi")
        - Thành viên dự án → getProjectMembers (trích xuất projectKeyword chính xác, bỏ "người/ai/bao nhiêu/có/dự án")
        - Duyệt/từ chối → approveRequest (cần type, action, id)

        Lưu ý:
        - Nếu user hỏi về ngày giờ hiện tại, dùng Thời gian hiện tại được cung cấp để trả lời trực tiếp.
        - Luôn suy luận month/year/projectKeyword từ lịch sử nếu user không nhắc lại.
        - Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp.
        """;

    private final LlmGateway llmGateway;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    /**
     * Gọi Gemini để quyết định cần tool hay trả lời trực tiếp.
     */
    public PlanDecision decideWithGemini(User user, ChatRequestDto request, String userMessage) {
        if (!llmGateway.isAvailable()) {
            return null; // caller sẽ fallback
        }

        try {
            List<String> historyLines = buildHistoryLines(request, user);

            ObjectNode payload = objectMapper.createObjectNode();
            ArrayNode contents = payload.putArray("contents");
            ObjectNode userContent = contents.addObject();
            ArrayNode parts = userContent.putArray("parts");

            String plannerInput = """
                    %s
                    Vai trò user: %s
                    Thời gian hiện tại: %s
                    Lịch sử gần đây: %s
                    Câu hỏi user: %s
                    """.formatted(
                    TOOL_PLANNER_PROMPT,
                    user.getRole().getName(),
                    LocalDateTime.now(),
                    historyLines,
                    userMessage
            );
            parts.addObject().put("text", plannerInput);

            String rawText = llmGateway.call(payload);
            String jsonText = extractJson(rawText);
            JsonNode node = objectMapper.readTree(jsonText);

            boolean needTool = node.path("needTool").asBoolean(false);
            String tool = node.path("tool").asText("none");
            JsonNode arguments = node.path("arguments").isObject() ? node.path("arguments") : objectMapper.createObjectNode();
            String directResponse = node.path("response").asText("");

            if (needTool && !"none".equals(tool)) {
                return new PlanDecision(true, tool, arguments, null);
            }
            if (!directResponse.isBlank()) {
                return new PlanDecision(false, "none", objectMapper.createObjectNode(), directResponse);
            }
            return null; // caller sẽ fallback
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * Gọi Gemini để tóm tắt kết quả tool thành câu trả lời tự nhiên.
     */
    public String summarizeWithGemini(User user, ChatRequestDto request, String userMessage, String toolName, java.util.Map<String, Object> toolResult) {
        if (!llmGateway.isAvailable()) {
            return null;
        }

        try {
            List<String> historyLines = buildHistoryLines(request, user);

            ObjectNode payload = objectMapper.createObjectNode();
            ArrayNode contents = payload.putArray("contents");
            ObjectNode userContent = contents.addObject();
            ArrayNode parts = userContent.putArray("parts");
            String input = """
                    %s
                    Vai trò user: %s
                    Thời gian hiện tại: %s
                    Câu hỏi user: %s
                    Lịch sử hội thoại: %s
                    
                    Tool đã gọi: %s
                    Dữ liệu thô từ hệ thống (JSON): %s
                    
                    YÊU CẦU:
                    - Trả lời bằng tiếng Việt, phong cách chuyên nghiệp nhưng thân thiện.
                    - Phải sử dụng dữ liệu từ JSON để trả lời. Nếu JSON có thông báo lỗi, hãy giải thích nhẹ nhàng.
                    - Tự động so sánh dữ liệu nếu có lịch sử (ví dụ: tháng này cao hơn tháng trước).
                    - Nếu liệt kê danh sách (nhân viên, dự án...), hãy dùng bullet points.
                    - Nếu dữ liệu rỗng, hãy báo cáo trung thực và hỏi user có muốn cung cấp thêm thông tin không.
                    """.formatted(
                            SYSTEM_PROMPT,
                            user.getRole().getName(),
                            LocalDateTime.now(),
                            userMessage,
                            historyLines,
                            toolName,
                            objectMapper.writeValueAsString(toolResult)
                    );
            parts.addObject().put("text", input);

            String text = llmGateway.call(payload);
            if (text == null || text.isBlank()) {
                return null;
            }
            return text.trim();
        } catch (Exception ex) {
            return null;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    public List<String> buildHistoryLines(ChatRequestDto request, User user) {
        List<String> lines = new ArrayList<>();
        if (request.getHistory() != null && !request.getHistory().isEmpty()) {
            int start = Math.max(0, request.getHistory().size() - 20);
            for (ChatRequestDto.HistoryMessage h : request.getHistory().subList(start, request.getHistory().size())) {
                if (h == null || h.getContent() == null || h.getContent().isBlank()) continue;
                String role = "assistant".equalsIgnoreCase(h.getRole()) ? "Assistant" : "User";
                lines.add(role + ": " + h.getContent().trim());
            }
            return lines;
        }

        List<ChatMessage> dbMessages = chatMessageRepository.findTop20ByUserOrderByCreatedAtDesc(user);
        dbMessages.sort(Comparator.comparing(ChatMessage::getCreatedAt));
        for (ChatMessage m : dbMessages) {
            lines.add((m.isUserMessage() ? "User: " : "Assistant: ") + m.getContent());
        }
        return lines;
    }

    public String extractJson(String text) {
        if (text == null) return "{}";
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```json", "").replaceFirst("^```", "");
            trimmed = trimmed.replace("```", "").trim();
        }
        int first = trimmed.indexOf('{');
        int last = trimmed.lastIndexOf('}');
        if (first >= 0 && last > first) {
            return trimmed.substring(first, last + 1);
        }
        return trimmed;
    }

    // ── Inner types (shared) ────────────────────────────────────────────

    public record PlanDecision(boolean needTool, String toolName, JsonNode arguments, String directResponse) {
    }
}
