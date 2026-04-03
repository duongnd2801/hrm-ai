package com.hrm.controller;

import com.hrm.dto.LeaveCreateRequest;
import com.hrm.dto.LeaveRequestDTO;
import com.hrm.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public ResponseEntity<LeaveRequestDTO> create(@Valid @RequestBody LeaveCreateRequest request, Authentication authentication) {
        return ResponseEntity.ok(leaveRequestService.createMyRequest(request, authentication));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public ResponseEntity<List<LeaveRequestDTO>> my(Authentication authentication) {
        return ResponseEntity.ok(leaveRequestService.getMyRequests(authentication));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER','HR','ADMIN')")
    public ResponseEntity<List<LeaveRequestDTO>> pending(Authentication authentication) {
        return ResponseEntity.ok(leaveRequestService.getPendingRequests(authentication));
    }

    @GetMapping("/reviewed")
    @PreAuthorize("hasAnyRole('MANAGER','HR','ADMIN')")
    public ResponseEntity<List<LeaveRequestDTO>> reviewed(Authentication authentication) {
        return ResponseEntity.ok(leaveRequestService.getReviewedRequests(authentication));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER','HR','ADMIN')")
    public ResponseEntity<LeaveRequestDTO> approve(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(leaveRequestService.review(id, true, authentication));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER','HR','ADMIN')")
    public ResponseEntity<LeaveRequestDTO> reject(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(leaveRequestService.review(id, false, authentication));
    }
}
