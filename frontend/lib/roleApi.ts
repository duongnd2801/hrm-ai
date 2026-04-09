import api from './api';
import type { RoleDTO, PermissionDTO } from '@/types';

export const roleApi = {
  getAllRoles: async (): Promise<RoleDTO[]> => {
    const response = await api.get('/api/roles');
    return response.data;
  },

  getAllPermissions: async (): Promise<PermissionDTO[]> => {
    const response = await api.get('/api/roles/permissions');
    return response.data;
  },

  createRole: async (role: RoleDTO): Promise<RoleDTO> => {
    const response = await api.post('/api/roles', role);
    return response.data;
  },

  updateRole: async (id: string, role: RoleDTO): Promise<RoleDTO> => {
    const response = await api.put(`/api/roles/${id}`, role);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/api/roles/${id}`);
  },
};
