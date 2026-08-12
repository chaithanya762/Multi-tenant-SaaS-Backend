import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function AuthScreen() {
  const { login, apiFetch, addToast, setIsDemoMode } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ tenantId: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

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
        login('demo-token-123', form.tenantId || 't1');
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
    login('demo-token-123', 't1');
    addToast('Demo Mode Activated', 'info');
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-orb auth-hero-orb-1"></div>
        <div className="auth-hero-orb auth-hero-orb-2"></div>
        <div className="auth-hero-content">
          <div className="auth-hero-logo">N</div>
          <h1>NexusSaaS</h1>
          <p>Enterprise-grade multi-tenant architecture for modern SaaS applications.</p>
        </div>
      </div>
      
      <div className="auth-form-side">
        <div className="auth-form-box glass-card card-p">
          <div className="auth-form-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Sign in to your tenant workspace' : 'Register a new admin user'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Tenant ID</label>
              <input required type="text" className="input" placeholder="e.g. acme-corp" value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label>Username</label>
              <input required type="text" className="input" placeholder="admin" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label>Email</label>
                <input required type="email" className="input" placeholder="admin@acme.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input required type="password" className="input" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
            </button>
          </form>

          <div className="auth-switch">
            <a onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
            </a>
          </div>
          
          <div className="divider"></div>
          
          <button className="btn btn-ghost" onClick={demoLogin} style={{ width: '100%', justifyContent: 'center' }}>
            Try Demo Without Backend
          </button>
        </div>
      </div>
    </div>
  );
}
