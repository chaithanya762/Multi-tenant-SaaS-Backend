import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../ui/DataTable';

export default function WebhookDeliveriesModal({ webhookId, onClose }) {
  const { apiFetch, addToast } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    if (!webhookId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/v1/webhooks/${webhookId}/deliveries`);
      setDeliveries(res.content || res || []);
    } catch (err) {
      addToast('Failed to fetch webhook deliveries', 'error');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [webhookId, apiFetch, addToast]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleRedeliver = async (deliveryId) => {
    try {
      await apiFetch(`/v1/webhooks/deliveries/${deliveryId}/redeliver`, { method: 'POST' });
      addToast('Re-delivery scheduled successfully!', 'success');
      fetchDeliveries();
    } catch (err) {
      addToast('Failed to redeliver: ' + err.message, 'error');
    }
  };

  const getStatusBadge = (row) => {
    const status = row.status || (row.responseStatus >= 200 && row.responseStatus < 300 ? 'SUCCESS' : 'FAILED');
    if (status === 'SUCCESS') {
      return <span className="badge badge-green">SUCCESS ({row.responseStatus || 200})</span>;
    }
    if (status === 'PENDING_RETRY') {
      return <span className="badge badge-amber">RETRY PENDING (#{row.attemptCount})</span>;
    }
    if (status === 'DEAD_LETTER') {
      return <span className="badge badge-red">DEAD_LETTER ({row.attemptCount}/3)</span>;
    }
    return <span className="badge badge-red">{status}</span>;
  };

  const columns = [
    { key: 'event', label: 'Event', render: (row) => <span className="badge badge-blue">{row.eventType || row.event || 'ping'}</span> },
    { key: 'status', label: 'Status & Attempts', render: (row) => getStatusBadge(row) },
    { key: 'latency', label: 'Latency', render: (row) => `${row.durationMs || row.latency || 0}ms` },
    { key: 'timestamp', label: 'Recorded At', render: (row) => new Date(row.createdAt || row.timestamp).toLocaleTimeString() },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <button className="btn btn-sm btn-outline" onClick={() => alert(row.payload)}>
          Payload
        </button>
        {row.status !== 'SUCCESS' && (
          <button className="btn btn-sm btn-primary" onClick={() => handleRedeliver(row.id)}>
            🔁 Retry
          </button>
        )}
      </div>
    )}
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px', width: '90%' }}>
        <div className="modal-header">
          <h2>Outbound Delivery Logs</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <DataTable columns={columns} data={deliveries} loading={loading} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
