package com.hrm.dto;

import com.hrm.entity.LeaveType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveCreateRequest {
    @NotNull(message = "Loại nghỉ phép không được trống")
    private LeaveType type;

    @NotNull(message = "Ngày bắt đầu không được trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được trống")
    private LocalDate endDate;

    @NotBlank(message = "Lý do không được trống")
    private String reason;
}
