package com.hrm.dto;

import com.hrm.entity.ProjectRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ProjectMemberRequest {
    @NotNull(message = "Cần chọn nhân viên")
    private UUID employeeId;

    @NotNull(message = "Vai trò dự án không được để trống")
    private ProjectRole role;

    private LocalDate joinedAt;
    
    private LocalDate leftAt;
    
    private Integer contributionPercentage;
}
