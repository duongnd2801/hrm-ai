package com.hrm.controller;

import com.hrm.dto.PayrollDTO;
import com.hrm.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
    public List<PayrollDTO> getAll(@RequestParam Integer month, @RequestParam Integer year, Authentication authentication) {
        return payrollService.getAllPayrolls(month, year, authentication);
    }

    @GetMapping("/my")
    public List<PayrollDTO> getMy(Authentication authentication) {
        return payrollService.getMyPayrolls(authentication);
    }
}
