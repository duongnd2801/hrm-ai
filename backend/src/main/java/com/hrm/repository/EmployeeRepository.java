package com.hrm.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hrm.entity.EmpStatus;
import com.hrm.entity.Employee;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    boolean existsByEmail(String email);
    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByUserId(UUID userId);

    long countByStatus(EmpStatus status);

    long countByStatusNot(EmpStatus status);
    long countByDepartmentId(UUID departmentId);
    long countByPositionId(UUID positionId);
    List<Employee> findByStatus(EmpStatus status);
    List<Employee> findByStatusNot(EmpStatus status);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user WHERE " +
            "LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.phone) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Employee> searchEmployeesWithoutStatus(@Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user WHERE " +
            "e.status = :status AND (" +
            "LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(e.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchEmployeesWithStatus(@Param("search") String search, @Param("status") EmpStatus status, Pageable pageable);

    default Page<Employee> searchEmployees(String search, EmpStatus status, Pageable pageable) {
        if (status == null) {
            return searchEmployeesWithoutStatus(search, pageable);
        } else {
            return searchEmployeesWithStatus(search, status, pageable);
        }
    }

    List<Employee> findByManagerId(UUID managerId);

    List<Employee> findByUserRoleName(String roleName);

    // --- Team-scoped queries for MANAGER (PM) ---
    @Query("SELECT e FROM Employee e WHERE e.id IN :ids AND (e.user.role.name = 'EMPLOYEE' OR e.id = :managerId)")
    Page<Employee> findTeamMembersOrSelf(@Param("ids") Set<UUID> ids, @Param("managerId") UUID managerId, Pageable pageable);

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.id IN :ids AND (e.user.role.name = 'EMPLOYEE' OR e.id = :managerId)")
    long countTeamMembersOrSelf(@Param("ids") Set<UUID> ids, @Param("managerId") UUID managerId);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user WHERE e.id IN :ids AND (e.user.role.name = 'EMPLOYEE' OR e.id = :managerId) AND (" +
           "LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchTeamEmployeesWithoutStatus(@Param("ids") Set<UUID> ids, @Param("search") String search, @Param("managerId") UUID managerId, Pageable pageable);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.user WHERE e.id IN :ids AND (e.user.role.name = 'EMPLOYEE' OR e.id = :managerId) AND " +
           "e.status = :status AND (" +
           "LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.phone) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Employee> searchTeamEmployeesWithStatus(@Param("ids") Set<UUID> ids, @Param("search") String search, @Param("status") EmpStatus status, @Param("managerId") UUID managerId, Pageable pageable);

    default Page<Employee> searchTeamEmployees(Set<UUID> ids, String search, EmpStatus status, UUID managerId, Pageable pageable) {
        if (ids == null || ids.isEmpty()) {
            return Page.empty(pageable);
        }
        if (search == null || search.isBlank()) {
            if (status != null) {
                return searchTeamEmployeesWithStatus(ids, "", status, managerId, pageable);
            }
            return findTeamMembersOrSelf(ids, managerId, pageable);
        }
        if (status == null) {
            return searchTeamEmployeesWithoutStatus(ids, search, managerId, pageable);
        }
        return searchTeamEmployeesWithStatus(ids, search, status, managerId, pageable);
    }
}
