package com.hrm.service;

import com.hrm.dto.EmployeeStatsDTO;
import java.time.LocalDate;
import com.hrm.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.hrm.dto.EmployeeDTO;
import com.hrm.dto.EmployeePersonalInfoDTO;
import com.hrm.repository.*;
import com.hrm.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public EmployeeStatsDTO getStats() {
        long currentWorking = employeeRepository.countByStatusNot(EmpStatus.INACTIVE);
        return EmployeeStatsDTO.builder()
                .total(currentWorking)
                .active(currentWorking)
                .absent(attendanceRepository.countByDateAndStatusIn(
                        LocalDate.now(),
                        List.of(AttendanceStatus.ABSENT, AttendanceStatus.DAY_OFF)))
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<EmployeeDTO> getAllEmployees(String search, String status, Pageable pageable,
            Authentication authentication) {
        Page<Employee> page;
        EmpStatus empStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                empStatus = EmpStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid status
            }
        }

        if (search != null && !search.isBlank()) {
            page = employeeRepository.searchEmployees(search, empStatus, pageable);
        } else if (empStatus != null) {
            // Search with status filter but no search terms
            page = employeeRepository.searchEmployees("", empStatus, pageable);
        } else {
            // No filters, get all employees
            page = employeeRepository.findAll(pageable);
        }

        List<EmployeeDTO> content = page.getContent().stream()
                .map(emp -> filterSensitiveData(mapToDTO(emp), authentication))
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getSize(),
                page.getNumber());
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeById(UUID id, Authentication authentication) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));
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

            String roleName = (dto.getRole() != null && !dto.getRole().isEmpty()) ? dto.getRole().toUpperCase()
                    : "EMPLOYEE";
            Role targetRole = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role '" + roleName + "' not found"));

            user.setRole(targetRole);
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
    public int createEmployeesBatch(List<EmployeeDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return 0;

        String defaultEncodedPassword = passwordEncoder.encode("Emp@123");
        List<Role> allRoles = roleRepository.findAll();
        
        // 1. Prepare Users
        List<User> usersToSave = new ArrayList<>();
        for (EmployeeDTO dto : dtos) {
            String roleName = (dto.getRole() != null && !dto.getRole().isEmpty()) ? dto.getRole().toUpperCase() : "EMPLOYEE";
            Role targetRole = allRoles.stream()
                .filter(r -> r.getName().equalsIgnoreCase(roleName))
                .findFirst()
                .orElse(allRoles.stream().filter(r -> r.getName().equals("EMPLOYEE")).findFirst().get());
            
            User user = new User();
            user.setEmail(dto.getEmail().trim().toLowerCase());
            user.setPassword(defaultEncodedPassword);
            user.setRole(targetRole);
            usersToSave.add(user);
        }
        
        List<User> savedUsers = userRepository.saveAll(usersToSave);
        Map<String, User> userMap = savedUsers.stream().collect(Collectors.toMap(User::getEmail, u -> u));
        
        // 2. Prepare Employees
        List<Employee> employeesToSave = new ArrayList<>();
        for (EmployeeDTO dto : dtos) {
            Employee emp = new Employee();
            mapToEntity(dto, emp);
            emp.setUser(userMap.get(dto.getEmail().trim().toLowerCase()));
            employeesToSave.add(emp);
        }
        
        employeeRepository.saveAll(employeesToSave);
        return dtos.size();
    }

    @Transactional
    public EmployeeDTO updateEmployee(UUID id, EmployeeDTO dto) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));
        if (!emp.getEmail().equals(dto.getEmail()) && employeeRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }

        // Update user email and role if changed
        User user = emp.getUser();
        if (user != null) {
            boolean userChanged = false;
            if (!emp.getEmail().equals(dto.getEmail())) {
                user.setEmail(dto.getEmail());
                userChanged = true;
            }
            if (dto.getRole() != null && !user.getRole().getName().equals(dto.getRole())) {
                Role newRole = roleRepository.findByName(dto.getRole().toUpperCase())
                        .orElseThrow(() -> new RuntimeException("Role không hợp lệ: " + dto.getRole()));
                user.setRole(newRole);
                userChanged = true;
            }
            if (userChanged) {
                userRepository.save(user);
            }
        }

        mapToEntity(dto, emp);
        emp = employeeRepository.save(emp);
        return mapToDTO(emp);
    }

    @Transactional
    public EmployeeDTO updatePersonalInfo(UUID id, EmployeePersonalInfoDTO dto, Authentication authentication) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

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

        // Thông tin cá nhân mở rộng (NV tự cập nhật)
        emp.setPersonalEmail(dto.getPersonalEmail());

        // Người thân liên hệ (NV tự cập nhật)
        emp.setEmergencyContactName(dto.getEmergencyContactName());
        emp.setEmergencyContactRelationship(dto.getEmergencyContactRelationship());
        emp.setEmergencyContactPhone(dto.getEmergencyContactPhone());

        emp = employeeRepository.save(emp);
        return mapToDTO(emp);
    }

    private EmployeeDTO mapToDTO(Employee emp) {
        EmployeeDTO dto = new EmployeeDTO();
        BeanUtils.copyProperties(emp, dto);
        if (emp.getUser() != null) {
            dto.setUserId(emp.getUser().getId());
            if (emp.getUser().getRole() != null) {
                dto.setRole(emp.getUser().getRole().getName());
            }
        }
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
        if (emp.getManager2() != null) {
            dto.setManager2Id(emp.getManager2().getId());
            dto.setManager2Name(emp.getManager2().getFullName());
        }
        return dto;
    }

    private EmployeeDTO filterSensitiveData(EmployeeDTO dto, Authentication authentication) {
        if (authentication == null)
            return dto;

        boolean isElevated = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("ROLE_ADMIN"));

        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        boolean isOwner = currentUser != null && dto.getUserId() != null && dto.getUserId().equals(currentUser.getId());

        if (!isElevated && !isOwner) {
            // Mask sensitive data for other employees
            dto.setBaseSalary(null);
            dto.setTaxDependents(null);
            dto.setPhone("********");
            dto.setAddress("********");
            // Ẩn thông tin nhạy cảm mở rộng
            dto.setCitizenId("********");
            dto.setCitizenIdDate(null);
            dto.setCitizenIdPlace(null);
            dto.setPersonalEmail("********");
            dto.setEmergencyContactName(null);
            dto.setEmergencyContactRelationship(null);
            dto.setEmergencyContactPhone(null);
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

        if (dto.getManager2Id() != null) {
            emp.setManager2(employeeRepository.findById(dto.getManager2Id()).orElse(null));
        } else {
            emp.setManager2(null);
        }
    }
}
