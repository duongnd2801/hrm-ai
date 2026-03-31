package com.hrm.dto;

import com.hrm.entity.RoleType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDTO {
    private UUID id;
    private String email;
    private String role;
    private LocalDateTime createdAt;
    private boolean isActive; // For soft delete/disable logic

    public static UserManagementDTO fromEntity(com.hrm.entity.User user) {
        return new UserManagementDTO(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getCreatedAt(),
                true // Assume true, or add to User entity if needed
        );
    }
}
