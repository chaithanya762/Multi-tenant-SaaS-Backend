const DEFAULT_RENDER_URL = 'https://multitenant-backend-4lh0.onrender.com';

export const getApiBaseUrl = () => {
  let customUrl = localStorage.getItem('saas_api_url');
  // Vercel hosts the frontend static files, not Java Spring Boot backend.
  // Overwrite if previously pointing to vercel.app
  if (customUrl && customUrl.includes('vercel.app')) {
    customUrl = DEFAULT_RENDER_URL;
    localStorage.setItem('saas_api_url', DEFAULT_RENDER_URL);
  }
  if (customUrl) return customUrl.replace(/\/+$/, '');
  
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('vercel.app')) return envUrl.replace(/\/+$/, '');

  return DEFAULT_RENDER_URL;
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
      const url = `${baseUrl}/api${endpoint}`;

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
        const targetUrl = getApiBaseUrl();
        const networkError = `Backend API server at [${targetUrl}] is unreachable. Ensure Render backend is awake or update target URL.`;
        if (addToast) addToast(networkError, 'error');
        throw new Error(networkError);
      }
      throw error;
    }
  };
};
