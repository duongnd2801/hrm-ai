import axios from 'axios';
import { getSession, clearSession } from './auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

// Handle 401/403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // D19: Safer URL check for login endpoint detection
    const isLoginEndpoint = error.config?.url ? error.config.url.includes('/api/auth/login') : false;
    
    if (typeof window !== 'undefined' && error.response?.status === 401 && !isLoginEndpoint) {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API Functions
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const response = await api.post('/api/auth/change-password', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
}
