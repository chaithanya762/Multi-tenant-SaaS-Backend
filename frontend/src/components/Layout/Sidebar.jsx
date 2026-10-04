import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { name: 'Dashboard', path: '/' },
  { name: 'Tenants', path: '/tenants' },
  { name: 'Products', path: '/products' },
  { name: 'Orders', path: '/orders' },
  { name: 'Users', path: '/users' },
  { name: 'API Keys', path: '/api-keys' },
  { name: 'Audit Log', path: '/audit-log' },
  { name: 'Billing', path: '/billing' },
  { name: 'Webhooks', path: '/webhooks' },
  { name: 'Settings', path: '/settings' },
  { name: 'RLS Attack Tester', path: '/rls-tester' },
];

export function Sidebar({ open, setOpen }) {
  const { handleLogout, apiFetch, tenantId } = useAuth();
  const [branding, setBranding] = useState({ displayName: 'Multitenant-SaaS', logoUrl: '', primaryColor: '' });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await apiFetch('/v1/tenants/current/branding');
        if (res) {
          setBranding(prev => ({ ...prev, ...res }));
          if (res.primaryColor) {
            document.documentElement.style.setProperty('--accent', res.primaryColor);
            document.documentElement.style.setProperty('--primary', res.primaryColor);
          }
        }
      } catch (e) {
        // Ignore
      }
    };
    fetchBranding();
  }, [apiFetch, tenantId]);

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
        ) : (
          <div className="brand-logo">{branding.displayName ? branding.displayName.charAt(0).toUpperCase() : 'N'}</div>
        )}
        <div className="brand-text">
          <div className="brand-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
            {branding.displayName || 'Multitenant-SaaS'}
          </div>
          <div className="brand-badge">ENTERPRISE</div>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {tabs.map(tab => (
          <NavLink
            key={tab.name}
            to={tab.path}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {tab.name}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div
          className="nav-item"
          onClick={handleLogout}
          style={{ color: 'var(--red)', cursor: 'pointer' }}
        >
          Sign Out
        </div>
      </div>
    </aside>
  );
}
