package com.hrm.service;

import com.hrm.dto.*;
import com.hrm.entity.Employee;
import com.hrm.entity.Project;
import com.hrm.entity.ProjectMember;
import com.hrm.entity.ProjectStatus;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.ProjectMemberRepository;
import com.hrm.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final int MAX_CURRENT_PROJECTS_PER_EMPLOYEE = 2;

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dự án không tồn tại"));
        return mapToResponse(project);
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        if (projectRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Mã dự án đã tồn tại");
        }

        Project project = Project.builder()
                .name(request.getName())
                .code(request.getCode())
                .color(request.getColor() != null ? request.getColor() : "#3b82f6")
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus())
                .type(request.getType())
                .build();

        return mapToResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProject(UUID id, ProjectUpdateRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dự án không tồn tại"));

        if (!project.getCode().equals(request.getCode()) && projectRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Mã dự án đã tồn tại");
        }

        project.setName(request.getName());
        project.setCode(request.getCode());
        project.setColor(request.getColor());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setStatus(request.getStatus());
        project.setType(request.getType());

        return mapToResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(UUID id) {
        if (!projectRepository.existsById(id)) {
            throw new RuntimeException("Dự án không tồn tại");
        }
        projectRepository.deleteById(id);
    }

    // --- Project Members ---

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(UUID projectId) {
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(this::mapMemberToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeProjectResponse> getCurrentProjectsForEmployee(UUID employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new RuntimeException("Nhân viên không tồn tại");
        }

        LocalDate today = LocalDate.now();
        return projectMemberRepository.findByEmployeeId(employeeId).stream()
                .filter(member -> isCurrentMember(member, today))
                .map(this::mapEmployeeProjectToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectMemberResponse addOrUpdateMember(UUID projectId, ProjectMemberRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Dự án không tồn tại"));
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Nhân viên không tồn tại"));

        ProjectMember member = projectMemberRepository.findByProjectIdAndEmployeeId(projectId, request.getEmployeeId())
                .orElse(ProjectMember.builder()
                        .project(project)
                        .employee(employee)
                        .build());

        validateCurrentProjectLimit(projectId, request.getEmployeeId(), request.getJoinedAt(), request.getLeftAt(), project);
        validateContributionPercentage(projectId, request.getEmployeeId(), request.getContributionPercentage() != null ? request.getContributionPercentage() : 0);

        member.setRole(request.getRole());
        member.setJoinedAt(request.getJoinedAt());
        member.setLeftAt(request.getLeftAt());
        member.setContributionPercentage(request.getContributionPercentage() != null ? request.getContributionPercentage() : 0);

        return mapMemberToResponse(projectMemberRepository.save(member));
    }

    @Transactional
    public void removeMember(UUID projectId, UUID employeeId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndEmployeeId(projectId, employeeId)
                .orElseThrow(() -> new RuntimeException("Thành viên không tồn tại trong dự án"));
        projectMemberRepository.delete(member);
    }

    // --- Mappers ---

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .code(project.getCode())
                .color(project.getColor())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .type(project.getType())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private ProjectMemberResponse mapMemberToResponse(ProjectMember member) {
        return ProjectMemberResponse.builder()
                .id(member.getId())
                .projectId(member.getProject().getId())
                .employeeId(member.getEmployee().getId())
                .employeeName(member.getEmployee().getFullName())
                .employeeEmail(member.getEmployee().getEmail())
                // Assuming you have no direct avatar field, or derive from name.
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .leftAt(member.getLeftAt())
                .contributionPercentage(member.getContributionPercentage())
                .build();
    }

    private void validateCurrentProjectLimit(UUID projectId, UUID employeeId, LocalDate requestedJoinedAt, LocalDate requestedLeftAt, Project targetProject) {
        LocalDate today = LocalDate.now();
        boolean targetWillBeCurrent = targetProject.getStatus() == ProjectStatus.ACTIVE
                && (requestedJoinedAt == null || !requestedJoinedAt.isAfter(today))
                && (requestedLeftAt == null || !requestedLeftAt.isBefore(today));

        if (!targetWillBeCurrent) {
            return;
        }

        long currentProjectCount = projectMemberRepository.findByEmployeeId(employeeId).stream()
                .filter(member -> !member.getProject().getId().equals(projectId))
                .filter(member -> isCurrentMember(member, today))
                .count();

        if (currentProjectCount >= MAX_CURRENT_PROJECTS_PER_EMPLOYEE) {
            throw new RuntimeException("Nhân viên đang tham gia tối đa 3 dự án.");
        }
    }

    private void validateContributionPercentage(UUID projectId, UUID employeeId, int newContribution) {
        LocalDate today = LocalDate.now();
        int currentTotal = projectMemberRepository.findByEmployeeId(employeeId).stream()
                .filter(member -> !member.getProject().getId().equals(projectId))
                .filter(member -> isCurrentMember(member, today))
                .mapToInt(ProjectMember::getContributionPercentage)
                .sum();

        if (currentTotal + newContribution > 100) {
            throw new RuntimeException("Tổng tỷ lệ đóng góp của nhân viên không được vượt quá 100% (Hiện tại: " + currentTotal + "% + Mới: " + newContribution + "%)");
        }
    }

    private boolean isCurrentMember(ProjectMember member, LocalDate today) {
        return member.getProject().getStatus() == ProjectStatus.ACTIVE
                && (member.getJoinedAt() == null || !member.getJoinedAt().isAfter(today))
                && (member.getLeftAt() == null || !member.getLeftAt().isBefore(today));
    }

    private EmployeeProjectResponse mapEmployeeProjectToResponse(ProjectMember member) {
        Project project = member.getProject();
        return EmployeeProjectResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .projectCode(project.getCode())
                .projectColor(project.getColor())
                .projectStatus(project.getStatus())
                .projectType(project.getType())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .leftAt(member.getLeftAt())
                .contributionPercentage(member.getContributionPercentage())
                .build();
    }
}
