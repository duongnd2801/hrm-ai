package com.hrm.dto;

import com.hrm.entity.OTStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class OTRequestDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate date;
    private BigDecimal hours;
    private String reason;
    private OTStatus status;
    private String reviewerEmail;
    private LocalDateTime createdAt;
}
