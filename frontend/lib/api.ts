import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { clearSession, saveSession } from './auth';
import type { ChatHistoryItem, ChatMessageRequest, ChatMessageResponse, UserSession } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Crucial for cookies
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Single point of truth for refreshing to avoid multiple calls
let refreshPromise: Promise<boolean> | null = null;

/**
 * Sync local metadata with backend /me endpoint
 */
export async function fetchCurrentSession(): Promise<UserSession | null> {
  try {
    const response = await api.get('/api/auth/me');
    const session = response.data as UserSession;
    saveSession(session);
    return session;
  } catch {
    clearSession();
    return null;
  }
}

async function handleTokenRefresh(): Promise<boolean> {
  try {
    // Refresh endpoint reads refresh cookie, returns new access cookie
    await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

// Global Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = config.url ?? '';
    
    // Skip logic for login/refresh to avoid loops
    if (requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    // 401 Unauthorized -> Attempt token refresh
    if (error.response?.status === 401) {
      if (!config._retry) {
        config._retry = true;

        if (!refreshPromise) {
          refreshPromise = handleTokenRefresh().finally(() => {
            refreshPromise = null;
          });
        }

        const success = await refreshPromise;
        if (success) {
          return api.request(config);
        }
      }

      // If refresh fails OR it was already a retry and still 401
      if (typeof window !== 'undefined') {
        clearSession();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export async function logout() {
  try {
    await api.post('/api/auth/logout');
  } finally {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

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
