package com.hrm.repository;

import com.hrm.entity.ApologyStatus;
import com.hrm.entity.Employee;
import com.hrm.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByEmployeeOrderByCreatedAtDesc(Employee employee);
    List<LeaveRequest> findByStatusOrderByCreatedAtAsc(ApologyStatus status);
    long countByEmployeeAndStatus(Employee employee, ApologyStatus status);
    long countByStatus(ApologyStatus status);
}
