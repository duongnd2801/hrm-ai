'use client';

import React, { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react';

import { UserSession } from '@/types';

interface AuthContextType {
  session: UserSession | null;
  loading: boolean;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  refreshSession: () => {},
});

export function AuthProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode;
  session: UserSession | null;
}) {
  return (
    <AuthContext.Provider value={{ session, loading: !session, refreshSession: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  return useContext(AuthContext);
}

export function useRBAC() {
  const { session } = useSession();
  
  return {
    hasRole: (...roles: string[]) => session !== null && roles.includes(session.role),
    hasPermission: (code: string) => session?.permissions?.includes(code) ?? false,
  };
}
