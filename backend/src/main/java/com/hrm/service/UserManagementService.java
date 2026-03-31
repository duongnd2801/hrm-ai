package com.hrm.service;

import com.hrm.dto.PageResponse;
import com.hrm.dto.UpdateUserRoleRequest;
import com.hrm.dto.UserManagementDTO;
import com.hrm.entity.RoleType;
import com.hrm.entity.User;
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
    private final PasswordEncoder passwordEncoder;
    private static final String DEFAULT_PASSWORD = "Emp@123";

    /**
     * Get all users with pagination (ADMIN only)
     */
    public PageResponse<UserManagementDTO> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findAll(pageable);

        return new PageResponse<>(
                users.getContent().stream()
                        .map(UserManagementDTO::fromEntity)
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
        return UserManagementDTO.fromEntity(user);
    }

    /**
     * Update user role (ADMIN only)
     */
    @Transactional
    public UserManagementDTO updateUserRole(UUID userId, UpdateUserRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            RoleType newRole = RoleType.valueOf(request.getRole().toUpperCase());
            user.setRole(newRole);
            User updated = userRepository.save(user);
            return UserManagementDTO.fromEntity(updated);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + request.getRole());
        }
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
        return UserManagementDTO.fromEntity(updated);
    }

    /**
     * Delete user (soft or hard delete) (ADMIN only)
     */
    @Transactional
    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Prevent deleting ADMIN users
        if (user.getRole() == RoleType.ADMIN) {
            throw new RuntimeException("Cannot delete ADMIN users");
        }

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
                        .map(UserManagementDTO::fromEntity)
                        .toList(),
                users.getTotalElements(),
                users.getTotalPages(),
                users.getSize(),
                users.getNumber()
        );
    }
}
