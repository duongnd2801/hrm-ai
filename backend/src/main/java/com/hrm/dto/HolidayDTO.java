package com.hrm.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class HolidayDTO {
    private UUID id;
    private LocalDate date;
    private String name;
    private Integer year;
    private Boolean isPaidLeave;
}
