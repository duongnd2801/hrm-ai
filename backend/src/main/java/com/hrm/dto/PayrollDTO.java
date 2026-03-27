package com.hrm.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class PayrollDTO {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private Integer month;
    private Integer year;
    private Long baseSalary;
    private Integer standardDays;
    private Double actualDays;
    private Double otHours;
    private Long otAmount;
    private Long allowance;
    private Long grossSalary;
    private Long bhxh;
    private Long bhyt;
    private Long bhtn;
    private Long taxableIncome;
    private Long incomeTax;
    private Long netSalary;
    private String note;
}
