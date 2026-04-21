import api from './api';
import type { EmployeeProject, Project, ProjectMember } from '@/types';

export const projectApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/api/projects');
    return response.data;
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await api.post('/api/projects', data);
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/api/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },

  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await api.get(`/api/projects/${projectId}/members`);
    return response.data;
  },

  getEmployeeCurrentProjects: async (employeeId: string): Promise<EmployeeProject[]> => {
    const response = await api.get(`/api/projects/employees/${employeeId}/current`);
    return response.data;
  },

  addOrUpdateMember: async (
    projectId: string,
    data: { employeeId: string; role: string; joinedAt?: string; leftAt?: string; contributionPercentage?: number }
  ): Promise<ProjectMember> => {
    const response = await api.post(`/api/projects/${projectId}/members`, data);
    return response.data;
  },

  removeMember: async (projectId: string, employeeId: string): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/members/${employeeId}`);
  },
};
