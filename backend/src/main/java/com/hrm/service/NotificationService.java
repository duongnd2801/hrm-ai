package com.hrm.service;

import com.hrm.dto.NotificationDTO;
import com.hrm.dto.PageResponse;
import com.hrm.entity.Notification;
import com.hrm.entity.User;
import com.hrm.repository.NotificationRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Create and save a notification
     */
    public NotificationDTO createNotification(
            User user,
            String title,
            String message,
            Notification.NotificationType type,
            String relatedEntityType,
            UUID relatedEntityId) {

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        return NotificationDTO.fromEntity(saved);
    }

    /**
     * Get all notifications for current user (paginated)
     */
    public PageResponse<NotificationDTO> getMyNotifications(int page, int size) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);

        return new PageResponse<>(
                notifications.getContent().stream()
                        .map(NotificationDTO::fromEntity)
                        .toList(),
                notifications.getTotalElements(),
                notifications.getTotalPages(),
                notifications.getSize(),
                notifications.getNumber()
        );
    }

    /**
     * Get unread notifications for current user (paginated)
     */
    public PageResponse<NotificationDTO> getMyUnreadNotifications(int page, int size) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user, pageable);

        return new PageResponse<>(
                notifications.getContent().stream()
                        .map(NotificationDTO::fromEntity)
                        .toList(),
                notifications.getTotalElements(),
                notifications.getTotalPages(),
                notifications.getSize(),
                notifications.getNumber()
        );
    }

    /**
     * Get count of unread notifications for current user
     */
    public long getUnreadCount() {
        User user = getCurrentUser();
        return notificationRepository.countUnreadByUser(user);
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public NotificationDTO markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        User currentUser = getCurrentUser();
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        Notification updated = notificationRepository.save(notification);
        return NotificationDTO.fromEntity(updated);
    }

    /**
     * Mark all notifications as read for current user
     */
    @Transactional
    public void markAllAsRead() {
        User user = getCurrentUser();
        Page<Notification> unread = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user, PageRequest.of(0, 1000));
        LocalDateTime now = LocalDateTime.now();

        unread.getContent().forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });

        notificationRepository.saveAll(unread.getContent());
    }

    /**
     * Delete a notification
     */
    @Transactional
    public void deleteNotification(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        User currentUser = getCurrentUser();
        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        notificationRepository.delete(notification);
    }

    /**
     * Delete all read notifications for current user
     */
    @Transactional
    public void deleteAllReadNotifications() {
        User user = getCurrentUser();
        notificationRepository.deleteByUserAndIsRead(user, true);
    }
}
