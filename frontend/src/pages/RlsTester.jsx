import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function RlsTester() {
  const { apiFetch, isDemoMode, addToast } = useAuth();
  const [dataA, setDataA] = useState([]);
  const [dataB, setDataB] = useState([]);
  const [running, setRunning] = useState(false);

  const testIsolation = async () => {
    setRunning(true);
    addToast('Fetching data as Tenant A and Tenant B...', 'info');
    
    if (isDemoMode) {
      setDataA([{ id: 1, name: 'Alpha Product 1' }]);
      setDataB([{ id: 2, name: 'Beta Product 1' }]);
      addToast('Isolation test complete (Demo)', 'success');
      setRunning(false);
      return;
    }

    try {
      const resA = await apiFetch('/v1/products', { headers: { 'X-Tenant-ID': 'tenant-alpha' } });
      const resB = await apiFetch('/v1/products', { headers: { 'X-Tenant-ID': 'tenant-beta' } });
      setDataA(resA.content || resA || []);
      setDataB(resB.content || resB || []);
      addToast('Isolation test complete', 'success');
    } catch(e) {
      addToast('Test failed: ' + e.message, 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>RLS Security Inspector</h1>
          <p>Verify PostgreSQL Row-Level Security (RLS) policies and tenant isolation boundaries.</p>
        </div>
      </div>

      <div className="glass-card card-p mb-6">
        <h3>Row-Level Security (RLS) Isolation Tester</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', marginTop: '8px' }}>
          Prove that database queries are strictly isolated by tenant context. 
          This will fetch products using two different tenant headers.
        </p>
        <button className="btn btn-primary" onClick={testIsolation} disabled={running}>
          {running ? 'Running...' : 'Run Isolation Test'}
        </button>
      </div>

      <div className="rls-grid">
        <div className="rls-panel rls-alpha glass-card">
          <div className="rls-panel-header">
            tenant-alpha context
          </div>
          <div className="card-p">
            <pre style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', overflowX: 'auto', margin: 0 }}>
              {JSON.stringify(dataA, null, 2)}
            </pre>
          </div>
        </div>
        <div className="rls-panel rls-beta glass-card">
          <div className="rls-panel-header">
            tenant-beta context
          </div>
          <div className="card-p">
            <pre style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', overflowX: 'auto', margin: 0 }}>
              {JSON.stringify(dataB, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
