import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';

export function Tenants() {
  const { apiFetch, addToast } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTenant, setNewTenant] = useState({ id: '', name: '' });

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/v1/tenants');
        setTenants(res.content || res || []);
      } catch (e) {
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, [apiFetch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/v1/tenants', { method: 'POST', body: JSON.stringify(newTenant) });
      setTenants([...tenants, res]);
      addToast('Tenant created successfully', 'success');
      setNewTenant({ id: '', name: '' });
    } catch (err) {
      addToast('Failed to create tenant: ' + err.message, 'error');
    }
  };

  const columns = [
    { key: 'id', label: 'Tenant ID', render: (row) => <code className="code-tag">{row.id}</code> },
    { key: 'name', label: 'Display Name', render: (row) => <strong style={{ color: 'var(--text-bright)' }}>{row.name}</strong> },
    { key: 'planId', label: 'Plan', render: (row) => <span className="badge badge-blue">{row.planId || 'plan-free'}</span> },
    { key: 'status', label: 'Status', render: (row) => {
      const statusClass = row.status === 'ACTIVE' ? 'badge-green' : row.status === 'SUSPENDED' ? 'badge-red' : 'badge-blue';
      return <span className={`badge ${statusClass}`}>{row.status || 'ACTIVE'}</span>;
    }}
  ];

  return (
    <div className="tenants-page">
      <div className="page-header mb-4">
        <h1>Tenants Management</h1>
        <p>Provision and inspect multi-tenant workspace organizations.</p>
      </div>

      <div className="card card-p mb-4">
        <h3 className="mb-2">Provision New Tenant</h3>
        <p className="subtext mb-4">Create an isolated database tenant boundary.</p>
        <form onSubmit={handleCreate} className="flex gap-3 items-center flex-wrap">
          <div className="form-group" style={{ flex: '1 1 180px' }}>
            <label>Tenant ID (Slug)</label>
            <input required className="input" placeholder="e.g. tenant-gamma" value={newTenant.id} onChange={e => setNewTenant({...newTenant, id: e.target.value})} />
          </div>
          <div className="form-group" style={{ flex: '2 1 240px' }}>
            <label>Display Name</label>
            <input required className="input" placeholder="Gamma Corporation" value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '22px' }}>Provision Tenant</button>
        </form>
      </div>

      <div className="card card-p">
        <h3 className="mb-4">Registered Tenants</h3>
        <DataTable columns={columns} data={tenants} loading={loading} />
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
