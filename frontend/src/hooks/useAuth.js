import { useState, useCallback } from 'react';

export function useAuth() {
  const [token, setTokenState] = useState(localStorage.getItem('saas_token') || '');
  const [tenantId, setTenantIdState] = useState(localStorage.getItem('saas_tenant') || '');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const setToken = useCallback((newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('saas_token', newToken);
    } else {
      localStorage.removeItem('saas_token');
    }
  }, []);

  const setTenantId = useCallback((newTenant) => {
    setTenantIdState(newTenant);
    if (newTenant) {
      localStorage.setItem('saas_tenant', newTenant);
    } else {
      localStorage.removeItem('saas_tenant');
    }
  }, []);

  const login = useCallback((newToken, newTenantId) => {
    setToken(newToken);
    setTenantId(newTenantId);
  }, [setToken, setTenantId]);

  const logout = useCallback(() => {
    setToken('');
    setTenantId('');
  }, [setToken, setTenantId]);

  return {
    token,
    setToken,
    tenantId,
    setTenantId,
    isDemoMode,
    setIsDemoMode,
    login,
    logout,
    isAuthenticated: !!token
  };
}
