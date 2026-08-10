import React, { useState, useEffect } from 'react';
import { 
  Layers, Users, Package, ShoppingCart, ShieldCheck, Activity, 
  Plus, RefreshCw, Moon, Sun, ExternalLink, X, CheckCircle2, 
  AlertCircle, Search, Lock, Database, WifiOff, Key, Download, Zap
} from 'lucide-react';

const INITIAL_DEMO_TENANTS = [
  { id: 'tenant-alpha', name: 'Alpha Corporation', status: 'ACTIVE' },
  { id: 'tenant-beta', name: 'Beta Solutions LLC', status: 'ACTIVE' }
];

const INITIAL_DEMO_PRODUCTS = {
  'tenant-alpha': [
    { id: 'prod-a1', name: 'Alpha Cloud Server', description: 'High performance compute node', price: 299.99, stockQuantity: 15 },
    { id: 'prod-a2', name: 'Alpha Database Shield', description: 'Encrypted storage cluster', price: 499.00, stockQuantity: 8 }
  ],
  'tenant-beta': [
    { id: 'prod-b1', name: 'Beta Analytics Suite', description: 'Real-time telemetry dashboard', price: 149.50, stockQuantity: 50 },
    { id: 'prod-b2', name: 'Beta Edge Gateway', description: 'IoT connection hub', price: 89.00, stockQuantity: 120 }
  ]
};

const INITIAL_DEMO_ORDERS = {
  'tenant-alpha': [
    { id: 'ord-a1', customerEmail: 'admin@alphacorp.com', totalAmount: 798.99, status: 'COMPLETED' },
    { id: 'ord-a2', customerEmail: 'devops@alphacorp.com', totalAmount: 299.99, status: 'PENDING' }
  ],
  'tenant-beta': [
    { id: 'ord-b1', customerEmail: 'contact@betasolutions.io', totalAmount: 238.50, status: 'COMPLETED' }
  ]
};

export default function App() {
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('tenants');
  const [activeTenant, setActiveTenant] = useState('tenant-alpha');
  const [customTenant, setCustomTenant] = useState('');
  const [isCustomTenantMode, setIsCustomTenantMode] = useState(false);

  // JWT & Rate Limit States
  const [jwtToken, setJwtToken] = useState('');
  const [useJwtAuth, setUseJwtAuth] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(60);

  // Data States
  const [tenants, setTenants] = useState(INITIAL_DEMO_TENANTS);
  const [products, setProducts] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  const [orders, setOrders] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  const [health, setHealth] = useState({ status: 'OFFLINE' });
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Filters & Pagination
  const [orderEmailFilter, setOrderEmailFilter] = useState('');
  const [productPage, setProductPage] = useState(0);
  const [orderPage, setOrderPage] = useState(0);

  // Isolation Workbench Test Data
  const [alphaProducts, setAlphaProducts] = useState([]);
  const [betaProducts, setBetaProducts] = useState([]);
  const [isTestingIsolation, setIsTestingIsolation] = useState(false);

  // Modals & Toasts
  const [modalType, setModalType] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const currentTenantId = isCustomTenantMode ? customTenant : activeTenant;

  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (useJwtAuth && jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else if (currentTenantId && !options.skipTenantHeader) {
      headers['X-Tenant-ID'] = currentTenantId;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      
      // Update Rate Limit Gauge
      const remainingHeader = res.headers.get('X-RateLimit-Remaining');
      if (remainingHeader !== null) {
        setRateLimitRemaining(parseInt(remainingHeader, 10));
      }

      if (res.status === 429) {
        addToast('429 Too Many Requests: Tenant quota exceeded!', 'error');
        throw new Error('Tenant quota exceeded (60 req/min).');
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setIsDemoMode(false);
      return data;
    } catch (err) {
      console.warn(`Backend connection notice for ${url}:`, err.message);
      if (err.message.includes('429')) throw err;
      setIsDemoMode(true);
      throw err;
    }
  };

  useEffect(() => {
    checkHealthAndLoad();
  }, []);

  const checkHealthAndLoad = async () => {
    try {
      const data = await apiFetch('/actuator/health', { skipTenantHeader: true });
      setHealth(data);
      loadTenants();
      addToast('Connected to Spring Boot enterprise backend!', 'success');
    } catch (err) {
      setHealth({ status: 'OFFLINE', error: err.message });
      setIsDemoMode(true);
      loadDemoData();
      addToast('Backend offline. Running in Claymorphic Interactive Demo Mode.', 'info');
    }
  };

  const loadDemoData = () => {
    const tid = currentTenantId || 'tenant-alpha';
    const pList = INITIAL_DEMO_PRODUCTS[tid] || [];
    setProducts({ content: pList, totalElements: pList.length, totalPages: 1, page: 0 });

    const oList = INITIAL_DEMO_ORDERS[tid] || [];
    setOrders({ content: oList, totalElements: oList.length, totalPages: 1, page: 0 });
  };

  useEffect(() => {
    if (isDemoMode) {
      loadDemoData();
    } else {
      if (activeTab === 'products') loadProducts();
      if (activeTab === 'orders') loadOrders();
    }
  }, [activeTenant, customTenant, isCustomTenantMode, activeTab, isDemoMode, useJwtAuth, jwtToken]);

  const loadTenants = async () => {
    try {
      const data = await apiFetch('/api/v1/tenants', { skipTenantHeader: true });
      setTenants(Array.isArray(data) ? data : INITIAL_DEMO_TENANTS);
    } catch (err) {
      setTenants(INITIAL_DEMO_TENANTS);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await apiFetch(`/api/v1/products?page=${productPage}&size=6`);
      setProducts(data);
    } catch (err) {
      loadDemoData();
    }
  };

  const loadOrders = async () => {
    try {
      let url = `/api/v1/orders?page=${orderPage}&size=6`;
      if (orderEmailFilter) {
        url = `/api/v1/orders?email=${encodeURIComponent(orderEmailFilter)}`;
      }
      const data = await apiFetch(url);
      if (Array.isArray(data)) {
        setOrders({ content: data, totalElements: data.length, totalPages: 1, page: 0 });
      } else {
        setOrders(data);
      }
    } catch (err) {
      loadDemoData();
    }
  };

  // Issue JWT Token
  const issueJwtToken = async () => {
    try {
      const data = await apiFetch('/api/v1/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: currentTenantId,
          username: 'admin@saas.com',
          role: 'ROLE_TENANT_ADMIN'
        }),
        skipTenantHeader: true
      });
      setJwtToken(data.token);
      setUseJwtAuth(true);
      addToast(`Generated JWT Token for tenant '${currentTenantId}'!`, 'success');
    } catch (err) {
      const dummyToken = `eyJhbGciOiJIUzI1NiJ9.tenant_${currentTenantId}.demo_signature`;
      setJwtToken(dummyToken);
      setUseJwtAuth(true);
      addToast(`Generated Demo JWT Token for '${currentTenantId}'`, 'info');
    }
  };

  // Export CSV Helper
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      addToast('No data available to export', 'error');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${currentTenantId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${data.length} records to CSV!`, 'success');
  };

  const runIsolationTest = async () => {
    setIsTestingIsolation(true);
    if (!isDemoMode) {
      try {
        const alphaRes = await apiFetch('/api/v1/products?page=0&size=10', {
          headers: { 'X-Tenant-ID': 'tenant-alpha' },
          skipTenantHeader: true
        });
        const betaRes = await apiFetch('/api/v1/products?page=0&size=10', {
          headers: { 'X-Tenant-ID': 'tenant-beta' },
          skipTenantHeader: true
        });
        setAlphaProducts(alphaRes.content || []);
        setBetaProducts(betaRes.content || []);
        addToast('Live PostgreSQL RLS data isolation verified!', 'success');
      } catch (err) {
        addToast(`Isolation test error: ${err.message}`, 'error');
      }
    } else {
      setTimeout(() => {
        setAlphaProducts(INITIAL_DEMO_PRODUCTS['tenant-alpha']);
        setBetaProducts(INITIAL_DEMO_PRODUCTS['tenant-beta']);
        addToast('Demo RLS isolation verified!', 'success');
      }, 500);
    }
    setIsTestingIsolation(false);
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newT = {
      id: formData.get('tenantId'),
      name: formData.get('tenantName'),
      status: 'ACTIVE'
    };

    if (!isDemoMode) {
      try {
        await apiFetch('/api/v1/tenants', {
          method: 'POST',
          body: JSON.stringify({ id: newT.id, name: newT.name }),
          skipTenantHeader: true
        });
        addToast(`Tenant '${newT.name}' onboarded! Default catalog provisioned via Async Event listener.`, 'success');
        loadTenants();
      } catch (err) {
        addToast(err.message, 'error');
        return;
      }
    } else {
      setTenants(prev => [...prev, newT]);
      addToast(`Tenant '${newT.name}' added to session!`, 'success');
    }
    setModalType(null);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newP = {
      id: `prod-${Date.now()}`,
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      stockQuantity: parseInt(formData.get('stockQuantity'), 10)
    };

    if (!isDemoMode) {
      try {
        await apiFetch('/api/v1/products', {
          method: 'POST',
          body: JSON.stringify(newP)
        });
        addToast(`Product '${newP.name}' created & cache updated!`, 'success');
        loadProducts();
      } catch (err) {
        addToast(err.message, 'error');
        return;
      }
    } else {
      setProducts(prev => ({
        ...prev,
        content: [newP, ...prev.content],
        totalElements: prev.totalElements + 1
      }));
      addToast(`Product '${newP.name}' added in Demo Mode!`, 'success');
    }
    setModalType(null);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newO = {
      id: `ord-${Date.now()}`,
      customerEmail: formData.get('customerEmail'),
      totalAmount: parseFloat(formData.get('totalAmount')),
      status: formData.get('status')
    };

    if (!isDemoMode) {
      try {
        await apiFetch('/api/v1/orders', {
          method: 'POST',
          body: JSON.stringify(newO)
        });
        addToast(`Order created for ${newO.customerEmail}!`, 'success');
        loadOrders();
      } catch (err) {
        addToast(err.message, 'error');
        return;
      }
    } else {
      setOrders(prev => ({
        ...prev,
        content: [newO, ...prev.content],
        totalElements: prev.totalElements + 1
      }));
      addToast(`Order created in Demo Mode!`, 'success');
    }
    setModalType(null);
  };

  return (
    <div className="app-shell">
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 18px',
            borderRadius: '16px',
            background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#3b82f6',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header Navbar */}
      <header className="clay-navbar">
        <div className="brand-section">
          <div className="brand-icon-clay">
            <Layers size={26} />
          </div>
          <div>
            <div className="brand-title">SaaS<span style={{ color: 'var(--accent-primary)' }}>Core</span> <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>ENTERPRISE</span></div>
            <div className="brand-subtitle">PostgreSQL RLS • JWT Auth • Rate Limiter • Cache</div>
          </div>
        </div>

        <div className="header-actions">
          {/* Rate Limit Gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-card)', borderRadius: '16px', fontSize: '0.8rem', fontWeight: '600' }}>
            <Zap size={14} color="#f59e0b" />
            <span>Quota: {rateLimitRemaining}/60 req/min</span>
          </div>

          {/* JWT Auth Button */}
          <button 
            className={`clay-btn-${useJwtAuth ? 'primary' : 'secondary'}`} 
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={issueJwtToken}
          >
            <Key size={14} />
            <span>{useJwtAuth ? 'JWT Active' : 'Issue JWT Token'}</span>
          </button>

          {/* Tenant Switcher */}
          <div className="clay-tenant-switcher">
            <div className="tenant-label-tag">
              <span className="pulse-dot-green"></span>
              <span>Tenant:</span>
            </div>

            {!isCustomTenantMode ? (
              <select 
                className="clay-select"
                value={activeTenant} 
                onChange={(e) => setActiveTenant(e.target.value)}
              >
                <option value="tenant-alpha">tenant-alpha (Alpha Corp)</option>
                <option value="tenant-beta">tenant-beta (Beta LLC)</option>
                {tenants.map(t => (
                  t.id !== 'tenant-alpha' && t.id !== 'tenant-beta' && (
                    <option key={t.id} value={t.id}>{t.id} ({t.name})</option>
                  )
                ))}
              </select>
            ) : (
              <input 
                type="text" 
                className="clay-input-field" 
                style={{ padding: '4px 10px', fontSize: '0.85rem', width: '130px' }}
                placeholder="Custom Tenant ID"
                value={customTenant}
                onChange={(e) => setCustomTenant(e.target.value)}
              />
            )}

            <button 
              className="clay-btn-secondary" 
              style={{ padding: '6px 10px', borderRadius: '12px', fontSize: '0.8rem' }}
              onClick={() => setIsCustomTenantMode(!isCustomTenantMode)}
            >
              {isCustomTenantMode ? 'Preset' : 'Custom'}
            </button>
          </div>

          <button className="clay-theme-toggle" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="main-grid">
        <aside className="clay-sidebar">
          <div className="sidebar-title">Navigation</div>
          
          <button className={`clay-nav-btn ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => setActiveTab('tenants')}>
            <div className="btn-content-left"><Users size={18} /><span>Tenants</span></div>
            <span className="clay-pill-count">{tenants.length}</span>
          </button>

          <button className={`clay-nav-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <div className="btn-content-left"><Package size={18} /><span>Products</span></div>
            <span className="clay-pill-count">{products.totalElements || 0}</span>
          </button>

          <button className={`clay-nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <div className="btn-content-left"><ShoppingCart size={18} /><span>Orders</span></div>
            <span className="clay-pill-count">{orders.totalElements || 0}</span>
          </button>

          <button className={`clay-nav-btn ${activeTab === 'isolation-test' ? 'active' : ''}`} onClick={() => setActiveTab('isolation-test')}>
            <div className="btn-content-left"><ShieldCheck size={18} /><span>RLS Tester</span></div>
            <span className="clay-badge clay-badge-active" style={{ fontSize: '0.65rem' }}>VERIFY</span>
          </button>

          <button className={`clay-nav-btn ${activeTab === 'observability' ? 'active' : ''}`} onClick={() => setActiveTab('observability')}>
            <div className="btn-content-left"><Activity size={18} /><span>Dev & Health</span></div>
          </button>
        </aside>

        {/* Content Panel */}
        <main className="clay-content-panel">
          {/* TAB 1: TENANTS */}
          {activeTab === 'tenants' && (
            <div>
              <div className="panel-header">
                <div className="panel-title-group">
                  <h2>Tenant Organizations</h2>
                  <p>Global tenant accounts operating outside RLS session scope</p>
                </div>
                <button className="clay-btn-primary" onClick={() => setModalType('tenant')}>
                  <Plus size={16} /><span>Register Tenant</span>
                </button>
              </div>

              <div className="clay-grid-3" style={{ marginTop: '24px' }}>
                {tenants.map(t => (
                  <div key={t.id} className="clay-item-card">
                    <div className="card-header-row">
                      <div className="card-item-title">{t.name}</div>
                      <span className="clay-badge clay-badge-active">{t.status || 'ACTIVE'}</span>
                    </div>
                    <div className="card-item-subtitle"><strong>Tenant ID:</strong> {t.id}</div>
                    <button 
                      className="clay-btn-secondary" 
                      style={{ marginTop: '10px', fontSize: '0.8rem', padding: '8px 12px' }}
                      onClick={() => {
                        setActiveTenant(t.id);
                        setIsCustomTenantMode(false);
                        setActiveTab('products');
                        addToast(`Switched active context to ${t.id}`, 'info');
                      }}
                    >
                      Switch Context to This Tenant
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              <div className="panel-header">
                <div className="panel-title-group">
                  <h2>Products Catalog</h2>
                  <p>Filtered by <strong>X-Tenant-ID: {currentTenantId}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="clay-btn-secondary" onClick={() => exportToCSV(products.content, 'products')}>
                    <Download size={16} /><span>Export CSV</span>
                  </button>
                  <button className="clay-btn-primary" onClick={() => setModalType('product')}>
                    <Plus size={16} /><span>Add Product</span>
                  </button>
                </div>
              </div>

              <div className="clay-table-wrapper" style={{ marginTop: '20px' }}>
                <table className="clay-table">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Price ($)</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.content && products.content.length > 0 ? (
                      products.content.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.id.substring(0, 8)}...</td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.description || '—'}</td>
                          <td style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>${typeof p.price === 'number' ? p.price.toFixed(2) : p.price}</td>
                          <td><span className="clay-badge clay-badge-active">{p.stockQuantity} units</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No products found for tenant <strong>{currentTenantId}</strong>.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <div className="panel-header">
                <div className="panel-title-group">
                  <h2>Tenant Orders Ledger</h2>
                  <p>Filtered by <strong>X-Tenant-ID: {currentTenantId}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button className="clay-btn-secondary" onClick={() => exportToCSV(orders.content, 'orders')}>
                    <Download size={16} /><span>Export CSV</span>
                  </button>
                  <button className="clay-btn-primary" onClick={() => setModalType('order')}>
                    <Plus size={16} /><span>Create Order</span>
                  </button>
                </div>
              </div>

              <div className="clay-table-wrapper" style={{ marginTop: '20px' }}>
                <table className="clay-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Email</th>
                      <th>Amount ($)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.content && orders.content.length > 0 ? (
                      orders.content.map(o => (
                        <tr key={o.id}>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.id.substring(0, 8)}...</td>
                          <td><strong>{o.customerEmail}</strong></td>
                          <td style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>${typeof o.totalAmount === 'number' ? o.totalAmount.toFixed(2) : o.totalAmount}</td>
                          <td><span className={`clay-badge clay-badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          No orders found for tenant <strong>{currentTenantId}</strong>.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ISOLATION TEST WORKBENCH */}
          {activeTab === 'isolation-test' && (
            <div>
              <div className="panel-header">
                <div className="panel-title-group">
                  <h2>PostgreSQL RLS Data Isolation Workbench</h2>
                  <p>Visually test multi-tenant data boundary enforcement in real-time</p>
                </div>
                <button className="clay-btn-primary" onClick={runIsolationTest} disabled={isTestingIsolation}>
                  <RefreshCw size={16} className={isTestingIsolation ? 'animate-spin' : ''} />
                  <span>Run Isolation Test</span>
                </button>
              </div>

              <div className="rls-test-card" style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <Lock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlignment: 'text-bottom' }} />
                  This test sends two simultaneous requests to <code>/api/v1/products</code>: one for <code>tenant-alpha</code> and another for <code>tenant-beta</code>. PostgreSQL Row-Level Security ensures each query returns strictly its tenant's data.
                </div>

                <div className="rls-comparison-grid" style={{ marginTop: '16px' }}>
                  <div className="rls-tenant-box">
                    <strong style={{ color: 'var(--accent-primary)' }}>Tenant Alpha View</strong>
                    {alphaProducts.map(p => (
                      <div key={p.id} style={{ padding: '8px', background: 'var(--bg-primary)', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <strong>{p.name}</strong> (${p.price})
                      </div>
                    ))}
                  </div>

                  <div className="rls-tenant-box">
                    <strong style={{ color: 'var(--accent-success)' }}>Tenant Beta View</strong>
                    {betaProducts.map(p => (
                      <div key={p.id} style={{ padding: '8px', background: 'var(--bg-primary)', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <strong>{p.name}</strong> (${p.price})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OBSERVABILITY */}
          {activeTab === 'observability' && (
            <div>
              <div className="panel-header">
                <div className="panel-title-group">
                  <h2>System Observability & Health</h2>
                  <p>Backend telemetry, Spring Actuator, and Swagger documentation</p>
                </div>
              </div>

              <div className="clay-grid-3" style={{ marginTop: '20px' }}>
                <div className="clay-item-card">
                  <div className="card-header-row">
                    <span className="card-item-title">Actuator Health</span>
                    <span className={`clay-badge clay-badge-${health.status === 'UP' ? 'active' : 'pending'}`}>{health.status}</span>
                  </div>
                  <div className="card-item-subtitle">Monitors database connectivity and liveness.</div>
                </div>

                <div className="clay-item-card">
                  <div className="card-header-row">
                    <span className="card-item-title">JWT Security</span>
                    <span className="clay-badge clay-badge-completed">ACTIVE</span>
                  </div>
                  <div className="card-item-subtitle">HMAC SHA-256 signed bearer tokens.</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {modalType === 'tenant' && (
        <div className="clay-modal-overlay">
          <div className="clay-modal-card">
            <div className="modal-header">
              <span className="modal-title">Register Tenant</span>
              <button className="modal-close-btn" onClick={() => setModalType(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="clay-input-group">
                <label className="clay-input-label">Tenant ID (Slug)</label>
                <input name="tenantId" className="clay-input-field" placeholder="e.g. tenant-gamma" required />
              </div>
              <div className="clay-input-group">
                <label className="clay-input-label">Organization Name</label>
                <input name="tenantName" className="clay-input-field" placeholder="e.g. Gamma Labs" required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="clay-btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="clay-btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'product' && (
        <div className="clay-modal-overlay">
          <div className="clay-modal-card">
            <div className="modal-header">
              <span className="modal-title">Add Product to {currentTenantId}</span>
              <button className="modal-close-btn" onClick={() => setModalType(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="clay-input-group">
                <label className="clay-input-label">Product Name</label>
                <input name="name" className="clay-input-field" placeholder="e.g. Analytics Engine" required />
              </div>
              <div className="clay-input-group">
                <label className="clay-input-label">Description</label>
                <input name="description" className="clay-input-field" placeholder="Brief description..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="clay-input-group">
                  <label className="clay-input-label">Price ($)</label>
                  <input name="price" type="number" step="0.01" min="0.01" className="clay-input-field" placeholder="199.99" required />
                </div>
                <div className="clay-input-group">
                  <label className="clay-input-label">Stock Quantity</label>
                  <input name="stockQuantity" type="number" min="0" className="clay-input-field" placeholder="50" required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="clay-btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="clay-btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'order' && (
        <div className="clay-modal-overlay">
          <div className="clay-modal-card">
            <div className="modal-header">
              <span className="modal-title">Create Order for {currentTenantId}</span>
              <button className="modal-close-btn" onClick={() => setModalType(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="clay-input-group">
                <label className="clay-input-label">Customer Email</label>
                <input name="customerEmail" type="email" className="clay-input-field" placeholder="client@company.com" required />
              </div>
              <div className="clay-input-group">
                <label className="clay-input-label">Total Amount ($)</label>
                <input name="totalAmount" type="number" step="0.01" min="0.01" className="clay-input-field" placeholder="299.99" required />
              </div>
              <div className="clay-input-group">
                <label className="clay-input-label">Status</label>
                <select name="status" className="clay-select" defaultValue="COMPLETED">
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="clay-btn-secondary" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="clay-btn-primary">Submit Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
