package com.hrm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRoleRequest {
    @NotBlank(message = "Role không được để trống")
    @Pattern(regexp = "ADMIN|HR|MANAGER|EMPLOYEE", message = "Role không hợp lệ")
    private String role; // ADMIN, HR, MANAGER, EMPLOYEE
}
