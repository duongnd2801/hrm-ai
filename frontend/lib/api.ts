import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { getSession, clearSession, saveSession } from './auth';
import type { ChatHistoryItem, ChatMessageRequest, ChatMessageResponse } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session?.refreshToken) return null;

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/refresh`,
      { refreshToken: session.refreshToken },
      { timeout: 10000 }
    );
    const data = response.data;
    if (!data?.token || !data?.refreshToken) return null;

    saveSession({
      token: data.token,
      refreshToken: data.refreshToken,
      email: data.email ?? session.email,
      role: data.role ?? session.role,
      employeeId: data.employeeId ?? session.employeeId,
      profileCompleted:
        typeof data.profileCompleted === 'boolean'
          ? data.profileCompleted
          : session.profileCompleted,
    });
    document.cookie = `hrm_token=${data.token}; path=/; max-age=86400`;
    return data.token as string;
  } catch {
    return null;
  }
}

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
  async (error) => {
    // D19: Safer URL check for login endpoint detection
    const config = (error.config ?? {}) as RetriableConfig;
    const requestUrl = config.url ?? '';
    const isLoginEndpoint = requestUrl.includes('/api/auth/login');
    const isRefreshEndpoint = requestUrl.includes('/api/auth/refresh');
    const isUnauthorized = error.response?.status === 401;

    if (typeof window !== 'undefined' && isUnauthorized && !isLoginEndpoint && !isRefreshEndpoint) {
      if (!config._retry) {
        config._retry = true;

        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        if (newAccessToken) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${newAccessToken}`;
          return api.request(config);
        }
      }

      clearSession();
      document.cookie = 'hrm_token=; path=/; max-age=0';
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
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    throw new Error(err.response?.data?.message || 'Failed to change password');
  }
}

export const chatApi = {
  async sendMessage(payload: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response = await api.post('/api/chat/message', payload, { timeout: 30000 });
    return response.data;
  },
  async getHistory(): Promise<ChatHistoryItem[]> {
    const response = await api.get('/api/chat/history', { timeout: 15000 });
    return Array.isArray(response.data) ? response.data : [];
  },
};
