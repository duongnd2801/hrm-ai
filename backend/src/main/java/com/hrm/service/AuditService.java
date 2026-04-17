package com.hrm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrm.entity.AuditLog;
import com.hrm.repository.AuditLogRepository;
import com.hrm.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Async
    public void log(UUID userId, String email, String action, String table, String targetId, Object oldVal, Object newVal) {
        try {
            String oldJson = oldVal != null ? objectMapper.writeValueAsString(oldVal) : null;
            String newJson = newVal != null ? objectMapper.writeValueAsString(newVal) : null;

            HttpServletRequest request = null;
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                request = attributes.getRequest();
            }

            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .email(email)
                    .action(action)
                    .targetTable(table)
                    .targetId(targetId)
                    .oldValues(oldJson)
                    .newValues(newJson)
                    .ipAddress(request != null ? request.getRemoteAddr() : "unknown")
                    .userAgent(request != null ? request.getHeader("User-Agent") : "unknown")
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit logged: {} for table {} id {}", action, table, targetId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize audit log values", e);
        } catch (Exception e) {
            log.error("Unexpected error during audit logging", e);
        }
    }

    /**
     * Log without RequestContext (useful for batch or background tasks)
     */
    @Async
    public void logSystem(String action, String table, String targetId, Object oldVal, Object newVal) {
        log(null, "SYSTEM", action, table, targetId, oldVal, newVal);
    }
}
