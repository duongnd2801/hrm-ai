package com.hrm.service;

import com.hrm.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.hrm.dto.PayrollDTO;
import com.hrm.entity.*;
import com.hrm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final CompanyConfigRepository companyConfigRepository;
    private final UserRepository userRepository;
    private final ImportExportService importExportService;

    @Transactional(readOnly = true)
    public byte[] exportPayroll(Integer month, Integer year, Authentication authentication) throws Exception {
        ensureAdminOrHR(authentication);
        List<PayrollDTO> payrolls = payrollRepository.findByMonthAndYear(month, year, Pageable.unpaged())
                .getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return importExportService.exportPayrollToExcel(payrolls, month, year);
    }

    @Transactional
    public List<PayrollDTO> calculateMonthlyPayroll(Integer month, Integer year, Authentication authentication) {
        ensureAdminOrHR(authentication);
        
        CompanyConfig config = getCompanyConfig();
        List<Employee> allEmployees = employeeRepository.findAll();
        List<Payroll> results = new ArrayList<>();

        for (Employee emp : allEmployees) {
            Payroll payroll = calculateForEmployee(emp, month, year, config);
            results.add(payrollRepository.save(payroll));
        }

        return results.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PayrollDTO> getMyPayrolls(Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        return payrollRepository.findByEmployeeOrderByYearDescMonthDesc(employee).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<PayrollDTO> getAllPayrolls(Integer month, Integer year, Pageable pageable, Authentication authentication) {
        ensureAdminOrHR(authentication);
        Page<Payroll> page = payrollRepository.findByMonthAndYear(month, year, pageable);
        List<PayrollDTO> content = page.getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getSize(),
                page.getNumber()
        );
    }

    private Payroll calculateForEmployee(Employee emp, int month, int year, CompanyConfig config) {
        long baseSalary = emp.getBaseSalary() != null ? emp.getBaseSalary() : 0L;
        int standardDays = config.getStandardDaysPerMonth();
        
        // Fetch attendances for month
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        List<Attendance> attendances = attendanceRepository.findByEmployeeIdAndDateBetween(emp.getId(), start, end);

        double actualDays = 0;
        double otHours = 0;

        for (Attendance att : attendances) {
            if (att.getStatus() == AttendanceStatus.ON_TIME 
                || att.getStatus() == AttendanceStatus.LATE 
                || att.getStatus() == AttendanceStatus.APPROVED) {
                actualDays += 1.0;
            } else if (att.getStatus() == AttendanceStatus.INSUFFICIENT) {
                actualDays += (att.getTotalHours() != null ? att.getTotalHours().doubleValue() / 8.0 : 0);
            }
            
            if (att.getTotalHours() != null) {
                double standard = config.getStandardHours() != null ? config.getStandardHours().doubleValue() : 8.0;
                otHours += Math.max(0, att.getTotalHours().doubleValue() - standard);
            }
        }

        double dailyRate = (double)baseSalary / standardDays;
        long attendanceSalary = (long)(actualDays * dailyRate);
        
        long otAmount = (long)(otHours * (dailyRate / 8.0) * config.getOtRateWeekday().doubleValue());
        long allowance = 0; // Can expand from employee entity if needed
        long grossSalary = attendanceSalary + otAmount + allowance;

        // Insurance (Calculation based on baseSalary)
        long bhxh = (long)(baseSalary * 0.08);
        long bhyt = (long)(baseSalary * 0.015);
        long bhtn = (long)(baseSalary * 0.01);
        long totalInsurance = bhxh + bhyt + bhtn;

        // Taxable Income
        long personalDeduction = 15500000L;
        long dependentDeduction = (emp.getTaxDependents() != null ? emp.getTaxDependents() : 0) * 6200000L;
        long taxableIncome = Math.max(0, grossSalary - totalInsurance - personalDeduction - dependentDeduction);

        long incomeTax = calculateIncomeTax(taxableIncome);
        long netSalary = Math.max(0, grossSalary - totalInsurance - incomeTax);

        final double finalActualDays = actualDays;
        final double finalOtHours = otHours;

        // Check if existing
        return payrollRepository.findByEmployeeAndMonthAndYear(emp, month, year)
                .map(p -> {
                    p.setBaseSalary(baseSalary);
                    p.setStandardDays(standardDays);
                    p.setActualDays(finalActualDays);
                    p.setOtHours(finalOtHours);
                    p.setOtAmount(otAmount);
                    p.setGrossSalary(grossSalary);
                    p.setBhxh(bhxh);
                    p.setBhyt(bhyt);
                    p.setBhtn(bhtn);
                    p.setTaxableIncome(taxableIncome);
                    p.setIncomeTax(incomeTax);
                    p.setNetSalary(netSalary);
                    return p;
                })
                .orElse(Payroll.builder()
                        .employee(emp)
                        .month(month)
                        .year(year)
                        .baseSalary(baseSalary)
                        .standardDays(standardDays)
                        .actualDays(actualDays)
                        .otHours(otHours)
                        .otAmount(otAmount)
                        .grossSalary(grossSalary)
                        .bhxh(bhxh)
                        .bhyt(bhyt)
                        .bhtn(bhtn)
                        .taxableIncome(taxableIncome)
                        .incomeTax(incomeTax)
                        .netSalary(netSalary)
                        .build());
    }

    private long calculateIncomeTax(long income) {
        if (income <= 0) return 0;
        
        long tax = 0;
        if (income <= 5000000) {
            tax = (long)(income * 0.05);
        } else if (income <= 10000000) {
            tax = (long)(income * 0.1 - 250000);
        } else if (income <= 18000000) {
            tax = (long)(income * 0.15 - 750000);
        } else if (income <= 32000000) {
            tax = (long)(income * 0.2 - 1650000);
        } else if (income <= 52000000) {
            tax = (long)(income * 0.25 - 3250000);
        } else if (income <= 80000000) {
            tax = (long)(income * 0.3 - 5850000);
        } else {
            tax = (long)(income * 0.35 - 9850000);
        }
        return tax;
    }

    private CompanyConfig getCompanyConfig() {
        return companyConfigRepository.findById("default")
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa được cấu hình."));
    }

    private Employee resolveCurrentEmployee(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng."));
        return employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Người dùng chưa được gán nhân viên."));
    }

    private void ensureAdminOrHR(Authentication authentication) {
        boolean allowed = authentication.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("ROLE_ADMIN"));
        if (!allowed) {
            throw new AccessDeniedException("Bạn không có quyền thực hiện chức năng này.");
        }
    }

    private PayrollDTO toDto(Payroll entity) {
        PayrollDTO dto = new PayrollDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setEmployeeId(entity.getEmployee().getId());
        dto.setEmployeeName(entity.getEmployee().getFullName());
        return dto;
    }
}
