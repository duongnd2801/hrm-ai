import api from './api';
import { LeaveRequestDTO } from '@/types';

export const leaveApi = {
  getMyLeaves: () => api.get<LeaveRequestDTO[]>('/api/leaves/my').then((res) => res.data),
  getAllLeaves: () => api.get<LeaveRequestDTO[]>('/api/leaves').then((res) => res.data),
  createLeave: (data: Partial<LeaveRequestDTO>) => api.post<LeaveRequestDTO>('/api/leaves', data).then((res) => res.data),
  approveLeave: (id: string) => api.post<LeaveRequestDTO>(`/api/leaves/${id}/approve`).then((res) => res.data),
  rejectLeave: (id: string) => api.post<LeaveRequestDTO>(`/api/leaves/${id}/reject`).then((res) => res.data),
};
