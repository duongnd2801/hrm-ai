package com.hrm.controller;

import com.hrm.dto.PageResponse;
import com.hrm.dto.PayrollDTO;
import com.hrm.service.PayrollService;
import com.hrm.service.PayrollPdfService;
import com.hrm.service.ImportExportService;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;
    private final PayrollPdfService payrollPdfService;
    private final ImportExportService importExportService;

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

    @GetMapping("/statement/pdf/{month}/{year}")
    public ResponseEntity<byte[]> downloadPayrollStatementPdf(@PathVariable Integer month, @PathVariable Integer year, Authentication authentication) throws Exception {
        PayrollDTO payroll = payrollService.getMyPayroll(month, year, authentication);
        byte[] pdfData = payrollPdfService.generatePayrollStatement(payroll);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=phieu_luong_" + month + "_" + year + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfData);
    }

    @GetMapping("/statement/excel/{month}/{year}")
    public ResponseEntity<byte[]> downloadPayrollStatementExcel(@PathVariable Integer month, @PathVariable Integer year, Authentication authentication) throws Exception {
        PayrollDTO payroll = payrollService.getMyPayroll(month, year, authentication);
        byte[] excelData = importExportService.exportPayrollToExcel(List.of(payroll), month, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=phieu_luong_" + month + "_" + year + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelData);
    }

    @GetMapping("/statement/pdf/by-id/{payrollId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<byte[]> downloadPayrollStatementPdfById(@PathVariable UUID payrollId, Authentication authentication) throws Exception {
        PayrollDTO payroll = payrollService.getPayrollById(payrollId, authentication);
        byte[] pdfData = payrollPdfService.generatePayrollStatement(payroll);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=phieu_luong_" + payroll.getEmployeeId() + "_" + payroll.getMonth() + "_" + payroll.getYear() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfData);
    }

    @GetMapping("/statement/excel/by-id/{payrollId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<byte[]> downloadPayrollStatementExcelById(@PathVariable UUID payrollId, Authentication authentication) throws Exception {
        PayrollDTO payroll = payrollService.getPayrollById(payrollId, authentication);
        byte[] excelData = importExportService.exportPayrollToExcel(List.of(payroll), payroll.getMonth(), payroll.getYear());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=phieu_luong_" + payroll.getEmployeeId() + "_" + payroll.getMonth() + "_" + payroll.getYear() + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelData);
    }

    @GetMapping("/{month}/{year}")
    public ResponseEntity<PayrollDTO> getMyPayroll(@PathVariable Integer month, @PathVariable Integer year, Authentication authentication) throws Exception {
        PayrollDTO payroll = payrollService.getMyPayroll(month, year, authentication);
        return ResponseEntity.ok(payroll);
    }
}
