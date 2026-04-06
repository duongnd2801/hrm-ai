package com.hrm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hrm.dto.ChatHistoryItemDto;
import com.hrm.dto.ChatRequestDto;
import com.hrm.dto.ChatResponseDto;
import com.hrm.entity.ChatMessage;
import com.hrm.entity.RoleType;
import com.hrm.entity.User;
import com.hrm.repository.ChatMessageRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final String FRIENDLY_BUSY_MESSAGE = "Xin lỗi, tôi đang bận. Bạn thử lại sau nhé!";
    private static final String NON_HRM_FALLBACK = "Mình ưu tiên hỗ trợ nghiệp vụ HRM. Nếu bạn cần, mình có thể trả lời ngắn rồi quay lại lương, công, phép, OT hoặc chính sách.";

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
            Bạn đang ở chế độ function-calling cho hệ thống HRM.
            Nhiệm vụ: Phân tích ý định người dùng và chọn tool phù hợp. 
            
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
              "response": "nội dung trả lời nếu không cần gọi tool"
            }
            
            Hướng dẫn chọn tool:
            - Lương/Phiếu lương cá nhân: getMyPayroll.
            - Lương người khác (ADMIN/HR/MANAGER): getEmployeePayroll (cần employeeKeyword).
            - Chấm công/Giờ làm/Đi muộn cá nhân: getMyAttendance.
            - Nghỉ phép/Số dư phép: getMyLeaveBalance.
            - Thống kê team/Đơn từ team: getTeamStats.
            - Chính sách/Giờ làm/Quy định/OT rate: getCompanyPolicy.
            - Ngày lễ: getUpcomingPublicHolidays.
            - Đơn chờ duyệt: getPendingRequests.
            - DANH SÁCH DỰ ÁN (liệt kê tên, mã, trạng thái): getProjects. Sử dụng khi user hỏi "dự án nào?", "có dự án gì?", "dự án của tôi?". Set onlyMyProjects=true nếu hỏi "dự án của tôi".
            - THÀNH VIÊN/NHÂN SỰ DỰ ÁN (số người, tên người, vai trò): getProjectMembers.Sử dụng khi user hỏi "có bao nhiêu người?", "ai làm?", "nhân sự?", "thành viên?", "có những ai?", hoặc hỏi về con người trong dự án.
              - TRÍCH XUẤT CHÍNH XÁC tên/mã dự án. TUYỆT ĐỐI loại bỏ: "người", "ai", "bao nhiêu", "có", "dự án", "project", "làm", "lam".
              - Ví dụ: "dự án AI_UNIT có bao nhiêu người" -> projectKeyword="AI_UNIT"
              - Ví dụ: "dự án HRM_2026 có những ai" -> projectKeyword="HRM_2026"
              - Nếu không có projectKeyword (hỏi chung chung), truyền projectKeyword=""
            - Duyệt/Từ chối: approveRequest (Cần type, action, id).
            - Tóm tắt tổng quan bản thân: getMySummary.
            
            QUYẾT ĐỊNH NHANH:
            - getProjects: User hỏi về "dự án gì?", "dự án nào?", "danh sách dự án?"
            - getProjectMembers: User hỏi về "ai?", "bao nhiêu người?", "thành viên?", "nhân sự?", "có ai?", "đội ngũ?"
            
            Lưu ý: Luôn ưu tiên suy luận từ lịch sử hội thoại để điền month, year hoặc projectKeyword nếu user không nhắc lại.
            """;


    private static final Pattern SIMPLE_MATH_PATTERN = Pattern.compile("^\\s*(-?\\d+)\\s*([+\\-*/xX])\\s*(-?\\d+)\\s*$");

    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatToolService chatToolService;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${chatbot.interaction.mode:BALANCED}")
    private String interactionModeRaw;

    @Transactional
    public ChatResponseDto processMessage(ChatRequestDto request, Authentication authentication) {
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        if (userMessage.isBlank()) {
            throw new IllegalArgumentException("Tin nhắn không được để trống.");
        }

        User user = resolveCurrentUser(authentication);
        saveMessage(user, user.getRole(), userMessage, true, null);

        String sanityResponse = tryHandleSimpleSanity(userMessage);
        if (sanityResponse != null) {
            saveMessage(user, user.getRole(), sanityResponse, false, null);
            return ChatResponseDto.builder().message(sanityResponse).timestamp(LocalDateTime.now()).build();
        }

        String socialResponse = tryHandleLightweightSocial(userMessage);
        if (socialResponse != null) {
            saveMessage(user, user.getRole(), socialResponse, false, null);
            return ChatResponseDto.builder().message(socialResponse).timestamp(LocalDateTime.now()).build();
        }

        String ackResponse = tryHandleShortAck(userMessage, request.getHistory());
        if (ackResponse != null) {
            saveMessage(user, user.getRole(), ackResponse, false, null);
            return ChatResponseDto.builder().message(ackResponse).timestamp(LocalDateTime.now()).build();
        }


        try {
            PlanDecision forced = forcedToolDecision(userMessage, request);
            if (forced != null) {
                Map<String, Object> toolResult = chatToolService.executeTool(
                        forced.toolName(),
                        forced.arguments(),
                        user,
                        authentication,
                        request.getMonth(),
                        request.getYear()
                );
                String finalAnswer = summarizeWithGemini(user, request, userMessage, forced.toolName(), toolResult);
                saveMessage(user, user.getRole(), finalAnswer, false, forced.toolName());
                return ChatResponseDto.builder()
                        .message(finalAnswer)
                        .toolName(forced.toolName())
                        .toolResult(toolResult)
                        .timestamp(LocalDateTime.now())
                        .build();
            }
            
            if (shouldHardReject(userMessage, request.getHistory())) {
                saveMessage(user, user.getRole(), NON_HRM_FALLBACK, false, null);
                return ChatResponseDto.builder().message(NON_HRM_FALLBACK).timestamp(LocalDateTime.now()).build();
            }

            PlanDecision decision = decideWithGemini(user, request, userMessage);
            Map<String, Object> toolResult = null;
            String toolName = null;
            String finalAnswer;

            if (decision.needTool()) {
                toolName = decision.toolName();
                toolResult = chatToolService.executeTool(
                        toolName,
                        decision.arguments(),
                        user,
                        authentication,
                        request.getMonth(),
                        request.getYear()
                );
                finalAnswer = summarizeWithGemini(user, request, userMessage, toolName, toolResult);
            } else {
                finalAnswer = decision.directResponse();
            }

            if (finalAnswer == null || finalAnswer.isBlank()) {
                finalAnswer = "Mình đã nhận yêu cầu, nhưng chưa thể tạo phản hồi phù hợp. Bạn vui lòng hỏi lại rõ hơn.";
            }

            saveMessage(user, user.getRole(), finalAnswer, false, toolName);
            return ChatResponseDto.builder()
                    .message(finalAnswer)
                    .toolName(toolName)
                    .toolResult(toolResult)
                    .timestamp(LocalDateTime.now())
                    .build();
        } catch (Exception ex) {
            if (isTimeoutException(ex)) {
                saveMessage(user, user.getRole(), FRIENDLY_BUSY_MESSAGE, false, null);
                return ChatResponseDto.builder().message(FRIENDLY_BUSY_MESSAGE).timestamp(LocalDateTime.now()).build();
            }
            throw ex;
        }
    }

    private PlanDecision forcedToolDecision(String userMessage, ChatRequestDto request) {
        String text = normalizeText(userMessage);
        ObjectNode args = baseArgs(request, userMessage);
        ChatIntent recentIntent = deriveRecentIntent(request.getHistory());

        // Duyet/tu choi co the la thao tac ghi, uu tien bat explicit
        if (text.contains("duyet") || text.contains("tu choi") || text.contains("approve") || text.contains("reject")) {
            String type = text.contains("ot") ? "OT" : text.contains("giai trinh") ? "APOLOGY" : "LEAVE";
            String action = (text.contains("tu choi") || text.contains("reject")) ? "REJECT" : "APPROVE";
            args.put("type", type);
            args.put("action", action);
            UUID id = extractUuid(userMessage);
            if (id != null) {
                args.put("id", id.toString());
            }
            return new PlanDecision(true, "approveRequest", args, null);
        }

        if (containsAny(text, "sap toi co ngay le gi", "sap toi co ngay le nao", "ngay le sap toi",
                "next holiday", "upcoming holiday", "upcoming holidays", "public holiday next")) {
            args.put("countryCode", "VN");
            return new PlanDecision(true, "getUpcomingPublicHolidays", args, null);
        }

        if (containsAnyApprox(text, "so thanh vien cong ty", "so nhan vien cong ty", "tong so nhan vien",
                "bao nhieu nhan vien", "bao nhieu thanh vien", "company headcount", "headcount")) {
            return new PlanDecision(true, "getCompanyHeadcount", args, null);
        }

        if (containsAnyApprox(text, "ngay le la ngay nao", "ngay le nao", "cac ngay le", "danh sach ngay le",
                "holiday list", "public holiday")) {
            args.put("countryCode", "VN");
            return new PlanDecision(true, "getUpcomingPublicHolidays", args, null);
        }

        if (text.equals("ngay le") || text.equals("le tet") || text.equals("holiday")) {
            args.put("countryCode", "VN");
            return new PlanDecision(true, "getUpcomingPublicHolidays", args, null);
        }

        // Policy/config luon route cung de tranh model doan
        if (containsAny(text, "gio lam", "gio vao", "gio ra", "nghi trua", "ot rate", "tang ca",
                "chinh sach", "quy dinh", "config", "cau hinh", "ngay cong chuan",
                "nua ngay", "nua ngay sang", "nua ngay chieu", "half day",
                "bao nhieu cong", "tinh cong", "he so", "tham so",
                "ot ngay le", "chinh sach ngay le", "quy dinh ngay le")) {
            return new PlanDecision(true, "getCompanyPolicy", args, null);
        }

        if (containsAny(text, "don cho duyet", "cho duyet", "pending", "pending request", "waiting approval", "requests to approve")) {
            return new PlanDecision(true, "getPendingRequests", args, null);
        }

        if (containsAny(text, "thong ke team", "team", "di muon", "luong tb", "nhom toi", "team stats", "team summary")) {
            return new PlanDecision(true, "getTeamStats", args, null);
        }

        if (containsAny(text, "luong", "payroll", "thuc nhan", "gross", "net", "salary", "payslip")) {
            if (containsAny(text, "tinh luong the nao", "cach tinh luong", "cong thuc tinh luong",
                    "luong tinh nhu the nao", "salary formula", "how calculate salary")) {
                return null;
            }
            String targetKeyword = extractPayrollTargetKeyword(text);
            if (targetKeyword != null) {
                args.put("employeeKeyword", targetKeyword);
                return new PlanDecision(true, "getEmployeePayroll", args, null);
            }
            return new PlanDecision(true, "getMyPayroll", args, null);
        }

        if (isLikelyEmployeeKeywordOnly(text)
                && !looksLikePolicyQuestion(text)
                && !looksLikeAttendanceQuestion(text)
                && hasRecentPayrollIntent(request.getHistory())) {
            args.put("employeeKeyword", text);
            return new PlanDecision(true, "getEmployeePayroll", args, null);
        }

        if (containsAnyApprox(text, "cham cong", "ngay cong", "di muon", "check in", "check out", "attendance", "timesheet", "work hours")) {
            return new PlanDecision(true, "getMyAttendance", args, null);
        }

        if (containsAnyApprox(text, "nghi phep", "phep", "don nghi", "giai trinh", "leave", "apology", "leave request")) {
            if (containsAny(text, "nhu nao", "the nao", "lam sao", "ra sao", "huong dan", "cach", "how", "guide", "steps")) {
                return null;
            }
            return new PlanDecision(true, "getMyLeaveBalance", args, null);
        }

        if (isGenericFollowUp(text) && recentIntent != ChatIntent.UNKNOWN) {
            return switch (recentIntent) {
                case PAYROLL, EMPLOYEE_PAYROLL -> new PlanDecision(true, "getMyPayroll", args, null);
                case ATTENDANCE -> new PlanDecision(true, "getMyAttendance", args, null);
                case POLICY -> new PlanDecision(true, "getCompanyPolicy", args, null);
                case TEAM -> new PlanDecision(true, "getTeamStats", args, null);
                case LEAVE -> new PlanDecision(true, "getMyLeaveBalance", args, null);
                case PROJECT -> new PlanDecision(true, "getProjects", args, null);
                default -> null;
            };
        }

        // Explicit handling for project member count queries like "du an HRM_2026 co bao nhieu nguoi"
        if (containsAny(text, "co bao nhieu nguoi", "bao nhieu nguoi", "co bao nhieu thanh vien", "bao nhieu thanh vien", 
                        "co ai trong", "nhung ai lam", "co nhung ai", "nhung ai", "co ai", "co so", "so nguoi")) {
            String projKey = extractProjectKeywordWithMembers(text);
            if (projKey != null) {
                args.put("projectKeyword", projKey);
                // Check if this is a count query (user asking "how many")
                if (containsAny(text, "co bao nhieu", "bao nhieu", "mấy", "co so", "so nguoi")) {
                    args.put("isCountQuery", true);
                }
                return new PlanDecision(true, "getProjectMembers", args, null);
            }
        }

        // Project and Member logic handled by Gemini reasoning for better flexibility
        // unless it's a very specific keyword that we want to force

        if (isContextualFollowUp(text, request.getHistory())) {
            return new PlanDecision(true, "getMySummary", args, null);
        }

        return null;
    }

    private PlanDecision decideWithGemini(User user, ChatRequestDto request, String userMessage) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return fallbackDecision(userMessage, request);
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
                    Lịch sử gần đây: %s
                    Câu hỏi user: %s
                    """.formatted(
                    TOOL_PLANNER_PROMPT,
                    user.getRole().name(),
                    historyLines,
                    userMessage
            );
            parts.addObject().put("text", plannerInput);

            String rawText = callGemini(payload);
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
            return fallbackDecision(userMessage, request);
        } catch (Exception ex) {
            if (isTimeoutException(ex)) {
                return new PlanDecision(false, "none", objectMapper.createObjectNode(), FRIENDLY_BUSY_MESSAGE);
            }
            return fallbackDecision(userMessage, request);
        }
    }

    private String summarizeWithGemini(User user, ChatRequestDto request, String userMessage, String toolName, Map<String, Object> toolResult) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return localSummary(toolName, toolResult);
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
                            user.getRole().name(), 
                            java.time.LocalDateTime.now(),
                            userMessage, 
                            historyLines, 
                            toolName, 
                            objectMapper.writeValueAsString(toolResult)
                    );
            parts.addObject().put("text", input);

            String text = callGemini(payload);
            if (text == null || text.isBlank()) {
                return localSummary(toolName, toolResult);
            }
            return text.trim();
        } catch (Exception ex) {
            if (isTimeoutException(ex)) {
                return FRIENDLY_BUSY_MESSAGE;
            }
            return localSummary(toolName, toolResult);
        }
    }
    private String localSummary(String toolName, Map<String, Object> toolResult) {
        if (toolResult == null) {
            return "Mình chưa lấy được dữ liệu phù hợp. Bạn thử hỏi lại cụ thể hơn..";
        }
        return switch (toolName) {
            case "getMyPayroll", "getEmployeePayroll" -> summarizePayroll(toolResult);
            case "getMyAttendance" -> summarizeAttendance(toolResult);
            case "getMyLeaveBalance" -> summarizeLeave(toolResult);
            case "getCompanyHeadcount" -> String.valueOf(toolResult.getOrDefault("message", "Đã lấy thông tin nhân sự công ty."));
            case "getCompanyPolicy", "getUpcomingPublicHolidays" ->
                    String.valueOf(toolResult.getOrDefault("message", "Đã lấy thông tin."));
            case "getTeamStats" -> summarizeTeam(toolResult);
            case "getPendingRequests" -> summarizePending(toolResult);
            case "getProjects" -> summarizeProjects(toolResult);
            case "getProjectMembers" -> summarizeProjectMembers(toolResult);
            case "approveRequest" -> String.valueOf(toolResult.getOrDefault("message", "Đã xử lý yêu cầu."));
            default -> String.valueOf(toolResult.getOrDefault("message", "Đã xử lý yêu cầu thành công."));
        };
    }

    private String summarizePayroll(Map<String, Object> data) {
        String employeeName = String.valueOf(data.getOrDefault("employeeName", "Nhan vien"));
        Object month = data.get("month");
        Object year = data.get("year");
        Object net = data.get("netSalary");
        Object gross = data.get("grossSalary");
        if (net == null && gross == null) {
            return String.valueOf(data.getOrDefault("message", "Hiện chưa có bảng lương cho kỳ này."));
        }
        return String.format(
                Locale.ROOT,
                "Lương tháng %s/%s của %s:%n- Tổng lương (Gross): %s%n- Thực nhận (Net): %s",
                month, year, employeeName, formatCurrency(gross), formatCurrency(net)
        );
    }

    private String summarizeAttendance(Map<String, Object> data) {
        return String.format(
                Locale.ROOT,
                "Chấm công tháng %s/%s:%n- Số bản ghi: %s%n- Đúng giờ: %s ngày%n- Đi muộn: %s ngày%n- Tổng giờ làm: %s",
                data.getOrDefault("month", "?"),
                data.getOrDefault("year", "?"),
                data.getOrDefault("records", 0),
                data.getOrDefault("onTimeDays", 0),
                data.getOrDefault("lateDays", 0),
                data.getOrDefault("totalWorkedHours", 0)
        );
    }

    private String summarizeLeave(Map<String, Object> data) {
        return String.format(
                Locale.ROOT,
                "Số dư phép năm %s:%n- Quota: %s ngày%n- Đã dùng: %s ngày%n- Còn lại: %s ngày",
                data.getOrDefault("year", LocalDateTime.now().getYear()),
                data.getOrDefault("annualLeaveQuota", 12),
                data.getOrDefault("usedAnnualLeaveDays", 0),
                data.getOrDefault("remainingAnnualLeaveDays", 0)
        );
    }

    private String summarizeTeam(Map<String, Object> data) {
        return String.format(
                Locale.ROOT,
                "Thống kê team tháng %s/%s:%n- Quy mô team: %s%n- Tổng ngày đi muộn: %s%n- Tổng giờ OT: %s",
                data.getOrDefault("month", "?"),
                data.getOrDefault("year", "?"),
                data.getOrDefault("teamSize", 0),
                data.getOrDefault("totalLateDays", 0),
                data.getOrDefault("totalOtHours", 0)
        );
    }

    private String summarizePending(Map<String, Object> data) {
        int leave = listSize(data.get("pendingLeaveRequests"));
        int apology = listSize(data.get("pendingApologyRequests"));
        int ot = listSize(data.get("pendingOtRequests"));
        return String.format(
                Locale.ROOT,
                "Đơn chờ duyệt hiện tại:%n- Nghỉ phép: %d%n- Giải trình: %d%n- OT: %d",
                leave, apology, ot
        );
    }

    private int listSize(Object obj) {
        if (obj instanceof List<?> list) return list.size();
        return 0;
    }

    private String formatCurrency(Object value) {
        if (value == null) return "N/A";
        try {
            long amount = Long.parseLong(String.valueOf(value));
            return String.format(Locale.ROOT, "%,d VND", amount);
        } catch (Exception ignored) {
            return String.valueOf(value);
        }
    }
    private PlanDecision fallbackDecision(String userMessage, ChatRequestDto request) {
        PlanDecision forced = forcedToolDecision(userMessage, request);
        if (forced != null) {
            return forced;
        }

        String text = normalizeText(userMessage);
        ObjectNode args = baseArgs(request, userMessage);

        // Keyword router as safety net (backup for Gemini)
        if (containsAny(text, "luong", "payroll", "thuc nhan", "gross", "net", "payslip")) {
            String targetKeyword = extractPayrollTargetKeyword(text);
            if (targetKeyword != null) {
                args.put("employeeKeyword", targetKeyword);
                return new PlanDecision(true, "getEmployeePayroll", args, null);
            }
            return new PlanDecision(true, "getMyPayroll", args, null);
        }
        
        // Check for project members BEFORE general project queries
        // This handles cases like "du an HRM_2026 co bao nhieu nguoi", "du an AI_UNIT co nhung ai"
        boolean hasMemberKeywords = containsAnyApprox(text, "thanh vien", "nhan su", "ai lam", "ai trong", 
                                                      "project members", "doi ngu", "so nguoi", "co bao nhieu", "bao nhieu",
                                                      "co nhung ai", "nhung ai", "co ai");
        boolean hasProjectKeywords = containsAnyApprox(text, "du an", "projects", "danh sach du an", "project cua toi");
        
        if (hasMemberKeywords && hasProjectKeywords) {
            // User is asking about project members
            String projKey = extractProjectKeywordWithMembers(text);
            if (projKey != null) args.put("projectKeyword", projKey);
            return new PlanDecision(true, "getProjectMembers", args, null);
        }
        
        if (hasProjectKeywords) {
            String projKey = extractProjectKeyword(text);
            if (projKey != null) args.put("projectKeyword", projKey);
            return new PlanDecision(true, "getProjects", args, null);
        }
        
        if (hasMemberKeywords) {
            String projKey = extractProjectKeywordWithMembers(text);
            if (projKey != null) args.put("projectKeyword", projKey);
            return new PlanDecision(true, "getProjectMembers", args, null);
        }

        if (containsAnyApprox(text, "cham cong", "ngay cong", "di muon", "check in", "check out", "attendance", "work hours")) {
            return new PlanDecision(true, "getMyAttendance", args, null);
        }

        if (containsAnyApprox(text, "nghi phep", "phep", "don nghi", "giai trinh", "leave", "apology")) {
            return new PlanDecision(true, "getMyLeaveBalance", args, null);
        }

        // Help guide as a later resort in fallback
        String guide = tryHandleSystemGuide(userMessage, request.getHistory() != null ? RoleType.EMPLOYEE : RoleType.EMPLOYEE); // Role derived roughly or just Employee for guide
        if (guide != null) {
            return new PlanDecision(false, "none", args, guide);
        }

        if (isHrmRelated(text) || isContextualFollowUp(text, request.getHistory())) {
            return new PlanDecision(true, "getMySummary", args, null);
        }

        return new PlanDecision(false, "none", args, NON_HRM_FALLBACK);
    }

    private ObjectNode baseArgs(ChatRequestDto request, String userMessage) {
        ObjectNode args = objectMapper.createObjectNode();
        Integer month = request.getMonth();
        Integer year = request.getYear();

        YearMonth inferred = inferMonthYear(userMessage);
        if (month == null && inferred != null) {
            month = inferred.getMonthValue();
        }
        if (year == null && inferred != null) {
            year = inferred.getYear();
        }

        YearMonth inferredFromHistory = inferMonthYearFromHistory(request.getHistory());
        if (month == null && inferredFromHistory != null) {
            month = inferredFromHistory.getMonthValue();
        }
        if (year == null && inferredFromHistory != null) {
            year = inferredFromHistory.getYear();
        }

        if (month != null) args.put("month", month);
        if (year != null) args.put("year", year);
        return args;
    }

    private YearMonth inferMonthYear(String userMessage) {
        String text = normalizeText(userMessage);
        YearMonth now = YearMonth.now();

        if (text.contains("thang truoc")) {
            return now.minusMonths(1);
        }
        if (text.contains("thang nay")) {
            return now;
        }

        Matcher monthYearMatcher = Pattern.compile("thang\\s*(\\d{1,2})(?:\\s*(?:nam|/)\\s*(\\d{4}))?").matcher(text);
        if (monthYearMatcher.find()) {
            int month = Integer.parseInt(monthYearMatcher.group(1));
            if (month < 1 || month > 12) {
                return null;
            }
            int year = monthYearMatcher.group(2) != null ? Integer.parseInt(monthYearMatcher.group(2)) : now.getYear();
            return YearMonth.of(year, month);
        }

        return null;
    }

    private YearMonth inferMonthYearFromHistory(List<ChatRequestDto.HistoryMessage> history) {
        if (history == null || history.isEmpty()) {
            return null;
        }
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatRequestDto.HistoryMessage h = history.get(i);
            if (h == null || h.getContent() == null || h.getContent().isBlank()) {
                continue;
            }
            YearMonth ym = inferMonthYear(h.getContent());
            if (ym != null) {
                return ym;
            }
        }
        return null;
    }

    private String extractPayrollTargetKeyword(String normalizedText) {
        if (normalizedText.contains("cua toi") || normalizedText.contains("luong toi")) {
            return null;
        }

        int index = normalizedText.indexOf("cua ");
        if (index < 0) {
            return null;
        }

        String candidate = normalizedText.substring(index + 4).trim();
        candidate = candidate.replaceAll("^(nhan vien|ban|anh|chi|em)\\s+", "").trim();
        candidate = candidate.replaceAll("^(ten\\s+la|la)\\s+", "").trim();
        candidate = candidate.replaceAll("^nhan vien\\s+ten\\s+la\\s+", "").trim();
        candidate = candidate.replaceAll("\\b(la\\s+bao\\s+nhieu|bao\\s+nhieu|la\\s+may|la\\s+gi|la\\s+ai)\\b.*$", "").trim();
        candidate = candidate.replaceAll("[^a-z0-9@._\\s]", " ").replaceAll("\\s+", " ").trim();
        if (candidate.isBlank() || "toi".equals(candidate)) {
            return null;
        }
        return candidate;
    }

    private boolean isLikelyEmployeeKeywordOnly(String text) {
        if (text == null || text.isBlank()) return false;
        if (isHrmRelated(text)) return false;
        if (looksLikePolicyQuestion(text) || looksLikeAttendanceQuestion(text)) return false;
        if (text.length() > 64) return false;
        if (!text.matches("[a-z0-9@._\\s]+")) return false;
        if (containsAny(text, "bao nhieu", "la gi", "the nao", "nhu nao", "sao", "ra sao", "lam sao",
                "tinh", "cong", "ot", "nua ngay", "gio lam", "ngay le", "giai trinh", "nghi phep")) {
            return false;
        }
        return true;
    }

    private boolean hasRecentPayrollIntent(List<ChatRequestDto.HistoryMessage> history) {
        if (history == null || history.isEmpty()) return false;
        int start = Math.max(0, history.size() - 6);
        for (ChatRequestDto.HistoryMessage h : history.subList(start, history.size())) {
            if (h == null || h.getContent() == null) continue;
            String content = normalizeText(h.getContent());
            if (containsAny(content, "luong", "payroll", "thuc nhan", "gross", "net", "khong tim thay nhan vien")) {
                return true;
            }
        }
        return false;
    }

    private ChatIntent deriveRecentIntent(List<ChatRequestDto.HistoryMessage> history) {
        if (history == null || history.isEmpty()) return ChatIntent.UNKNOWN;
        int start = Math.max(0, history.size() - 8);
        for (int i = history.size() - 1; i >= start; i--) {
            ChatRequestDto.HistoryMessage h = history.get(i);
            if (h == null || h.getContent() == null) continue;
            String content = normalizeText(h.getContent());
            if (containsAny(content, "salary", "payroll", "luong", "gross", "net", "payslip")) return ChatIntent.PAYROLL;
            if (containsAny(content, "attendance", "cham cong", "check in", "check out", "timesheet")) return ChatIntent.ATTENDANCE;
            if (containsAny(content, "policy", "chinh sach", "config", "ot rate", "ngay le", "holiday")) return ChatIntent.POLICY;
            if (containsAny(content, "team stats", "thong ke team", "pending request", "don cho duyet")) return ChatIntent.TEAM;
            if (containsAny(content, "leave", "nghi phep", "giai trinh", "apology")) return ChatIntent.LEAVE;
        }
        return ChatIntent.UNKNOWN;
    }

    private boolean isGenericFollowUp(String text) {
        return containsAny(text, "con", "con thi", "vay", "the con", "thang truoc thi sao", "thang nay thi sao",
                "how about", "what about", "and", "then", "ok con", "tiep");
    }

    private String tryHandleShortAck(String message, List<ChatRequestDto.HistoryMessage> history) {
        String text = normalizeText(message);
        if (!containsAny(text, "ok", "oke", "uh", "uhm", "um", "vay a", "ro i", "duoc", "got it")) {
            return null;
        }

        ChatIntent intent = deriveRecentIntent(history);
        return switch (intent) {
            case PAYROLL, EMPLOYEE_PAYROLL -> "OK. Bạn muốn xem lương tháng nào hoặc so sánh với tháng trước?";
            case ATTENDANCE -> "OK. Bạn muốn xem chấm công theo tháng nào?";
            case POLICY -> "OK. Bạn muốn xem thêm mục nào trong chính sách công ty?";
            case TEAM -> "OK. Bạn muốn xem thêm thống kê nào của team?";
            case LEAVE -> "OK. Bạn muốn xem số dư phép hay hướng dẫn tạo đơn?";
            default -> "OK. Bạn muốn mình hỗ trợ gì tiếp theo trong hệ thống HRM?";
        };
    }

    private boolean looksLikePolicyQuestion(String text) {
        return containsAny(text, "nua ngay", "half day", "tham so", "he so", "bao nhieu cong", "tinh cong",
                "gio lam", "nghi trua", "ot rate", "chinh sach", "cau hinh", "policy", "holiday");
    }

    private boolean looksLikeAttendanceQuestion(String text) {
        return containsAny(text, "cham cong", "check in", "check out", "di muon", "ngay cong", "cong", "attendance", "timesheet");
    }

    private List<String> buildHistoryLines(ChatRequestDto request, User user) {
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
    private String tryHandleSimpleSanity(String message) {
        String text = normalizeText(message);
        if (text.equals("test") || text.equals("ping")) {
            return "Mình đang hoạt động bình thường.";
        }

        Matcher matcher = SIMPLE_MATH_PATTERN.matcher(text);
        if (!matcher.matches()) {
            return null;
        }

        long a = Long.parseLong(matcher.group(1));
        long b = Long.parseLong(matcher.group(3));
        String op = matcher.group(2);

        return switch (op) {
            case "+" -> String.valueOf(a + b);
            case "-" -> String.valueOf(a - b);
            case "*", "x" -> String.valueOf(a * b);
            case "/" -> b == 0 ? "Không thể chia cho 0." : String.valueOf((double) a / b);
            default -> null;
        };
    }

    private String tryHandleLightweightSocial(String message) {
        String text = normalizeText(message);
        if (text.matches(".*\\b(xin chao|chao|hello|helo|hi|hey)\\b.*")) {
            return "Chào bạn. Mình có thể hỗ trợ lương, công, phép và chính sách HRM.";
        }
        if (text.matches(".*\\b(cam on|thank|thanks)\\b.*")) {
            return "Rất vui được hỗ trợ bạn.";
        }
        if (text.contains("dung") || text.contains("huong dan") || text.contains("hoi gi") || text.contains("how to use")) {
            return "Bạn có thể hỏi về lương, chấm công, nghỉ phép, OT hoặc chính sách công ty.";
        }
        return null;
    }

    private String tryHandleSystemGuide(String message, RoleType role) {
        String text = normalizeText(message);

        if (containsAny(text, "he thong co gi", "co nhung chuc nang", "cac chuc nang", "module", "menu nao")) {
            return "Hệ thống HRM hỗ trợ: nhân viên, chấm công, giải trình, nghỉ phép, tăng ca, bảng lương (Excel/PDF), cấu hình, thông báo và chatbot nội bộ..";
        }

        if (containsAny(text, "phan quyen", "quyen", "role")) {
            return switch (role) {
                case ADMIN -> "Bạn đang là ADMIN: được quản lý user, cấu hình, nhân viên và theo dõi toàn bộ dữ liệu.";
                case HR -> "Bạn đang là HR: được quản lý nhân sự, tính lương, xuất báo cáo và xử lý nghiệp vụ HR.";
                case MANAGER -> "Bạn đang là MANAGER: được duyệt đơn của team và xem thống kê team theo phạm vi được giao.";
                case EMPLOYEE -> "Bạn đang là EMPLOYEE: xem dữ liệu cá nhân, gửi đơn nghỉ/giải trình/OT và theo dõi bảng lương của mình.";
            };
        }

        if (containsAny(text, "import excel", "nhap excel", "template", "preview excel")) {
            return "Import Excel: tải template, điền dữ liệu theo mẫu, upload file xlsx và xác nhận preview trước khi ghi vào hệ thống.";
        }

        if (containsAny(text, "xuat excel", "xuat pdf", "phieu luong", "bao cao")) {
            return "Export: bạn có thể xuất danh sách nhân viên, bảng lương Excel và phiếu lương PDF cá nhân theo tháng.";
        }

        if (containsAny(text, "doi mat khau", "change password", "reset mat khau")) {
            return "Đổi mật khẩu: bấm avatar/header -> Đổi mật khẩu, nhập mật khẩu hiện tại và mật khẩu mới.";
        }

        if (containsAny(text, "tinh luong the nao", "cach tinh luong", "cong thuc tinh luong", "luong tinh nhu the nao")) {
            return "Lương được tính theo công thức cơ bản: lương thực tế + tiền OT + phụ cấp - bảo hiểm - thuế TNCN. Lương thực tế phụ thuộc ngày công, OT phụ thuộc số giờ tăng ca và hệ số OT trong cấu hình công ty.";
        }

        if (containsAnyApprox(text,
                "muc giam tru gia canh",
                "giam tru gia canh",
                "giam tru ban than",
                "muc giam tru ban than",
                "giam tru nguoi phu thuoc",
                "muc giam tru nguoi phu thuoc")) {
            return "Theo m\u1ee9c \u00e1p d\u1ee5ng t\u1eeb ng\u00e0y 01/01/2026, gi\u1ea3m tr\u1eeb gia c\u1ea3nh cho b\u1ea3n th\u00e2n l\u00e0 15,5 tri\u1ec7u \u0111\u1ed3ng/th\u00e1ng v\u00e0 cho m\u1ed7i ng\u01b0\u1eddi ph\u1ee5 thu\u1ed9c l\u00e0 6,2 tri\u1ec7u \u0111\u1ed3ng/th\u00e1ng.";
        }

        if (containsAny(text, "thong bao", "notification", "chuong")) {
            return "Thông báo hiển thị đơn chờ duyệt và kết quả duyệt/từ chối. Bạn có thể mở panel chuông trên header để xem nhanh.";
        }

        if (containsAny(text, "chatbot ho tro gi", "chatbot lam duoc gi", "tro ly ai la gi", "hoi gi duoc", "what can you do", "help", "features")) {
            return "Chatbot hỗ trợ hỏi về lương, chấm công, nghỉ phép, OT, chính sách và duyệt đơn theo quyền. Bạn có thể hỏi tự nhiên, không cần dùng mẫu cố định.";
        }

        if (containsAny(text, "giai trinh", "don giai trinh")
                && containsAny(text, "nhu nao", "the nao", "lam sao", "ra sao", "huong dan", "cach")) {
            return "Giải trình: vào menu Giải trình, chọn ngày chấm công cần giải trình, nhập lý do và gửi đơn. Manager/HR sẽ duyệt hoặc từ chối.";
        }

        if (containsAny(text, "xin nghi phep", "nghi phep", "don nghi")
                && containsAny(text, "nhu nao", "the nao", "lam sao", "ra sao", "huong dan", "cach")) {
            return "Xin nghỉ phép: vào menu Nghỉ phép, chọn loại nghỉ, ngày bắt đầu-kết thúc, nhập lý do rồi gửi đơn. Đơn sẽ chuyển đến cấp duyệt theo quyền.";
        }

        if (containsAny(text, "ngay le", "le tet", "holiday")
                && containsAny(text, "nhu nao", "the nao", "lam sao", "ra sao", "chinh sach", "quy dinh")) {
            return "Ngày lễ được quản lý trong module Ngày lễ. OT ngày lễ áp dụng hệ số otRateHoliday theo cấu hình công ty.";
        }

        return null;
    }
    private boolean shouldHardReject(String message, List<ChatRequestDto.HistoryMessage> history) {
        String text = normalizeText(message);
        InteractionMode mode = getInteractionMode();

        if (mode == InteractionMode.FRIENDLY) {
            return false;
        }

        if (mode == InteractionMode.STRICT) {
            if (isHrmRelated(text) || isContextualFollowUp(text, history)) return false;
            if (tryHandleSimpleSanity(text) != null) return false;
            if (tryHandleLightweightSocial(text) != null) return false;
            return true;
        }

        // BALANCED (default): chi chan cac cau ro rang lech scope qua xa HRM.
        if (isHrmRelated(text) || isContextualFollowUp(text, history)) return false;
        if (tryHandleSimpleSanity(text) != null) return false;
        if (tryHandleLightweightSocial(text) != null) return false;
        if (tryHandleSystemGuide(text, RoleType.EMPLOYEE) != null) return false;
        return isClearlyOutOfScope(text);
    }

    private boolean isClearlyOutOfScope(String text) {
        return containsAny(text,
                "soi cau", "keo bong", "chung khoan hom nay", "du doan tran dau",
                "crypto signal", "tai xiu", "game skin", "loto", "xoso");
    }

    private InteractionMode getInteractionMode() {
        if (interactionModeRaw == null || interactionModeRaw.isBlank()) {
            return InteractionMode.BALANCED;
        }
        try {
            return InteractionMode.valueOf(interactionModeRaw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return InteractionMode.BALANCED;
        }
    }

    private boolean isHrmRelated(String text) {
        String[] keywords = {
                "luong", "thuong", "phu cap", "bao hiem", "thue", "tncn",
                "giam tru gia canh", "giam tru ban than", "nguoi phu thuoc",
                "cham cong", "ngay cong", "gio lam", "ot", "tang ca",
                "nghi phep", "xin nghi", "giai trinh", "chinh sach", "quy dinh",
                "duyet don", "tu choi don", "payroll", "attendance", "leave",
                "apology", "config", "company", "cau hinh", "cong ty",
                "ngay le", "le tet", "holiday",
                "phan quyen", "role", "permission", "dashboard", "menu", "module",
                "import", "export", "excel", "pdf", "template", "preview",
                "thong bao", "notification", "doi mat khau", "user management", "quan ly user",
                "chatbot", "tro ly ai", "salary", "payslip", "timesheet", "policy", "approval", "overtime", "leave request",
                "du an", "project", "thanh vien du an", "thanh vien project", "vai tro du an"
        };
        return containsAnyApprox(text, keywords);
    }

    private boolean isContextualFollowUp(String text, List<ChatRequestDto.HistoryMessage> history) {
        String[] followUpHints = {"so voi", "thang truoc", "chi tiet hon", "tiep", "giai thich them", "con lai", "how about", "what about", "compare", "then"};
        boolean hasHint = false;
        for (String hint : followUpHints) {
            if (text.contains(hint)) {
                hasHint = true;
                break;
            }
        }
        if (!hasHint) return false;
        if (history == null || history.isEmpty()) return false;

        int start = Math.max(0, history.size() - 6);
        for (ChatRequestDto.HistoryMessage h : history.subList(start, history.size())) {
            if (h != null && h.getContent() != null && isHrmRelated(normalizeText(h.getContent()))) {
                return true;
            }
        }
        return false;
    }

    private String normalizeText(String input) {
        if (input == null) return "";
        String lowered = input.trim().toLowerCase(Locale.ROOT);
        String normalized = Normalizer.normalize(lowered, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return normalized.replace("\u0111", "d");
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsAnyApprox(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword) || containsApproxPhrase(text, keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsApproxPhrase(String text, String phrase) {
        String[] textTokens = tokenizeNormalized(text);
        String[] phraseTokens = tokenizeNormalized(phrase);
        if (textTokens.length == 0 || phraseTokens.length == 0 || phraseTokens.length > textTokens.length) {
            return false;
        }

        for (int start = 0; start <= textTokens.length - phraseTokens.length; start++) {
            boolean matched = true;
            for (int offset = 0; offset < phraseTokens.length; offset++) {
                if (!roughlyMatchesToken(textTokens[start + offset], phraseTokens[offset])) {
                    matched = false;
                    break;
                }
            }
            if (matched) {
                return true;
            }
        }
        return false;
    }

    private String[] tokenizeNormalized(String text) {
        return Arrays.stream(text.split("[^a-z0-9]+"))
                .filter(token -> !token.isBlank())
                .toArray(String[]::new);
    }

    private boolean roughlyMatchesToken(String actual, String expected) {
        if (actual.equals(expected)) {
            return true;
        }
        if (actual.length() <= 2 || expected.length() <= 2) {
            return false;
        }
        if (Math.abs(actual.length() - expected.length()) > 1) {
            return false;
        }
        return isOneEditAway(actual, expected) || isSingleAdjacentTranspose(actual, expected);
    }

    private boolean isSingleAdjacentTranspose(String left, String right) {
        if (left.length() != right.length()) {
            return false;
        }
        int firstDiff = -1;
        int secondDiff = -1;
        for (int i = 0; i < left.length(); i++) {
            if (left.charAt(i) != right.charAt(i)) {
                if (firstDiff == -1) {
                    firstDiff = i;
                } else if (secondDiff == -1) {
                    secondDiff = i;
                } else {
                    return false;
                }
            }
        }
        return firstDiff != -1
                && secondDiff == firstDiff + 1
                && left.charAt(firstDiff) == right.charAt(secondDiff)
                && left.charAt(secondDiff) == right.charAt(firstDiff);
    }

    private boolean isOneEditAway(String left, String right) {
        int leftLen = left.length();
        int rightLen = right.length();
        if (Math.abs(leftLen - rightLen) > 1) {
            return false;
        }

        String shorter = leftLen <= rightLen ? left : right;
        String longer = leftLen <= rightLen ? right : left;
        int i = 0;
        int j = 0;
        int edits = 0;

        while (i < shorter.length() && j < longer.length()) {
            if (shorter.charAt(i) == longer.charAt(j)) {
                i++;
                j++;
                continue;
            }
            edits++;
            if (edits > 1) {
                return false;
            }
            if (shorter.length() == longer.length()) {
                i++;
            }
            j++;
        }

        if (j < longer.length() || i < shorter.length()) {
            edits++;
        }
        return edits <= 1;
    }

    private UUID extractUuid(String text) {
        try {
            Matcher matcher = Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}").matcher(text);
            if (matcher.find()) {
                return UUID.fromString(matcher.group());
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String callGemini(ObjectNode payload) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(25000);
        requestFactory.setReadTimeout(25000);

        RestTemplate restTemplate = new RestTemplate(requestFactory);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(payload), headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Gọi API Gemini thất bại.");
        }

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        return textNode.asText("");
    }

    private boolean isTimeoutException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof java.net.SocketTimeoutException || current instanceof java.net.http.HttpTimeoutException) {
                return true;
            }
            if (current instanceof ResourceAccessException && current.getMessage() != null
                    && current.getMessage().toLowerCase(Locale.ROOT).contains("timed out")) {
                return true;
            }
            if (current.getMessage() != null && current.getMessage().toLowerCase(Locale.ROOT).contains("timed out")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private void saveMessage(User user, RoleType role, String content, boolean isUserMessage, String toolName) {
        chatMessageRepository.save(ChatMessage.builder()
                .user(user)
                .role(role)
                .content(content)
                .userMessage(isUserMessage)
                .toolName(toolName)
                .build());
    }

    private User resolveCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản đăng nhập."));
    }

    private String extractJson(String text) {
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

    @Transactional(readOnly = true)
    public List<ChatHistoryItemDto> getHistory(Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        List<ChatMessage> rows = chatMessageRepository.findTop80ByUserOrderByCreatedAtDesc(user);
        rows.sort(Comparator.comparing(ChatMessage::getCreatedAt));

        List<ChatHistoryItemDto> result = new ArrayList<>();
        for (ChatMessage row : rows) {
            result.add(ChatHistoryItemDto.builder()
                    .role(row.isUserMessage() ? "user" : "assistant")
                    .content(row.getContent())
                    .timestamp(row.getCreatedAt())
                    .build());
        }
        return result;
    }

    private String extractProjectKeyword(String text) {
        // Try to extract code between brackets first (common if copied from list)
        Pattern p = Pattern.compile("\\[([a-zA-Z0-9_-]+)\\]");
        Matcher m = p.matcher(text);
        if (m.find()) return m.group(1);
        
        // Try to extract project codes (alphanumeric with underscores/hyphens)
        // Find ALL all-caps codes and return the longest one with underscores
        Pattern codePattern = Pattern.compile("\\b([A-Z]+(?:_[A-Z0-9]+)*)\\b");
        Matcher codeMatcher = codePattern.matcher(text);
        String bestCode = null;
        while (codeMatcher.find()) {
            String code = codeMatcher.group(1);
            if (!isStopWord(code)) {
                // Prefer codes with underscores, then longer codes
                if (bestCode == null || code.contains("_") || 
                    (code.length() > bestCode.length() && !bestCode.contains("_"))) {
                    bestCode = code;
                }
            }
        }
        if (bestCode != null) {
            return bestCode;
        }

        // If no code found, try to extract the full project name after "du an"
        String cleaned = removeProjectQuestionPhrases(text);
        cleaned = cleaned.replaceAll("(?i)^(du\\s+an|project)\\s+", "").trim();
        
        if (cleaned.isEmpty()) return null;
        
        return cleaned;
    }

    private String extractProjectKeywordWithMembers(String text) {
        // Try to extract code between brackets first
        Pattern pBracket = Pattern.compile("\\[([a-zA-Z0-9_-]+)\\]");
        Matcher mBracket = pBracket.matcher(text);
        if (mBracket.find()) return mBracket.group(1);
        
        // Try to extract project codes - prefer codes with underscores (like AI_UNIT, HRM_2026)
        // Find ALL uppercase codes and return the longest one preferring those with underscores
        Pattern codePattern = Pattern.compile("\\b([A-Z]+(?:_[A-Z0-9]+)*)\\b");
        Matcher codeMatcher = codePattern.matcher(text);
        String bestCode = null;
        while (codeMatcher.find()) {
            String code = codeMatcher.group(1);
            if (!isStopWord(code)) {
                // Prefer codes with underscores, then longer codes
                if (bestCode == null || code.contains("_") || 
                    (code.length() > bestCode.length() && !bestCode.contains("_"))) {
                    bestCode = code;
                }
            }
        }
        if (bestCode != null) {
            return bestCode;
        }

        // If no code match found, extract the full name after "du an"
        String cleaned = removeProjectQuestionPhrases(text);
        cleaned = cleaned.replaceAll("(?i)^(du\\s+an|project)\\s+", "").trim();
        
        if (cleaned.isEmpty()) return null;
        
        return cleaned;
    }
    
    private String removeProjectQuestionPhrases(String text) {
        // Remove specific Vietnamese phrases comprehensively
        return text
                // Remove "how many people" variations
                .replaceAll("(?i)\\s+co\\s+bao\\s+nhieu\\s+nguoi(\\s|$)", " ")
                .replaceAll("(?i)\\s+bao\\s+nhieu\\s+nguoi(\\s|$)", " ")
                .replaceAll("(?i)\\s+co\\s+bao\\s+nhieu\\s+thanh\\s+vien(\\s|$)", " ")
                .replaceAll("(?i)\\s+bao\\s+nhieu\\s+thanh\\s+vien(\\s|$)", " ")
                // Remove member/team phrases
                .replaceAll("(?i)\\s+thanh\\s+vien(\\s+trong(\\s+du\\s+an)?)?", " ")
                .replaceAll("(?i)\\s+nhan\\s+su(\\s+trong(\\s+du\\s+an)?)?", " ")
                .replaceAll("(?i)\\s+ai\\s+lam(\\s+trong(\\s+du\\s+an)?)?", " ")
                // "co nhung ai" / "nhung ai" / "co ai"
                .replaceAll("(?i)\\s+co\\s+nhung\\s+ai(\\s+trong)?", " ")
                .replaceAll("(?i)\\s+nhung\\s+ai(\\s+trong)?", " ")
                .replaceAll("(?i)\\s+co\\s+ai(\\s+trong)?", " ")
                .replaceAll("(?i)\\s+doi\\s+ngu", " ")
                .replaceAll("(?i)\\s+project\\s+members?", " ")
                // Remove trailing singular "nguoi" (people) and "ai" (who)
                .replaceAll("(?i)\\s+nguoi(\\s|$)", " ")
                .replaceAll("(?i)\\s+ai(\\s|$)", " ")
                .trim();
    }
    
    private boolean isStopWord(String token) {
        if (token == null || token.isEmpty()) return true;
        String lower = token.toLowerCase(Locale.ROOT).trim();
        return switch (lower) {
            case "co", "la", "cua", "trong", "hien", "tai", "toi", "minh", "ban", "anh", 
                 "chi", "em", "so", "nay", "vua", "roi", "do", "cho", "hoi", "biet", 
                 "gia", "dinh", "nhom", "du", "an", "project", "nguoi", "thanh", "vien", 
                 "nhan", "su", "nao", "gi", "nhung", "may", "lam", "ai", 
                 "bao", "nhieu", "sao" -> true;
            default -> false;
        };
    }

    private String summarizeProjects(Map<String, Object> data) {
        List<?> projects = (List<?>) data.get("projects");
        if (projects == null || projects.isEmpty()) {
            return String.valueOf(data.getOrDefault("message", "Không tìm thấy dự án nào."));
        }
        StringBuilder sb = new StringBuilder("Danh sách dự án của bạn (tối đa 15):\n");
        for (Object obj : projects) {
            Map<?, ?> p = (Map<?, ?>) obj;
            sb.append(String.format(Locale.ROOT, "- [%s] %s (Trạng thái: %s)%n",
                    p.get("code"), p.get("name"), p.get("status")));
        }
        return sb.toString().trim();
    }

    private String summarizeProjectMembers(Map<String, Object> data) {
        if (data.containsKey("projectSummaries")) {
            List<?> summaries = (List<?>) data.get("projectSummaries");
            if (summaries == null || summaries.isEmpty()) return "Không tìm thấy dự án nào.";
            StringBuilder sb = new StringBuilder("Thống kê nhân sự các dự án:\n");
            for (Object obj : summaries) {
                Map<?, ?> m = (Map<?, ?>) obj;
                sb.append(String.format("- [%s] %s: %s người (%s)%n", 
                    m.get("code"), m.get("name"), m.get("memberCount"), m.get("status")));
            }
            return sb.toString().trim();
        }

        List<?> members = (List<?>) data.get("members");
        Integer count = null;
        try {
            Object countObj = data.get("count");
            if (countObj instanceof Integer) {
                count = (Integer) countObj;
            } else if (countObj instanceof Number) {
                count = ((Number) countObj).intValue();
            }
        } catch (Exception ignored) {
        }

        if (members == null || members.isEmpty()) {
            return String.valueOf(data.getOrDefault("message", "Không tìm thấy thành viên."));
        }
        
        String projName = String.valueOf(data.get("projectName"));
        
        // Check if this is a count query (user asked "how many")
        boolean isCountQuery = false;
        try {
            Object countQueryObj = data.get("isCountQuery");
            if (countQueryObj instanceof Boolean) {
                isCountQuery = (Boolean) countQueryObj;
            }
        } catch (Exception ignored) {
        }
        
        // If user explicitly asked "how many", always show count
        if (isCountQuery) {
            return String.format("Dự án %s có %d người.", projName, count != null ? count : 0);
        }
        
        // Otherwise: If count is large (>5), show count; if small (<=5), list members
        if (count != null && count > 5) {
            return String.format("Dự án %s có %d người.", projName, count);
        }
        
        StringBuilder sb = new StringBuilder("Thành viên dự án ").append(projName).append(":\n");
        for (Object obj : members) {
            Map<?, ?> m = (Map<?, ?>) obj;
            sb.append(String.format(Locale.ROOT, "- %s (%s)%n",
                    m.get("employeeName"), m.get("role")));
        }
        return sb.toString().trim();
    }

    private enum ChatIntent {
        PAYROLL,
        EMPLOYEE_PAYROLL,
        ATTENDANCE,
        LEAVE,
        TEAM,
        POLICY,
        PROJECT,
        UNKNOWN
    }

    private enum InteractionMode {
        STRICT,
        BALANCED,
        FRIENDLY
    }

    private record PlanDecision(boolean needTool, String toolName, JsonNode arguments, String directResponse) {
    }
}
