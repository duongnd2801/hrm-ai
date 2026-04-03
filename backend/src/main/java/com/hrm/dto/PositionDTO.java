package com.hrm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.UUID;

@Data
public class PositionDTO {
    private UUID id;

    @NotBlank(message = "Tên vị trí không được để trống")
    @Size(max = 100, message = "Tên vị trí không được quá 100 ký tự")
    private String name;
    private String description;
    private Boolean isLocked;
    private Boolean multiPerDept;
    private Boolean standalone;
}
