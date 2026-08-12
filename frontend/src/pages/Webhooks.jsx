import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function Webhooks() {
  const { apiFetch, addToast, isDemoMode } = useAuth();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHook, setNewHook] = useState({ url: '', events: 'order.created' });
  const [hookToDelete, setHookToDelete] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/webhooks');
      if (res._demo) {
        setWebhooks([{ id: 'w1', url: 'https://acme.com/hook', events: 'order.created' }]);
      } else {
        setWebhooks(res.content || res || []);
      }
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/v1/webhooks', { method: 'POST', body: JSON.stringify(newHook) });
      setWebhooks([...webhooks, res._demo ? { id: Date.now().toString(), ...newHook } : res]);
      addToast('Webhook Endpoint added', 'success');
      setNewHook({ url: '', events: 'order.created' });
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!hookToDelete) return;
    try {
      const res = await apiFetch(`/v1/webhooks/${hookToDelete.id}`, { method: 'DELETE' });
      setWebhooks(webhooks.filter(w => w.id !== hookToDelete.id));
      addToast('Webhook deleted', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setHookToDelete(null);
    }
  };

  const columns = [
    { key: 'url', label: 'Endpoint URL', render: (row) => <code className="code-tag">{row.url}</code> },
    { key: 'events', label: 'Subscribed Events', render: (row) => <span className="badge badge-cyan">{row.events}</span> },
    { key: 'status', label: 'Status', render: () => <span className="badge badge-green">● Active</span> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <button className="btn btn-danger btn-xs" onClick={() => setHookToDelete(row)}>Remove</button>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Webhook Endpoints</h1>
          <p>Deliver real-time event notifications with exponential backoff retries.</p>
        </div>
      </div>

      <div className="glass-card card-p mb-6">
        <h3 className="mb-2">Register Webhook Endpoint</h3>
        <p className="subtext mb-4">Receive HTTP POST payloads when tenant resources update.</p>
        <form onSubmit={handleCreate} className="flex-gap-12" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '2 1 240px' }}>
            <label>Endpoint Target URL</label>
            <input type="url" required className="input" placeholder="https://api.acme.com/v1/webhooks" value={newHook.url} onChange={e => setNewHook({...newHook, url: e.target.value})} />
          </div>
          <div className="form-group" style={{ flex: '1 1 180px' }}>
            <label>Subscribed Event</label>
            <input required className="input" placeholder="order.created" value={newHook.events} onChange={e => setNewHook({...newHook, events: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary">Add Endpoint</button>
        </form>
      </div>

      <div className="glass-card card-p">
        <h3 className="mb-4">Configured Endpoints</h3>
        <DataTable columns={columns} data={webhooks} loading={loading} emptyMessage="No webhooks configured." />
      </div>

      <ConfirmDialog 
        isOpen={!!hookToDelete}
        title="Delete Webhook"
        message={`Are you sure you want to delete the webhook to ${hookToDelete?.url}?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setHookToDelete(null)}
      />
    </div>
  );
}
