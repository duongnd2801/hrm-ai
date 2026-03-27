package com.hrm.controller;

import com.hrm.dto.ApologyCreateRequest;
import com.hrm.dto.ApologyDTO;
import com.hrm.dto.ReviewRequest;
import com.hrm.service.ApologyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
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
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public ResponseEntity<ApologyDTO> create(@RequestBody ApologyCreateRequest request, Authentication authentication) {
        return ResponseEntity.ok(apologyService.createMyApology(request, authentication));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public ResponseEntity<List<ApologyDTO>> my(Authentication authentication) {
        return ResponseEntity.ok(apologyService.getMyApologies(authentication));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER','HR','ADMIN')")
    public ResponseEntity<List<ApologyDTO>> pending(Authentication authentication) {
        return ResponseEntity.ok(apologyService.getPendingApologies(authentication));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER','HR','ADMIN')")
    public ResponseEntity<ApologyDTO> approve(@PathVariable UUID id, @RequestBody(required = false) ReviewRequest request, Authentication authentication) {
        return ResponseEntity.ok(apologyService.review(id, true, request != null ? request.getNote() : null, authentication));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('MANAGER','HR','ADMIN')")
    public ResponseEntity<ApologyDTO> reject(@PathVariable UUID id, @RequestBody(required = false) ReviewRequest request, Authentication authentication) {
        return ResponseEntity.ok(apologyService.review(id, false, request != null ? request.getNote() : null, authentication));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> denied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }
}
