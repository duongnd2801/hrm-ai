package com.hrm.dto;

import com.hrm.entity.ContractType;
import com.hrm.entity.EmpStatus;
import com.hrm.entity.GenderType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class EmployeeDTO {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String bio;
    private GenderType gender;
    private LocalDate birthDate;
    private EmpStatus status;
    private ContractType contractType;
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Virtual fields
    private UUID departmentId;
    private String departmentName;
    private UUID positionId;
    private String positionName;
    private UUID managerId;
    private String managerName;
    
    private Long baseSalary;
    private Integer taxDependents;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
