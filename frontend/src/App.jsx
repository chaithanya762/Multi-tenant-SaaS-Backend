import React, { useState, useEffect, useCallback } from 'react';

// --- INJECTED CSS ---
const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-primary: #0f111a;
    --bg-secondary: #1a1d27;
    --text-primary: #f8f9fa;
    --text-secondary: #a0aab2;
    --accent: #8b5cf6;
    --accent-hover: #7c3aed;
    --danger: #ef4444;
    --success: #10b981;
    --glass-bg: rgba(26, 29, 39, 0.6);
    --glass-border: rgba(255, 255, 255, 0.08);
    --sidebar-width: 260px;
  }

  [data-theme='light'] {
    --bg-primary: #f3f4f6;
    --bg-secondary: #ffffff;
    --text-primary: #111827;
    --text-secondary: #4b5563;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(0, 0, 0, 0.1);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
  }

  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    overflow-x: hidden;
    transition: background-color 0.3s, color 0.3s;
  }

  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
  }

  /* Layout */
  .app-container {
    display: flex;
    min-height: 100vh;
  }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-width);
    border-right: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    padding: 24px 0;
    transition: transform 0.3s ease;
    z-index: 100;
  }

  .sidebar-header {
    padding: 0 24px 24px;
    font-size: 1.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--accent);
  }

  .nav-item {
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-secondary);
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }

  .nav-item:hover {
    background: rgba(139, 92, 246, 0.1);
    color: var(--accent);
  }

  .nav-item.active {
    background: linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%);
    color: var(--accent);
    border-left: 3px solid var(--accent);
  }

  .nav-icon {
    font-size: 1.2rem;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: calc(100vw - var(--sidebar-width));
  }

  .topbar {
    height: 70px;
    border-bottom: 1px solid var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
  }

  .page-content {
    padding: 32px;
    flex: 1;
    overflow-y: auto;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Components */
  .card {
    padding: 24px;
    margin-bottom: 24px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 24px;
  }

  .stat-card h3 {
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .stat-card .value {
    font-size: 2rem;
    font-weight: 700;
  }

  .btn {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-primary);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .btn-primary {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }

  .btn-danger {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .btn-danger:hover {
    background: var(--danger);
    color: white;
  }

  input, select {
    background: var(--bg-primary);
    border: 1px solid var(--glass-border);
    color: var(--text-primary);
    padding: 12px 16px;
    border-radius: 8px;
    width: 100%;
    margin-bottom: 16px;
    outline: none;
    transition: border-color 0.2s;
  }

  input:focus, select:focus {
    border-color: var(--accent);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }

  th, td {
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid var(--glass-border);
  }

  th {
    color: var(--text-secondary);
    font-weight: 500;
    font-size: 0.875rem;
    text-transform: uppercase;
  }

  .badge {
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
  .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
  .badge-primary { background: rgba(139, 92, 246, 0.1); color: var(--accent); }

  /* Login / Hero */
  .hero-bg {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 70%), var(--bg-primary);
    z-index: -1;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    padding: 40px;
  }

  .login-card h2 {
    font-size: 1.75rem;
    margin-bottom: 8px;
    text-align: center;
  }

  .login-card p {
    color: var(--text-secondary);
    text-align: center;
    margin-bottom: 32px;
  }

  /* Toasts */
  .toast-container {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .toast {
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out forwards;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .flex-between { display: flex; justify-content: space-between; align-items: center; }
  .flex-gap { display: flex; gap: 12px; align-items: center; }
  
  /* Skeleton */
  .skeleton {
    background: linear-gradient(90deg, var(--glass-border) 25%, rgba(255,255,255,0.05) 50%, var(--glass-border) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
  }
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); position: fixed; height: 100vh; background: var(--glass-bg); backdrop-filter: blur(20px); }
    .sidebar.open { transform: translateX(0); }
    .main-content { max-width: 100vw; }
  }
`;

// --- MOCK DATA FOR DEMO MODE ---
const mockData = {
  tenants: [{ id: 't1', name: 'Acme Corp' }, { id: 't2', name: 'Globex' }],
  products: [{ id: 1, name: 'SaaS Basic', price: 29 }, { id: 2, name: 'SaaS Pro', price: 99 }],
  orders: [{ id: 101, email: 'user@acme.com', total: 29, status: 'Completed' }, { id: 102, email: 'admin@globex.com', total: 99, status: 'Pending' }],
  users: [{ id: 1, username: 'admin', email: 'admin@acme.com', active: true }],
  apiKeys: [{ id: 'k1', name: 'Prod Key', prefix: 'sk_live_...a1b2', scopes: 'read,write' }],
  auditLog: [{ id: 1, action: 'CREATE', resource: 'Order', user: 'admin', timestamp: new Date().toISOString() }],
  billing: { apiCalls: 15420, ordersCreated: 342, plan: 'Pro', currentCycleCost: 150.00 },
  webhooks: [{ id: 'w1', url: 'https://acme.com/hook', events: 'order.created' }]
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('saas_token') || '');
  const [tenantId, setTenantId] = useState(localStorage.getItem('saas_tenant') || '');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [toasts, setToasts] = useState([]);
  
  // Navigation State
  const [currentTab, setCurrentTab] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize CSS
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = globalCss;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_tenant');
    setToken('');
    setTenantId('');
    addToast('Logged out successfully', 'success');
  };

  const apiFetch = useCallback(async (endpoint, options = {}) => {
    if (isDemoMode) {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 400));
      return { _demo: true };
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer \${token}` }),
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(options.headers || {})
      };

      const response = await fetch(`/api\${endpoint}`, { ...options, headers });
      
      if (response.status === 401) {
        handleLogout();
        addToast('Session expired. Please login again.', 'danger');
        throw new Error('Unauthorized');
      }
      if (response.status === 429) {
        addToast('Rate limit exceeded. Please slow down.', 'danger');
        throw new Error('Rate Limited');
      }
      if (!response.ok) {
        throw new Error(`API Error: \${response.statusText}`);
      }

      // Handle 204 No Content
      const text = await response.text();
      return text ? JSON.parse(text) : {};
      
    } catch (error) {
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        setIsDemoMode(true);
        addToast('Backend unreachable. Switched to Demo Mode with mock data.', 'primary');
        return { _demo: true };
      }
      throw error;
    }
  }, [token, tenantId, isDemoMode, addToast]);

  if (!token) {
    return (
      <AuthScreen 
        setToken={(t) => { setToken(t); localStorage.setItem('saas_token', t); }}
        setTenantId={(t) => { setTenantId(t); localStorage.setItem('saas_tenant', t); }}
        apiFetch={apiFetch}
        addToast={addToast}
        setIsDemoMode={setIsDemoMode}
      />
    );
  }

  const tabs = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Tenants', icon: '🏢' },
    { name: 'Products', icon: '📦' },
    { name: 'Orders', icon: '🛒' },
    { name: 'Users', icon: '👥' },
    { name: 'API Keys', icon: '🔑' },
    { name: 'Audit Log', icon: '📋' },
    { name: 'Billing', icon: '💳' },
    { name: 'Webhooks', icon: '🔗' },
    { name: 'RLS Tester', icon: '🧪' },
  ];

  return (
    <div className="app-container">
      {/* Background for nice glass effect */}
      <div className="hero-bg"></div>

      {/* Sidebar */}
      <aside className={`sidebar glass \${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="nav-icon">✨</span> NexusSaaS
        </div>
        <div style={{ flex: 1 }}>
          {tabs.map(tab => (
            <div 
              key={tab.name}
              className={`nav-item \${currentTab === tab.name ? 'active' : ''}`}
              onClick={() => { setCurrentTab(tab.name); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{tab.icon}</span>
              {tab.name}
            </div>
          ))}
        </div>
        <div className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto', color: 'var(--danger)' }}>
          <span className="nav-icon">🚪</span> Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar glass">
          <div className="flex-gap">
            <button className="btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none' /* handled via css media query in real world */ }}>☰</button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{currentTab}</h2>
            {isDemoMode && <span className="badge badge-primary">DEMO MODE</span>}
          </div>
          <div className="flex-gap">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Tenant: <strong>{tenantId || 'None'}</strong></span>
            <button className="btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <div className="page-content">
          {currentTab === 'Dashboard' && <DashboardTab apiFetch={apiFetch} isDemoMode={isDemoMode} />}
          {currentTab === 'Tenants' && <TenantsTab apiFetch={apiFetch} isDemoMode={isDemoMode} addToast={addToast} />}
          {currentTab === 'Products' && <ProductsTab apiFetch={apiFetch} isDemoMode={isDemoMode} addToast={addToast} />}
          {currentTab === 'Orders' && <OrdersTab apiFetch={apiFetch} isDemoMode={isDemoMode} addToast={addToast} />}
          {currentTab === 'Users' && <UsersTab apiFetch={apiFetch} isDemoMode={isDemoMode} addToast={addToast} />}
          {currentTab === 'API Keys' && <ApiKeysTab apiFetch={apiFetch} isDemoMode={isDemoMode} addToast={addToast} />}
          {currentTab === 'Audit Log' && <AuditLogTab apiFetch={apiFetch} isDemoMode={isDemoMode} />}
          {currentTab === 'Billing' && <BillingTab apiFetch={apiFetch} isDemoMode={isDemoMode} />}
          {currentTab === 'Webhooks' && <WebhooksTab apiFetch={apiFetch} isDemoMode={isDemoMode} addToast={addToast} />}
          {currentTab === 'RLS Tester' && <RlsTesterTab apiFetch={apiFetch} isDemoMode={isDemoMode} addToast={addToast} />}
        </div>
      </main>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast glass`} style={{ borderLeft: `4px solid var(--\${toast.type === 'danger' ? 'danger' : toast.type === 'success' ? 'success' : 'accent'})` }}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// TABS & COMPONENTS
// ==========================================

function AuthScreen({ setToken, setTenantId, apiFetch, addToast, setIsDemoMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ tenantId: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/v1/auth/login' : '/v1/auth/register';
      const body = { ...form };
      if (isLogin) delete body.email;

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (res._demo) {
        // Mock successful login
        setToken('demo-token-123');
        setTenantId(form.tenantId || 't1');
        addToast('Demo Mode Login Successful', 'success');
        return;
      }

      if (res.token) {
        setToken(res.token);
        setTenantId(form.tenantId);
        addToast(`Welcome back, \${form.username}!`, 'success');
      } else if (!isLogin) {
        addToast('Registration successful! Please login.', 'success');
        setIsLogin(true);
      }
    } catch (err) {
      addToast(err.message || 'Authentication failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setIsDemoMode(true);
    setToken('demo-token-123');
    setTenantId('t1');
    addToast('Demo Mode Activated', 'primary');
  };

  return (
    <div className="login-container">
      <div className="hero-bg"></div>
      <div className="card glass login-card">
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p>{isLogin ? 'Sign in to your tenant workspace' : 'Register a new admin user'}</p>
        
        <form onSubmit={handleSubmit}>
          <label>Tenant ID</label>
          <input required type="text" placeholder="e.g. acme-corp" value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} />
          
          <label>Username</label>
          <input required type="text" placeholder="admin" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          
          {!isLogin && (
            <>
              <label>Email</label>
              <input required type="email" placeholder="admin@acme.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </>
          )}

          <label>Password</label>
          <input required type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button className="btn" onClick={() => setIsLogin(!isLogin)} style={{ border: 'none', background: 'transparent' }}>
            {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        </div>
        
        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
          <button className="btn" onClick={demoLogin} style={{ width: '100%', justifyContent: 'center' }}>
            Try Demo Without Backend
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ apiFetch, isDemoMode }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isDemoMode) {
      setStats({ apiCalls: 15420, orders: 342, products: 12, health: 'Operational' });
      return;
    }
    // In real app, fetch these from various endpoints
    setStats({ apiCalls: 0, orders: 0, products: 0, health: 'Checking...' });
  }, [isDemoMode]);

  return (
    <div>
      <div className="grid-3">
        <div className="card glass stat-card">
          <h3>API Calls (30d)</h3>
          <div className="value">{stats?.apiCalls.toLocaleString() || <Skeleton width="100px" height="40px" />}</div>
        </div>
        <div className="card glass stat-card">
          <h3>Total Orders</h3>
          <div className="value">{stats?.orders.toLocaleString() || <Skeleton width="100px" height="40px" />}</div>
        </div>
        <div className="card glass stat-card">
          <h3>Active Products</h3>
          <div className="value">{stats?.products.toLocaleString() || <Skeleton width="100px" height="40px" />}</div>
        </div>
      </div>
      <div className="card glass">
        <h3 style={{ marginBottom: '16px' }}>System Status</h3>
        <div className="flex-between">
          <span>Backend API</span>
          <span className={`badge \${stats?.health === 'Operational' || isDemoMode ? 'badge-success' : 'badge-danger'}`}>
            {isDemoMode ? 'Mock Server Online' : stats?.health || 'Operational'}
          </span>
        </div>
      </div>
    </div>
  );
}

function TenantsTab({ apiFetch, isDemoMode, addToast }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTenant, setNewTenant] = useState({ id: '', name: '' });

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/tenants');
      setTenants(res._demo ? mockData.tenants : res.content || res || []);
      setLoading(false);
    };
    fetchTenants();
  }, [apiFetch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await apiFetch('/v1/tenants', { method: 'POST', body: JSON.stringify(newTenant) });
    if (res._demo) {
      setTenants([...tenants, { ...newTenant }]);
    } else {
      setTenants([...tenants, res]);
    }
    addToast('Tenant created', 'success');
    setNewTenant({ id: '', name: '' });
  };

  return (
    <div>
      <div className="card glass">
        <h3>Create New Tenant</h3>
        <form onSubmit={handleCreate} className="flex-gap" style={{ marginTop: '16px' }}>
          <input required placeholder="Tenant ID (e.g. acme)" value={newTenant.id} onChange={e => setNewTenant({...newTenant, id: e.target.value})} style={{ margin: 0 }} />
          <input required placeholder="Display Name" value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} style={{ margin: 0 }} />
          <button type="submit" className="btn btn-primary">Create</button>
        </form>
      </div>

      <div className="card glass">
        <h3>All Tenants</h3>
        {loading ? <SkeletonLines /> : (
          <table>
            <thead><tr><th>ID</th><th>Name</th></tr></thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id}><td>{t.id}</td><td>{t.name}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ProductsTab({ apiFetch, isDemoMode, addToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/products?page=0&size=20');
      setProducts(res._demo ? mockData.products : res.content || []);
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  return (
    <div className="card glass">
      <div className="flex-between">
        <h3>Products</h3>
        <button className="btn btn-primary" onClick={() => addToast('Create Product modal would open here')}>+ New Product</button>
      </div>
      {loading ? <SkeletonLines /> : (
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Price</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>${p.price}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function OrdersTab({ apiFetch, isDemoMode, addToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/orders?page=0&size=20');
      setOrders(res._demo ? mockData.orders : res.content || []);
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  return (
    <div className="card glass">
      <div className="flex-between">
        <h3>Recent Orders</h3>
      </div>
      {loading ? <SkeletonLines /> : (
        <table>
          <thead><tr><th>ID</th><th>Email</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.email}</td>
                <td><span className={`badge \${o.status === 'Completed' ? 'badge-success' : 'badge-primary'}`}>{o.status}</span></td>
                <td>${o.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UsersTab({ apiFetch, isDemoMode, addToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/users');
      setUsers(res._demo ? mockData.users : res.content || res || []);
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  return (
    <div className="card glass">
      <h3>Tenant Users</h3>
      {loading ? <SkeletonLines /> : (
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td><span className={`badge \${u.active ? 'badge-success' : 'badge-danger'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                <td><button className="btn btn-danger" onClick={() => addToast('User deactivated (mock)')}>Deactivate</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ApiKeysTab({ apiFetch, isDemoMode, addToast }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/api-keys');
      setKeys(res._demo ? mockData.apiKeys : res.content || res || []);
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  const handleCreate = async () => {
    const res = await apiFetch('/v1/api-keys', { method: 'POST', body: JSON.stringify({ name: 'New Key', scopes: 'read' }) });
    if (res._demo) {
      const mockKey = { id: Date.now().toString(), name: 'New Key', prefix: 'ak_live_...test', scopes: 'read' };
      setKeys([...keys, mockKey]);
      setNewKey('ak_live_demo_secret_key_889210491');
    } else {
      setKeys([...keys, res]);
      setNewKey(res.secret || 'Secret hidden');
    }
    addToast('API Key created', 'success');
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <h3>API Keys</h3>
        <button className="btn btn-primary" onClick={handleCreate}>+ Generate Key</button>
      </div>

      {newKey && (
        <div className="card glass" style={{ borderColor: 'var(--success)' }}>
          <h4 style={{ color: 'var(--success)', marginBottom: '8px' }}>New API Key Generated</h4>
          <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>Copy this key now. You won't be able to see it again!</p>
          <code style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '4px', display: 'block', wordBreak: 'break-all' }}>{newKey}</code>
        </div>
      )}

      <div className="card glass">
        {loading ? <SkeletonLines /> : (
          <table>
            <thead><tr><th>Name</th><th>Key Prefix</th><th>Scopes</th><th>Actions</th></tr></thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td><code>{k.prefix}</code></td>
                  <td><span className="badge badge-primary">{k.scopes}</span></td>
                  <td><button className="btn btn-danger" onClick={() => addToast('Key Revoked (mock)')}>Revoke</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AuditLogTab({ apiFetch, isDemoMode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/audit-log');
      setLogs(res._demo ? mockData.auditLog : res.content || res || []);
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  return (
    <div className="card glass">
      <h3>Audit Log</h3>
      {loading ? <SkeletonLines /> : (
        <table>
          <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Resource</th></tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{new Date(l.timestamp).toLocaleString()}</td>
                <td>{l.user}</td>
                <td><span className="badge badge-primary">{l.action}</span></td>
                <td>{l.resource}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BillingTab({ apiFetch, isDemoMode }) {
  const [billing, setBilling] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      const res = await apiFetch('/v1/billing/usage');
      setBilling(res._demo ? mockData.billing : res);
    };
    load();
  }, [apiFetch]);

  if (!billing) return <SkeletonLines />;

  return (
    <div>
      <div className="card glass" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, var(--glass-bg) 100%)' }}>
        <h2>Current Plan: {billing.plan}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Estimated cost for this cycle: <strong>${billing.currentCycleCost}</strong></p>
      </div>
      
      <div className="grid-3">
        <div className="card glass stat-card">
          <h3>API Calls Usage</h3>
          <div className="value">{billing.apiCalls.toLocaleString()}</div>
        </div>
        <div className="card glass stat-card">
          <h3>Orders Created</h3>
          <div className="value">{billing.ordersCreated.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function WebhooksTab({ apiFetch, isDemoMode, addToast }) {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHook, setNewHook] = useState({ url: '', events: 'order.created' });
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/webhooks');
      setWebhooks(res._demo ? mockData.webhooks : res.content || res || []);
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await apiFetch('/v1/webhooks', { method: 'POST', body: JSON.stringify(newHook) });
    setWebhooks([...webhooks, res._demo ? { id: Date.now().toString(), ...newHook } : res]);
    addToast('Webhook Endpoint added', 'success');
    setNewHook({ url: '', events: 'order.created' });
  };

  return (
    <div>
      <div className="card glass">
        <h3>Add Endpoint</h3>
        <form onSubmit={handleCreate} className="flex-gap" style={{ marginTop: '16px' }}>
          <input type="url" required placeholder="https://yourapp.com/webhook" value={newHook.url} onChange={e => setNewHook({...newHook, url: e.target.value})} style={{ margin: 0, flex: 2 }} />
          <input required placeholder="Events (comma separated)" value={newHook.events} onChange={e => setNewHook({...newHook, events: e.target.value})} style={{ margin: 0, flex: 1 }} />
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
      </div>

      <div className="card glass">
        <h3>Configured Endpoints</h3>
        {loading ? <SkeletonLines /> : (
          <table>
            <thead><tr><th>URL</th><th>Events</th><th>Actions</th></tr></thead>
            <tbody>
              {webhooks.map(w => (
                <tr key={w.id}>
                  <td>{w.url}</td>
                  <td><span className="badge badge-success">{w.events}</span></td>
                  <td><button className="btn btn-danger" onClick={() => addToast('Webhook deleted (mock)')}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function RlsTesterTab({ apiFetch, isDemoMode, addToast }) {
  const [dataA, setDataA] = useState([]);
  const [dataB, setDataB] = useState([]);

  const testIsolation = async () => {
    addToast('Fetching data as Tenant A and Tenant B...', 'info');
    
    if (isDemoMode) {
      setDataA([{ id: 1, name: 'Alpha Product 1' }]);
      setDataB([{ id: 2, name: 'Beta Product 1' }]);
      addToast('Isolation test complete (Demo)', 'success');
      return;
    }

    try {
      const resA = await apiFetch('/v1/products', { headers: { 'X-Tenant-ID': 'tenant-alpha' } });
      const resB = await apiFetch('/v1/products', { headers: { 'X-Tenant-ID': 'tenant-beta' } });
      setDataA(resA.content || resA || []);
      setDataB(resB.content || resB || []);
      addToast('Isolation test complete', 'success');
    } catch(e) {
      addToast('Test failed: ' + e.message, 'danger');
    }
  };

  return (
    <div>
      <div className="card glass" style={{ marginBottom: '24px' }}>
        <h3>Row-Level Security (RLS) Isolation Tester</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Prove that database queries are strictly isolated by tenant.</p>
        <button className="btn btn-primary" onClick={testIsolation}>Run Isolation Test</button>
      </div>

      <div className="grid-3">
        <div className="card glass">
          <h4 style={{ color: 'var(--accent)' }}>tenant-alpha context</h4>
          <pre style={{ marginTop: '16px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', overflowX: 'auto' }}>
            {JSON.stringify(dataA, null, 2)}
          </pre>
        </div>
        <div className="card glass">
          <h4 style={{ color: 'var(--success)' }}>tenant-beta context</h4>
          <pre style={{ marginTop: '16px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', overflowX: 'auto' }}>
            {JSON.stringify(dataB, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Helpers
function Skeleton({ width, height }) {
  return <div className="skeleton" style={{ width, height }}></div>;
}

function SkeletonLines() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      <Skeleton width="100%" height="40px" />
      <Skeleton width="100%" height="40px" />
      <Skeleton width="100%" height="40px" />
    </div>
  );
}
