package com.hrm.dto;

import com.hrm.entity.ApologyType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ApologyCreateRequest {
    private LocalDate attendanceDate;
    private ApologyType type;
    private String reason;
    private String fileUrl;
}
