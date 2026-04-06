package com.hrm.service;

import com.hrm.entity.*;
import com.hrm.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import com.hrm.dto.PayrollDTO;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PayrollServiceTest {

    @Mock
    private PayrollRepository payrollRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private CompanyConfigRepository companyConfigRepository;
    
    @InjectMocks
    private PayrollService payrollService;

    private Employee employee;
    private CompanyConfig config;

    @BeforeEach
    void setUp() {
        employee = Employee.builder()
                .fullName("Nguyễn Đình Dương")
                .baseSalary(20000000L) // 20M
                .taxDependents(1) // 1 dependent
                .build();

        config = CompanyConfig.builder()
                .standardDaysPerMonth(20)
                .standardHours(BigDecimal.valueOf(8))
                .otRateWeekday(BigDecimal.valueOf(1.5))
                .build();
    }

    @Test
    @DisplayName("Test 2026 Tax Calculation (15.5M self, 6.2M dependent)")
    void testTaxCalculation2026() {
        // Gross income = 20M base + 0 OT + 0 allowance = 20M
        // Total Insurance = 20M * 0.105 = 2.1M
        // Personal Deduction = 15.5M
        // Dependent Deduction = 6.2M (for 1 dependent)
        // Taxable Income = 20M - 2.1M - 15.5M - 6.2M = -3.8M -> Should be 0
        // Expected Tax = 0
        // Expected Net = 20M - 2.1M = 17.9M

        when(companyConfigRepository.findAll()).thenReturn(Collections.singletonList(config));
        when(employeeRepository.findAll()).thenReturn(Collections.singletonList(employee));
        
        Attendance att = Attendance.builder()
                .status(AttendanceStatus.ON_TIME)
                .totalHours(BigDecimal.valueOf(8))
                .build();
        List<Attendance> mockAttendances = Collections.nCopies(20, att);
        
        when(attendanceRepository.findByEmployeeIdAndDateBetween(any(), any(), any())).thenReturn(mockAttendances);
        when(payrollRepository.findByEmployeeAndMonthAndYear(any(), anyInt(), anyInt())).thenReturn(Optional.empty());
        when(payrollRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Authentication mockAuth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(mockAuth).getAuthorities();

        List<PayrollDTO> results = payrollService.calculateMonthlyPayroll(4, 2026, mockAuth);
        
        assertEquals(1, results.size());
        PayrollDTO dto = results.get(0);
        assertEquals(20.0, dto.getActualDays(), 0.01);
        assertEquals(20000000L, dto.getBaseSalary());
        assertEquals(2100000L, dto.getBhxh() + dto.getBhyt() + dto.getBhtn());
        assertEquals(0L, dto.getTaxableIncome());
        assertEquals(0L, dto.getIncomeTax());
        assertEquals(17900000L, dto.getNetSalary());
    }

    @Test
    @DisplayName("Test High Income Tax Calculation")
    void testHighIncomeTax() {
        // ... (repeated with 20 attendances)
        employee.setBaseSalary(100000000L);
        employee.setTaxDependents(0);
        
        when(companyConfigRepository.findAll()).thenReturn(Collections.singletonList(config));
        when(employeeRepository.findAll()).thenReturn(Collections.singletonList(employee));
        
        Attendance att = Attendance.builder()
                .status(AttendanceStatus.ON_TIME)
                .totalHours(BigDecimal.valueOf(8))
                .build();
        List<Attendance> mockAttendances = Collections.nCopies(20, att);
        
        when(attendanceRepository.findByEmployeeIdAndDateBetween(any(), any(), any())).thenReturn(mockAttendances);
        when(payrollRepository.findByEmployeeAndMonthAndYear(any(), anyInt(), anyInt())).thenReturn(Optional.empty());
        when(payrollRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Authentication mockAuth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(mockAuth).getAuthorities();

        List<PayrollDTO> results = payrollService.calculateMonthlyPayroll(4, 2026, mockAuth);
        
        PayrollDTO dto = results.get(0);
        assertEquals(74000000L, dto.getTaxableIncome());
        assertEquals(16350000L, dto.getIncomeTax());
    }
}
