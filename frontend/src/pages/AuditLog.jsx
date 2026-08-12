import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';

export function AuditLog() {
  const { apiFetch, isDemoMode } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/audit-log');
      if (res._demo) {
        setLogs([{ id: 1, action: 'CREATE', resource: 'Order', user: 'admin', timestamp: new Date().toISOString() }]);
      } else {
        setLogs(res.content || res || []);
      }
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: (row) => <code className="code-tag">{new Date(row.timestamp).toLocaleString()}</code> },
    { key: 'user', label: 'Actor', render: (row) => <strong style={{ fontWeight: 600 }}>{row.user}</strong> },
    { key: 'action', label: 'Event Action', render: (row) => (
      <span className={`badge ${row.action === 'CREATE' ? 'badge-green' : row.action === 'DELETE' ? 'badge-red' : 'badge-blue'}`}>
        {row.action}
      </span>
    )},
    { key: 'resource', label: 'Target Resource', render: (row) => <span className="badge badge-purple">{row.resource}</span> }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Trail & Logs</h1>
          <p>Immutable event log of actions taken within active tenant context.</p>
        </div>
      </div>

      <div className="glass-card card-p">
        <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No audit logs recorded yet." />
      </div>
    </div>
  );
}
