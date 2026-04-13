package com.hrm.dto;

import com.hrm.entity.GenderType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EmployeePersonalInfoDTO {
    private String phone;
    private String address;
    private String bio;
    private GenderType gender;
    private LocalDate birthDate;

    // Thông tin cá nhân mở rộng (NV tự cập nhật)
    private String personalEmail;

    // Người thân liên hệ (NV tự cập nhật)
    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactPhone;
}
