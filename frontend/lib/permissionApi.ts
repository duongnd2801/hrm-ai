import api from './api';
import type { PermissionDTO } from '@/types';

export const permissionApi = {
  getAllPermissions: async (): Promise<PermissionDTO[]> => {
    const response = await api.get('/api/permissions');
    return response.data;
  },

  getPermissionById: async (id: string): Promise<PermissionDTO> => {
    const response = await api.get(`/api/permissions/${id}`);
    return response.data;
  },

  createPermission: async (permission: PermissionDTO): Promise<PermissionDTO> => {
    const response = await api.post('/api/permissions', permission);
    return response.data;
  },

  updatePermission: async (id: string, permission: PermissionDTO): Promise<PermissionDTO> => {
    const response = await api.put(`/api/permissions/${id}`, permission);
    return response.data;
  },

  deletePermission: async (id: string): Promise<void> => {
    await api.delete(`/api/permissions/${id}`);
  },
};
