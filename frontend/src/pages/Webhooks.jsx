import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';

export function Webhooks() {
  const { apiFetch, addToast } = useAuth();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHook, setNewHook] = useState({ url: '', events: 'order.created', secret: '' });

  useEffect(() => {
    const fetchWebhooks = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/v1/webhooks');
        setWebhooks(res.content || res || []);
      } catch (e) {
        setWebhooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWebhooks();
  }, [apiFetch]);

  const handleRegisterHook = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/v1/webhooks', {
        method: 'POST',
        body: JSON.stringify(newHook)
      });
      setWebhooks([...webhooks, res]);
      addToast('Webhook endpoint registered', 'success');
      setNewHook({ url: '', events: 'order.created', secret: '' });
    } catch (err) {
      addToast('Failed to register webhook: ' + err.message, 'error');
    }
  };

  const columns = [
    { key: 'url', label: 'Endpoint URL', render: (row) => <code className="code-tag">{row.url}</code> },
    { key: 'events', label: 'Subscribed Events', render: (row) => <span className="badge badge-blue">{row.events}</span> },
    { key: 'status', label: 'Status', render: () => <span className="badge badge-green">Active</span> }
  ];

  return (
    <div className="webhooks-page">
      <div className="page-header mb-4">
        <h1>Webhook Endpoints</h1>
        <p>Configure HTTP webhook notifications for real-time tenant system events.</p>
      </div>

      <div className="card card-p mb-4">
        <h3 className="mb-2">Register Webhook Endpoint</h3>
        <form onSubmit={handleRegisterHook} className="flex gap-3 items-center flex-wrap">
          <div className="form-group" style={{ flex: '2 1 240px' }}>
            <label>Destination URL</label>
            <input 
              required 
              type="url"
              className="input" 
              placeholder="https://api.tenant.com/webhooks" 
              value={newHook.url} 
              onChange={e => setNewHook({...newHook, url: e.target.value})} 
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 180px' }}>
            <label>Event Topic</label>
            <input 
              required 
              className="input" 
              placeholder="order.created" 
              value={newHook.events} 
              onChange={e => setNewHook({...newHook, events: e.target.value})} 
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 180px' }}>
            <label>Signing Secret</label>
            <input 
              required 
              className="input" 
              placeholder="whsec_..." 
              value={newHook.secret} 
              onChange={e => setNewHook({...newHook, secret: e.target.value})} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '22px' }}>Register Webhook</button>
        </form>
      </div>

      <div className="card card-p">
        <h3 className="mb-4">Configured Endpoints</h3>
        <DataTable columns={columns} data={webhooks} loading={loading} />
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
