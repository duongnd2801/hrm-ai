package com.hrm.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class PositionDTO {
    private UUID id;
    private String name;
    private String description;
    private Boolean isLocked;
    private Boolean multiPerDept;
    private Boolean standalone;
}
