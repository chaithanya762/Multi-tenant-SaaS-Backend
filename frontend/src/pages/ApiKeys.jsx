import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';

export function ApiKeys() {
  const { apiFetch, addToast } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState(null);

  useEffect(() => {
    const fetchKeys = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/v1/api-keys');
        setKeys(res.content || res || []);
      } catch (e) {
        setKeys([]);
      } finally {
        setLoading(false);
      }
    };
    fetchKeys();
  }, [apiFetch]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/v1/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName })
      });
      setNewKey(res.token || res.key || 'ak_live_secret_key_generated');
      setKeys([...keys, res]);
      addToast('API Key generated successfully', 'success');
      setNewKeyName('');
    } catch (err) {
      addToast('Failed to generate key: ' + err.message, 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Key Identifier', render: (row) => <strong style={{ color: 'var(--text-bright)' }}>{row.name}</strong> },
    { key: 'prefix', label: 'Token Prefix', render: (row) => <code className="code-tag">{row.prefix || row.keyPrefix || 'ak_live_...'}</code> },
    { key: 'scopes', label: 'Permissions', render: (row) => <span className="badge badge-blue">{row.scopes || 'READ_WRITE'}</span> },
    { key: 'createdAt', label: 'Created', render: (row) => <span className="text-secondary">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Active'}</span> }
  ];

  return (
    <div className="api-keys-page">
      <div className="page-header mb-4">
        <h1>API Keys & Credentials</h1>
        <p>Generate and manage programmatic API credentials for tenant integrations.</p>
      </div>

      <div className="card card-p mb-4">
        <h3 className="mb-2">Generate New API Key</h3>
        <form onSubmit={handleCreateKey} className="flex gap-3 items-center flex-wrap">
          <div className="form-group" style={{ flex: '1 1 240px' }}>
            <label>Key Name / Description</label>
            <input 
              required 
              className="input" 
              placeholder="e.g. Production Ingestion Service" 
              value={newKeyName} 
              onChange={e => setNewKeyName(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '22px' }}>Generate Secret Key</button>
        </form>

        {newKey && (
          <div className="mt-4 p-3 card" style={{ background: 'var(--bg-surface)' }}>
            <div className="text-xs text-secondary mb-1">Copy your secret key now. It will not be shown again:</div>
            <code className="code-tag font-mono" style={{ color: 'var(--green)', wordBreak: 'break-all' }}>{newKey}</code>
          </div>
        )}
      </div>

      <div className="card card-p">
        <h3 className="mb-4">Active Credentials</h3>
        <DataTable columns={columns} data={keys} loading={loading} />
      </div>

      <footer className="app-footer">
        <div>Multitenant-SaaS Platform v1.0.0</div>
        <div className="flex gap-4">
          <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
          <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
          <a href="#" onClick={e => e.preventDefault()}>API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
