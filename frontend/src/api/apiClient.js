const DEFAULT_RENDER_URL = 'https://multitenant-backend-4lh0.onrender.com';

export const getApiBaseUrl = () => {
  // If running directly on Render itself, use same-origin relative paths
  if (typeof window !== 'undefined' && window.location.origin.includes('onrender.com')) {
    return '';
  }

  let customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('saas_api_url') : null;
  // If customUrl is missing, or points to obsolete vercel frontend, reset to Render backend
  if (!customUrl || customUrl.includes('vercel.app')) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('saas_api_url', DEFAULT_RENDER_URL);
    }
    return DEFAULT_RENDER_URL;
  }

  return customUrl.replace(/\/+$/, '');
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
        const targetUrl = getApiBaseUrl() || window.location.origin;
        const networkError = `Backend API server at [${targetUrl}] is unreachable (502 / Connection Refused). Please ensure your backend is running or specify your Render API URL.`;
        if (addToast) addToast(networkError, 'error');
        throw new Error(networkError);
      }
      throw error;
    }
  };
};
