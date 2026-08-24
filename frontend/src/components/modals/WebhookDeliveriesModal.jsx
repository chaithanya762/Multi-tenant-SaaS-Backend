import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../ui/DataTable';

export default function WebhookDeliveriesModal({ webhookId, onClose }) {
  const { apiFetch, addToast } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!webhookId) return;
    
    const fetchDeliveries = async () => {
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
    };
    
    fetchDeliveries();
  }, [webhookId, apiFetch, addToast]);

  const columns = [
    { key: 'event', label: 'Event', render: (row) => <span className="badge badge-blue">{row.event || 'ping'}</span> },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`badge ${row.responseStatus >= 200 && row.responseStatus < 300 ? 'badge-green' : 'badge-red'}`}>
        {row.responseStatus || 'Failed'}
      </span>
    )},
    { key: 'latency', label: 'Latency (ms)', render: (row) => `${row.latency || 0}ms` },
    { key: 'timestamp', label: 'Timestamp', render: (row) => new Date(row.createdAt || row.timestamp).toLocaleString() },
    { key: 'payload', label: 'Payload', render: (row) => (
      <button className="btn btn-sm btn-outline" onClick={() => alert(JSON.stringify(row.payload, null, 2))}>
        View
      </button>
    )}
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <h2>Delivery History</h2>
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
