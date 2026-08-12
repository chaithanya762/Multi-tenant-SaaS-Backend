export const mockData = {
  tenants: [{ id: 't1', name: 'Acme Corp' }, { id: 't2', name: 'Globex' }],
  products: [{ id: 1, name: 'SaaS Basic', price: 29 }, { id: 2, name: 'SaaS Pro', price: 99 }],
  orders: [{ id: 101, email: 'user@acme.com', total: 29, status: 'Completed' }, { id: 102, email: 'admin@globex.com', total: 99, status: 'Pending' }],
  users: [{ id: 1, username: 'admin', email: 'admin@acme.com', active: true }],
  apiKeys: [{ id: 'k1', name: 'Prod Key', prefix: 'sk_live_...a1b2', scopes: 'read,write' }],
  auditLog: [{ id: 1, action: 'CREATE', resource: 'Order', user: 'admin', timestamp: new Date().toISOString() }],
  billing: { apiCalls: 15420, ordersCreated: 342, plan: 'Pro', currentCycleCost: 150.00 },
  webhooks: [{ id: 'w1', url: 'https://acme.com/hook', events: 'order.created' }]
};

export const createApiClient = (token, tenantId, isDemoMode, setIsDemoMode, addToast, handleLogout) => {
  return async (endpoint, options = {}) => {
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 400));
      return { _demo: true };
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(options.headers || {})
      };

      const response = await fetch(`/api${endpoint}`, { ...options, headers });
      
      if (response.status === 401) {
        if (handleLogout) handleLogout();
        if (addToast) addToast('Session expired. Please login again.', 'danger');
        throw new Error('Unauthorized');
      }
      if (response.status === 429) {
        if (addToast) addToast('Rate limit exceeded. Please slow down.', 'danger');
        throw new Error('Rate Limited');
      }
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : {};
      
    } catch (error) {
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        if (setIsDemoMode) setIsDemoMode(true);
        if (addToast) addToast('Backend unreachable. Switched to Demo Mode with mock data.', 'primary');
        return { _demo: true };
      }
      throw error;
    }
  };
};
