package com.hrm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportErrorResponse {
    private int rowNumber;
    private String email; // To identify which employee had the error
    private String errorMessage;
}
