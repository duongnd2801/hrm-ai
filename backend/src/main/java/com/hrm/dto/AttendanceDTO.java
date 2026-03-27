package com.hrm.dto;

import com.hrm.entity.AttendanceStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AttendanceDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private BigDecimal totalHours;
    private AttendanceStatus status;
    private String note;
}
