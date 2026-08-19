import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getApiBaseUrl } from '../api/apiClient';

const DEFAULT_RENDER_URL = 'https://multitenant-backend-4lh0.onrender.com';

export function AuthScreen() {
  const { login, apiFetch, addToast } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetToken, setResetToken] = useState('');
  const [form, setForm] = useState({ tenantId: 'tenant-alpha', username: 'alpha-admin', email: '', password: 'password123' });
  const [apiUrl, setApiUrl] = useState(() => {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('saas_api_url') : null;
    if (!raw || raw.includes('vercel.app')) {
      if (typeof localStorage !== 'undefined') localStorage.setItem('saas_api_url', DEFAULT_RENDER_URL);
      return DEFAULT_RENDER_URL;
    }
    return raw;
  });
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If local storage has Vercel URL, clean it up automatically
    const current = localStorage.getItem('saas_api_url');
    if (!current || current.includes('vercel.app')) {
      localStorage.setItem('saas_api_url', DEFAULT_RENDER_URL);
      setApiUrl(DEFAULT_RENDER_URL);
    }
  }, []);

  const handleApiUrlChange = (val) => {
    setApiUrl(val);
    if (val) {
      localStorage.setItem('saas_api_url', val);
    } else {
      localStorage.removeItem('saas_api_url');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': form.tenantId },
        body: JSON.stringify({ tenantId: form.tenantId, email: form.email })
      });
      const data = await res.json();
      if (res.ok) {
        setResetToken(data.resetToken || '');
        setResetStep(2);
        addToast('Reset token generated. Check the response or your email.', 'success');
      } else {
        addToast(data.message || 'Failed to generate reset token', 'error');
      }
    } catch (err) {
      addToast('Network error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': form.tenantId },
        body: JSON.stringify({ tenantId: form.tenantId, email: form.email, resetToken, newPassword: form.password })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Password reset successfully! Please login.', 'success');
        setIsForgotPassword(false);
        setResetStep(1);
        setResetToken('');
      } else {
        addToast(data.message || 'Password reset failed', 'error');
      }
    } catch (err) {
      addToast('Network error: ' + err.message, 'error');
    } finally {
      setLoading(false);
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
        headers: {
          'X-Tenant-ID': form.tenantId
        },
        body: JSON.stringify(body)
      });

      const token = res.accessToken || res.token;
      if (token) {
        login(token, res.refreshToken, form.tenantId);
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
      <div className="auth-topbar-actions">
        <button 
          className="btn btn-secondary" 
          onClick={toggleTheme} 
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">N</div>
          <h1>Multitenant-SaaS Platform</h1>
          <p>{isLogin ? 'Sign in to access your tenant workspace' : 'Register a new tenant administrator'}</p>
        </div>

        <div className="auth-card">
          {isForgotPassword ? (
            <form onSubmit={resetStep === 1 ? handleForgotPassword : handleResetPassword}>
              <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                {resetStep === 1 ? 'Forgot Password' : 'Reset Password'}
              </h2>
              <div className="form-group mb-4">
                <label>Tenant Identifier</label>
                <input name="tenantId" className="input" placeholder="e.g. tenant-alpha" value={form.tenantId} onChange={e => setForm({...form, tenantId: e.target.value})} required />
              </div>
              <div className="form-group mb-4">
                <label>Email Address</label>
                <input name="email" type="email" className="input" placeholder="admin@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              {resetStep === 2 && (
                <>
                  <div className="form-group mb-4">
                    <label>Reset Token</label>
                    <input className="input" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Paste reset token" required />
                  </div>
                  <div className="form-group mb-4">
                    <label>New Password</label>
                    <input name="password" type="password" className="input" placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                  </div>
                </>
              )}
              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Processing...' : resetStep === 1 ? 'Send Reset Token' : 'Reset Password'}
              </button>
              <button type="button" className="btn btn-link" onClick={() => { setIsForgotPassword(false); setResetStep(1); }} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}>
                Back to Sign In
              </button>
            </form>
          ) : (
            <>
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
                    <span>Backend Target: <code className="code-tag">{apiUrl || DEFAULT_RENDER_URL}</code></span>
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
                
                {isLogin && (
                  <button type="button" className="btn btn-link" onClick={() => { setIsForgotPassword(true); setResetStep(1); }} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--cyan, #06b6d4)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>
                    Forgot Password?
                  </button>
                )}
              </form>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8rem' }}>
                <a onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
                  {isLogin ? 'Create a new account' : 'Already have an account? Sign in'}
                </a>
              </div>
            </>
          )}
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
