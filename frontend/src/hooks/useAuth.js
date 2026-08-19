import { useState, useCallback } from 'react';

export function useAuth() {
  const [token, setTokenState] = useState(localStorage.getItem('saas_token') || '');
  const [refreshToken, setRefreshTokenState] = useState(localStorage.getItem('saas_refresh_token') || '');
  const [tenantId, setTenantIdState] = useState(localStorage.getItem('saas_tenant') || '');

  const setToken = useCallback((newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('saas_token', newToken);
    } else {
      localStorage.removeItem('saas_token');
    }
  }, []);

  const setRefreshToken = useCallback((newRefresh) => {
    setRefreshTokenState(newRefresh);
    if (newRefresh) {
      localStorage.setItem('saas_refresh_token', newRefresh);
    } else {
      localStorage.removeItem('saas_refresh_token');
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

  const login = useCallback((newToken, newRefreshToken, newTenantId) => {
    setToken(newToken);
    setRefreshToken(newRefreshToken);
    setTenantId(newTenantId);
  }, [setToken, setRefreshToken, setTenantId]);

  const logout = useCallback(() => {
    setToken('');
    setRefreshToken('');
    setTenantId('');
  }, [setToken, setRefreshToken, setTenantId]);

  return {
    token,
    setToken,
    refreshToken,
    setRefreshToken,
    tenantId,
    setTenantId,
    login,
    logout,
    isAuthenticated: !!token
  };
}
