import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../api/apiClient';

export function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/users/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username, password })
      });
      
      if (!res.ok) {
        throw new Error('Failed to accept invite. Token may be invalid or expired.');
      }
      
      navigate('/?inviteAccepted=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-screen">
        <div className="auth-card text-center">
          <h2>Invalid Link</h2>
          <p className="text-secondary mt-2">No invitation token provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="text-center mb-6">
          <div className="auth-logo mx-auto mb-2">N</div>
          <h2>Accept Invitation</h2>
          <p className="text-secondary">Complete your registration to join the workspace.</p>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label>Choose a Username</label>
            <input 
              required 
              type="text" 
              className="input" 
              placeholder="e.g. johndoe" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div className="form-group mb-6">
            <label>Set Password</label>
            <input 
              required 
              type="password" 
              className="input" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Processing...' : 'Join Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
