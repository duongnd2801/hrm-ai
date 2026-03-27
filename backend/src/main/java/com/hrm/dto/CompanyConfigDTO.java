package com.hrm.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class CompanyConfigDTO {
    private String id;
    private LocalTime workStartTime;
    private LocalTime workEndTime;
    private LocalTime lunchBreakStart;
    private LocalTime lunchBreakEnd;
    private Integer earlyCheckinMinutes;
    private BigDecimal standardHours;
    private Integer standardDaysPerMonth;
    private Integer cutoffDay;
    private BigDecimal otRateWeekday;
    private BigDecimal otRateWeekend;
    private BigDecimal otRateHoliday;
    private BigDecimal otRateHolidayComp;
    private BigDecimal halfDayMorningRate;
    private BigDecimal halfDayAfternoonRate;
}
