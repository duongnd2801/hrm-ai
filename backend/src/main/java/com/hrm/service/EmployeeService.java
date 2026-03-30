package com.hrm.service;

import com.hrm.dto.EmployeeDTO;
import com.hrm.entity.*;
import com.hrm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAllEmployees(String search, Authentication authentication) {
        List<Employee> emps;
        if (search != null && !search.trim().isEmpty()) {
            emps = employeeRepository.searchEmployees(search.trim().toLowerCase());
        } else {
            emps = employeeRepository.findAll();
        }
        return emps.stream()
                .map(emp -> filterSensitiveData(mapToDTO(emp), authentication))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeById(UUID id, Authentication authentication) {
        Employee emp = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));
        return filterSensitiveData(mapToDTO(emp), authentication);
    }

    @Transactional
    public EmployeeDTO createEmployee(EmployeeDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Payload không hợp lệ");
        }

        if (dto.getFullName() == null || dto.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ tên không được để trống");
        }

        if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống");
        }

        if (dto.getStartDate() == null) {
            dto.setStartDate(LocalDate.now());
        }

        String normalizedEmail = dto.getEmail().trim().toLowerCase();
        dto.setEmail(normalizedEmail);

        if (employeeRepository.existsByEmail(normalizedEmail) || userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        try {
            // Auto-create User account
            User user = new User();
            user.setEmail(normalizedEmail);
            user.setPassword(passwordEncoder.encode("Emp@123")); // Default password
            user.setRole(RoleType.EMPLOYEE);
            user = userRepository.save(user);

            Employee emp = new Employee();
            mapToEntity(dto, emp);
            emp.setUser(user);

            emp = employeeRepository.save(emp);
            return mapToDTO(emp);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ hoặc email đã tồn tại");
        }
    }

    @Transactional
    public EmployeeDTO updateEmployee(UUID id, EmployeeDTO dto) {
        Employee emp = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));
        if (!emp.getEmail().equals(dto.getEmail()) && employeeRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
        
        // Update user email if changed
        if (!emp.getEmail().equals(dto.getEmail())) {
            User user = emp.getUser();
            if (user != null) {
                user.setEmail(dto.getEmail());
                userRepository.save(user);
            }
        }
        
        mapToEntity(dto, emp);
        emp = employeeRepository.save(emp);
        return mapToDTO(emp);
    }

    @Transactional
    public EmployeeDTO updatePersonalInfo(UUID id, EmployeeDTO dto, Authentication authentication) {
        Employee emp = employeeRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (emp.getUser() == null || !emp.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Bạn chỉ được cập nhật hồ sơ cá nhân của chính mình.");
        }
        
        // Only update personal allowed info
        emp.setPhone(dto.getPhone());
        emp.setAddress(dto.getAddress());
        emp.setBio(dto.getBio());
        emp.setGender(dto.getGender());
        emp.setBirthDate(dto.getBirthDate());
        
        emp = employeeRepository.save(emp);
        return mapToDTO(emp);
    }

    private EmployeeDTO mapToDTO(Employee emp) {
        EmployeeDTO dto = new EmployeeDTO();
        BeanUtils.copyProperties(emp, dto);
        if (emp.getUser() != null) dto.setUserId(emp.getUser().getId());
        if (emp.getDepartment() != null) {
            dto.setDepartmentId(emp.getDepartment().getId());
            dto.setDepartmentName(emp.getDepartment().getName());
        }
        if (emp.getPosition() != null) {
            dto.setPositionId(emp.getPosition().getId());
            dto.setPositionName(emp.getPosition().getName());
        }
        if (emp.getManager() != null) {
            dto.setManagerId(emp.getManager().getId());
            dto.setManagerName(emp.getManager().getFullName());
        }
        return dto;
    }

    private EmployeeDTO filterSensitiveData(EmployeeDTO dto, Authentication authentication) {
        if (authentication == null) return dto;

        boolean isElevated = authentication.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("ROLE_ADMIN"));

        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        boolean isOwner = currentUser != null && dto.getUserId() != null && dto.getUserId().equals(currentUser.getId());

        if (!isElevated && !isOwner) {
            // Mask sensitive data for other employees
            dto.setBaseSalary(null);
            dto.setTaxDependents(null);
            dto.setPhone("********");
            dto.setAddress("********");
        }
        return dto;
    }

    private void mapToEntity(EmployeeDTO dto, Employee emp) {
        BeanUtils.copyProperties(dto, emp, "id", "user", "createdAt", "updatedAt");
        
        if (dto.getDepartmentId() != null) {
            emp.setDepartment(departmentRepository.findById(dto.getDepartmentId()).orElse(null));
        } else {
            emp.setDepartment(null);
        }
        
        if (dto.getPositionId() != null) {
            emp.setPosition(positionRepository.findById(dto.getPositionId()).orElse(null));
        } else {
            emp.setPosition(null);
        }
        
        if (dto.getManagerId() != null) {
            emp.setManager(employeeRepository.findById(dto.getManagerId()).orElse(null));
        } else {
            emp.setManager(null);
        }
    }
}
