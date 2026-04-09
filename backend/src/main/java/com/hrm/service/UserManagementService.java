package com.hrm.service;

import com.hrm.dto.PageResponse;
import com.hrm.dto.UpdateUserRoleRequest;
import com.hrm.dto.UserManagementDTO;
import com.hrm.repository.RoleRepository;
import com.hrm.entity.User;
import com.hrm.entity.Role;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private static final String DEFAULT_PASSWORD = "Emp@123";

    public com.hrm.dto.UserStatsDTO getUserStats() {
        return com.hrm.dto.UserStatsDTO.builder()
                .total(userRepository.count())
                .admins(userRepository.countByRole_Name("ADMIN") + userRepository.countByRole_Name("HR"))
                .managers(userRepository.countByRole_Name("MANAGER"))
                .employees(userRepository.countByRole_Name("EMPLOYEE"))
                .build();
    }

    /**
     * Get all users with pagination (ADMIN only)
     */
    public PageResponse<UserManagementDTO> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findAll(pageable);

        return new PageResponse<>(
                users.getContent().stream()
                        .map(this::mapToDTO)
                        .toList(),
                users.getTotalElements(),
                users.getTotalPages(),
                users.getSize(),
                users.getNumber()
        );
    }

    /**
     * Get user by ID
     */
    public UserManagementDTO getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDTO(user);
    }

    private UserManagementDTO mapToDTO(User user) {
        UserManagementDTO dto = UserManagementDTO.fromEntity(user);
        employeeRepository.findByUserId(user.getId())
                .ifPresent(emp -> dto.setFullName(emp.getFullName()));
        return dto;
    }

    /**
     * Update user role (ADMIN only)
     */
    @Transactional
    public UserManagementDTO updateUserRole(UUID userId, UpdateUserRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = roleRepository.findByName(request.getRole().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Role không hợp lệ: " + request.getRole()));
        
        user.setRole(role);
        User updated = userRepository.save(user);
        return mapToDTO(updated);
    }

    /**
     * Reset user password to default (ADMIN only)
     */
    @Transactional
    public UserManagementDTO resetPassword(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        User updated = userRepository.save(user);
        return mapToDTO(updated);
    }

    /**
     * Delete user (soft or hard delete) (ADMIN only)
     */
    @Transactional
    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Prevent deleting ADMIN users
        if ("ADMIN".equals(user.getRole().getName())) {
            throw new RuntimeException("Không thể xóa tài khoản Admin hệ thống");
        }

        // Gỡ liên kết từ bảng employees trước khi xóa user (tránh lỗi Foreign Key)
        employeeRepository.findByUserId(userId).ifPresent(emp -> {
            emp.setUser(null);
            employeeRepository.save(emp);
        });

        userRepository.delete(user);
    }

    /**
     * Search users by email
     */
    public PageResponse<UserManagementDTO> searchUsersByEmail(String email, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findByEmailContainingIgnoreCase(email, pageable);

        return new PageResponse<>(
                users.getContent().stream()
                        .map(this::mapToDTO)
                        .toList(),
                users.getTotalElements(),
                users.getTotalPages(),
                users.getSize(),
                users.getNumber()
        );
    }
}
