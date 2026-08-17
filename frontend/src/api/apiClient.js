export const createApiClient = (token, tenantId, addToast, handleLogout) => {
  return async (endpoint, options = {}) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(options.headers || {})
      };

      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api${endpoint}`, { ...options, headers });
      
      if (response.status === 401) {
        if (handleLogout) handleLogout();
        if (addToast) addToast('Session expired. Please login again.', 'error');
        throw new Error('Unauthorized');
      }
      if (response.status === 429) {
        if (addToast) addToast('Rate limit exceeded. Please slow down.', 'error');
        throw new Error('Rate Limited');
      }
      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `API Error (${response.status}): ${response.statusText}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.message) errorMsg = parsed.message;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : {};
      
    } catch (error) {
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        const networkError = 'Backend API is unreachable. Check your network or backend server deployment.';
        if (addToast) addToast(networkError, 'error');
        throw new Error(networkError);
      }
      throw error;
    }
  };
};
