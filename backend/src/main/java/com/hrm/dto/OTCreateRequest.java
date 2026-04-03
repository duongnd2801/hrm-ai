package com.hrm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class OTCreateRequest {
    @NotNull(message = "Ngày tăng ca không được trống")
    private LocalDate date;

    @NotNull(message = "Số giờ không được trống")
    @DecimalMin(value = "0.1", message = "Số giờ phải lớn hơn 0")
    private BigDecimal hours;
    private String reason;
}
