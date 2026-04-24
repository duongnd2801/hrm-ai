package com.hrm.service;

import com.hrm.dto.ChatHistoryItemDto;
import com.hrm.dto.ChatRequestDto;
import com.hrm.dto.ChatResponseDto;
import com.hrm.entity.User;
import com.hrm.repository.UserRepository;
import com.hrm.service.ToolPlannerService.PlanDecision;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final String FRIENDLY_BUSY_MESSAGE = "Xin lỗi, tôi đang bận. Bạn thử lại sau nhé!";
    private static final String NON_HRM_FALLBACK = "Mình ưu tiên hỗ trợ nghiệp vụ HRM. Nếu bạn cần, mình có thể trả lời ngắn rồi quay lại lương, công, phép, OT hoặc chính sách.";

    private final UserRepository userRepository;
    private final ChatHistoryService chatHistoryService;
    private final ToolDispatcherService toolDispatcherService;
    private final ToolPlannerService toolPlannerService;

    @Transactional
    public ChatResponseDto processMessage(ChatRequestDto request, Authentication authentication) {
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        if (userMessage.isBlank()) {
            throw new IllegalArgumentException("Tin nhắn không được để trống.");
        }

        User user = resolveCurrentUser(authentication);
        String roleName = user.getRole().getName();
        chatHistoryService.saveMessage(user, roleName, userMessage, true, null);

        // 1. Heuristics nhanh (chào hỏi, tính toán, giờ giấc)
        String sanityResponse = toolDispatcherService.tryHandleSimpleSanity(userMessage);
        if (sanityResponse != null) {
            return saveAndReturn(user, roleName, sanityResponse, null, null);
        }

        String dateTimeResponse = toolDispatcherService.tryHandleDateTime(userMessage);
        if (dateTimeResponse != null) {
            return saveAndReturn(user, roleName, dateTimeResponse, null, null);
        }

        String socialResponse = toolDispatcherService.tryHandleLightweightSocial(userMessage);
        if (socialResponse != null) {
            return saveAndReturn(user, roleName, socialResponse, null, null);
        }

        String ackResponse = toolDispatcherService.tryHandleShortAck(userMessage, request.getHistory());
        if (ackResponse != null) {
            return saveAndReturn(user, roleName, ackResponse, null, null);
        }

        try {
            // 2. Forced tool routing (bắt buộc dùng tool bằng regex)
            PlanDecision forced = toolDispatcherService.forcedToolDecision(userMessage, request);
            if (forced != null) {
                return executeAndSummarize(user, roleName, request, userMessage, forced, authentication);
            }
            
            // 3. Reject các câu hỏi ngoài lề (crypto, sổ xố...)
            if (toolDispatcherService.shouldHardReject(userMessage, request.getHistory())) {
                return saveAndReturn(user, roleName, NON_HRM_FALLBACK, null, null);
            }

            // 4. Lên kế hoạch với Gemini
            PlanDecision decision = toolPlannerService.decideWithGemini(user, request, userMessage);
            
            // Nếu Gemini không phản hồi / lỗi, dùng local fallback
            if (decision == null) {
                decision = toolDispatcherService.fallbackDecision(user, userMessage, request);
            }

            if (decision.needTool()) {
                return executeAndSummarize(user, roleName, request, userMessage, decision, authentication);
            } else {
                String finalAnswer = decision.directResponse();
                if (finalAnswer == null || finalAnswer.isBlank()) {
                    finalAnswer = "Mình đã nhận yêu cầu, nhưng chưa thể tạo phản hồi phù hợp. Bạn vui lòng hỏi lại rõ hơn.";
                }
                return saveAndReturn(user, roleName, finalAnswer, null, null);
            }

        } catch (Exception ex) {
            if (isTimeoutException(ex)) {
                return saveAndReturn(user, roleName, FRIENDLY_BUSY_MESSAGE, null, null);
            }
            // Fallback cuối cùng nếu có exception khác
            PlanDecision fallback = toolDispatcherService.fallbackDecision(user, userMessage, request);
            if (fallback.needTool()) {
                try {
                    return executeAndSummarize(user, roleName, request, userMessage, fallback, authentication);
                } catch (Exception ignored) {}
            }
            return saveAndReturn(user, roleName, fallback.directResponse() != null ? fallback.directResponse() : NON_HRM_FALLBACK, null, null);
        }
    }

    private ChatResponseDto executeAndSummarize(User user, String roleName, ChatRequestDto request, String userMessage, PlanDecision decision, Authentication authentication) {
        String toolName = decision.toolName();
        Map<String, Object> toolResult = toolDispatcherService.executeTool(
                toolName,
                decision.arguments(),
                user,
                authentication,
                request.getMonth(),
                request.getYear()
        );

        String finalAnswer = toolPlannerService.summarizeWithGemini(user, request, userMessage, toolName, toolResult);
        if (finalAnswer == null || finalAnswer.isBlank()) {
            finalAnswer = toolDispatcherService.localSummary(toolName, toolResult);
        }

        return saveAndReturn(user, roleName, finalAnswer, toolName, toolResult);
    }

    private ChatResponseDto saveAndReturn(User user, String roleName, String message, String toolName, Map<String, Object> toolResult) {
        chatHistoryService.saveMessage(user, roleName, message, false, toolName);
        return ChatResponseDto.builder()
                .message(message)
                .toolName(toolName)
                .toolResult(toolResult)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private boolean isTimeoutException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof java.net.SocketTimeoutException || current instanceof java.net.http.HttpTimeoutException) {
                return true;
            }
            if (current instanceof org.springframework.web.client.ResourceAccessException && current.getMessage() != null
                    && current.getMessage().toLowerCase(java.util.Locale.ROOT).contains("timed out")) {
                return true;
            }
            if (current.getMessage() != null && current.getMessage().toLowerCase(java.util.Locale.ROOT).contains("timed out")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private User resolveCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản đăng nhập."));
    }

    @Transactional(readOnly = true)
    public List<ChatHistoryItemDto> getHistory(Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        return chatHistoryService.getHistory(user);
    }
}
