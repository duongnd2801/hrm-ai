package com.hrm.controller;

import com.hrm.dto.PageResponse;
import com.hrm.dto.PayrollDTO;
import com.hrm.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @PostMapping("/calculate")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public List<PayrollDTO> calculate(@RequestParam Integer month, @RequestParam Integer year, Authentication authentication) {
        return payrollService.calculateMonthlyPayroll(month, year, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<PageResponse<PayrollDTO>> getAll(
            @RequestParam Integer month, 
            @RequestParam Integer year, 
            @PageableDefault(size = 10) Pageable pageable, 
            Authentication authentication) {
        return ResponseEntity.ok(payrollService.getAllPayrolls(month, year, pageable, authentication));
    }

    @GetMapping("/my")
    public List<PayrollDTO> getMy(Authentication authentication) {
        return payrollService.getMyPayrolls(authentication);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<byte[]> export(@RequestParam Integer month, @RequestParam Integer year, Authentication authentication) throws Exception {
        byte[] data = payrollService.exportPayroll(month, year, authentication);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payroll_" + month + "_" + year + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
}
