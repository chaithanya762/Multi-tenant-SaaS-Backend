const DEFAULT_RENDER_URL = 'https://multitenant-backend-4lh0.onrender.com';

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.origin.includes('onrender.com')) {
    return '';
  }
  let customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('saas_api_url') : null;
  if (!customUrl || customUrl.includes('vercel.app')) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('saas_api_url', DEFAULT_RENDER_URL);
    }
    return DEFAULT_RENDER_URL;
  }
  return customUrl.replace(/\/+$/, '');
};

let isRefreshing = false;
let refreshPromise = null;

export const createApiClient = (token, refreshToken, tenantId, addToast, handleLogout, setToken) => {
  
  const attemptRefresh = async () => {
    if (isRefreshing) return refreshPromise;
    if (!refreshToken) return null;
    
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.accessToken) {
          if (setToken) setToken(data.accessToken);
          return data.accessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  };

  return async (endpoint, options = {}) => {
    const makeRequest = async (authToken) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(options.headers || {})
      };
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api${endpoint}`;
      return fetch(url, { ...options, headers });
    };

    try {
      let response = await makeRequest(token);
      
      // On 401, attempt token refresh before giving up
      if (response.status === 401 && refreshToken) {
        const newToken = await attemptRefresh();
        if (newToken) {
          response = await makeRequest(newToken);
        }
      }
      
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
