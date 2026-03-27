package com.hrm.service;

import com.hrm.dto.OTCreateRequest;
import com.hrm.dto.OTRequestDTO;
import com.hrm.entity.Employee;
import com.hrm.entity.OTRequest;
import com.hrm.entity.OTStatus;
import com.hrm.entity.User;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.OTRequestRepository;
import com.hrm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OTRequestService {

    private final OTRequestRepository otRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public List<OTRequestDTO> getMyRequests(UUID userId) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Chưa có hồ sơ nhân viên."));
        return otRequestRepository.findByEmployeeId(emp.getId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<OTRequestDTO> getPendingRequests() {
        return otRequestRepository.findByStatus(OTStatus.PENDING).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OTRequestDTO createRequest(UUID userId, OTCreateRequest req) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Chưa có hồ sơ nhân viên."));

        OTRequest otRequest = OTRequest.builder()
                .employee(emp)
                .date(req.getDate())
                .hours(req.getHours())
                .reason(req.getReason())
                .status(OTStatus.PENDING)
                .build();

        return toDTO(otRequestRepository.save(otRequest));
    }

    @Transactional
    public void review(UUID id, UUID reviewerId, boolean approved) {
        OTRequest otRequest = otRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn OT."));
        
        User reviewer = userRepository.findById(reviewerId).orElse(null);
        
        otRequest.setStatus(approved ? OTStatus.APPROVED : OTStatus.REJECTED);
        otRequest.setReviewedBy(reviewer);
        otRequestRepository.save(otRequest);
    }

    private OTRequestDTO toDTO(OTRequest ot) {
        return OTRequestDTO.builder()
                .id(ot.getId())
                .employeeId(ot.getEmployee().getId())
                .employeeName(ot.getEmployee().getFullName())
                .date(ot.getDate())
                .hours(ot.getHours())
                .reason(ot.getReason())
                .status(ot.getStatus())
                .reviewerEmail(ot.getReviewedBy() != null ? ot.getReviewedBy().getEmail() : null)
                .createdAt(ot.getCreatedAt())
                .build();
    }
}
