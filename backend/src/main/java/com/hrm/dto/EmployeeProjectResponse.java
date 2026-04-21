package com.hrm.dto;

import com.hrm.entity.ProjectRole;
import com.hrm.entity.ProjectStatus;
import com.hrm.entity.ProjectType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class EmployeeProjectResponse {
    private UUID projectId;
    private String projectName;
    private String projectCode;
    private String projectColor;
    private ProjectStatus projectStatus;
    private ProjectType projectType;
    private ProjectRole role;
    private LocalDate joinedAt;
    private LocalDate leftAt;
    private Integer contributionPercentage;
}
