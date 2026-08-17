import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/apiClient';

const DEFAULT_RENDER_URL = 'https://multitenant-backend-4lh0.onrender.com';

export function AuthScreen() {
  const { login, apiFetch, addToast } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ tenantId: 'tenant-alpha', username: 'alpha-admin', email: '', password: 'password123' });
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('saas_api_url') || DEFAULT_RENDER_URL);
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize default Render URL in localStorage if not set
  if (!localStorage.getItem('saas_api_url')) {
    localStorage.setItem('saas_api_url', DEFAULT_RENDER_URL);
  }

  const handleApiUrlChange = (val) => {
    setApiUrl(val);
    if (val) {
      localStorage.setItem('saas_api_url', val);
    } else {
      localStorage.removeItem('saas_api_url');
    }
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

      if (res.token) {
        login(res.token, form.tenantId);
        addToast(`Welcome, ${form.username}`, 'success');
      } else if (!isLogin) {
        addToast('Registration successful. Please sign in.', 'success');
        setIsLogin(true);
      }
    } catch (err) {
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">N</div>
          <h1>NexusSaaS Platform</h1>
          <p>{isLogin ? 'Sign in to access your tenant workspace' : 'Register a new tenant administrator'}</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit} className="form-group gap-4">
            <div className="form-group">
              <label>Tenant Identifier</label>
              <input 
                required 
                type="text" 
                className="input" 
                placeholder="e.g. tenant-alpha" 
                value={form.tenantId} 
                onChange={e => setForm({...form, tenantId: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label>Username</label>
              <input 
                required 
                type="text" 
                className="input" 
                placeholder="Username" 
                value={form.username} 
                onChange={e => setForm({...form, username: e.target.value})} 
              />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  required 
                  type="email" 
                  className="input" 
                  placeholder="admin@tenant.com" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input 
                required 
                type="password" 
                className="input" 
                placeholder="••••••••" 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
              />
            </div>

            {/* API Endpoint Selector */}
            <div style={{ marginTop: '4px' }}>
              <div 
                onClick={() => setShowConfig(!showConfig)} 
                style={{ fontSize: '0.76rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              >
                <span>Backend Target: <code className="code-tag">{apiUrl || getApiBaseUrl() || '/api'}</code></span>
                <span>{showConfig ? '▲ Hide' : '▼ Change'}</span>
              </div>

              {showConfig && (
                <div className="form-group mt-2">
                  <label>Backend API Base URL</label>
                  <input 
                    type="url" 
                    className="input" 
                    placeholder="https://multitenant-backend-4lh0.onrender.com" 
                    value={apiUrl} 
                    onChange={e => handleApiUrlChange(e.target.value)} 
                  />
                  <div className="subtext">Targeting live Render backend instance.</div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Register Administrator'}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem' }}>
            <a onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
              {isLogin ? 'Create a new account' : 'Already have an account? Sign in'}
            </a>
          </div>
        </div>

        <div className="auth-footer-links">
          <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
          <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
          <a href="#" onClick={e => e.preventDefault()}>Security</a>
        </div>
      </div>
    </div>
  );
}
