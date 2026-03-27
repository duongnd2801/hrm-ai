import { UserSession } from '@/types';

const SESSION_KEY = 'hrm_session';

export function saveSession(session: UserSession): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getRole(): string | null {
  return getSession()?.role ?? null;
}

export function hasRole(...roles: string[]): boolean {
  const role = getRole();
  return role !== null && roles.includes(role);
}
