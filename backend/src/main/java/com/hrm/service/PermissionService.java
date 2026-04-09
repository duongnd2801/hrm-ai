package com.hrm.service;

import com.hrm.dto.PermissionDTO;
import com.hrm.entity.Permission;
import com.hrm.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {
    private final PermissionRepository permissionRepository;

    public List<PermissionDTO> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PermissionDTO getPermissionById(UUID id) {
        return permissionRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Permission not found"));
    }

    @Transactional
    public PermissionDTO createPermission(PermissionDTO dto) {
        // Check if code already exists
        if (permissionRepository.findByCode(dto.getCode()).isPresent()) {
            throw new RuntimeException("Permission code already exists: " + dto.getCode());
        }

        Permission permission = new Permission();
        permission.setName(dto.getName());
        permission.setCode(dto.getCode());
        permission.setModule(dto.getModule());
        
        return toDTO(permissionRepository.save(permission));
    }

    @Transactional
    public PermissionDTO updatePermission(UUID id, PermissionDTO dto) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found"));

        // Check if code is being changed to an existing code
        if (!permission.getCode().equals(dto.getCode()) && 
            permissionRepository.findByCode(dto.getCode()).isPresent()) {
            throw new RuntimeException("Permission code already exists: " + dto.getCode());
        }

        permission.setName(dto.getName());
        permission.setCode(dto.getCode());
        permission.setModule(dto.getModule());
        
        return toDTO(permissionRepository.save(permission));
    }

    @Transactional
    public void deletePermission(UUID id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found"));
        
        // Prevent deletion of core system permissions
        String[] protectedCodes = {"PERM_VIEW", "PERM_CREATE", "PERM_UPDATE", "PERM_DELETE", 
                                   "ROLE_VIEW", "ROLE_CREATE", "ROLE_UPDATE", "ROLE_DELETE"};
        for (String code : protectedCodes) {
            if (code.equals(permission.getCode())) {
                throw new RuntimeException("Cannot delete system permission: " + code);
            }
        }
        
        permissionRepository.delete(permission);
    }

    private PermissionDTO toDTO(Permission p) {
        return new PermissionDTO(
            p.getId().toString(),
            p.getName(),
            p.getCode(),
            p.getModule()
        );
    }
}
