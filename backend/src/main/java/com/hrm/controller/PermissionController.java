package com.hrm.controller;

import com.hrm.dto.PermissionDTO;
import com.hrm.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {
    
    private final PermissionService permissionService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_VIEW')")
    public List<PermissionDTO> getAllPermissions() {
        return permissionService.getAllPermissions();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_VIEW')")
    public PermissionDTO getPermissionById(@PathVariable UUID id) {
        return permissionService.getPermissionById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CREATE')")
    public PermissionDTO createPermission(@RequestBody PermissionDTO dto) {
        return permissionService.createPermission(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_UPDATE')")
    public PermissionDTO updatePermission(@PathVariable UUID id, @RequestBody PermissionDTO dto) {
        return permissionService.updatePermission(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DELETE')")
    public void deletePermission(@PathVariable UUID id) {
        permissionService.deletePermission(id);
    }
}
