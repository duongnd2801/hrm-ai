package com.hrm.dto;

import com.hrm.entity.ContractType;
import com.hrm.entity.EmpStatus;
import com.hrm.entity.GenderType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class EmployeeDTO {
    private UUID id;
    private UUID userId;
    private String role;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 255, message = "Họ tên không được vượt quá 255 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
    private String email;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;
    
    private String address;
    private String bio;
    private GenderType gender;
    private LocalDate birthDate;
    private EmpStatus status;
    private ContractType contractType;

    @NotNull(message = "Ngày bắt đầu không được để trống")
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

    // --- Nhóm HỢP ĐỒNG mở rộng ---
    private UUID manager2Id;
    private String manager2Name;
    private LocalDate joinDate;
    private LocalDate contractSigningDate;

    // --- Nhóm CÁ NHÂN mở rộng ---
    @Email(message = "Email cá nhân không hợp lệ")
    private String personalEmail;

    @Size(max = 20, message = "Số CCCD không được vượt quá 20 ký tự")
    private String citizenId;
    private LocalDate citizenIdDate;
    private String citizenIdPlace;

    // --- Nhóm NGƯỜI THÂN LIÊN HỆ ---
    private String emergencyContactName;
    private String emergencyContactRelationship;
    @Size(max = 20, message = "SĐT người thân không được vượt quá 20 ký tự")
    private String emergencyContactPhone;

    // --- Nhóm TRÌNH ĐỘ ---
    private String programmingLanguages;
    private String major;
    private String university;
    private String educationLevel;
    private Integer graduationYear;
    private String itCertificate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
