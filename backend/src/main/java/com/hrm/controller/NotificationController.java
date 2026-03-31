package com.hrm.controller;

import com.hrm.dto.NotificationDTO;
import com.hrm.dto.PageResponse;
import com.hrm.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Quản lý thông báo cho user")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy tất cả thông báo của tôi", description = "Paginated list of all notifications")
    public ResponseEntity<PageResponse<NotificationDTO>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(notificationService.getMyNotifications(page, size));
    }

    @GetMapping("/my/unread")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy thông báo chưa đọc", description = "Paginated list of unread notifications")
    public ResponseEntity<PageResponse<NotificationDTO>> getMyUnreadNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(notificationService.getMyUnreadNotifications(page, size));
    }

    @GetMapping("/my/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc", description = "Get count of unread notifications")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu thông báo là đã đọc", description = "Mark notification as read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/mark-all-as-read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc", description = "Mark all notifications as read")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xóa thông báo", description = "Delete a notification")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete-all-read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xóa tất cả thông báo đã đọc", description = "Delete all read notifications")
    public ResponseEntity<Void> deleteAllReadNotifications() {
        notificationService.deleteAllReadNotifications();
        return ResponseEntity.noContent().build();
    }
}
