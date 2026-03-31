package com.hrm.event;

import com.hrm.entity.Notification;
import com.hrm.service.NotificationService;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Listener para eventos de mudança de status de requests
 * Cria notificações automaticamente quando um request muda de status
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RequestStatusChangedEventListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * D30: Listener para mudanças de status de requests
     * Cria notificações automáticas para usuários afetados
     */
    @EventListener
    @Transactional
    public void onRequestStatusChanged(RequestStatusChangedEvent event) {
        log.info("Processando evento: {} [{}] -> {}", 
            event.getRequestType(), event.getRequestId(), event.getStatus());

        try {
            // 1. Buscar usuário afetado
            var user = userRepository.findById(event.getAffectedUserId())
                    .orElse(null);
            
            if (user == null) {
                log.warn("Usuário não encontrado: {}", event.getAffectedUserId());
                return;
            }

            // 2. Mapear status para tipo de notificação
            Notification.NotificationType notificationType = mapStatusToType(event.getStatus());
            
            // 3. Criar título e mensagem baseado no tipo de request
            String title = buildTitle(event.getRequestType(), event.getStatus());
            String message = buildMessage(event.getRequestType(), event.getStatus(), event.getReason());

            // 4. Criar notificação
            notificationService.createNotification(
                user,
                title,
                message,
                notificationType,
                event.getRequestType(),
                event.getRequestId()
            );

            log.info("Notificação criada para usuário: {} - {}", user.getEmail(), title);
            
        } catch (Exception ex) {
            log.error("Erro ao processar RequestStatusChangedEvent", ex);
        }
    }

    /**
     * Mapeia status para tipo de notificação
     */
    private Notification.NotificationType mapStatusToType(String status) {
        return switch (status.toUpperCase()) {
            case "APPROVED" -> Notification.NotificationType.REQUEST_APPROVED;
            case "REJECTED" -> Notification.NotificationType.REQUEST_REJECTED;
            case "PENDING" -> Notification.NotificationType.REQUEST_PENDING;
            default -> Notification.NotificationType.INFO;
        };
    }

    /**
     * Constrói título da notificação
     */
    private String buildTitle(String requestType, String status) {
        String typeLabel = switch (requestType.toUpperCase()) {
            case "APOLOGY" -> "Đơn xin tha tội";
            case "LEAVE_REQUEST" -> "Đơn xin phép";
            case "OT_REQUEST" -> "Tờ khai OT";
            default -> "Yêu cầu";
        };

        return typeLabel + " " + switch (status.toUpperCase()) {
            case "APPROVED" -> "được duyệt ✅";
            case "REJECTED" -> "bị từ chối ❌";
            case "PENDING" -> "chờ xử lý ⏳";
            default -> "được cập nhật";
        };
    }

    /**
     * Constrói nội dung của notificação
     */
    private String buildMessage(String requestType, String status, String reason) {
        String baseMsg = switch (requestType.toUpperCase()) {
            case "APOLOGY" -> "Đơn xin tha tội của bạn";
            case "LEAVE_REQUEST" -> "Đơn xin phép của bạn";
            case "OT_REQUEST" -> "Tờ khai OT của bạn";
            default -> "Yêu cầu của bạn";
        };

        return switch (status.toUpperCase()) {
            case "APPROVED" -> baseMsg + " đã được quản lý phê duyệt.";
            case "REJECTED" -> {
                String msg = baseMsg + " đã bị từ chối.";
                if (reason != null && !reason.isEmpty()) {
                    msg += " Lý do: " + reason;
                }
                yield msg;
            }
            case "PENDING" -> baseMsg + " đang chờ xử lý từ quản lý.";
            default -> baseMsg + " đã được cập nhật.";
        };
    }
}
