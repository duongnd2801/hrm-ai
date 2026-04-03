package com.hrm.dto;

import com.hrm.entity.ApologyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ApologyCreateRequest {
    @NotNull(message = "Ngày giải trình không được trống")
    private LocalDate attendanceDate;

    @NotNull(message = "Loại giải trình không được trống")
    private ApologyType type;

    @NotBlank(message = "Lý do giải trình không được trống")
    private String reason;
    private String fileUrl;
}
