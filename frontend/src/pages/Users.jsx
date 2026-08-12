import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function Users() {
  const { apiFetch, addToast, isDemoMode } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch('/v1/users');
      if (res._demo) {
        setUsers([{ id: 1, username: 'admin', email: 'admin@acme.com', active: true }]);
      } else {
        setUsers(res.content || res || []);
      }
      setLoading(false);
    };
    load();
  }, [apiFetch]);

  const handleDeactivateConfirm = async () => {
    if (!userToDeactivate) return;
    
    try {
      const res = await apiFetch(`/v1/users/${userToDeactivate.id}/deactivate`, { method: 'POST' });
      if (res._demo) {
        setUsers(users.map(u => u.id === userToDeactivate.id ? { ...u, active: false } : u));
      } else {
        setUsers(users.map(u => u.id === userToDeactivate.id ? { ...u, active: false } : u));
      }
      addToast(`User ${userToDeactivate.username} deactivated`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUserToDeactivate(null);
    }
  };

  const columns = [
    { key: 'username', label: 'Username', render: (row) => <strong style={{ fontWeight: 600 }}>{row.username}</strong> },
    { key: 'email', label: 'Email Address', render: (row) => <span className="text-secondary">{row.email}</span> },
    { key: 'role', label: 'Role', render: (row) => <span className="badge badge-purple">{row.role || 'TENANT_ADMIN'}</span> },
    { key: 'active', label: 'Status', render: (row) => (
      <span className={`badge ${row.active ? 'badge-green' : 'badge-red'}`}>
        ● {row.active ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      row.active && (
        <button className="btn btn-danger btn-xs" onClick={() => setUserToDeactivate(row)}>
          Deactivate
        </button>
      )
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Team & Access Control</h1>
          <p>Manage tenant members, security roles, and active status.</p>
        </div>
      </div>

      <div className="glass-card card-p">
        <DataTable columns={columns} data={users} loading={loading} />
      </div>

      <ConfirmDialog 
        isOpen={!!userToDeactivate}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${userToDeactivate?.username}? They will no longer be able to log in.`}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setUserToDeactivate(null)}
      />
    </div>
  );
}
