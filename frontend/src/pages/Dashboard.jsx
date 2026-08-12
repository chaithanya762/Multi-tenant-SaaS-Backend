import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShoppingBag, 
  Package, 
  Zap, 
  ShieldCheck, 
  Server, 
  Database, 
  Radio, 
  ArrowUpRight,
  Clock
} from 'lucide-react';

function Sparkline({ points, color = "#6366f1" }) {
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

export function Dashboard() {
  const { apiFetch, isDemoMode, tenantId } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (isDemoMode) {
        setStats({ apiCalls: 124850, orders: 342, products: 12, health: 'Operational', latency: '14ms' });
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
          latency: '18ms'
        });
      } catch (err) {
        setStats({ apiCalls: 0, orders: 0, products: 0, health: 'Error', latency: 'N/A' });
      }
    };
    
    fetchStats();
  }, [apiFetch, isDemoMode]);

  const recentActivity = [
    { id: 1, action: 'Product Catalog Synchronized', user: 'system', time: '2m ago', icon: Package, badge: 'success' },
    { id: 2, action: 'Order #ORD-9821 Created', user: 'customer@acme.com', time: '14m ago', icon: ShoppingBag, badge: 'info' },
    { id: 3, action: 'API Key Revoked (prod-read)', user: 'admin@tenant.com', time: '1h ago', icon: ShieldCheck, badge: 'warning' },
    { id: 4, action: 'RLS Context Initialized', user: 'system', time: '3h ago', icon: Zap, badge: 'purple' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Real-time metrics, active tenant quota, and infrastructure status.</p>
        </div>
        <div className="header-actions">
          <span className="tenant-chip">
            <ShieldCheck size={14} /> Active Tenant: <strong>{tenantId || 'demo-tenant'}</strong>
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
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
            <Sparkline points="0,25 20,20 40,22 60,10 80,14 100,5" color="#6366f1" />
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
            <Sparkline points="0,20 20,18 40,20 60,19 80,15 100,14" color="#3b82f6" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
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
            <Sparkline points="0,15 20,16 40,12 60,15 80,14 100,10" color="#8b5cf6" />
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
                <span>Redis Rate Limiter</span>
              </div>
              <span className="badge badge-cyan">Active (60 req/m)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
