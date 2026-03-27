package com.hrm.dto;

import com.hrm.entity.RoleType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserDTO {
    private UUID id;
    private String email;
    private RoleType role;
    private LocalDateTime createdAt;
}
