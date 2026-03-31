package com.hrm.service;

import com.hrm.dto.AttendanceDTO;
import com.hrm.entity.*;
import com.hrm.repository.AttendanceRepository;
import com.hrm.repository.CompanyConfigRepository;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private static final String DEFAULT_CONFIG_ID = "default";
    private static final ZoneId APP_ZONE = ZoneId.systemDefault();

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final CompanyConfigRepository companyConfigRepository;

    @Transactional
    public AttendanceDTO checkIn(Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDate today = now.toLocalDate();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseGet(() -> Attendance.builder().employee(employee).date(today).build());

        if (attendance.getCheckIn() != null) {
            throw new IllegalArgumentException("Bạn đã check-in trong ngày hôm nay.");
        }

        CompanyConfig config = getCompanyConfig();
        // D28: Safe null-checks for work start time and early check-in minutes
        if (config.getWorkStartTime() != null && config.getEarlyCheckinMinutes() != null) {
            LocalDateTime earliest = LocalDateTime.of(today, config.getWorkStartTime().minusMinutes(config.getEarlyCheckinMinutes()));
            if (now.isBefore(earliest)) {
                throw new IllegalArgumentException("Chưa đến thời gian cho phép check-in.");
            }
        }

        attendance.setCheckIn(now);
        normalizeStatus(attendance, config);
        return toDto(attendanceRepository.save(attendance));
    }

    @Transactional
    public AttendanceDTO checkOut(Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        LocalDateTime now = LocalDateTime.now(APP_ZONE);
        LocalDate today = now.toLocalDate();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa check-in hôm nay."));

        if (attendance.getCheckIn() == null) {
            throw new IllegalArgumentException("Bạn chưa check-in hôm nay.");
        }
        if (attendance.getCheckOut() != null) {
            throw new IllegalArgumentException("Bạn đã check-out trong ngày hôm nay.");
        }
        if (now.isBefore(attendance.getCheckIn())) {
            throw new IllegalArgumentException("Thời gian check-out không hợp lệ.");
        }

        attendance.setCheckOut(now);
        normalizeStatus(attendance, getCompanyConfig());
        return toDto(attendanceRepository.save(attendance));
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getMyAttendance(Integer month, Integer year, Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        return getAttendanceForEmployee(employee.getId(), month, year, authentication);
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getAttendanceForEmployee(UUID employeeId, Integer month, Integer year, Authentication authentication) {
        Employee current = resolveCurrentEmployee(authentication);
        Employee target = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên."));

        boolean sameUser = current.getId().equals(target.getId());
        boolean elevated = hasAnyRole(authentication, RoleType.MANAGER, RoleType.HR, RoleType.ADMIN);
        if (!sameUser && !elevated) {
            throw new AccessDeniedException("Bạn không có quyền xem chấm công của nhân viên khác.");
        }

        int resolvedMonth = month == null ? LocalDate.now(APP_ZONE).getMonthValue() : month;
        int resolvedYear = year == null ? LocalDate.now(APP_ZONE).getYear() : year;
        LocalDate fromDate = LocalDate.of(resolvedYear, resolvedMonth, 1);
        LocalDate toDate = fromDate.withDayOfMonth(fromDate.lengthOfMonth());

        CompanyConfig config = getCompanyConfig();
        List<Attendance> records = attendanceRepository.findByEmployeeAndDateBetweenOrderByDateAsc(target, fromDate, toDate);
        records.forEach(record -> normalizeStatus(record, config));
        return records.stream().map(this::toDto).toList();
    }

    private void normalizeStatus(Attendance attendance, CompanyConfig config) {
        if (attendance.getStatus() == AttendanceStatus.APPROVED || attendance.getStatus() == AttendanceStatus.DAY_OFF) {
            return;
        }

        LocalDate today = LocalDate.now(APP_ZONE);

        // Case: No check-in and no check-out
        if (attendance.getCheckIn() == null && attendance.getCheckOut() == null) {
            if (attendance.getDate().isBefore(today)) {
                attendance.setStatus(AttendanceStatus.ABSENT);
            } else {
                attendance.setStatus(AttendanceStatus.PENDING);
            }
            attendance.setTotalHours(null);
            return;
        }

        // Case: Only check-in, no check-out yet (Today or in-progress)
        if (attendance.getCheckIn() != null && attendance.getCheckOut() == null) {
            // D27: Safe null-check for work start time
            boolean isLate = config.getWorkStartTime() != null 
                ? attendance.getCheckIn().toLocalTime().isAfter(config.getWorkStartTime())
                : false;
            attendance.setStatus(isLate ? AttendanceStatus.LATE : AttendanceStatus.PENDING);
            attendance.setTotalHours(null);
            return;
        }

        // Case: Both check-in and check-out exist
        BigDecimal totalHours = computeWorkHours(attendance.getCheckIn(), attendance.getCheckOut(), config);
        attendance.setTotalHours(totalHours);

        // D27: Safe null-check for work start time
        boolean isLate = config.getWorkStartTime() != null 
            ? attendance.getCheckIn().toLocalTime().isAfter(config.getWorkStartTime())
            : false;
        BigDecimal standardHours = config.getStandardHours() == null
                ? BigDecimal.valueOf(8)
                : config.getStandardHours();

        if (totalHours.compareTo(standardHours) < 0) {
            // Note: If it's today and they checked out but it's not actually "end of day" yet,
            // we still mark it insufficient if they actually punched out.
            attendance.setStatus(AttendanceStatus.INSUFFICIENT);
        } else {
            attendance.setStatus(isLate ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME);
        }
    }

    private BigDecimal computeWorkHours(LocalDateTime checkIn, LocalDateTime checkOut, CompanyConfig config) {
        // Defensive check for null parameters
        if (checkIn == null || checkOut == null) {
            return BigDecimal.ZERO;
        }
        
        Duration total = Duration.between(checkIn, checkOut);
        if (total.isNegative()) {
            return BigDecimal.ZERO;
        }

        LocalDate date = checkIn.toLocalDate();
        // D26: Safe null-check for lunch break times
        Duration overlap = Duration.ZERO;
        if (config.getLunchBreakStart() != null && config.getLunchBreakEnd() != null) {
            LocalDateTime lunchStart = LocalDateTime.of(date, config.getLunchBreakStart());
            LocalDateTime lunchEnd = LocalDateTime.of(date, config.getLunchBreakEnd());
            overlap = overlap(checkIn, checkOut, lunchStart, lunchEnd);
        }
        
        Duration actual = total.minus(overlap);
        if (actual.isNegative()) {
            actual = Duration.ZERO;
        }

        BigDecimal minutes = BigDecimal.valueOf(actual.toMinutes());
        return minutes.divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private Duration overlap(LocalDateTime aStart, LocalDateTime aEnd, LocalDateTime bStart, LocalDateTime bEnd) {
        LocalDateTime start = aStart.isAfter(bStart) ? aStart : bStart;
        LocalDateTime end = aEnd.isBefore(bEnd) ? aEnd : bEnd;
        if (end.isAfter(start)) {
            return Duration.between(start, end);
        }
        return Duration.ZERO;
    }

    private CompanyConfig getCompanyConfig() {
        return companyConfigRepository.findById(DEFAULT_CONFIG_ID)
                .orElseThrow(() -> new IllegalStateException("Cấu hình công ty không tìm thấy"));
    }

    private Employee resolveCurrentEmployee(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản đăng nhập."));
        return employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản chưa được gán hồ sơ nhân viên."));
    }

    private boolean hasAnyRole(Authentication authentication, RoleType... roles) {
        for (RoleType role : roles) {
            if (authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role.name()))) {
                return true;
            }
        }
        return false;
    }

    private AttendanceDTO toDto(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        // D25: Safe null-check for lazy-loaded employee relationship
        if (attendance.getEmployee() != null) {
            dto.setEmployeeId(attendance.getEmployee().getId());
            dto.setEmployeeName(attendance.getEmployee().getFullName());
        }
        dto.setDate(attendance.getDate());
        dto.setCheckIn(attendance.getCheckIn());
        dto.setCheckOut(attendance.getCheckOut());
        dto.setTotalHours(attendance.getTotalHours());
        dto.setStatus(attendance.getStatus());
        dto.setNote(attendance.getNote());
        return dto;
    }
}
