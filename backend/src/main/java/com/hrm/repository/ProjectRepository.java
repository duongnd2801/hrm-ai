package com.hrm.repository;

import com.hrm.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByCodeIgnoreCase(String code);
    boolean existsByCode(String code);
    
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Project p WHERE LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    java.util.List<Project> searchByKeyword(@org.springframework.data.repository.query.Param("keyword") String keyword);
}
