export const getApiBaseUrl = () => {
  const customUrl = localStorage.getItem('saas_api_url');
  if (customUrl) return customUrl.replace(/\/+$/, '');
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  return '';
};

export const createApiClient = (token, tenantId, addToast, handleLogout) => {
  return async (endpoint, options = {}) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(options.headers || {})
      };

      const baseUrl = getApiBaseUrl();
      const url = baseUrl ? `${baseUrl}/api${endpoint}` : `/api${endpoint}`;

      const response = await fetch(url, { ...options, headers });
      
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
        const targetUrl = getApiBaseUrl() || 'http://localhost:8080';
        const networkError = `Backend API server at [${targetUrl}] is unreachable (502 / Connection Refused). Please ensure your backend is running or specify your Render API URL.`;
        if (addToast) addToast(networkError, 'error');
        throw new Error(networkError);
      }
      throw error;
    }
  };
};
