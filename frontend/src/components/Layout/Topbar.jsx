import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export function Topbar({ toggleSidebar }) {
  const { tenantId, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/tenants': return 'Tenants Management';
      case '/products': return 'Product Catalog';
      case '/orders': return 'Order Management';
      case '/users': return 'Team & Access';
      case '/api-keys': return 'API Keys & Secrets';
      case '/audit-log': return 'Audit Logs';
      case '/billing': return 'Subscription & Billing';
      case '/webhooks': return 'Webhook Endpoints';
      case '/rls-tester': return 'RLS Security Inspector';
      default: return 'Console';
    }
  };

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <span className="text-secondary font-semibold" style={{ fontSize: '0.84rem' }}>Console</span>
        <span className="text-muted">/</span>
        <span className="text-bright font-bold" style={{ fontSize: '0.92rem' }}>{getPageTitle()}</span>
      </div>

      <div className="flex items-center gap-3">
        {isDemoMode ? (
          <span className="badge badge-amber">Demo Mode</span>
        ) : (
          <span className="badge badge-green">Live Production</span>
        )}
        <span className="badge badge-blue font-mono">
          Tenant: {tenantId || 'global'}
        </span>
        <button className="btn btn-secondary" onClick={toggleTheme} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </header>
  );
}
