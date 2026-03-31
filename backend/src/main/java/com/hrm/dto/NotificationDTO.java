package com.hrm.dto;

import com.hrm.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {

    private UUID id;

    private String title;

    private String message;

    private String type;

    private boolean isRead;

    private String relatedEntityType;

    private UUID relatedEntityId;

    private LocalDateTime createdAt;

    private LocalDateTime readAt;

    public static NotificationDTO fromEntity(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType().name(),
                notification.isRead(),
                notification.getRelatedEntityType(),
                notification.getRelatedEntityId(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
