package com.hrm.repository;

import com.hrm.entity.Apology;
import com.hrm.entity.ApologyStatus;
import com.hrm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApologyRepository extends JpaRepository<Apology, UUID> {
    List<Apology> findByEmployeeOrderByCreatedAtDesc(Employee employee);
    List<Apology> findByStatusOrderByCreatedAtAsc(ApologyStatus status);
    List<Apology> findByStatusNotOrderByCreatedAtDesc(ApologyStatus status);
    java.util.Optional<Apology> findByAttendanceId(UUID attendanceId);
    long countByEmployeeAndStatus(Employee employee, ApologyStatus status);
    long countByStatus(ApologyStatus status);
}
