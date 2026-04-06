package com.hrm.repository;

import com.hrm.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    List<ProjectMember> findByProjectId(UUID projectId);
    List<ProjectMember> findByEmployeeId(UUID employeeId);
    Optional<ProjectMember> findByProjectIdAndEmployeeId(UUID projectId, UUID employeeId);
    boolean existsByProjectIdAndEmployeeId(UUID projectId, UUID employeeId);
    long countByProjectId(UUID projectId);
}
