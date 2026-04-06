package com.hrm.service;

import com.hrm.dto.*;
import com.hrm.entity.Employee;
import com.hrm.entity.Project;
import com.hrm.entity.ProjectMember;
import com.hrm.repository.EmployeeRepository;
import com.hrm.repository.ProjectMemberRepository;
import com.hrm.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

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

        member.setRole(request.getRole());
        member.setJoinedAt(request.getJoinedAt());
        member.setLeftAt(request.getLeftAt());

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
                .build();
    }
}
