package com.hrm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "company_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyConfig {

    @Id
    @Column(length = 10)
    @Builder.Default
    private String id = "default";

    @Column(name = "work_start_time")
    private LocalTime workStartTime;

    @Column(name = "work_end_time")
    private LocalTime workEndTime;

    @Column(name = "lunch_break_start")
    private LocalTime lunchBreakStart;

    @Column(name = "lunch_break_end")
    private LocalTime lunchBreakEnd;

    @Column(name = "early_checkin_minutes")
    private Integer earlyCheckinMinutes;

    @Column(name = "standard_hours")
    private BigDecimal standardHours;

    @Column(name = "standard_days_per_month")
    private Integer standardDaysPerMonth;

    @Column(name = "cutoff_day")
    private Integer cutoffDay;

    @Column(name = "ot_rate_weekday")
    private BigDecimal otRateWeekday;

    @Column(name = "ot_rate_weekend")
    private BigDecimal otRateWeekend;

    @Column(name = "ot_rate_holiday")
    private BigDecimal otRateHoliday;

    @Column(name = "ot_rate_holiday_comp")
    private BigDecimal otRateHolidayComp;

    @Column(name = "half_day_morning_rate")
    private BigDecimal halfDayMorningRate;

    @Column(name = "half_day_afternoon_rate")
    private BigDecimal halfDayAfternoonRate;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void prePersist() {
        this.updatedAt = LocalDateTime.now();
    }
}
