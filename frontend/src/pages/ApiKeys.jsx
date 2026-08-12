import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function ApiKeys() {
  const { apiFetch, addToast, isDemoMode } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [keyToRevoke, setKeyToRevoke] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/api-keys');
      if (res._demo) {
        setKeys([{ id: 'k1', name: 'Prod Key', prefix: 'sk_live_...a1b2', scopes: 'read,write' }]);
      } else {
        setKeys(res.content || res || []);
      }
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  const handleCreate = async () => {
    try {
      const res = await apiFetch('/v1/api-keys', { method: 'POST', body: JSON.stringify({ name: 'New Key', scopes: 'read' }) });
      if (res._demo) {
        const mockKey = { id: Date.now().toString(), name: 'New Key', prefix: 'ak_live_...test', scopes: 'read' };
        setKeys([...keys, mockKey]);
        setNewKey('ak_live_demo_secret_key_889210491');
      } else {
        setKeys([...keys, res]);
        setNewKey(res.secret || 'Secret hidden');
      }
      addToast('API Key created', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleRevokeConfirm = async () => {
    if (!keyToRevoke) return;
    
    try {
      const res = await apiFetch(`/v1/api-keys/${keyToRevoke.id}`, { method: 'DELETE' });
      setKeys(keys.filter(k => k.id !== keyToRevoke.id));
      addToast('API Key revoked', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setKeyToRevoke(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Key Name', render: (row) => <strong style={{ fontWeight: 600 }}>{row.name}</strong> },
    { key: 'prefix', label: 'Key Prefix', render: (row) => <code className="code-tag">{row.prefix}</code> },
    { key: 'scopes', label: 'Permission Scopes', render: (row) => <span className="badge badge-purple">{row.scopes}</span> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <button className="btn btn-danger btn-xs" onClick={() => setKeyToRevoke(row)}>Revoke Key</button>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>API Keys & Credentials</h1>
          <p>Generate, inspect, and revoke programmatic authentication tokens.</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>+ Generate API Key</button>
      </div>

      {newKey && (
        <div className="glass-card card-p mb-6" style={{ borderColor: 'var(--green)' }}>
          <h4 style={{ color: 'var(--green)', marginBottom: '8px' }}>New API Key Generated</h4>
          <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>Copy this key now. You won't be able to see it again!</p>
          <div className="secret-box">{newKey}</div>
        </div>
      )}

      <div className="glass-card card-p">
        <DataTable columns={columns} data={keys} loading={loading} emptyMessage="No API keys found." />
      </div>

      <ConfirmDialog 
        isOpen={!!keyToRevoke}
        title="Revoke API Key"
        message={`Are you sure you want to revoke "${keyToRevoke?.name}"? Any applications using this key will immediately lose access.`}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setKeyToRevoke(null)}
      />
    </div>
  );
}
