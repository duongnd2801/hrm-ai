package com.hrm.controller;

import com.hrm.dto.OTCreateRequest;
import com.hrm.dto.OTRequestDTO;
import com.hrm.security.CustomUserDetails;
import com.hrm.service.OTRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ot-requests")
@RequiredArgsConstructor
public class OTRequestController {

    private final OTRequestService otRequestService;

    @GetMapping("/my")
    public List<OTRequestDTO> getMyRequests(@AuthenticationPrincipal CustomUserDetails user) {
        return otRequestService.getMyRequests(user.getId());
    }

    @PostMapping
    public OTRequestDTO createRequest(@AuthenticationPrincipal CustomUserDetails user, @RequestBody OTCreateRequest req) {
        return otRequestService.createRequest(user.getId(), req);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public List<OTRequestDTO> getPendingRequests() {
        return otRequestService.getPendingRequests();
    }

    @GetMapping("/reviewed")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public List<OTRequestDTO> getReviewedRequests() {
        return otRequestService.getReviewedRequests();
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<Void> approve(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails user) {
        otRequestService.review(id, user.getId(), true);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'HR')")
    public ResponseEntity<Void> reject(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails user) {
        otRequestService.review(id, user.getId(), false);
        return ResponseEntity.ok().build();
    }
}
