import React, { createContext, useContext, useMemo } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';
import { useToast as useToastHook } from '../hooks/useToast';
import { createApiClient } from '../api/apiClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const auth = useAuthHook();
  const toast = useToastHook();

  const handleLogout = () => {
    auth.logout();
    toast.addToast('Logged out successfully', 'info');
  };

  const apiFetch = useMemo(() => {
    return createApiClient(
      auth.token,
      auth.tenantId,
      toast.addToast,
      handleLogout
    );
  }, [auth.token, auth.tenantId, toast.addToast]);

  const value = {
    ...auth,
    ...toast,
    apiFetch,
    handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
