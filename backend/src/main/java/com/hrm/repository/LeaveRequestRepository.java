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
    
    // Query to find overlapping leave requests for a given employee and date range
    // This finds any requests that overlap with [startDate, endDate]
    @org.springframework.data.jpa.repository.Query(
        "SELECT lr FROM LeaveRequest lr WHERE lr.employee = :employee AND lr.status != 'REJECTED' " +
        "AND lr.startDate <= :endDate AND lr.endDate >= :startDate"
    )
    List<LeaveRequest> findOverlappingRequests(
        @org.springframework.data.repository.query.Param("employee") Employee employee,
        @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate,
        @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate
    );
}
