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
 * Listener cho sự kiện thay đổi trạng thái của các Request
 * Tự động tạo thông báo khi một request thay đổi trạng thái
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RequestStatusChangedEventListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    /**
     * D30: Listener cho sự kiện thay đổi trạng thái
     * Tạo thông báo tự động cho người dùng liên quan
     */
    @EventListener
    @Transactional
    public void onRequestStatusChanged(RequestStatusChangedEvent event) {
        log.info("Đang xử lý sự kiện: {} [{}] -> {}", 
            event.getRequestType(), event.getRequestId(), event.getStatus());

        try {
            // 1. Tìm người dùng bị ảnh hưởng
            var user = userRepository.findById(event.getAffectedUserId())
                    .orElse(null);
            
            if (user == null) {
                log.warn("Không tìm thấy người dùng: {}", event.getAffectedUserId());
                return;
            }

            // 2. Map trạng thái thành loại thông báo
            Notification.NotificationType notificationType = mapStatusToType(event.getStatus());
            
            // 3. Tạo tiêu đề và tin nhắn dựa trên loại request
            String title = buildTitle(event.getRequestType(), event.getStatus());
            String message = buildMessage(event.getRequestType(), event.getStatus(), event.getReason());

            // 4. Tạo thông báo
            notificationService.createNotification(
                user,
                title,
                message,
                notificationType,
                event.getRequestType(),
                event.getRequestId()
            );

            log.info("Đã tạo thông báo cho người dùng: {} - {}", user.getEmail(), title);
            
        } catch (Exception ex) {
            log.error("Lỗi khi xử lý RequestStatusChangedEvent", ex);
        }
    }

    /**
     * Map trạng thái sang loại thông báo
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
     * Xây dựng tiêu đề thông báo
     */
    private String buildTitle(String requestType, String status) {
        String typeLabel = switch (requestType.toUpperCase()) {
            case "APOLOGY" -> "Đơn xin tha tội";
            case "LEAVE_REQUEST" -> "Đơn xin phép";
            case "OT_REQUEST" -> "Tờ khai OT";
            default -> "Yêu cầu";
        };

        return typeLabel + " " + switch (status.toUpperCase()) {
            case "APPROVED" -> "được duyệt";
            case "REJECTED" -> "bị từ chối";
            case "PENDING" -> "chờ xử lý";
            default -> "được cập nhật";
        };
    }

    /**
     * Xây dựng nội dung thông báo
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
