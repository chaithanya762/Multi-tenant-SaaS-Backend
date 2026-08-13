import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Sparkles, Key, Zap, Lock } from 'lucide-react';

export function AuthScreen() {
  const { login, apiFetch, addToast, setIsDemoMode } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ tenantId: 'tenant-alpha', username: 'alpha-admin', email: '', password: 'password123' });
  const [loading, setLoading] = useState(false);

  const prefill = (tenantId, username) => {
    setForm({ tenantId, username, email: `${username}@${tenantId}.com`, password: 'password123' });
    addToast(`Pre-filled for ${tenantId}`, 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/v1/auth/login' : '/v1/auth/register';
      const body = { ...form };
      if (isLogin) delete body.email;

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (res._demo) {
        login('demo-token-123', form.tenantId || 'tenant-alpha');
        addToast('Demo Mode Login Successful', 'success');
        return;
      }

      if (res.token) {
        login(res.token, form.tenantId);
        addToast(`Welcome back, ${form.username}!`, 'success');
      } else if (!isLogin) {
        addToast('Registration successful! Please login.', 'success');
        setIsLogin(true);
      }
    } catch (err) {
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setIsDemoMode(true);
    login('demo-token-123', 'tenant-alpha');
    addToast('Demo Mode Activated', 'info');
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-orb auth-hero-orb-1" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(0,0,0,0) 70%)' }}></div>
        <div className="auth-hero-orb auth-hero-orb-2" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>
        <div className="auth-hero-content">
          <div className="auth-hero-logo" style={{ background: 'var(--accent-gradient)', color: '#090d16', fontWeight: 'bold' }}>N</div>
          <h1>NexusSaaS</h1>
          <p>Enterprise-grade multi-tenant architecture with PostgreSQL RLS & Token Bucket Rate Limiting.</p>

          <div className="mt-8 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-secondary">
              <ShieldCheck size={16} className="text-cyan" /> Row-Level Security Isolated Databases
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <Zap size={16} className="text-emerald" /> High-Performance Rate Limiter Engine
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-form-side">
        <div className="auth-form-box glass-card card-p" style={{ border: '1px solid rgba(6, 182, 212, 0.25)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
          <div className="auth-form-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Sign in to your tenant workspace' : 'Register a new admin user'}</p>
          </div>

          {/* Quick Pre-fill Helper */}
          <div className="mb-4 p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
            <span className="text-xs text-secondary font-mono">Quick Demo Tenants:</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => prefill('tenant-alpha', 'alpha-admin')} className="btn btn-xs btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                tenant-alpha
              </button>
              <button type="button" onClick={() => prefill('tenant-beta', 'beta-admin')} className="btn btn-xs btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                tenant-beta
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Tenant ID (RLS Context)</label>
              <input required type="text" className="input" placeholder="e.g. tenant-alpha" value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label>Username</label>
              <input required type="text" className="input" placeholder="alpha-admin" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label>Email</label>
                <input required type="email" className="input" placeholder="admin@tenant-alpha.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input required type="password" className="input" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', background: 'var(--accent-gradient)', color: '#090d16', fontWeight: 'bold' }} disabled={loading}>
              {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Register Admin'}
            </button>
          </form>

          <div className="auth-switch mt-4 text-center">
            <a onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--cyan)', cursor: 'pointer', fontSize: '0.85rem' }}>
              {isLogin ? 'Need an account? Register new tenant admin' : 'Already registered? Sign in'}
            </a>
          </div>
          
          <div className="divider my-4"></div>
          
          <button className="btn btn-ghost" onClick={demoLogin} style={{ width: '100%', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Try Offline Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
}
