package com.hrm.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class CompanyConfigDTO {
    private String id;
    
    @NotNull(message = "Giờ bắt đầu làm việc không được trống")
    private LocalTime workStartTime;
    
    @NotNull(message = "Giờ kết thúc làm việc không được trống")
    private LocalTime workEndTime;
    
    @NotNull(message = "Giờ nghỉ trưa bắt đầu không được trống")
    private LocalTime lunchBreakStart;
    
    @NotNull(message = "Giờ nghỉ trưa kết thúc không được trống")
    private LocalTime lunchBreakEnd;
    
    @Min(0)
    private Integer earlyCheckinMinutes;
    
    @NotNull
    private BigDecimal standardHours;
    
    @Min(1) @Max(31)
    private Integer standardDaysPerMonth;
    
    @Min(1) @Max(31)
    private Integer cutoffDay;
    
    private BigDecimal otRateWeekday;
    private BigDecimal otRateWeekend;
    private BigDecimal otRateHoliday;
    private BigDecimal otRateHolidayComp;
    private BigDecimal halfDayMorningRate;
    private BigDecimal halfDayAfternoonRate;
}
