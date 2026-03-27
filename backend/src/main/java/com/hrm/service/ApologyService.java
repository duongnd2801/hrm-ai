package com.hrm.service;

import com.hrm.dto.ApologyCreateRequest;
import com.hrm.dto.ApologyDTO;
import com.hrm.entity.*;
import com.hrm.repository.ApologyRepository;
import com.hrm.repository.AttendanceRepository;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApologyService {

    private final ApologyRepository apologyRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Transactional
    public ApologyDTO createMyApology(ApologyCreateRequest request, Authentication authentication) {
        if (request.getAttendanceDate() == null || request.getType() == null || request.getReason() == null || request.getReason().isBlank()) {
            throw new IllegalArgumentException("Thông tin đơn không hợp lệ.");
        }

        Employee employee = resolveCurrentEmployee(authentication);
        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, request.getAttendanceDate())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dữ liệu chấm công cho ngày đã chọn."));

        if (attendance.getStatus() != AttendanceStatus.LATE
                && attendance.getStatus() != AttendanceStatus.INSUFFICIENT
                && attendance.getStatus() != AttendanceStatus.ABSENT) {
            throw new IllegalArgumentException("Ngày này không cần tạo đơn xin tha tội.");
        }

        if (attendance.getCheckIn() == null && request.getType() == ApologyType.FORGOT_CHECKOUT) {
            throw new IllegalArgumentException("Không hợp lệ với dữ liệu check-in/check-out.");
        }

        if (attendance.getCheckIn() != null && attendance.getCheckOut() != null && request.getType() == ApologyType.FORGOT_CHECKIN) {
            throw new IllegalArgumentException("Dữ liệu check-in đã tồn tại.");
        }

        Apology apology = Apology.builder()
                .employee(employee)
                .attendance(attendance)
                .type(request.getType())
                .reason(request.getReason().trim())
                .fileUrl(request.getFileUrl())
                .status(ApologyStatus.PENDING)
                .build();

        return toDto(apologyRepository.save(apology));
    }

    @Transactional(readOnly = true)
    public List<ApologyDTO> getMyApologies(Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        return apologyRepository.findByEmployeeOrderByCreatedAtDesc(employee).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ApologyDTO> getPendingApologies(Authentication authentication) {
        ensureReviewer(authentication);
        return apologyRepository.findByStatusOrderByCreatedAtAsc(ApologyStatus.PENDING).stream().map(this::toDto).toList();
    }

    @Transactional
    public ApologyDTO review(UUID apologyId, boolean approved, String note, Authentication authentication) {
        ensureReviewer(authentication);
        User reviewer = resolveCurrentUser(authentication);

        Apology apology = apologyRepository.findById(apologyId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn xin tha tội."));

        if (apology.getStatus() != ApologyStatus.PENDING) {
            throw new IllegalArgumentException("Đơn đã được xử lý trước đó.");
        }

        apology.setStatus(approved ? ApologyStatus.APPROVED : ApologyStatus.REJECTED);
        apology.setReviewedBy(reviewer);
        apology.setReviewNote(note);

        if (approved) {
            Attendance attendance = apology.getAttendance();
            attendance.setStatus(AttendanceStatus.APPROVED);
            attendanceRepository.save(attendance);
        }

        return toDto(apologyRepository.save(apology));
    }

    private Employee resolveCurrentEmployee(Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        return employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản chưa được gán hồ sơ nhân viên."));
    }

    private User resolveCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản đăng nhập."));
    }

    private void ensureReviewer(Authentication authentication) {
        boolean allowed = authentication.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_MANAGER")
                        || a.getAuthority().equals("ROLE_HR")
                        || a.getAuthority().equals("ROLE_ADMIN"));
        if (!allowed) {
            throw new AccessDeniedException("Bạn không có quyền duyệt đơn.");
        }
    }

    private ApologyDTO toDto(Apology apology) {
        ApologyDTO dto = new ApologyDTO();
        dto.setId(apology.getId());
        dto.setEmployeeId(apology.getEmployee().getId());
        dto.setEmployeeName(apology.getEmployee().getFullName());
        dto.setAttendanceId(apology.getAttendance().getId());
        dto.setAttendanceDate(apology.getAttendance().getDate());
        dto.setType(apology.getType());
        dto.setReason(apology.getReason());
        dto.setFileUrl(apology.getFileUrl());
        dto.setStatus(apology.getStatus());
        dto.setReviewNote(apology.getReviewNote());
        if (apology.getReviewedBy() != null) {
            dto.setReviewedBy(apology.getReviewedBy().getId());
            dto.setReviewerEmail(apology.getReviewedBy().getEmail());
        }
        return dto;
    }
}
