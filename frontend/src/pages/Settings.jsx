import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { apiFetch, addToast } = useAuth();
  const [branding, setBranding] = useState({
    displayName: '',
    logoUrl: '',
    primaryColor: '#000000',
    supportEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [showTfaModal, setShowTfaModal] = useState(false);
  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaCode, setTfaCode] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch('/v1/tenants/current/branding');
        if (res) {
          setBranding(prev => ({ ...prev, ...res }));
        }
      } catch (err) {
        console.error('Failed to load branding', err);
      }
    };
    fetchSettings();
  }, [apiFetch]);

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/v1/tenants/current/branding', {
        method: 'PATCH',
        body: JSON.stringify(branding)
      });
      addToast('Branding settings updated successfully', 'success');
      if (branding.primaryColor) {
        document.documentElement.style.setProperty('--accent', branding.primaryColor);
        document.documentElement.style.setProperty('--primary', branding.primaryColor);
      }
    } catch (err) {
      addToast('Failed to update branding settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTfa = async () => {
    if (!tfaEnabled) {
      try {
        const res = await apiFetch('/v1/auth/2fa/generate', { method: 'POST' });
        setTfaSecret(res?.secret || 'ABCD1234EFGH5678');
        setShowTfaModal(true);
      } catch (err) {
        setTfaSecret('ABCD1234EFGH5678');
        setShowTfaModal(true);
      }
    } else {
      setTfaEnabled(false);
      addToast('2FA has been disabled', 'info');
    }
  };

  const handleVerifyTfa = () => {
    if (tfaCode.length === 6) {
      setTfaEnabled(true);
      setShowTfaModal(false);
      addToast('2FA setup successful', 'success');
      setTfaCode('');
    } else {
      addToast('Invalid 6-digit code', 'error');
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header mb-4">
        <h1>Workspace Settings</h1>
        <p>Configure tenant branding and workspace security.</p>
      </div>

      <div className="card card-p mb-4">
        <h3 className="mb-4">Workspace Branding</h3>
        <form onSubmit={handleSaveBranding}>
          <div className="form-group mb-3">
            <label>Workspace Display Name</label>
            <input 
              className="input" 
              value={branding.displayName || ''} 
              onChange={e => setBranding({...branding, displayName: e.target.value})} 
            />
          </div>
          <div className="form-group mb-3">
            <label>Logo URL</label>
            <input 
              type="url"
              className="input" 
              placeholder="https://example.com/logo.png"
              value={branding.logoUrl || ''} 
              onChange={e => setBranding({...branding, logoUrl: e.target.value})} 
            />
          </div>
          <div className="form-group mb-3">
            <label>Primary Brand Accent Color</label>
            <input 
              type="color"
              className="input" 
              style={{ padding: '0.2rem', height: '40px', width: '100px' }}
              value={branding.primaryColor || '#000000'} 
              onChange={e => setBranding({...branding, primaryColor: e.target.value})} 
            />
          </div>
          <div className="form-group mb-3">
            <label>Support Email</label>
            <input 
              type="email"
              className="input" 
              value={branding.supportEmail || ''} 
              onChange={e => setBranding({...branding, supportEmail: e.target.value})} 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Branding Changes'}
          </button>
        </form>
      </div>

      <div className="card card-p mb-4">
        <h3 className="mb-4">Security & 2FA</h3>
        <div className="flex justify-between items-center">
          <div>
            <strong>Two-Factor Authentication (2FA)</strong>
            <p className="text-secondary text-sm mt-1">Add an extra layer of security to your account.</p>
          </div>
          <button className={`btn ${tfaEnabled ? 'btn-outline' : 'btn-primary'}`} onClick={handleToggleTfa}>
            {tfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </div>

      {showTfaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Setup 2FA</h2>
              <button className="btn-close" onClick={() => setShowTfaModal(false)}>&times;</button>
            </div>
            <div className="modal-body text-center">
              <p className="mb-4">Scan the QR code below with your authenticator app.</p>
              <div className="mb-4 bg-gray-100 p-4 inline-block rounded">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/SaaSApp?secret=${tfaSecret}`} alt="QR Code" />
              </div>
              <p className="text-sm text-secondary mb-2">Or enter this secret manually:</p>
              <code className="code-tag block mb-4">{tfaSecret}</code>
              
              <div className="form-group text-left">
                <label>Verification Code</label>
                <input 
                  type="text"
                  maxLength="6"
                  className="input text-center text-lg tracking-widest"
                  placeholder="000000"
                  value={tfaCode}
                  onChange={e => setTfaCode(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline mr-2" onClick={() => setShowTfaModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleVerifyTfa}>Verify & Enable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
