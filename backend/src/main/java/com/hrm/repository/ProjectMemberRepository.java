package com.hrm.repository;

import com.hrm.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    List<ProjectMember> findByProjectId(UUID projectId);
    List<ProjectMember> findByEmployeeId(UUID employeeId);
    Optional<ProjectMember> findByProjectIdAndEmployeeId(UUID projectId, UUID employeeId);
    boolean existsByProjectIdAndEmployeeId(UUID projectId, UUID employeeId);
    long countByProjectId(UUID projectId);

    /**
     * Lấy ID các nhân viên thuộc các dự án mà user đang làm Quản lý (PM), không bao gồm chính user.
     * Trả về Set rỗng nếu không có.
     */
    @Query("SELECT DISTINCT pm2.employee.id FROM ProjectMember pm1 " +
           "JOIN ProjectMember pm2 ON pm1.project.id = pm2.project.id " +
           "WHERE pm1.employee.id = :employeeId " +
           "AND pm1.role = :pmRole")
    Set<UUID> findRawTeammateEmployeeIds(@Param("employeeId") UUID employeeId, @Param("pmRole") com.hrm.entity.ProjectRole pmRole);

    default Set<UUID> findTeammateEmployeeIds(UUID employeeId) {
        return findRawTeammateEmployeeIds(employeeId, com.hrm.entity.ProjectRole.PM);
    }
}
