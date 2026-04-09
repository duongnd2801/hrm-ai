package com.hrm.dto;

import com.hrm.entity.ApologyStatus;
import com.hrm.entity.LeaveType;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class LeaveRequestDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LeaveType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private ApologyStatus status;
    private String reviewNote;
    private String reviewedByName;
    private LocalDateTime createdAt;
}
