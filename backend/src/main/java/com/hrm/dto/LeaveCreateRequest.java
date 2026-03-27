package com.hrm.dto;

import com.hrm.entity.LeaveType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveCreateRequest {
    private LeaveType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}
