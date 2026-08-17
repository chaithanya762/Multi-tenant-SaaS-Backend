import React from 'react';
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
  { name: 'RLS Inspector', path: '/rls-tester' },
];

export function Sidebar({ open, setOpen }) {
  const { handleLogout } = useAuth();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">N</div>
        <div className="brand-text">
          <div className="brand-name">NexusSaaS</div>
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
