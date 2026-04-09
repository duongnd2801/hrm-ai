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
    public List<LeaveRequestDTO> getMyLeaves(Authentication authentication) {
        return leaveRequestService.getMyLeaveRequests(authentication);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR') or hasRole('MANAGER')")
    public List<LeaveRequestDTO> getAllLeaves() {
        return leaveRequestService.getAllLeaveRequests();
    }

    @PostMapping
    public LeaveRequestDTO createLeave(@RequestBody LeaveRequestDTO dto, Authentication authentication) {
        return leaveRequestService.createLeaveRequest(dto, authentication);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR') or hasRole('MANAGER')")
    public LeaveRequestDTO approveLeave(@PathVariable UUID id, Authentication authentication) {
        return leaveRequestService.approveLeaveRequest(id, authentication);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('HR') or hasRole('MANAGER')")
    public LeaveRequestDTO rejectLeave(@PathVariable UUID id, Authentication authentication) {
        return leaveRequestService.rejectLeaveRequest(id, authentication);
    }
}
