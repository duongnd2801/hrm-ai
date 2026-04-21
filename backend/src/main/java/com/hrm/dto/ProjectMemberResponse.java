package com.hrm.dto;

import com.hrm.entity.ProjectRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class ProjectMemberResponse {
    private UUID id;
    private UUID projectId;
    private UUID employeeId;
    private String employeeName;
    private String employeeEmail;
    private String employeeAvatar;
    private ProjectRole role;
    private LocalDate joinedAt;
    private LocalDate leftAt;
    private Integer contributionPercentage;
}
