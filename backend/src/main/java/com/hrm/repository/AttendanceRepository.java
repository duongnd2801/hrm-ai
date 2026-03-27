package com.hrm.repository;

import com.hrm.entity.Attendance;
import com.hrm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    Optional<Attendance> findByEmployeeAndDate(Employee employee, LocalDate date);

    List<Attendance> findByEmployeeAndDateBetweenOrderByDateAsc(Employee employee, LocalDate fromDate, LocalDate toDate);

    List<Attendance> findByEmployeeIdAndDateBetween(UUID employeeId, LocalDate fromDate, LocalDate toDate);
}
