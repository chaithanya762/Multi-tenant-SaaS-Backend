import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Package,
  ShoppingCart,
  Users,
  Key,
  ClipboardList,
  CreditCard,
  Link as LinkIcon,
  FlaskConical,
  LogOut
} from 'lucide-react';

const tabs = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Tenants', path: '/tenants', icon: Building2 },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Orders', path: '/orders', icon: ShoppingCart },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'API Keys', path: '/api-keys', icon: Key },
  { name: 'Audit Log', path: '/audit-log', icon: ClipboardList },
  { name: 'Billing', path: '/billing', icon: CreditCard },
  { name: 'Webhooks', path: '/webhooks', icon: LinkIcon },
  { name: 'RLS Tester', path: '/rls-tester', icon: FlaskConical },
];

export function Sidebar({ open, setOpen }) {
  const { handleLogout } = useAuth();

  return (
    <aside className={`sidebar glass ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">N</div>
        <div className="brand-text">
          <div className="brand-name">NexusSaaS</div>
          <div className="brand-badge">ENTERPRISE</div>
        </div>
      </div>
      <div className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><Icon size={18} /></span>
              {tab.name}
            </NavLink>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <div
          className="nav-item"
          onClick={handleLogout}
          style={{ color: 'var(--red)', cursor: 'pointer' }}
        >
          <span className="nav-item-icon"><LogOut size={18} /></span>
          Logout
        </div>
      </div>
    </aside>
  );
}
