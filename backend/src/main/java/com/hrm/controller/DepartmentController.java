package com.hrm.controller;

import com.hrm.dto.DepartmentDTO;
import com.hrm.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/company/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final CompanyService companyService;

    @GetMapping
    @PreAuthorize("hasAuthority('DEPT_VIEW')")
    public ResponseEntity<List<DepartmentDTO>> getAll() {
        return ResponseEntity.ok(companyService.getAllDepartments());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DEPT_CREATE')")
    public ResponseEntity<DepartmentDTO> create(@Valid @RequestBody DepartmentDTO dto) {
        return ResponseEntity.ok(companyService.createDepartment(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DEPT_UPDATE')")
    public ResponseEntity<DepartmentDTO> update(@PathVariable UUID id, @Valid @RequestBody DepartmentDTO dto) {
        return ResponseEntity.ok(companyService.updateDepartment(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DEPT_DELETE')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        companyService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }
}
