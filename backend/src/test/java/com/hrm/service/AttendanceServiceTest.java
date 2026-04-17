package com.hrm.service;

import com.hrm.dto.AttendanceDTO;
import com.hrm.entity.*;
import com.hrm.repository.AttendanceRepository;
import com.hrm.repository.CompanyConfigRepository;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CompanyConfigRepository companyConfigRepository;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private AttendanceService attendanceService;

    private User user;
    private Employee employee;
    private CompanyConfig config;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@hrm.com");

        employee = new Employee();
        employee.setId(UUID.randomUUID());
        employee.setUser(user);
        employee.setFullName("Test Employee");

        config = new CompanyConfig();
        config.setWorkStartTime(LocalTime.of(8, 0));
        config.setWorkEndTime(LocalTime.of(17, 0));
        config.setLunchBreakStart(LocalTime.of(12, 0));
        config.setLunchBreakEnd(LocalTime.of(13, 0));
        config.setEarlyCheckinMinutes(30);
        config.setStandardHours(BigDecimal.valueOf(8.0));
    }

    @Test
    void checkIn_Success_OnTime() {
        when(authentication.getName()).thenReturn("test@hrm.com");
        when(userRepository.findByEmail("test@hrm.com")).thenReturn(Optional.of(user));
        when(employeeRepository.findByUserId(user.getId())).thenReturn(Optional.of(employee));
        when(companyConfigRepository.findById("default")).thenReturn(Optional.of(config));
        
        when(attendanceRepository.findByEmployeeAndDate(eq(employee), any(LocalDate.class)))
                .thenReturn(Optional.empty());
                
        when(attendanceRepository.saveAndFlush(any(Attendance.class))).thenAnswer(i -> {
            Attendance a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AttendanceDTO result = attendanceService.checkIn(authentication);

        assertNotNull(result);
        assertEquals(employee.getId(), result.getEmployeeId());
        // Trạng thái sẽ là PENDING nếu chưa đến muộn, nếu đến sau giờ thì là LATE
        // Tùy thuộc vào thời gian chạy test. 
        // Trong unit test chạy thật nên thời gian localDateTime.now() sẽ được gọi
    }
}
