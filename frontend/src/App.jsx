import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Topbar } from './components/Layout/Topbar';
import { ToastContainer } from './components/Layout/ToastContainer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Pages
import { AuthScreen } from './pages/AuthScreen';
import { Dashboard } from './pages/Dashboard';
import { Tenants } from './pages/Tenants';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Users } from './pages/Users';
import { ApiKeys } from './pages/ApiKeys';
import { AuditLog } from './pages/AuditLog';
import { Billing } from './pages/Billing';
import { Webhooks } from './pages/Webhooks';
import { RlsTester } from './pages/RlsTester';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      
      <main className="main-content">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="page-content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/users" element={<Users />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/webhooks" element={<Webhooks />} />
              <Route path="/rls-tester" element={<RlsTester />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
