package com.hrm.controller;

import com.hrm.dto.EmployeeDTO;
import com.hrm.service.EmployeeService;
import com.hrm.service.ImportExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final ImportExportService importExportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees(Authentication authentication) {
        return ResponseEntity.ok(employeeService.getAllEmployees(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id, authentication));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<?> createEmployee(@RequestBody EmployeeDTO dto) {
        try {
            return ResponseEntity.ok(employeeService.createEmployee(dto));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<EmployeeDTO> updateEmployee(@PathVariable UUID id, @RequestBody EmployeeDTO dto) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }

    @PatchMapping("/{id}/personal")
    public ResponseEntity<EmployeeDTO> updatePersonalInfo(@PathVariable UUID id, @RequestBody EmployeeDTO dto, Authentication authentication) {
        return ResponseEntity.ok(employeeService.updatePersonalInfo(id, dto, authentication));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<byte[]> exportEmployees(Authentication authentication) throws Exception {
        byte[] excelData = importExportService.exportEmployeesToExcel(employeeService.getAllEmployees(authentication));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employees.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() throws Exception {
        byte[] templateData = importExportService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employee_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(templateData);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<String> importEmployees(@RequestParam("file") MultipartFile file) throws Exception {
        List<EmployeeDTO> parsed = importExportService.parseEmployeeExcel(file);
        for (EmployeeDTO emp : parsed) {
            try {
                employeeService.createEmployee(emp);
            } catch (Exception e) {
                // Ignore duplicates or log
            }
        }
        return ResponseEntity.ok("Imported " + parsed.size() + " employees.");
    }
}
