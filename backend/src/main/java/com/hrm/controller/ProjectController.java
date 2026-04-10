package com.hrm.controller;

import com.hrm.dto.*;
import com.hrm.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAuthority('PRJ_VIEW')")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PRJ_VIEW')")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRJ_CREATE')")
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRJ_UPDATE')")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable UUID id, @Valid @RequestBody ProjectUpdateRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRJ_DELETE')")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // --- Members ---

    @GetMapping("/{id}/members")
    @PreAuthorize("hasAuthority('PRJ_VIEW')")
    public ResponseEntity<List<ProjectMemberResponse>> getProjectMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getProjectMembers(id));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAuthority('PRJ_UPDATE')")
    public ResponseEntity<ProjectMemberResponse> addOrUpdateMember(
            @PathVariable UUID id,
            @Valid @RequestBody ProjectMemberRequest request) {
        return ResponseEntity.ok(projectService.addOrUpdateMember(id, request));
    }

    @DeleteMapping("/{id}/members/{employeeId}")
    @PreAuthorize("hasAuthority('PRJ_UPDATE')")
    public ResponseEntity<Void> removeMember(@PathVariable UUID id, @PathVariable UUID employeeId) {
        projectService.removeMember(id, employeeId);
        return ResponseEntity.noContent().build();
    }
}
