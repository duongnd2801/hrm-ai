'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = () => {
    const s = getSession();
    setSession(s);
    setLoading(false);
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  return useContext(AuthContext);
}
