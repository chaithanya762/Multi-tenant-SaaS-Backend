import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Moon, Sun, Search, ShieldCheck } from 'lucide-react';

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
    <header className="top-bar">
      <div className="top-bar-left">
        <button className="mobile-menu-btn btn btn-icon" onClick={toggleSidebar}>
          <Menu size={18} />
        </button>
        <div className="breadcrumb-area">
          <span className="breadcrumb-root">Console</span>
          <span className="breadcrumb-sep">/</span>
          <h2 className="page-title">{getPageTitle()}</h2>
        </div>
      </div>

      <div className="top-bar-center">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input type="text" placeholder="Search resources, API keys, orders..." className="search-input" />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      <div className="top-bar-right">
        {isDemoMode ? (
          <span className="status-pill demo"><div className="status-dot"></div>DEMO MODE</span>
        ) : (
          <span className="status-pill online"><div className="status-dot"></div>LIVE</span>
        )}
        <div className="tenant-badge">
          <ShieldCheck size={14} color="var(--accent)" />
          <span>{tenantId || 'global'}</span>
        </div>
        <button className="btn btn-icon theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
