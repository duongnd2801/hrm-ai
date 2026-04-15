package com.hrm.repository;

import com.hrm.entity.Attendance;
import com.hrm.entity.AttendanceStatus;
import com.hrm.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    Optional<Attendance> findByEmployeeAndDate(Employee employee, LocalDate date);

    List<Attendance> findByEmployeeAndDateBetweenOrderByDateAsc(Employee employee, LocalDate fromDate, LocalDate toDate);

    List<Attendance> findByEmployeeIdAndDateBetween(UUID employeeId, LocalDate fromDate, LocalDate toDate);

    List<Attendance> findByEmployeeIdInAndDateBetween(Collection<UUID> employeeIds, LocalDate fromDate, LocalDate toDate);
    
    long countByDateAndStatusIn(LocalDate date, Collection<AttendanceStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT e.id, e.fullName, d.name, a.status, COUNT(a.status) " +
           "FROM Attendance a " +
           "JOIN a.employee e " +
           "LEFT JOIN e.department d " +
           "WHERE a.date >= ?1 AND a.date <= ?2 " +
           "GROUP BY e.id, e.fullName, d.name, a.status")
    List<Object[]> getAttendanceStats(LocalDate startDate, LocalDate endDate);
}
