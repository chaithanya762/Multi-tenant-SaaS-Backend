import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import WebhookDeliveriesModal from '../components/modals/WebhookDeliveriesModal';

export function Webhooks() {
  const { apiFetch, addToast } = useAuth();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHook, setNewHook] = useState({ url: '', events: 'order.created', secret: '' });

  const [deadLetters, setDeadLetters] = useState([]);
  const [loadingDlq, setLoadingDlq] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/v1/webhooks');
      setWebhooks(res.content || res || []);
    } catch (e) {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const fetchDeadLetters = useCallback(async () => {
    setLoadingDlq(true);
    try {
      const res = await apiFetch('/v1/webhooks/dead-letter');
      setDeadLetters(res.content || res || []);
    } catch (e) {
      setDeadLetters([]);
    } finally {
      setLoadingDlq(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchWebhooks();
    fetchDeadLetters();
  }, [fetchWebhooks, fetchDeadLetters]);

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

  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleTestWebhook = async (id) => {
    try {
      const start = Date.now();
      const res = await apiFetch(`/v1/webhooks/${id}/test`, { method: 'POST' });
      const latency = Date.now() - start;
      addToast(`Webhook test initiated. Status: ${res?.status || 'PENDING'}, Latency: ${latency}ms`, 'success');
      fetchDeadLetters();
    } catch (err) {
      addToast(`Webhook test failed: ${err.message}`, 'error');
      fetchDeadLetters();
    }
  };

  const handleRedeliver = async (deliveryId) => {
    try {
      await apiFetch(`/v1/webhooks/deliveries/${deliveryId}/redeliver`, { method: 'POST' });
      addToast('Webhook re-delivery triggered successfully!', 'success');
      fetchDeadLetters();
    } catch (err) {
      addToast('Failed to redeliver: ' + err.message, 'error');
    }
  };

  const handleViewHistory = (id) => {
    setSelectedWebhookId(id);
    setShowHistoryModal(true);
  };

  const columns = [
    { key: 'url', label: 'Endpoint URL', render: (row) => <code className="code-tag">{row.url}</code> },
    { key: 'events', label: 'Subscribed Events', render: (row) => <span className="badge badge-blue">{row.events}</span> },
    { key: 'status', label: 'Status', render: () => <span className="badge badge-green">Active</span> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-2">
         <button className="btn btn-outline btn-sm" onClick={() => handleTestWebhook(row.id)}>Test Webhook</button>
         <button className="btn btn-outline btn-sm" onClick={() => handleViewHistory(row.id)}>Delivery History</button>
      </div>
    )}
  ];

  const dlqColumns = [
    { key: 'eventType', label: 'Event', render: (row) => <span className="badge badge-red">{row.eventType}</span> },
    { key: 'attempts', label: 'Attempts', render: (row) => <span className="badge badge-amber">{row.attemptCount} / 3</span> },
    { key: 'status', label: 'Status', render: () => <span className="badge badge-red">DEAD_LETTER</span> },
    { key: 'error', label: 'Last Error Response', render: (row) => (
      <span className="code-tag" style={{ maxWidth: '280px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.responseBody}>
        {row.responseBody || 'Network Timeout'}
      </span>
    )},
    { key: 'timestamp', label: 'Failed At', render: (row) => new Date(row.updatedAt || row.createdAt).toLocaleTimeString() },
    { key: 'actions', label: 'Recovery Action', render: (row) => (
      <button className="btn btn-primary btn-sm" onClick={() => handleRedeliver(row.id)}>
        🔁 Retry Now
      </button>
    )}
  ];

  return (
    <div className="webhooks-page">
      <div className="page-header mb-4">
        <h1>Webhook Endpoints & Resilient Dispatcher</h1>
        <p>Outbound event streams with asynchronous delivery, exponential backoff retries, and Dead Letter Queue (DLQ) quarantine.</p>
      </div>

      {deadLetters.length > 0 && (
        <div className="card card-p mb-4" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 style={{ color: '#ef4444', margin: 0 }}>⚠️ Quarantined Deliveries (Dead Letter Queue)</h3>
              <p className="text-muted text-sm mt-1 mb-0">Webhooks that failed 3 consecutive retry attempts. Review error details or click Retry Now.</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={fetchDeadLetters}>Refresh DLQ</button>
          </div>
          <DataTable columns={dlqColumns} data={deadLetters} loading={loadingDlq} />
        </div>
      )}

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
        <div>Multitenant-SaaS Platform v2.0.0 (Event-Driven Webhook Engine)</div>
        <div className="flex gap-4">
          <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
          <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
          <a href="#" onClick={e => e.preventDefault()}>API Documentation</a>
        </div>
      </footer>
      {showHistoryModal && (
        <WebhookDeliveriesModal 
          webhookId={selectedWebhookId} 
          onClose={() => {
            setShowHistoryModal(false);
            fetchDeadLetters();
          }} 
        />
      )}
    </div>
  );
}
