package com.hrm.dto;

import com.hrm.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMatrixDTO {
    private UUID employeeId;
    private String employeeName;
    private String departmentName;
    private Map<Integer, AttendanceStatus> dailyStatus; // Day -> Status
    private Map<Integer, Double> dailyHours; // Day -> Hours
    private double totalWorkHours;
    private double totalWorkDays; // "Thực tế"
    private double paidDays; // "Hưởng lương" (Work + Approved Leave)
    private long lateCount;
    private long absentCount;
}
