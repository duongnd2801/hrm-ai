'use client';

import React, { createContext, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import { getSession } from '@/lib/auth';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [version, setVersion] = useState(0);

  const refreshSession = () => {
    setVersion((prev) => prev + 1);
  };

  const session = useMemo(() => (isClient ? getSession() : null), [isClient, version]);
  const loading = !isClient;

  return (
    <AuthContext.Provider value={{ session, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  return useContext(AuthContext);
}
