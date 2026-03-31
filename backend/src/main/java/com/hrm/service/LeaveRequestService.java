package com.hrm.service;

import com.hrm.dto.LeaveCreateRequest;
import com.hrm.dto.LeaveRequestDTO;
import com.hrm.entity.*;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.LeaveRequestRepository;
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
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Transactional
    public LeaveRequestDTO createMyRequest(LeaveCreateRequest request, Authentication authentication) {
        if (request.getType() == null || request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Thông tin nghỉ phép/OT không hợp lệ.");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc không thể nhỏ hơn ngày bắt đầu.");
        }

        Employee employee = resolveCurrentEmployee(authentication);
        
        // Check for overlapping requests
        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlappingRequests(
                employee, request.getStartDate(), request.getEndDate());
        
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("Nhân viên đã có đơn nghỉ/OT chồng lấn với khoảng ngày này. " +
                    "Vui lòng chọn khoảng ngày khác hoặc kiểm tra các đơn đang chờ duyệt.");
        }
        
        LeaveRequest entity = LeaveRequest.builder()
                .employee(employee)
                .type(request.getType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason())
                .status(ApologyStatus.PENDING)
                .build();

        return toDto(leaveRequestRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getMyRequests(Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        return leaveRequestRepository.findByEmployeeOrderByCreatedAtDesc(employee).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getPendingRequests(Authentication authentication) {
        ensureReviewer(authentication);
        return leaveRequestRepository.findByStatusOrderByCreatedAtAsc(ApologyStatus.PENDING).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getReviewedRequests(Authentication authentication) {
        ensureReviewer(authentication);
        return leaveRequestRepository.findByStatusNotOrderByCreatedAtDesc(ApologyStatus.PENDING).stream().map(this::toDto).toList();
    }

    @Transactional
    public LeaveRequestDTO review(UUID requestId, boolean approved, Authentication authentication) {
        ensureReviewer(authentication);
        User reviewer = resolveCurrentUser(authentication);
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn nghỉ phép/OT."));

        if (request.getStatus() != ApologyStatus.PENDING) {
            throw new IllegalArgumentException("Đơn đã được xử lý trước đó.");
        }

        request.setStatus(approved ? ApologyStatus.APPROVED : ApologyStatus.REJECTED);
        request.setReviewedBy(reviewer);
        return toDto(leaveRequestRepository.save(request));
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

    private LeaveRequestDTO toDto(LeaveRequest entity) {
        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setId(entity.getId());
        dto.setEmployeeId(entity.getEmployee().getId());
        dto.setEmployeeName(entity.getEmployee().getFullName());
        dto.setType(entity.getType());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setReason(entity.getReason());
        dto.setStatus(entity.getStatus());
        if (entity.getReviewedBy() != null) {
            dto.setReviewedBy(entity.getReviewedBy().getId());
            dto.setReviewerEmail(entity.getReviewedBy().getEmail());
        }
        return dto;
    }
}
