package com.hrm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSummaryDTO {
    private UUID employeeId;
    private String employeeName;
    private String departmentName;
    private long onTimeCount;
    private long lateCount;
    private long insufficientCount;
    private long absentCount;
    private long approvedCount;
    private long dayOffCount;
    private long totalWorkDays;
}
