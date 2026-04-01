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

    private static final String FRIENDLY_BUSY_MESSAGE = "Xin lÃ¡Â»â€”i, tÃƒÂ´i Ã„â€˜ang bÃ¡ÂºÂ­n. BÃ¡ÂºÂ¡n thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau nhÃƒÂ©! Ã°Å¸â„¢Â";
    private static final String NON_HRM_FALLBACK = "MÃƒÂ¬nh Ã†Â°u tiÃƒÂªn hÃ¡Â»â€” trÃ¡Â»Â£ nghiÃ¡Â»â€¡p vÃ¡Â»Â¥ HRM. NÃ¡ÂºÂ¿u bÃ¡ÂºÂ¡n cÃ¡ÂºÂ§n, mÃƒÂ¬nh cÃƒÂ³ thÃ¡Â»Æ’ trÃ¡ÂºÂ£ lÃ¡Â»Âi ngÃ¡ÂºÂ¯n rÃ¡Â»â€œi quay lÃ¡ÂºÂ¡i lÃ†Â°Ã†Â¡ng, cÃƒÂ´ng, phÃƒÂ©p, OT hoÃ¡ÂºÂ·c chÃƒÂ­nh sÃƒÂ¡ch.";

    private static final String SYSTEM_PROMPT = """
            BÃ¡ÂºÂ¡n lÃƒÂ  trÃ¡Â»Â£ lÃƒÂ½ HRM nÃ¡Â»â„¢i bÃ¡Â»â„¢ cÃ¡Â»Â§a cÃƒÂ´ng ty. NhiÃ¡Â»â€¡m vÃ¡Â»Â¥ DUY NHÃ¡ÂºÂ¤T cÃ¡Â»Â§a bÃ¡ÂºÂ¡n lÃƒÂ  hÃ¡Â»â€” trÃ¡Â»Â£ cÃƒÂ¡c vÃ¡ÂºÂ¥n Ã„â€˜Ã¡Â»Â nhÃƒÂ¢n sÃ¡Â»Â±.
            CHÃ¡Â»Ë† trÃ¡ÂºÂ£ lÃ¡Â»Âi cÃƒÂ¡c chÃ¡Â»Â§ Ã„â€˜Ã¡Â»Â sau:
            - LÃ†Â°Ã†Â¡ng, thÃ†Â°Ã¡Â»Å¸ng, phÃ¡Â»Â¥ cÃ¡ÂºÂ¥p, bÃ¡ÂºÂ£o hiÃ¡Â»Æ’m, thuÃ¡ÂºÂ¿ TNCN
            - ChÃ¡ÂºÂ¥m cÃƒÂ´ng, ngÃƒÂ y cÃƒÂ´ng, giÃ¡Â»Â lÃƒÂ m, OT
            - NghÃ¡Â»â€° phÃƒÂ©p, Ã„â€˜Ã†Â¡n xin nghÃ¡Â»â€°, giÃ¡ÂºÂ£i trÃƒÂ¬nh
            - ChÃƒÂ­nh sÃƒÂ¡ch cÃƒÂ´ng ty (giÃ¡Â»Â lÃƒÂ m, quy Ã„â€˜Ã¡Â»â€¹nh, OT rate)
            - DuyÃ¡Â»â€¡t/tÃ¡Â»Â« chÃ¡Â»â€˜i Ã„â€˜Ã†Â¡n (nÃ¡ÂºÂ¿u cÃƒÂ³ quyÃ¡Â»Ân)

            NÃ¡ÂºÂ¿u cÃƒÂ¢u hÃ¡Â»Âi khÃƒÂ´ng thuÃ¡Â»â„¢c HRM, bÃ¡ÂºÂ¡n cÃƒÂ³ thÃ¡Â»Æ’ phÃ¡ÂºÂ£n hÃ¡Â»â€œi ngÃ¡ÂºÂ¯n gÃ¡Â»Ân, lÃ¡Â»â€¹ch sÃ¡Â»Â±,
            sau Ã„â€˜ÃƒÂ³ chÃ¡Â»Â§ Ã„â€˜Ã¡Â»â„¢ng kÃƒÂ©o lÃ¡ÂºÂ¡i cÃƒÂ¡c chÃ¡Â»Â§ Ã„â€˜Ã¡Â»Â HRM.
            TrÃ¡ÂºÂ£ lÃ¡Â»Âi bÃ¡ÂºÂ±ng tiÃ¡ÂºÂ¿ng ViÃ¡Â»â€¡t, ngÃ¡ÂºÂ¯n gÃ¡Â»Ân, chuyÃƒÂªn nghiÃ¡Â»â€¡p.
            """;

    private static final String TOOL_PLANNER_PROMPT = """
            BÃ¡ÂºÂ¡n Ã„â€˜ang Ã¡Â»Å¸ chÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ function-calling.
            ChÃ¡Â»â€° trÃ¡ÂºÂ£ JSON Ã„â€˜ÃƒÂºng schema sau vÃƒÂ  khÃƒÂ´ng thÃƒÂªm markdown:
            {
              "needTool": true|false,
              "tool": "getMyPayroll|getEmployeePayroll|getMyAttendance|getMyLeaveBalance|getTeamStats|getCompanyPolicy|getUpcomingPublicHolidays|getPendingRequests|approveRequest|getMySummary|none",
              "arguments": { "month": 3, "year": 2026, "type": "LEAVE", "id": "uuid", "action": "APPROVE" },
              "response": "nÃ¡Â»â„¢i dung trÃ¡ÂºÂ£ lÃ¡Â»Âi nÃ¡ÂºÂ¿u khÃƒÂ´ng cÃ¡ÂºÂ§n gÃ¡Â»Âi tool"
            }
            NguyÃƒÂªn tÃ¡ÂºÂ¯c:
            - HÃ¡Â»Âi giÃ¡Â»Â lÃƒÂ m/chÃƒÂ­nh sÃƒÂ¡ch/config/OT rate => bÃ¡ÂºÂ¯t buÃ¡Â»â„¢c getCompanyPolicy.
            - HÃ¡Â»Âi lÃ†Â°Ã†Â¡ng cÃƒÂ¡ nhÃƒÂ¢n => getMyPayroll.
            - HÃ¡Â»Âi lÃ†Â°Ã†Â¡ng nhÃƒÂ¢n viÃƒÂªn khÃƒÂ¡c (admin/hr/manager) => getEmployeePayroll.
            - HÃ¡Â»Âi chÃ¡ÂºÂ¥m cÃƒÂ´ng cÃƒÂ¡ nhÃƒÂ¢n => getMyAttendance.
            - HÃ¡Â»Âi phÃƒÂ©p cÃƒÂ²n lÃ¡ÂºÂ¡i/Ã„â€˜Ã†Â¡n phÃƒÂ©p => getMyLeaveBalance.
            - HÃ¡Â»Âi thÃ¡Â»â€˜ng kÃƒÂª team => getTeamStats.
            - HÃ¡Â»Âi ngÃƒÂ y lÃ¡Â»â€¦ sÃ¡ÂºÂ¯p tÃ¡Â»â€ºi => getUpcomingPublicHolidays.
            - HÃ¡Â»Âi Ã„â€˜Ã†Â¡n chÃ¡Â»Â duyÃ¡Â»â€¡t => getPendingRequests.
            - YÃƒÂªu cÃ¡ÂºÂ§u duyÃ¡Â»â€¡t/tÃ¡Â»Â« chÃ¡Â»â€˜i Ã„â€˜Ã†Â¡n => approveRequest.
            - CÃƒÂ¢u ngoÃƒÂ i HRM => needTool=false vÃƒÂ  response ngÃ¡ÂºÂ¯n gÃ¡Â»Ân, lÃ¡Â»â€¹ch sÃ¡Â»Â±, Ã†Â°u tiÃƒÂªn kÃƒÂ©o vÃ¡Â»Â HRM.
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
            throw new IllegalArgumentException("Tin nhÃ¡ÂºÂ¯n khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng.");
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

        String systemGuideResponse = tryHandleSystemGuide(userMessage, user.getRole());
        if (systemGuideResponse != null) {
            saveMessage(user, user.getRole(), systemGuideResponse, false, null);
            return ChatResponseDto.builder().message(systemGuideResponse).timestamp(LocalDateTime.now()).build();
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
                finalAnswer = "MÃƒÂ¬nh Ã„â€˜ÃƒÂ£ nhÃ¡ÂºÂ­n yÃƒÂªu cÃ¡ÂºÂ§u, nhÃ†Â°ng chÃ†Â°a thÃ¡Â»Æ’ tÃ¡ÂºÂ¡o phÃ¡ÂºÂ£n hÃ¡Â»â€œi phÃƒÂ¹ hÃ¡Â»Â£p. BÃ¡ÂºÂ¡n vui lÃƒÂ²ng hÃ¡Â»Âi lÃ¡ÂºÂ¡i rÃƒÂµ hÃ†Â¡n.";
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

        // DuyÃ¡Â»â€¡t/tÃ¡Â»Â« chÃ¡Â»â€˜i cÃƒÂ³ thÃ¡Â»Æ’ lÃƒÂ  thao tÃƒÂ¡c ghi, Ã†Â°u tiÃƒÂªn bÃ¡ÂºÂ¯t explicit
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

        // Policy/config luÃƒÂ´n route cÃ¡Â»Â©ng Ã„â€˜Ã¡Â»Æ’ trÃƒÂ¡nh model Ã„â€˜oÃƒÂ¡n
        if (containsAny(text, "gio lam", "gio vao", "gio ra", "nghi trua", "ot rate", "tang ca",
                "chinh sach", "quy dinh", "config", "cau hinh", "cong ty", "ngay cong chuan",
                "nua ngay", "nua ngay sang", "nua ngay chieu", "half day",
                "bao nhieu cong", "tinh cong", "he so", "tham so",
                "ngay le", "le tet", "holiday")) {
            return new PlanDecision(true, "getCompanyPolicy", args, null);
        }

        if (containsAny(text, "don cho duyet", "cho duyet", "pending", "pending request", "waiting approval", "requests to approve")) {
            return new PlanDecision(true, "getPendingRequests", args, null);
        }

        if (containsAny(text, "thong ke team", "team", "di muon", "luong tb", "nhom toi", "team stats", "team summary")) {
            return new PlanDecision(true, "getTeamStats", args, null);
        }

        if (containsAny(text, "luong", "payroll", "thuc nhan", "gross", "net", "salary", "payslip")) {
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

        if (containsAny(text, "cham cong", "ngay cong", "di muon", "check in", "check out", "attendance", "timesheet", "work hours")) {
            return new PlanDecision(true, "getMyAttendance", args, null);
        }

        if (containsAny(text, "nghi phep", "phep", "don nghi", "giai trinh", "leave", "apology", "leave request")) {
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
                default -> null;
            };
        }

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
                    User role: %s
                    LÃ¡Â»â€¹ch sÃ¡Â»Â­ gÃ¡ÂºÂ§n Ã„â€˜ÃƒÂ¢y: %s
                    User message: %s
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
                    Vai trÃƒÂ² user: %s
                    LÃ¡Â»â€¹ch sÃ¡Â»Â­ gÃ¡ÂºÂ§n Ã„â€˜ÃƒÂ¢y: %s
                    CÃƒÂ¢u hÃ¡Â»Âi user: %s
                    Tool Ã„â€˜ÃƒÂ£ gÃ¡Â»Âi: %s
                    KÃ¡ÂºÂ¿t quÃ¡ÂºÂ£ tool (JSON): %s
                    HÃƒÂ£y trÃ¡ÂºÂ£ lÃ¡Â»Âi ngÃ¡ÂºÂ¯n gÃ¡Â»Ân, rÃƒÂµ rÃƒÂ ng, chÃ¡Â»â€° dÃ¡Â»Â±a trÃƒÂªn dÃ¡Â»Â¯ liÃ¡Â»â€¡u trÃƒÂªn.
                    """.formatted(SYSTEM_PROMPT, user.getRole().name(), historyLines, userMessage, toolName, objectMapper.writeValueAsString(toolResult));
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
            return "MÃ¬nh chÆ°a láº¥y Ä‘Æ°á»£c dá»¯ liá»‡u phÃ¹ há»£p. Báº¡n thá»­ há»i láº¡i cá»¥ thá»ƒ hÆ¡n.";
        }
        return switch (toolName) {
            case "getMyPayroll", "getEmployeePayroll" -> summarizePayroll(toolResult);
            case "getMyAttendance" -> summarizeAttendance(toolResult);
            case "getMyLeaveBalance" -> summarizeLeave(toolResult);
            case "getCompanyPolicy", "getUpcomingPublicHolidays" ->
                    String.valueOf(toolResult.getOrDefault("message", "ÄÃ£ láº¥y thÃ´ng tin."));
            case "getTeamStats" -> summarizeTeam(toolResult);
            case "getPendingRequests" -> summarizePending(toolResult);
            case "approveRequest" -> String.valueOf(toolResult.getOrDefault("message", "ÄÃ£ xá»­ lÃ½ yÃªu cáº§u."));
            default -> String.valueOf(toolResult.getOrDefault("message", "ÄÃ£ xá»­ lÃ½ yÃªu cáº§u thÃ nh cÃ´ng."));
        };
    }

    private String summarizePayroll(Map<String, Object> data) {
        String employeeName = String.valueOf(data.getOrDefault("employeeName", "NhÃ¢n viÃªn"));
        Object month = data.get("month");
        Object year = data.get("year");
        Object net = data.get("netSalary");
        Object gross = data.get("grossSalary");
        if (net == null && gross == null) {
            return String.valueOf(data.getOrDefault("message", "Hiá»‡n chÆ°a cÃ³ báº£ng lÆ°Æ¡ng cho ká»³ nÃ y."));
        }
        return String.format(
                Locale.ROOT,
                "LÆ°Æ¡ng thÃ¡ng %s/%s cá»§a %s:%n- Tá»•ng lÆ°Æ¡ng (Gross): %s%n- Thá»±c nháº­n (Net): %s",
                month, year, employeeName, formatCurrency(gross), formatCurrency(net)
        );
    }

    private String summarizeAttendance(Map<String, Object> data) {
        return String.format(
                Locale.ROOT,
                "Cháº¥m cÃ´ng thÃ¡ng %s/%s:%n- Sá»‘ báº£n ghi: %s%n- ÄÃºng giá»: %s ngÃ y%n- Äi muá»™n: %s ngÃ y%n- Tá»•ng giá» lÃ m: %s",
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
                "Sá»‘ dÆ° phÃ©p nÄƒm %s:%n- Quota: %s ngÃ y%n- ÄÃ£ dÃ¹ng: %s ngÃ y%n- CÃ²n láº¡i: %s ngÃ y",
                data.getOrDefault("year", LocalDateTime.now().getYear()),
                data.getOrDefault("annualLeaveQuota", 12),
                data.getOrDefault("usedAnnualLeaveDays", 0),
                data.getOrDefault("remainingAnnualLeaveDays", 0)
        );
    }

    private String summarizeTeam(Map<String, Object> data) {
        return String.format(
                Locale.ROOT,
                "Thá»‘ng kÃª team thÃ¡ng %s/%s:%n- Quy mÃ´ team: %s%n- Tá»•ng ngÃ y Ä‘i muá»™n: %s%n- Tá»•ng giá» OT: %s",
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
                "ÄÆ¡n chá» duyá»‡t hiá»‡n táº¡i:%n- Nghá»‰ phÃ©p: %d%n- Giáº£i trÃ¬nh: %d%n- OT: %d",
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
            case PAYROLL, EMPLOYEE_PAYROLL -> "OK. BÃ¡ÂºÂ¡n muÃ¡Â»â€˜n xem lÃ†Â°Ã†Â¡ng thÃƒÂ¡ng nÃƒÂ o hoÃ¡ÂºÂ·c so sÃƒÂ¡nh vÃ¡Â»â€ºi thÃƒÂ¡ng trÃ†Â°Ã¡Â»â€ºc?";
            case ATTENDANCE -> "OK. BÃ¡ÂºÂ¡n muÃ¡Â»â€˜n xem chÃ¡ÂºÂ¥m cÃƒÂ´ng theo thÃƒÂ¡ng nÃƒÂ o?";
            case POLICY -> "OK. BÃ¡ÂºÂ¡n muÃ¡Â»â€˜n xem thÃƒÂªm mÃ¡Â»Â¥c nÃƒÂ o trong chÃƒÂ­nh sÃƒÂ¡ch cÃƒÂ´ng ty?";
            case TEAM -> "OK. BÃ¡ÂºÂ¡n muÃ¡Â»â€˜n xem thÃƒÂªm thÃ¡Â»â€˜ng kÃƒÂª nÃƒÂ o cÃ¡Â»Â§a team?";
            case LEAVE -> "OK. BÃ¡ÂºÂ¡n muÃ¡Â»â€˜n xem sÃ¡Â»â€˜ dÃ†Â° phÃƒÂ©p hay hÃ†Â°Ã¡Â»â€ºng dÃ¡ÂºÂ«n tÃ¡ÂºÂ¡o Ã„â€˜Ã†Â¡n?";
            default -> "OK. BÃ¡ÂºÂ¡n muÃ¡Â»â€˜n mÃƒÂ¬nh hÃ¡Â»â€” trÃ¡Â»Â£ gÃƒÂ¬ tiÃ¡ÂºÂ¿p theo trong hÃ¡Â»â€¡ thÃ¡Â»â€˜ng HRM?";
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
            int start = Math.max(0, request.getHistory().size() - 10);
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
            return "Hệ thống HRM hỗ trợ: nhân viên, chấm công, giải trình, nghỉ phép, tăng ca, bảng lương (Excel/PDF), cấu hình, thông báo và chatbot nội bộ.";
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

        if (containsAny(text, "thong bao", "notification", "chuong")) {
            return "Thông báo hiển thị đơn chờ duyệt và kết quả duyệt/từ chối. Bạn có thể mở panel chuông trên header để xem nhanh.";
        }

        if (containsAny(text, "chatbot", "tro ly ai", "hoi gi duoc", "what can you do", "help", "features")) {
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

        // BALANCED (default): chÃ¡Â»â€° chÃ¡ÂºÂ·n cÃƒÂ¡c cÃƒÂ¢u rÃƒÂµ rÃƒÂ ng lÃ¡Â»â€¡ch scope quÃƒÂ¡ xa HRM.
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
                "cham cong", "ngay cong", "gio lam", "ot", "tang ca",
                "nghi phep", "xin nghi", "giai trinh", "chinh sach", "quy dinh",
                "duyet don", "tu choi don", "payroll", "attendance", "leave",
                "apology", "config", "company", "cau hinh", "cong ty",
                "ngay le", "le tet", "holiday",
                "phan quyen", "role", "permission", "dashboard", "menu", "module",
                "import", "export", "excel", "pdf", "template", "preview",
                "thong bao", "notification", "doi mat khau", "user management", "quan ly user",
                "chatbot", "tro ly ai", "salary", "payslip", "timesheet", "policy", "approval", "overtime", "leave request"
        };
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
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
        return normalized.replace("đ", "d");
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
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
            throw new IllegalStateException("Gemini API call failed.");
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
                .orElseThrow(() -> new IllegalArgumentException("KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y tÃƒÂ i khoÃ¡ÂºÂ£n Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p."));
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

    private enum ChatIntent {
        PAYROLL,
        EMPLOYEE_PAYROLL,
        ATTENDANCE,
        LEAVE,
        TEAM,
        POLICY,
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
