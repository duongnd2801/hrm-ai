package com.hrm.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "payrolls")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payroll {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "base_salary", nullable = false)
    private Long baseSalary;

    @Column(name = "standard_days", nullable = false)
    private Integer standardDays;

    @Column(name = "actual_days", nullable = false)
    private Double actualDays;

    @Column(name = "ot_hours")
    private Double otHours;

    @Column(name = "ot_amount")
    private Long otAmount;

    private Long allowance;

    @Column(name = "gross_salary", nullable = false)
    private Long grossSalary;

    private Long bhxh;
    private Long bhyt;
    private Long bhtn;

    @Column(name = "taxable_income", nullable = false)
    private Long taxableIncome;

    @Column(name = "income_tax", nullable = false)
    private Long incomeTax;

    @Column(name = "net_salary", nullable = false)
    private Long netSalary;

    private String note;

    @Column(name = "created_at", insertable = false, updatable = false)
    private java.time.LocalDateTime createdAt;
}
