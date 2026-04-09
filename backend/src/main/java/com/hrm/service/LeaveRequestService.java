package com.hrm.service;

import com.hrm.dto.LeaveRequestDTO;
import com.hrm.entity.ApologyStatus;
import com.hrm.entity.Employee;
import com.hrm.entity.LeaveRequest;
import com.hrm.entity.User;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.LeaveRequestRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {
    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getMyLeaveRequests(Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        return leaveRequestRepository.findByEmployeeIdOrderByStartDateDesc(employee.getId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDTO> getAllLeaveRequests() {
        return leaveRequestRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveRequestDTO createLeaveRequest(LeaveRequestDTO dto, Authentication authentication) {
        Employee employee = resolveCurrentEmployee(authentication);
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setType(dto.getType());
        leaveRequest.setStartDate(dto.getStartDate());
        leaveRequest.setEndDate(dto.getEndDate());
        leaveRequest.setReason(dto.getReason());
        leaveRequest.setStatus(ApologyStatus.PENDING);
        return toDTO(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional
    public LeaveRequestDTO approveLeaveRequest(UUID id, Authentication authentication) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LeaveRequest not found"));
        User user = resolveCurrentUser(authentication);
        leaveRequest.setStatus(ApologyStatus.APPROVED);
        leaveRequest.setReviewedBy(user);
        return toDTO(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional
    public LeaveRequestDTO rejectLeaveRequest(UUID id, Authentication authentication) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LeaveRequest not found"));
        User user = resolveCurrentUser(authentication);
        leaveRequest.setStatus(ApologyStatus.REJECTED);
        leaveRequest.setReviewedBy(user);
        return toDTO(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional
    public LeaveRequestDTO review(UUID id, boolean approved, Authentication authentication) {
        if (approved) {
            return approveLeaveRequest(id, authentication);
        } else {
            return rejectLeaveRequest(id, authentication);
        }
    }

    private Employee resolveCurrentEmployee(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    private User resolveCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private LeaveRequestDTO toDTO(LeaveRequest leaveRequest) {
        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setId(leaveRequest.getId());
        dto.setEmployeeId(leaveRequest.getEmployee().getId());
        dto.setEmployeeName(leaveRequest.getEmployee().getFullName());
        dto.setType(leaveRequest.getType());
        dto.setStartDate(leaveRequest.getStartDate());
        dto.setEndDate(leaveRequest.getEndDate());
        dto.setReason(leaveRequest.getReason());
        dto.setStatus(leaveRequest.getStatus());
        if (leaveRequest.getReviewedBy() != null) {
            dto.setReviewedByName(leaveRequest.getReviewedBy().getEmail());
        }
        dto.setCreatedAt(leaveRequest.getCreatedAt());
        return dto;
    }
}
