package com.hrm.repository;

import com.hrm.entity.ApologyStatus;
import com.hrm.entity.Employee;
import com.hrm.entity.LeaveRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    @EntityGraph(attributePaths = {"employee", "reviewedBy"})
    List<LeaveRequest> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);

    @Override
    @EntityGraph(attributePaths = {"employee", "reviewedBy"})
    List<LeaveRequest> findAll();

    List<LeaveRequest> findByEmployeeIdAndStatus(UUID employeeId, ApologyStatus status);
    
    // Su dung cho Dashboard va ChatTool
    long countByEmployeeAndStatus(Employee employee, ApologyStatus status);
    long countByStatus(ApologyStatus status);
    List<LeaveRequest> findByEmployeeOrderByCreatedAtDesc(Employee employee);
    List<LeaveRequest> findByStatusOrderByCreatedAtAsc(ApologyStatus status);
}
