package com.hrm.controller;

import com.hrm.dto.LeaveRequestDTO;
import com.hrm.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {
    private final LeaveRequestService leaveRequestService;

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('LEAVE_VIEW')")
    public List<LeaveRequestDTO> getMyLeaves(Authentication authentication) {
        return leaveRequestService.getMyLeaveRequests(authentication);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LEAVE_VIEW') and hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public List<LeaveRequestDTO> getAllLeaves() {
        return leaveRequestService.getAllLeaveRequests();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('LEAVE_CREATE')")
    public LeaveRequestDTO createLeave(@RequestBody LeaveRequestDTO dto, Authentication authentication) {
        return leaveRequestService.createLeaveRequest(dto, authentication);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('LEAVE_APPROVE') and hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public LeaveRequestDTO approveLeave(@PathVariable UUID id, Authentication authentication) {
        return leaveRequestService.approveLeaveRequest(id, authentication);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('LEAVE_APPROVE') and hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    public LeaveRequestDTO rejectLeave(@PathVariable UUID id, Authentication authentication) {
        return leaveRequestService.rejectLeaveRequest(id, authentication);
    }
}
