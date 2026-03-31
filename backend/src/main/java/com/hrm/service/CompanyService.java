package com.hrm.service;

import com.hrm.dto.CompanyConfigDTO;
import com.hrm.dto.DepartmentDTO;
import com.hrm.dto.PositionDTO;
import com.hrm.entity.CompanyConfig;
import com.hrm.entity.Department;
import com.hrm.entity.Position;
import com.hrm.repository.CompanyConfigRepository;
import com.hrm.repository.DepartmentRepository;
import com.hrm.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyConfigRepository configRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    // --- Company Config ---
    @Transactional(readOnly = true)
    public CompanyConfigDTO getConfig() {
        CompanyConfig config = configRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    CompanyConfig newConfig = new CompanyConfig();
                    newConfig.setId("default");
                    return configRepository.save(newConfig);
                });
        CompanyConfigDTO dto = new CompanyConfigDTO();
        BeanUtils.copyProperties(config, dto);
        return dto;
    }

    @Transactional
    public CompanyConfigDTO updateConfig(CompanyConfigDTO dto) {
        CompanyConfig config = configRepository.findAll().stream()
                .findFirst()
                .orElse(new CompanyConfig());
        // Preserve existing ID if present, otherwise set default
        if (config.getId() == null) {
            config.setId("default");
        }
        BeanUtils.copyProperties(dto, config, "id");
        config = configRepository.save(config);
        
        CompanyConfigDTO resultDto = new CompanyConfigDTO();
        BeanUtils.copyProperties(config, resultDto);
        return resultDto;
    }

    // --- Departments ---
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream().map(dept -> {
            DepartmentDTO dto = new DepartmentDTO();
            BeanUtils.copyProperties(dept, dto);
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDTO createDepartment(DepartmentDTO dto) {
        if (departmentRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new RuntimeException("Department name already exists");
        }
        Department dept = new Department();
        dept.setName(dto.getName());
        dept = departmentRepository.save(dept);
        dto.setId(dept.getId());
        return dto;
    }

    @Transactional
    public DepartmentDTO updateDepartment(UUID id, DepartmentDTO dto) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        if (!dept.getName().equalsIgnoreCase(dto.getName()) && departmentRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new RuntimeException("Department name already exists");
        }
        dept.setName(dto.getName());
        dept = departmentRepository.save(dept);
        dto.setId(dept.getId());
        return dto;
    }

    @Transactional
    public void deleteDepartment(UUID id) {
        departmentRepository.deleteById(id);
    }

    // --- Positions ---
    @Transactional(readOnly = true)
    public List<PositionDTO> getAllPositions() {
        return positionRepository.findAll().stream().map(pos -> {
            PositionDTO dto = new PositionDTO();
            BeanUtils.copyProperties(pos, dto);
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public PositionDTO createPosition(PositionDTO dto) {
        if (positionRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new RuntimeException("Position name already exists");
        }
        Position pos = new Position();
        BeanUtils.copyProperties(dto, pos, "id");
        pos = positionRepository.save(pos);
        dto.setId(pos.getId());
        return dto;
    }

    @Transactional
    public PositionDTO updatePosition(UUID id, PositionDTO dto) {
        Position pos = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found"));
        if (pos.getIsLocked() != null && pos.getIsLocked()) {
            throw new RuntimeException("Position is locked and cannot be edited");
        }
        if (!pos.getName().equalsIgnoreCase(dto.getName()) && positionRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new RuntimeException("Position name already exists");
        }
        BeanUtils.copyProperties(dto, pos, "id", "isLocked");
        pos = positionRepository.save(pos);
        dto.setId(pos.getId());
        return dto;
    }
    
    @Transactional
    public PositionDTO togglePositionLock(UUID id, boolean locked) {
        Position pos = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found"));
        pos.setIsLocked(locked);
        pos = positionRepository.save(pos);
        PositionDTO dto = new PositionDTO();
        BeanUtils.copyProperties(pos, dto);
        return dto;
    }

    @Transactional
    public void deletePosition(UUID id) {
        Position pos = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found"));
        if (pos.getIsLocked() != null && pos.getIsLocked()) {
            throw new RuntimeException("Position is locked and cannot be deleted");
        }
        positionRepository.deleteById(id);
    }
}
