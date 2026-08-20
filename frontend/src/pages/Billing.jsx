import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function Billing() {
  const { apiFetch } = useAuth();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/v1/billing/usage');
        setBilling(res);
      } catch (e) {
        setBilling(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [apiFetch]);

  return (
    <div className="billing-page">
      <div className="page-header mb-4">
        <h1>Subscription & Billing</h1>
        <p>Inspect tenant usage limits, current plan status, and accrued balance.</p>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Active Plan Tier</div>
          <div className="stat-value">{billing?.plan || 'ENTERPRISE'}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Recorded API Usage</div>
          <div className="stat-value">{loading ? '...' : (billing?.api_calls ? billing.api_calls.toLocaleString() : '0')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Orders This Cycle</div>
          <div className="stat-value font-mono">
            {loading ? '...' : (billing?.orders_created ?? 0)}
          </div>
        </div>
      </div>

      <div className="card card-p">
        <h3 className="mb-2">Quota Limits & Governance</h3>
        <p className="subtext mb-4">PostgreSQL Row-Level Isolation enforces real-time rate caps per plan.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Rate Limit (req/min)</th>
                <th>Order Quota</th>
                <th>Database Isolation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-blue">FREE</span></td>
                <td>60</td>
                <td>100</td>
                <td>PostgreSQL RLS Filter</td>
              </tr>
              <tr>
                <td><span className="badge badge-green">ENTERPRISE</span></td>
                <td>Unlimited</td>
                <td>Unlimited</td>
                <td>Dedicated Tenant Schema / RLS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <footer className="app-footer">
        <div>Multitenant-SaaS Platform v1.0.0</div>
        <div className="flex gap-4">
          <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
          <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
          <a href="#" onClick={e => e.preventDefault()}>API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
