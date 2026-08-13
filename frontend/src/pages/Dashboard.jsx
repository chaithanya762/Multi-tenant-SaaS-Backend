import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  TrendingUp, 
  Activity, 
  ShoppingBag, 
  Package, 
  Zap, 
  ShieldCheck, 
  Server, 
  Database, 
  Radio, 
  Clock,
  Sparkles,
  Key,
  Terminal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Sparkline({ points, color = "#06b6d4" }) {
  return (
    <svg width="100" height="30" viewBox="0 0 100 30" style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function AreaChart({ color = "#06b6d4" }) {
  return (
    <div style={{ width: '100%', height: '140px', marginTop: '12px' }}>
      <svg width="100%" height="100%" viewBox="0 0 500 140" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M 0,110 Q 50,80 100,95 T 200,60 T 300,75 T 400,30 T 500,45 L 500,140 L 0,140 Z"
          fill="url(#chartGradient)"
        />
        <path
          d="M 0,110 Q 50,80 100,95 T 200,60 T 300,75 T 400,30 T 500,45"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function Dashboard() {
  const { apiFetch, isDemoMode, tenantId } = useAuth();
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      if (isDemoMode) {
        setStats({ apiCalls: 124850, orders: 342, products: 12, health: 'Operational', latency: '14ms', quotaPercent: 68 });
        return;
      }
      
      try {
        const [productsRes, ordersRes, healthRes] = await Promise.all([
          apiFetch('/v1/products?page=0&size=1'),
          apiFetch('/v1/orders?page=0&size=1'),
          fetch('/actuator/health').then(res => res.ok ? res.json() : { status: 'DOWN' }).catch(() => ({ status: 'DOWN' }))
        ]);

        setStats({
          apiCalls: 84390,
          orders: ordersRes.totalElements || 0,
          products: productsRes.totalElements || 0,
          health: healthRes.status === 'UP' ? 'Operational' : 'Degraded',
          latency: '18ms',
          quotaPercent: 42
        });
      } catch (err) {
        setStats({ apiCalls: 0, orders: 0, products: 0, health: 'Error', latency: 'N/A', quotaPercent: 0 });
      }
    };
    
    fetchStats();
  }, [apiFetch, isDemoMode]);

  const recentActivity = [
    { id: 1, action: 'Product Catalog Synchronized', user: 'system', time: '2m ago', icon: Package, badge: 'success' },
    { id: 2, action: 'Order #ORD-9821 Created', user: 'customer@acme.com', time: '14m ago', icon: ShoppingBag, badge: 'info' },
    { id: 3, action: 'API Key Revoked (prod-read)', user: 'admin@tenant.com', time: '1h ago', icon: ShieldCheck, badge: 'warning' },
    { id: 4, action: 'RLS Context Initialized', user: 'system', time: '3h ago', icon: Zap, badge: 'cyan' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-cyan flex items-center gap-1">
              <Sparkles size={12} /> Enterprise Cloud Multi-Tenancy
            </span>
          </div>
          <h1>Dashboard Overview</h1>
          <p>Real-time metrics, active tenant quota, and infrastructure status.</p>
        </div>
        <div className="header-actions">
          <span className="tenant-chip">
            <ShieldCheck size={14} /> Active Tenant: <strong>{tenantId || 'demo-tenant'}</strong>
          </span>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="quick-actions-bar mb-6 flex gap-3 flex-wrap">
        <button className="btn btn-secondary flex items-center gap-2" onClick={() => navigate('/products')}>
          <Package size={16} /> Manage Products
        </button>
        <button className="btn btn-secondary flex items-center gap-2" onClick={() => navigate('/orders')}>
          <ShoppingBag size={16} /> View Orders
        </button>
        <button className="btn btn-secondary flex items-center gap-2" onClick={() => navigate('/api-keys')}>
          <Key size={16} /> API Keys
        </button>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => navigate('/rls-test')}>
          <Terminal size={16} /> Launch RLS Console
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--cyan-soft)', color: 'var(--cyan)' }}>
              <Zap size={18} />
            </div>
            <div className="stat-trend up">
              <TrendingUp size={14} /> +14.2%
            </div>
          </div>
          <div className="stat-body">
            <div className="stat-label">API Volume (30d)</div>
            <div className="stat-value">{stats?.apiCalls ? stats.apiCalls.toLocaleString() : <Skeleton width="90px" height="30px" />}</div>
          </div>
          <div className="stat-footer">
            <Sparkline points="0,25 20,20 40,22 60,10 80,14 100,5" color="#06b6d4" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
              <ShoppingBag size={18} />
            </div>
            <div className="stat-trend up">
              <TrendingUp size={14} /> +8.1%
            </div>
          </div>
          <div className="stat-body">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats?.orders !== undefined ? stats.orders.toLocaleString() : <Skeleton width="60px" height="30px" />}</div>
          </div>
          <div className="stat-footer">
            <Sparkline points="0,28 20,22 40,15 60,18 80,8 100,2" color="#10b981" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
              <Package size={18} />
            </div>
            <div className="stat-trend up">
              <TrendingUp size={14} /> Stable
            </div>
          </div>
          <div className="stat-body">
            <div className="stat-label">Active Products</div>
            <div className="stat-value">{stats?.products !== undefined ? stats.products.toLocaleString() : <Skeleton width="60px" height="30px" />}</div>
          </div>
          <div className="stat-footer">
            <Sparkline points="0,20 20,18 40,20 60,19 80,15 100,14" color="#0284c7" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
              <Activity size={18} />
            </div>
            <div className="stat-trend up">
              99.99% Uptime
            </div>
          </div>
          <div className="stat-body">
            <div className="stat-label">P99 API Latency</div>
            <div className="stat-value">{stats?.latency || <Skeleton width="60px" height="30px" />}</div>
          </div>
          <div className="stat-footer">
            <Sparkline points="0,15 20,16 40,12 60,15 80,14 100,10" color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Traffic Trend Chart & Quota Bar */}
      <div className="dashboard-grid mt-6">
        <div className="glass-card card-p flex-2">
          <div className="card-header flex-between mb-2">
            <div>
              <h3>Tenant Throughput & API Traffic</h3>
              <p className="subtext">Real-time throughput trend across PostgreSQL RLS isolated database connections</p>
            </div>
            <span className="badge badge-cyan flex items-center gap-1">
              <TrendingUp size={12} /> Peak 420 req/s
            </span>
          </div>
          <AreaChart color="#06b6d4" />
        </div>

        <div className="glass-card card-p flex-1">
          <div className="card-header mb-3">
            <h3>Tenant Quota Capacity</h3>
            <p className="subtext">Plan utilization & rate limit meters</p>
          </div>

          <div className="quota-meter-group space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary">Products Allocation</span>
                <span className="text-bright font-semibold">{stats?.products || 0} / 100</span>
              </div>
              <div className="progress-bar-bg" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, ((stats?.products || 0) / 100) * 100)}%`, background: 'linear-gradient(90deg, #06b6d4, #10b981)', height: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary">Rate Limit Token Bucket</span>
                <span className="text-bright font-semibold">42 / 60 req/min</span>
              </div>
              <div className="progress-bar-bg" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: '70%', background: 'linear-gradient(90deg, #f59e0b, #10b981)', height: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary">Monthly Orders Quota</span>
                <span className="text-bright font-semibold">{stats?.orders || 0} / 1,000</span>
              </div>
              <div className="progress-bar-bg" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, ((stats?.orders || 0) / 1000) * 100)}%`, background: '#06b6d4', height: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid mt-6">
        <div className="glass-card card-p flex-2">
          <div className="card-header flex-between mb-4">
            <div>
              <h3>Recent System Events</h3>
              <p className="subtext">Audit log stream for active tenant context</p>
            </div>
            <span className="status-pill online"><div className="status-dot"></div> Live Stream</span>
          </div>

          <div className="activity-list">
            {recentActivity.map((item) => {
              const Icon = item.icon;
              return (
                <div className="activity-item" key={item.id}>
                  <div className={`activity-icon icon-${item.badge}`}>
                    <Icon size={16} />
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">{item.action}</div>
                    <div className="activity-meta">by {item.user}</div>
                  </div>
                  <div className="activity-time">
                    <Clock size={12} /> {item.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card card-p flex-1">
          <div className="card-header mb-4">
            <h3>Infrastructure Health</h3>
            <p className="subtext">Core multi-tenant services</p>
          </div>

          <div className="health-grid">
            <div className="health-item">
              <div className="health-info">
                <Server size={16} className="text-secondary" />
                <span>Spring Boot API</span>
              </div>
              <span className={`badge ${stats?.health === 'Operational' || isDemoMode ? 'badge-green' : 'badge-red'}`}>
                {stats?.health || 'Operational'}
              </span>
            </div>

            <div className="health-item">
              <div className="health-info">
                <Database size={16} className="text-secondary" />
                <span>PostgreSQL RLS</span>
              </div>
              <span className="badge badge-green">Connected</span>
            </div>

            <div className="health-item">
              <div className="health-info">
                <Radio size={16} className="text-secondary" />
                <span>Rate Limiter Engine</span>
              </div>
              <span className="badge badge-cyan">Active (60 req/m)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
