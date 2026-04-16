package com.hrm.controller;

import com.hrm.dto.CompanyConfigDTO;
import com.hrm.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company/config")
@RequiredArgsConstructor
public class CompanyConfigController {

    private final CompanyService companyService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('COMP_VIEW', 'ATT_VIEW')")
    public ResponseEntity<CompanyConfigDTO> getConfig() {
        return ResponseEntity.ok(companyService.getConfig());
    }

    @PutMapping
    @PreAuthorize("hasAuthority('COMP_UPDATE')")
    public ResponseEntity<CompanyConfigDTO> updateConfig(@Valid @RequestBody CompanyConfigDTO dto) {
        return ResponseEntity.ok(companyService.updateConfig(dto));
    }
}
