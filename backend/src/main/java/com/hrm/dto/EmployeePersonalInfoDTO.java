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
}
