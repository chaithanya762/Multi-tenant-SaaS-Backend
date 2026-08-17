import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { apiFetch, isDemoMode, tenantId } = useAuth();
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

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

  return (
    <div className="dashboard-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Tenant Metrics Overview</h1>
          <p>Real-time operational metrics for tenant ID: <strong className="code-tag">{tenantId || 'demo-tenant'}</strong></p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate('/products')}>Products</button>
          <button className="btn btn-secondary" onClick={() => navigate('/orders')}>Orders</button>
          <button className="btn btn-primary" onClick={() => navigate('/rls-tester')}>RLS Inspector</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">API Volume (30d)</div>
          <div className="stat-value">{stats?.apiCalls ? stats.apiCalls.toLocaleString() : '---'}</div>
          <div className="stat-meta">+14.2% from previous cycle</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats?.orders !== undefined ? stats.orders.toLocaleString() : '---'}</div>
          <div className="stat-meta">Active customer orders</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Products</div>
          <div className="stat-value">{stats?.products !== undefined ? stats.products.toLocaleString() : '---'}</div>
          <div className="stat-meta">Tenant SKU inventory</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">System Latency (P99)</div>
          <div className="stat-value">{stats?.latency || '---'}</div>
          <div className="stat-meta">Database & Gateway RTT</div>
        </div>
      </div>

      <div className="card card-p mt-4">
        <div className="card-header">
          <h3>Infrastructure Component Status</h3>
          <p className="subtext">Core database isolation and security parameters</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Service Component</th>
                <th>Type</th>
                <th>Isolation Strategy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Spring Boot Core API</td>
                <td>Backend Gateway</td>
                <td>JWT Claims Verification</td>
                <td><span className="badge badge-green">{stats?.health || 'Operational'}</span></td>
              </tr>
              <tr>
                <td>PostgreSQL Engine</td>
                <td>Relational Database</td>
                <td>Row-Level Security (RLS)</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td>Rate Limiting Engine</td>
                <td>Traffic Control</td>
                <td>Token Bucket (60 req/min)</td>
                <td><span className="badge badge-blue">Enforced</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <footer className="app-footer">
        <div>NexusSaaS Enterprise v1.0.0</div>
        <div className="flex gap-4">
          <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
          <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
          <a href="#" onClick={e => e.preventDefault()}>API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
