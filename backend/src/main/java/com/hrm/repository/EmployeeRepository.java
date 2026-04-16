package com.hrm.repository;

import java.util.List;
import java.util.Optional;
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

    Optional<Employee> findByUserId(UUID userId);

    long countByStatus(EmpStatus status);

    long countByStatusNot(EmpStatus status);
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
}
