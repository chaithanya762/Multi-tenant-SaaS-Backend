import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { apiFetch, tenantId } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [productsRes, ordersRes, healthRes] = await Promise.all([
          apiFetch('/v1/products?page=0&size=1').catch(() => ({ totalElements: 0 })),
          apiFetch('/v1/orders?page=0&size=1').catch(() => ({ totalElements: 0 })),
          fetch('/actuator/health').then(res => res.ok ? res.json() : { status: 'DOWN' }).catch(() => ({ status: 'DOWN' }))
        ]);

        setStats({
          orders: ordersRes.totalElements !== undefined ? ordersRes.totalElements : (ordersRes.content ? ordersRes.content.length : 0),
          products: productsRes.totalElements !== undefined ? productsRes.totalElements : (productsRes.content ? productsRes.content.length : 0),
          health: healthRes.status === 'UP' ? 'Operational' : 'Offline'
        });
      } catch (err) {
        setStats({ orders: 0, products: 0, health: 'Offline' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [apiFetch]);

  return (
    <div className="dashboard-page">
      <div className="page-header flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1>Tenant Metrics Overview</h1>
          <p>Real-time operational metrics for tenant ID: <strong className="code-tag">{tenantId || 'global'}</strong></p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate('/products')}>Products</button>
          <button className="btn btn-secondary" onClick={() => navigate('/orders')}>Orders</button>
          <button className="btn btn-primary" onClick={() => navigate('/rls-tester')}>RLS Inspector</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{loading ? '...' : (stats?.orders ?? 0)}</div>
          <div className="stat-meta">Active tenant orders</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Products</div>
          <div className="stat-value">{loading ? '...' : (stats?.products ?? 0)}</div>
          <div className="stat-meta">Inventory SKU count</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Backend API Status</div>
          <div className="stat-value" style={{ fontSize: '1.1rem' }}>
            <span className={`badge ${stats?.health === 'Operational' ? 'badge-green' : 'badge-red'}`}>
              {stats?.health || 'Offline'}
            </span>
          </div>
          <div className="stat-meta">Spring Boot Actuator Health</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tenant ID</div>
          <div className="stat-value font-mono" style={{ fontSize: '1.1rem' }}>{tenantId || 'global'}</div>
          <div className="stat-meta">Session Row-Level Isolation</div>
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
                <td><span className={`badge ${stats?.health === 'Operational' ? 'badge-green' : 'badge-red'}`}>{stats?.health || 'Offline'}</span></td>
              </tr>
              <tr>
                <td>PostgreSQL Engine</td>
                <td>Relational Database</td>
                <td>Row-Level Security (RLS)</td>
                <td><span className="badge badge-blue">Active</span></td>
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
