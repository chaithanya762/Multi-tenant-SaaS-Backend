import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function InviteUserModal({ isOpen, onClose }) {
  const { apiFetch, addToast } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/v1/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role })
      });
      // the backend returns the invite link or token
      setInviteLink(res.inviteUrl || `${window.location.origin}/accept-invite?token=${res.token}`);
      addToast('User invited successfully', 'success');
    } catch (err) {
      addToast('Failed to invite user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    addToast('Invite link copied to clipboard', 'info');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Invite Team Member</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        
        {!inviteLink ? (
          <form onSubmit={handleInvite}>
            <div className="modal-body">
              <div className="form-group mb-3">
                <label>Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="input" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              <div className="form-group mb-4">
                <label>Role</label>
                <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline mr-2" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-body text-center py-6">
            <h3 className="mb-2">Invitation Created!</h3>
            <p className="text-secondary mb-4">Share this link with the user to let them join your workspace.</p>
            <div className="flex gap-2">
              <input type="text" readOnly className="input" value={inviteLink} />
              <button className="btn btn-primary" onClick={copyToClipboard}>Copy</button>
            </div>
            <div className="mt-6">
              <button className="btn btn-outline w-full" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
