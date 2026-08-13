import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';

export function Tenants() {
  const { apiFetch, addToast, isDemoMode } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTenant, setNewTenant] = useState({ id: '', name: '' });

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/tenants');
      setTenants(res._demo ? [{ id: 't1', name: 'Acme Corp' }, { id: 't2', name: 'Globex' }] : res.content || res || []);
      setLoading(false);
    };
    fetchTenants();
  }, [apiFetch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await apiFetch('/v1/tenants', { method: 'POST', body: JSON.stringify(newTenant) });
    if (res._demo) {
      setTenants([...tenants, { ...newTenant }]);
    } else {
      setTenants([...tenants, res]);
    }
    addToast('Tenant created', 'success');
    setNewTenant({ id: '', name: '' });
  };

  const columns = [
    { key: 'id', label: 'Tenant ID', render: (row) => <code className="code-tag">{row.id}</code> },
    { key: 'name', label: 'Display Name', render: (row) => <strong style={{ fontWeight: 600 }}>{row.name}</strong> },
    { key: 'plan', label: 'Plan', render: (row) => <span className="badge badge-purple">{row.plan || 'ENTERPRISE'}</span> },
    { key: 'status', label: 'Status', render: () => <span className="badge badge-green">● Active</span> }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tenants Management</h1>
          <p>Provision and inspect multi-tenant workspace organizations.</p>
        </div>
      </div>

      <div className="glass-card card-p mb-6">
        <h3 className="mb-2">Provision New Tenant</h3>
        <p className="subtext mb-4">Create an isolated database tenant boundary.</p>
        <form onSubmit={handleCreate} className="flex-gap-12" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1 1 180px' }}>
            <label>Tenant ID (Slug)</label>
            <input required className="input" placeholder="e.g. acme-corp" value={newTenant.id} onChange={e => setNewTenant({...newTenant, id: e.target.value})} />
          </div>
          <div className="form-group" style={{ flex: '2 1 240px' }}>
            <label>Display Name</label>
            <input required className="input" placeholder="Acme Corporation" value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary">Provision Tenant</button>
        </form>
      </div>

      <div className="glass-card card-p mt-6">
        <h3 className="mb-4">Registered Tenants</h3>
        <DataTable columns={columns} data={tenants} loading={loading} />
      </div>
    </div>
  );
}
