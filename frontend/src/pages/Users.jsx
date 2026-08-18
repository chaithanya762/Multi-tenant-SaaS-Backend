import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CreateUserModal } from '../components/modals/CreateUserModal';

export function Users() {
  const { apiFetch, addToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/v1/users');
      setUsers(res.content || res || []);
    } catch (e) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [apiFetch]);

  const handleUserCreated = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
  };

  const handleDeactivateConfirm = async () => {
    if (!userToDeactivate) return;
    
    try {
      await apiFetch(`/v1/users/${userToDeactivate.id}/deactivate`, { method: 'POST' });
      setUsers(users.map(u => u.id === userToDeactivate.id ? { ...u, active: false } : u));
      addToast(`User ${userToDeactivate.username} deactivated`, 'success');
    } catch (err) {
      addToast('Failed to deactivate user: ' + err.message, 'error');
    } finally {
      setUserToDeactivate(null);
    }
  };

  const columns = [
    { key: 'username', label: 'Username', render: (row) => <strong style={{ color: 'var(--text-bright)' }}>{row.username}</strong> },
    { key: 'email', label: 'Email Address', render: (row) => <span className="text-secondary">{row.email}</span> },
    { key: 'role', label: 'Role', render: (row) => <span className="badge badge-blue">{row.role || 'ROLE_TENANT_USER'}</span> },
    { key: 'active', label: 'Status', render: (row) => (
      <span className={`badge ${row.active !== false ? 'badge-green' : 'badge-red'}`}>
        {row.active !== false ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', label: 'Actions', render: (row) => (
      row.active !== false && (
        <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => setUserToDeactivate(row)}>
          Deactivate
        </button>
      )
    )}
  ];

  return (
    <div className="users-page">
      <div className="page-header mb-4 flex justify-between items-center">
        <div>
          <h1>Team & Access Control</h1>
          <p>Manage tenant members, security roles, and active status.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Add Member
        </button>
      </div>

      <div className="card card-p">
        <DataTable columns={columns} data={users} loading={loading} />
      </div>

      <CreateUserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      <ConfirmDialog 
        isOpen={!!userToDeactivate}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${userToDeactivate?.username}? They will no longer be able to log in.`}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setUserToDeactivate(null)}
      />

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
