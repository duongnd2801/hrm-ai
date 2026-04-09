package com.hrm.controller;

import com.hrm.dto.PermissionDTO;
import com.hrm.dto.RoleDTO;
import com.hrm.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {
    
    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_VIEW')")
    public List<RoleDTO> getAllRoles() {
        return roleService.getAllRoles();
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('PERM_VIEW')")
    public List<PermissionDTO> getAllPermissions() {
        return roleService.getAllPermissions();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CREATE')")
    public RoleDTO createRole(@RequestBody RoleDTO role) {
        return roleService.createRole(role);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_UPDATE')")
    public RoleDTO updateRole(@PathVariable UUID id, @RequestBody RoleDTO role) {
        return roleService.updateRole(id, role);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_DELETE')")
    public void deleteRole(@PathVariable UUID id) {
        roleService.deleteRole(id);
    }
}
