package com.hrm.service;

import com.hrm.dto.DashboardSummaryDTO;
import com.hrm.entity.*;
import com.hrm.repository.ApologyRepository;
import com.hrm.repository.AttendanceRepository;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.LeaveRequestRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final ApologyRepository apologyRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryDTO getSummary(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan dang nhap."));

        DashboardSummaryDTO dto = new DashboardSummaryDTO();
        LocalDate today = LocalDate.now(APP_ZONE);
        dto.setToday(today.toString());

        Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);
        if (employee != null) {
            Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today).orElse(null);
            if (attendance != null) {
                dto.setTodayAttendanceStatus(attendance.getStatus());
                dto.setTodayCheckIn(attendance.getCheckIn() != null ? attendance.getCheckIn().toString() : null);
                dto.setTodayCheckOut(attendance.getCheckOut() != null ? attendance.getCheckOut().toString() : null);
            }
            dto.setMyPendingApologies(apologyRepository.countByEmployeeAndStatus(employee, ApologyStatus.PENDING));
            dto.setMyPendingLeaveRequests(leaveRequestRepository.countByEmployeeAndStatus(employee, ApologyStatus.PENDING));
        } else {
            dto.setMyPendingApologies(0L);
            dto.setMyPendingLeaveRequests(0L);
        }

        boolean reviewer = authentication.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_MANAGER")
                        || a.getAuthority().equals("ROLE_HR")
                        || a.getAuthority().equals("ROLE_ADMIN"));
        if (reviewer) {
            dto.setPendingApologiesToReview(apologyRepository.countByStatus(ApologyStatus.PENDING));
            dto.setPendingLeaveRequestsToReview(leaveRequestRepository.countByStatus(ApologyStatus.PENDING));
        } else {
            dto.setPendingApologiesToReview(0L);
            dto.setPendingLeaveRequestsToReview(0L);
        }

        return dto;
    }
}
