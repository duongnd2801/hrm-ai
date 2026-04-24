import { UserSession } from '@/types';

const SESSION_KEY = 'hrm_session';

export function saveSession(session: UserSession): void {
  if (typeof window !== 'undefined') {
    const safeSession = {
      email: session.email,
      role: session.role,
      employeeId: session.employeeId,
      profileCompleted: session.profileCompleted
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeSession));
  }
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Partial<UserSession>;
    return {
      email: session.email || '',
      role: session.role || 'EMPLOYEE',
      employeeId: session.employeeId,
      profileCompleted: session.profileCompleted,
      permissions: session.permissions || []
    } as UserSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    // document.cookie and other sensitive removals are handled by backend /logout
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}
