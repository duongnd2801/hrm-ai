package com.hrm.service;

import com.hrm.dto.PermissionDTO;
import com.hrm.dto.RoleDTO;
import com.hrm.entity.Permission;
import com.hrm.entity.Role;
import com.hrm.repository.PermissionRepository;
import com.hrm.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<PermissionDTO> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::toPermissionDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoleDTO createRole(RoleDTO dto) {
        Role role = new Role();
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());
        role.setPermissions(mapPermissions(dto.getPermissions()));
        return toDTO(roleRepository.save(role));
    }

    @Transactional
    public RoleDTO updateRole(UUID id, RoleDTO dto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        // Don't allow renaming system roles if needed, but let's keep it simple
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());
        role.setPermissions(mapPermissions(dto.getPermissions()));
        
        return toDTO(roleRepository.save(role));
    }

    @Transactional
    public void deleteRole(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        if (List.of("ADMIN", "HR", "MANAGER", "EMPLOYEE").contains(role.getName())) {
            throw new RuntimeException("Cannot delete system roles");
        }
        
        roleRepository.delete(role);
    }

    private Set<Permission> mapPermissions(List<String> codes) {
        if (codes == null) return new HashSet<>();
        return new HashSet<>(permissionRepository.findAll().stream()
                .filter(p -> codes.contains(p.getCode()))
                .collect(Collectors.toList()));
    }

    private RoleDTO toDTO(Role role) {
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId().toString());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        dto.setPermissions(role.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toList()));
        dto.setCreatedAt(role.getCreatedAt() != null ? role.getCreatedAt().toString() : null);
        return dto;
    }

    private PermissionDTO toPermissionDTO(Permission p) {
        return new PermissionDTO(
            p.getId().toString(),
            p.getName(),
            p.getCode(),
            p.getModule()
        );
    }
}
