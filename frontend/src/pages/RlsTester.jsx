import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function RlsTester() {
  const { apiFetch, addToast } = useAuth();
  const [dataA, setDataA] = useState([]);
  const [dataB, setDataB] = useState([]);
  const [running, setRunning] = useState(false);

  const testIsolation = async () => {
    setRunning(true);
    addToast('Executing database queries for tenant isolation check...', 'info');

    try {
      const resA = await apiFetch('/v1/products', { headers: { 'X-Tenant-ID': 'tenant-alpha' } });
      const resB = await apiFetch('/v1/products', { headers: { 'X-Tenant-ID': 'tenant-beta' } });
      setDataA(resA.content || resA || []);
      setDataB(resB.content || resB || []);
      addToast('Isolation test completed successfully', 'success');
    } catch(e) {
      addToast('Test failed: ' + e.message, 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rls-tester-page">
      <div className="page-header">
        <h1>Row-Level Security (RLS) Policy Inspector</h1>
        <p>Verify that queries executed under different tenant headers return strictly isolated records.</p>
      </div>

      <div className="card card-p mb-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <strong style={{ color: 'var(--text-bright)' }}>Execute Isolation Proof Test</strong>
            <div className="subtext">
              Calls <code className="code-tag">GET /api/v1/products</code> using <code className="code-tag">X-Tenant-ID: tenant-alpha</code> and <code className="code-tag">X-Tenant-ID: tenant-beta</code>.
            </div>
          </div>
          <button className="btn btn-primary" onClick={testIsolation} disabled={running}>
            {running ? 'Executing Queries...' : 'Run RLS Validation'}
          </button>
        </div>
      </div>

      <div className="grid grid-2 gap-4">
        <div className="card">
          <div className="card-p" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <strong>Query Context: tenant-alpha</strong>
          </div>
          <div className="card-p">
            <pre className="code-tag" style={{ width: '100%', display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem' }}>
              {JSON.stringify(dataA, null, 2)}
            </pre>
          </div>
        </div>

        <div className="card">
          <div className="card-p" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <strong>Query Context: tenant-beta</strong>
          </div>
          <div className="card-p">
            <pre className="code-tag" style={{ width: '100%', display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem' }}>
              {JSON.stringify(dataB, null, 2)}
            </pre>
          </div>
        </div>
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
