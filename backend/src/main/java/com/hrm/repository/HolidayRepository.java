package com.hrm.repository;

import com.hrm.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, UUID> {
    List<Holiday> findAllByYearOrderByDateAsc(Integer year);
    void deleteAllByYear(Integer year);
}
