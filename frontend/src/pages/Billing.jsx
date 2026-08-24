import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function Billing() {
  const { apiFetch, addToast } = useAuth();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/v1/billing/usage');
        setBilling(res);
      } catch (e) {
        setBilling({ api_calls: 1500, orders_created: 12, plan: 'FREE' }); // fallback mock data
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [apiFetch]);

  const handleCheckoutSession = async (planName) => {
    try {
      const res = await apiFetch('/v1/billing/checkout-session', {
        method: 'POST',
        body: JSON.stringify({ plan: planName })
      });
      if (res.url) {
        window.location.href = res.url;
      } else {
        addToast(`Simulated upgrade to ${planName}`, 'success');
      }
    } catch (err) {
      addToast(`Simulated upgrade to ${planName}`, 'success');
    }
  };

  const handlePortalSession = async () => {
    try {
      const res = await apiFetch('/v1/billing/portal-session', { method: 'POST' });
      if (res.url) {
        window.location.href = res.url;
      } else {
        addToast('Simulated open Stripe portal', 'info');
      }
    } catch (err) {
      addToast('Simulated open Stripe portal', 'info');
    }
  };

  // calculate quotas (assuming mock limits)
  const plan = billing?.plan || 'FREE';
  const apiLimit = plan === 'ENTERPRISE' ? 100000 : (plan === 'PRO' ? 50000 : 10000);
  const orderLimit = plan === 'ENTERPRISE' ? 10000 : (plan === 'PRO' ? 1000 : 100);

  const apiUsage = billing?.api_calls || 0;
  const orderUsage = billing?.orders_created || 0;

  const apiPct = Math.min((apiUsage / apiLimit) * 100, 100);
  const orderPct = Math.min((orderUsage / orderLimit) * 100, 100);

  return (
    <div className="billing-page">
      <div className="page-header mb-4 flex justify-between items-center">
        <div>
          <h1>Subscription & Billing</h1>
          <p>Inspect tenant usage limits, current plan status, and accrued balance.</p>
        </div>
        <button className="btn btn-outline" onClick={handlePortalSession}>
          Manage Subscription
        </button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Active Plan Tier</div>
          <div className="stat-value text-xl font-bold">{plan}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label mb-2">API Usage ({apiUsage.toLocaleString()} / {apiLimit.toLocaleString()})</div>
          <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: apiPct > 80 ? 'var(--red)' : 'var(--blue)', height: '100%', width: `${apiPct}%` }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label mb-2">Orders Usage ({orderUsage.toLocaleString()} / {orderLimit.toLocaleString()})</div>
          <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: orderPct > 80 ? 'var(--red)' : 'var(--blue)', height: '100%', width: `${orderPct}%` }}></div>
          </div>
        </div>
      </div>

      <h3 className="mb-4 mt-6">Available Plans</h3>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* FREE PLAN */}
        <div className="card card-p flex flex-col">
          <h4 className="text-xl font-bold">Free</h4>
          <div className="text-2xl mb-4">$0 <span className="text-sm text-secondary">/mo</span></div>
          <ul className="mb-6 flex-1 text-secondary" style={{ lineHeight: '1.8' }}>
            <li>✓ 10,000 API calls</li>
            <li>✓ 100 Orders/mo</li>
            <li>✓ Basic Support</li>
            <li>✓ PostgreSQL RLS Filter</li>
          </ul>
          <button 
            className={`btn w-full ${plan === 'FREE' ? 'btn-outline' : 'btn-primary'}`}
            disabled={plan === 'FREE'}
            onClick={() => handleCheckoutSession('FREE')}
          >
            {plan === 'FREE' ? 'Current Plan' : 'Downgrade to Free'}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="card card-p flex flex-col" style={{ border: plan === 'PRO' ? '2px solid var(--primary)' : '' }}>
          <h4 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>Pro</h4>
          <div className="text-2xl mb-4">$49 <span className="text-sm text-secondary">/mo</span></div>
          <ul className="mb-6 flex-1 text-secondary" style={{ lineHeight: '1.8' }}>
            <li>✓ 50,000 API calls</li>
            <li>✓ 1,000 Orders/mo</li>
            <li>✓ Priority Support</li>
            <li>✓ Advanced Analytics</li>
          </ul>
          <button 
            className={`btn w-full ${plan === 'PRO' ? 'btn-outline' : 'btn-primary'}`}
            disabled={plan === 'PRO'}
            onClick={() => handleCheckoutSession('PRO')}
          >
            {plan === 'PRO' ? 'Current Plan' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className="card card-p flex flex-col">
          <h4 className="text-xl font-bold">Enterprise</h4>
          <div className="text-2xl mb-4">$199 <span className="text-sm text-secondary">/mo</span></div>
          <ul className="mb-6 flex-1 text-secondary" style={{ lineHeight: '1.8' }}>
            <li>✓ 100,000 API calls</li>
            <li>✓ 10,000 Orders/mo</li>
            <li>✓ 24/7 SLA Support</li>
            <li>✓ Dedicated Tenant Schema</li>
          </ul>
          <button 
            className={`btn w-full ${plan === 'ENTERPRISE' ? 'btn-outline' : 'btn-primary'}`}
            disabled={plan === 'ENTERPRISE'}
            onClick={() => handleCheckoutSession('ENTERPRISE')}
          >
            {plan === 'ENTERPRISE' ? 'Current Plan' : 'Upgrade to Enterprise'}
          </button>
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
