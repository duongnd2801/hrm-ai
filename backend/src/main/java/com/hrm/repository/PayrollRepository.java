package com.hrm.repository;

import com.hrm.entity.Employee;
import com.hrm.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, UUID> {
    Optional<Payroll> findByEmployeeAndMonthAndYear(Employee employee, Integer month, Integer year);
    List<Payroll> findByMonthAndYear(Integer month, Integer year);
    List<Payroll> findByEmployeeOrderByYearDescMonthDesc(Employee employee);
}
