package com.hrm.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserDTO {
    private UUID id;
    private String email;
    private String role;
    private LocalDateTime createdAt;
}
