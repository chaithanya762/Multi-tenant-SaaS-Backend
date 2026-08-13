import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SkeletonLines } from '../components/ui/Skeleton';

export function Billing() {
  const { apiFetch, isDemoMode } = useAuth();
  const [billing, setBilling] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      const res = await apiFetch('/v1/billing/usage');
      if (res._demo) {
        setBilling({ apiCalls: 15420, ordersCreated: 342, plan: 'Pro', currentCycleCost: 150.00 });
      } else {
        setBilling(res);
      }
    };
    load();
  }, [apiFetch]);

  if (!billing) return <SkeletonLines />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Subscription & Billing</h1>
          <p>Plan tier, current usage cycle, and estimated monthly billing charges.</p>
        </div>
      </div>

      <div className="glass-card card-p mb-6">
        <div className="flex-between">
          <div>
            <div className="stat-label">Active Subscription Tier</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-bright)', marginTop: '4px' }}>
              {billing.plan} Plan
            </h2>
          </div>
          <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Active Workspace</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '0.9rem' }}>
          Estimated cost for current cycle: <strong style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>${(billing.currentCycleCost ?? 150.00).toFixed(2)}</strong>
        </p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">API Volume Quota Usage</div>
          <div className="stat-value">{billing.apiCalls?.toLocaleString() || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Orders Generated</div>
          <div className="stat-value">{billing.ordersCreated?.toLocaleString() || 0}</div>
        </div>
      </div>
    </div>
  );
}
