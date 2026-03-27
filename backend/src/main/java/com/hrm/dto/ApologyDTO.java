package com.hrm.dto;

import com.hrm.entity.ApologyStatus;
import com.hrm.entity.ApologyType;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ApologyDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID attendanceId;
    private LocalDate attendanceDate;
    private ApologyType type;
    private String reason;
    private String fileUrl;
    private ApologyStatus status;
    private UUID reviewedBy;
    private String reviewerEmail;
    private String reviewNote;
}
