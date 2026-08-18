import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function CreateUserModal({ isOpen, onClose, onUserCreated }) {
  const { apiFetch, addToast, tenantId } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'ROLE_TENANT_USER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/v1/auth/register', {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          tenantId: tenantId,
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role
        })
      });

      addToast('User created successfully', 'success');
      onUserCreated({
        id: Math.random().toString(),
        username: form.username,
        email: form.email,
        role: form.role,
        active: true
      });
      setForm({ username: '', email: '', password: '', role: 'ROLE_TENANT_USER' });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box card card-p">
        <div className="modal-header mb-4">
          <h2>Add Team Member</h2>
        </div>
        <div className="modal-body mb-4">
          {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}
          <form id="create-user-form" onSubmit={handleSubmit} className="form-group gap-3">
            <div className="form-group">
              <label>Username</label>
              <input 
                required 
                className="input" 
                placeholder="e.g. dev-john"
                value={form.username} 
                onChange={e => setForm({...form, username: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                required 
                type="email"
                className="input" 
                placeholder="john@tenant.com"
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
              />
            </div>

            <div className="grid grid-2 gap-3">
              <div className="form-group">
                <label>Password</label>
                <input 
                  required 
                  type="password" 
                  className="input" 
                  placeholder="••••••••"
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  className="input"
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                >
                  <option value="ROLE_TENANT_USER">Team Member</option>
                  <option value="ROLE_TENANT_ADMIN">Tenant Admin</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer flex justify-between">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button form="create-user-form" type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
