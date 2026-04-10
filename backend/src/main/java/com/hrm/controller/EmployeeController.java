package com.hrm.controller;

import com.hrm.dto.EmployeeStatsDTO;
import com.hrm.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import com.hrm.dto.EmployeeDTO;
import com.hrm.dto.EmployeePersonalInfoDTO;
import com.hrm.service.EmployeeService;
import com.hrm.service.ImportExportService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final ImportExportService importExportService;

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('EMP_VIEW')")
    public ResponseEntity<EmployeeStatsDTO> getStats() {
        return ResponseEntity.ok(employeeService.getStats());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMP_VIEW')")
    public ResponseEntity<PageResponse<EmployeeDTO>> getAllEmployees(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "fullName", direction = Sort.Direction.ASC) Pageable pageable,
            Authentication authentication) {
        return ResponseEntity.ok(employeeService.getAllEmployees(search, pageable, authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMP_VIEW')")
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id, authentication));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EMP_CREATE')")
    public ResponseEntity<EmployeeDTO> createEmployee(@Valid @RequestBody EmployeeDTO dto) {
        return ResponseEntity.ok(employeeService.createEmployee(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMP_UPDATE')")
    public ResponseEntity<EmployeeDTO> updateEmployee(@PathVariable UUID id, @Valid @RequestBody EmployeeDTO dto) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }

    @PatchMapping("/{id}/personal")
    public ResponseEntity<EmployeeDTO> updatePersonalInfo(@PathVariable UUID id, @RequestBody EmployeePersonalInfoDTO dto, Authentication authentication) {
        return ResponseEntity.ok(employeeService.updatePersonalInfo(id, dto, authentication));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('EMP_EXPORT')")
    public ResponseEntity<byte[]> exportEmployees(
            @RequestParam(required = false) String search,
            Authentication authentication) throws Exception {
        byte[] excelData = importExportService.exportEmployeesToExcel(
                employeeService.getAllEmployees(search, Pageable.unpaged(), authentication).getContent()
        );
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employees.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    @GetMapping("/template")
    @PreAuthorize("hasAuthority('EMP_IMPORT')")
    public ResponseEntity<byte[]> downloadTemplate() throws Exception {
        byte[] templateData = importExportService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employee_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(templateData);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('EMP_IMPORT')")
    public ResponseEntity<?> importEmployees(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("File trống. Vui lòng chọn file Excel.");
            }
            
            List<EmployeeDTO> parsed = importExportService.parseEmployeeExcel(file);
            if (parsed.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("File không chứa dữ liệu hợp lệ. Vui lòng kiểm tra định dạng Excel.");
            }
            
            int successCount = 0;
            List<String> errors = new ArrayList<>();
            
            for (int i = 0; i < parsed.size(); i++) {
                try {
                    employeeService.createEmployee(parsed.get(i));
                    successCount++;
                } catch (IllegalArgumentException e) {
                    errors.add("Dòng " + (i + 2) + ": " + e.getMessage());
                } catch (Exception e) {
                    errors.add("Dòng " + (i + 2) + ": Lỗi không xác định - " + e.getMessage());
                }
            }
            
            if (successCount == 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Không import được nhân viên nào. Lỗi: " + String.join("; ", errors));
            }
            
            String message = "Import thành công " + successCount + " nhân viên.";
            if (!errors.isEmpty()) {
                message += " " + errors.size() + " dòng bị lỗi: " + String.join("; ", errors);
            }
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi đọc file: " + e.getMessage());
        }
    }
}
