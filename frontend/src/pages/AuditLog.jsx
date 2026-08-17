import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';

export function AuditLog() {
  const { apiFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/v1/audit-log');
        setLogs(res.content || res || []);
      } catch (e) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [apiFetch]);

  const columns = [
    { key: 'action', label: 'Action Event', render: (row) => <strong style={{ color: 'var(--text-bright)' }}>{row.action}</strong> },
    { key: 'resource', label: 'Target Resource', render: (row) => <code className="code-tag">{row.resource || row.entityName || 'System'}</code> },
    { key: 'user', label: 'Performed By', render: (row) => <span className="text-secondary">{row.user || row.performedBy || 'admin'}</span> },
    { key: 'timestamp', label: 'Timestamp', render: (row) => <span className="text-muted font-mono">{row.timestamp ? new Date(row.timestamp).toLocaleString() : 'Just now'}</span> }
  ];

  return (
    <div className="audit-log-page">
      <div className="page-header mb-4">
        <h1>System Audit Logs</h1>
        <p>Immutable security trail of administrative and data mutations.</p>
      </div>

      <div className="card card-p">
        <DataTable columns={columns} data={logs} loading={loading} />
      </div>

      <footer className="app-footer">
        <div>NexusSaaS Enterprise v1.0.0</div>
        <div className="flex gap-4">
          <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
          <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
          <a href="#" onClick={e => e.preventDefault()}>API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
