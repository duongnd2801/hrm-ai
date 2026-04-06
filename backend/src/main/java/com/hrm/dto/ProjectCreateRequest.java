package com.hrm.dto;

import com.hrm.entity.ProjectStatus;
import com.hrm.entity.ProjectType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ProjectCreateRequest {
    @NotBlank(message = "Tên dự án không được để trống")
    @Size(max = 255)
    private String name;

    @NotBlank(message = "Mã dự án không được để trống")
    @Size(max = 50)
    private String code;

    @Size(max = 20)
    private String color;

    private String description;

    @NotNull(message = "Ngày bắt đầu dự án không được để trống")
    private LocalDate startDate;

    private LocalDate endDate;

    @NotNull(message = "Trạng thái dự án không được để trống")
    private ProjectStatus status;
    
    @NotNull(message = "Loại dự án không được để trống")
    private ProjectType type;
}
