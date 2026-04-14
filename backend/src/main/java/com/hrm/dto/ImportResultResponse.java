package com.hrm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportResultResponse {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<ImportErrorResponse> errors;
    private String message;
    private List<EmployeeDTO> employees;
}
