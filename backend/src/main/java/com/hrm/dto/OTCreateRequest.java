package com.hrm.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class OTCreateRequest {
    private LocalDate date;
    private BigDecimal hours;
    private String reason;
}
