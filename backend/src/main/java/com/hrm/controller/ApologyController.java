package com.hrm.controller;

import com.hrm.dto.ApologyCreateRequest;
import com.hrm.dto.ApologyDTO;
import com.hrm.dto.ReviewRequest;
import com.hrm.service.ApologyService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/apologies")
@RequiredArgsConstructor
public class ApologyController {

    private final ApologyService apologyService;

    @PostMapping
    @PreAuthorize("hasAuthority('APOLOGY_CREATE')")
    public ResponseEntity<ApologyDTO> create(@Valid @RequestBody ApologyCreateRequest request, Authentication authentication) {
        return ResponseEntity.ok(apologyService.createMyApology(request, authentication));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('APOLOGY_VIEW')")
    public ResponseEntity<List<ApologyDTO>> my(Authentication authentication) {
        return ResponseEntity.ok(apologyService.getMyApologies(authentication));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('APOLOGY_APPROVE')")
    public ResponseEntity<List<ApologyDTO>> pending(Authentication authentication) {
        return ResponseEntity.ok(apologyService.getPendingApologies(authentication));
    }

    @GetMapping("/reviewed")
    @PreAuthorize("hasAuthority('APOLOGY_APPROVE')")
    public ResponseEntity<List<ApologyDTO>> reviewed(Authentication authentication) {
        return ResponseEntity.ok(apologyService.getReviewedApologies(authentication));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('APOLOGY_APPROVE')")
    public ResponseEntity<ApologyDTO> approve(@PathVariable UUID id, @RequestBody(required = false) ReviewRequest request, Authentication authentication) {
        return ResponseEntity.ok(apologyService.review(id, true, request != null ? request.getNote() : null, authentication));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('APOLOGY_APPROVE')")
    public ResponseEntity<ApologyDTO> reject(@PathVariable UUID id, @RequestBody(required = false) ReviewRequest request, Authentication authentication) {
        return ResponseEntity.ok(apologyService.review(id, false, request != null ? request.getNote() : null, authentication));
    }
}
