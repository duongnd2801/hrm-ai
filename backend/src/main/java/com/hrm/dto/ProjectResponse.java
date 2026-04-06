package com.hrm.dto;

import com.hrm.entity.ProjectStatus;
import com.hrm.entity.ProjectType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProjectResponse {
    private UUID id;
    private String name;
    private String code;
    private String color;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private ProjectStatus status;
    private ProjectType type;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
