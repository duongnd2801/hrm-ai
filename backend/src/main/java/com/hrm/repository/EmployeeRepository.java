package com.hrm.repository;

import com.hrm.entity.EmpStatus;
import com.hrm.entity.Employee;
import com.hrm.entity.RoleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    boolean existsByEmail(String email);
    Optional<Employee> findByUserId(UUID userId);
    
    long countByStatus(EmpStatus status);
    long countByStatusNot(EmpStatus status);

    @Query("SELECT e FROM Employee e WHERE " +
           "LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.phone) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Employee> searchEmployees(@Param("search") String search, Pageable pageable);

    List<Employee> findByManagerId(UUID managerId);
    List<Employee> findByUserRole(RoleType role);
}
