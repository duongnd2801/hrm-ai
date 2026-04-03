package com.hrm.controller;

import com.hrm.dto.PageResponse;
import com.hrm.dto.UpdateUserRoleRequest;
import com.hrm.dto.UserManagementDTO;
import com.hrm.service.UserManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Quản lý tài khoản người dùng (Admin only)")
public class UserManagementController {

    private final UserManagementService userManagementService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy thống kê tài khoản hệ thống")
    public ResponseEntity<com.hrm.dto.UserStatsDTO> getUserStats() {
        return ResponseEntity.ok(userManagementService.getUserStats());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy danh sách tất cả người dùng", description = "Paginated list of all users")
    public ResponseEntity<PageResponse<UserManagementDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userManagementService.getAllUsers(page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy thông tin người dùng", description = "Get user details by ID")
    public ResponseEntity<UserManagementDTO> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userManagementService.getUserById(id));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật vai trò người dùng", description = "Update user role")
    public ResponseEntity<UserManagementDTO> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(userManagementService.updateUserRole(id, request));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Đặt lại mật khẩu người dùng", description = "Reset user password to default (Emp@123)")
    public ResponseEntity<UserManagementDTO> resetPassword(@PathVariable UUID id) {
        return ResponseEntity.ok(userManagementService.resetPassword(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa người dùng", description = "Delete user account")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userManagementService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tìm kiếm người dùng theo email", description = "Search users by email")
    public ResponseEntity<PageResponse<UserManagementDTO>> searchUsersByEmail(
            @RequestParam String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userManagementService.searchUsersByEmail(email, page, size));
    }
}
