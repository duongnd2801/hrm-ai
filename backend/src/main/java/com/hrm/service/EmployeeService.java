package com.hrm.service;

import com.hrm.config.CacheNames;
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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    private final AuditService auditService;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final AttendanceRepository attendanceRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public EmployeeStatsDTO getStats(Authentication authentication) {
        boolean isAdminOrHr = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMIN") || a.getAuthority().equals("HR") || a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR"));
        
        boolean hasViewAll = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("EMP_VIEW_ALL"));
        
        boolean canViewTeam = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("EMP_VIEW_TEAM"));

        // Nếu là MANAGER (hoặc có quyền View Team) và KHÔNG PHẢI Admin/HR -> Thống kê theo Team
        if (!isAdminOrHr && (canViewTeam || (hasViewAll && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().contains("MANAGER"))))) {
            // MANAGER: chỉ đếm nhân viên trong dự án mình tham gia
            java.util.Set<java.util.UUID> teamIds = getTeammateIds(authentication);
            com.hrm.security.CustomUserDetails userDetails = (com.hrm.security.CustomUserDetails) authentication.getPrincipal();
            Employee currentEmp = employeeRepository.findByUserId(userDetails.getId()).orElse(null);
            UUID employeeId = currentEmp != null ? currentEmp.getId() : null;
            long teamCount = teamIds.isEmpty() ? 0 : employeeRepository.countTeamMembersOrSelf(teamIds, employeeId);
            return EmployeeStatsDTO.builder()
                    .total(teamCount)
                    .active(teamCount)
                    .absent(0)
                    .build();
        }

        // HR/ADMIN: thống kê toàn công ty
        if (hasViewAll || isAdminOrHr) {
            long currentWorking = employeeRepository.countByStatusNot(EmpStatus.INACTIVE);
            return EmployeeStatsDTO.builder()
                    .total(currentWorking)
                    .active(currentWorking)
                    .absent(attendanceRepository.countByDateAndStatusIn(
                            LocalDate.now(),
                            List.of(AttendanceStatus.ABSENT, AttendanceStatus.DAY_OFF)))
                    .build();
        }
        
        return new EmployeeStatsDTO(0, 0, 0);
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

        // Kiểm tra quyền: 
        // 1. ADMIN/HR (EMP_VIEW_ALL) -> Xem toàn bộ
        // 2. MANAGER (EMP_VIEW_TEAM) -> Chỉ xem nhân viên (Role EMPLOYEE) trong team của mình
        
        boolean isAdminOrHr = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMIN") || a.getAuthority().equals("HR") || a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR"));
        
        boolean hasViewAll = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("EMP_VIEW_ALL"));
        
        boolean canViewTeam = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("EMP_VIEW_TEAM"));

        // Nếu là MANAGER (hoặc có quyền View Team) và KHÔNG PHẢI Admin/HR -> Ép xem theo Team
        if (!isAdminOrHr && (canViewTeam || (hasViewAll && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().contains("MANAGER"))))) {
            // MANAGER: chỉ xem nhân viên trong dự án mình tham gia
            java.util.Set<java.util.UUID> ids = getTeammateIds(authentication);
            if (ids == null || ids.isEmpty()) {
                return new PageResponse<>(java.util.List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber());
            }
            com.hrm.security.CustomUserDetails userDetails = (com.hrm.security.CustomUserDetails) authentication.getPrincipal();
            Employee currentEmp = employeeRepository.findByUserId(userDetails.getId()).orElse(null);
            UUID employeeId = currentEmp != null ? currentEmp.getId() : null;
            page = employeeRepository.searchTeamEmployees(ids, search, empStatus, employeeId, pageable);
        } else if (hasViewAll) {
            // ADMIN/HR hoặc người có quyền View All thực sự
            if (search != null && !search.isBlank()) {
                page = employeeRepository.searchEmployees(search, empStatus, pageable);
            } else if (empStatus != null) {
                page = employeeRepository.searchEmployees("", empStatus, pageable);
            } else {
                page = employeeRepository.findAll(pageable);
            }
        } else {
            // Trường hợp khác (Employee) -> Thường sẽ bị chặn ở Controller hoặc chỉ thấy chính mình
            page = Page.empty(pageable);
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
    @Cacheable(value = CacheNames.EMPLOYEE_DETAILS, key = "#id")
    public EmployeeDTO getEmployeeById(UUID id, Authentication authentication) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên"));

        boolean canViewAll = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("EMP_VIEW_ALL"));
        boolean canViewTeam = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("EMP_VIEW_TEAM"));

        if (!canViewAll) {
            User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
            boolean isOwner = currentUser != null && emp.getUser() != null
                    && emp.getUser().getId().equals(currentUser.getId());

            // MANAGER (EMP_VIEW_TEAM): cho phép xem nhân viên cùng dự án
            boolean isTeammate = false;
            if (!isOwner && canViewTeam) {
                java.util.Set<java.util.UUID> teamIds = getTeammateIds(authentication);
                isTeammate = teamIds.contains(id);
            }

            if (!isOwner && !isTeammate) {
                throw new AccessDeniedException("Bạn chỉ được xem thông tin cá nhân của chính mình.");
            }
        }

        return filterSensitiveData(mapToDTO(emp), authentication);
    }

    @Transactional
    @CacheEvict(value = CacheNames.EMPLOYEE_STATS, allEntries = true)
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

            // Log Audit
            auditService.logSystem("CREATE_EMPLOYEE", "employees", emp.getId().toString(), null, emp);

            return mapToDTO(emp);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Dữ liệu không hợp lệ hoặc email đã tồn tại");
        }
    }

    @Transactional
    @CacheEvict(value = CacheNames.EMPLOYEE_STATS, allEntries = true)
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
    @CacheEvict(value = CacheNames.EMPLOYEE_DETAILS, key = "#id")
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
    @CacheEvict(value = CacheNames.EMPLOYEE_DETAILS, key = "#id")
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

        // Dùng permission EMP_VIEW_ALL thay vì authority role để nhất quán với RBAC
        boolean canViewAll = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("EMP_VIEW_ALL"));

        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        boolean isOwner = currentUser != null && dto.getUserId() != null && dto.getUserId().equals(currentUser.getId());

        if (!canViewAll && !isOwner) {
            // MANAGER (EMP_VIEW_TEAM) vẫn bị ẩn dữ liệu nhạy cảm
            dto.setBaseSalary(null);
            dto.setTaxDependents(null);
            dto.setPhone("********");
            dto.setAddress("********");
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

    /**
     * Lấy tập hợp employee IDs cùng dự án với user hiện tại.
     */
    private java.util.Set<java.util.UUID> getTeammateIds(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (currentUser == null) return java.util.Set.of();
        Employee currentEmp = employeeRepository.findByUserId(currentUser.getId()).orElse(null);
        if (currentEmp == null) return java.util.Set.of();
        return projectMemberRepository.findTeammateEmployeeIds(currentEmp.getId());
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
