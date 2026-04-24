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
@lombok.extern.slf4j.Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseService sseService;

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
                .read(false)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = NotificationDTO.fromEntity(saved);
        long unreadCount = notificationRepository.countUnreadByUser(user);
        
        // Push SSE update AFTER commit to avoid race conditions
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
            new org.springframework.transaction.support.TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sseService.sendNotification(user.getId(), dto);
                    sseService.sendUnreadCount(user.getId(), unreadCount);
                }
            }
        );
        
        return dto;
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
        Page<Notification> notifications = notificationRepository.findByUserAndReadFalseOrderByCreatedAtDesc(user, pageable);

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
            throw new RuntimeException("Bạn không có quyền truy cập thông báo này");
        }

        notificationRepository.updateReadStatus(notificationId, true, LocalDateTime.now());
        log.info("Notification {} marked as read for user {}", notificationId, currentUser.getEmail());
        
        long unreadCount = notificationRepository.countUnreadByUser(currentUser);

        // Push count update AFTER commit
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
            new org.springframework.transaction.support.TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sseService.sendUnreadCount(currentUser.getId(), unreadCount);
                }
            }
        );
        
        return NotificationDTO.fromEntity(notificationRepository.findById(notificationId).orElse(null));
    }

    /**
     * Mark all notifications as read for current user
     */
    @Transactional
    public void markAllAsRead() {
        User user = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        notificationRepository.markAllAsReadForUser(user, now);
        log.info("Marked all notifications as read for user {}", user.getEmail());
        
        // Push count update AFTER commit
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
            new org.springframework.transaction.support.TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sseService.sendUnreadCount(user.getId(), 0L);
                }
            }
        );
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
            throw new RuntimeException("Bạn không có quyền truy cập thông báo này");
        }

        notificationRepository.delete(notification);
        long unreadCount = notificationRepository.countUnreadByUser(currentUser);
        
        // Push count update AFTER commit
        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
            new org.springframework.transaction.support.TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sseService.sendUnreadCount(currentUser.getId(), unreadCount);
                }
            }
        );
    }

    /**
     * Delete all read notifications for current user
     */
    @Transactional
    public void deleteAllReadNotifications() {
        User user = getCurrentUser();
        notificationRepository.deleteByUserAndRead(user, true);
    }
}
