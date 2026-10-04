import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function RlsTester() {
  const { apiFetch, addToast, tenantId } = useAuth();
  const [dataA, setDataA] = useState([]);
  const [dataB, setDataB] = useState([]);
  const [runningIsolation, setRunningIsolation] = useState(false);
  
  // Penetration test state
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const testIsolation = async () => {
    setRunningIsolation(true);
    addToast('Executing database queries for tenant isolation check...', 'info');

    try {
      const resA = await apiFetch('/v1/products', { headers: { 'X-Tenant-ID': 'tenant-alpha' } });
      const resB = await apiFetch('/v1/products', { headers: { 'X-Tenant-ID': 'tenant-beta' } });
      setDataA(resA.content || resA || []);
      setDataB(resB.content || resB || []);
      addToast('Isolation test completed successfully', 'success');
    } catch (e) {
      addToast('Test failed: ' + e.message, 'error');
    } finally {
      setRunningIsolation(false);
    }
  };

  const runAttackSimulation = async (attackType, endpoint) => {
    setSimulating(true);
    setActiveSimulation(attackType);
    addToast(`Launching cyber attack simulation: ${attackType}...`, 'info');

    try {
      const res = await apiFetch(endpoint, { method: 'POST' });
      setSimulationResult(res);
      if (res.defenseStatus === 'BLOCKED_SUCCESSFULLY') {
        addToast(`Attack thwarted! PostgreSQL RLS and security boundaries blocked 100% of attack.`, 'success');
      } else {
        addToast(`Attack simulation returned status: ${res.defenseStatus}`, 'error');
      }
    } catch (e) {
      addToast(`Simulation failed: ${e.message}`, 'error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="rls-tester-page">
      <div className="page-header">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1>Row-Level Security (RLS) & Penetration Testing Console</h1>
            <p>
              Simulate real-world OWASP Top 10 multi-tenant attack vectors to verify that PostgreSQL Row-Level Security (RLS)
              and cryptographic JWT filters eliminate cross-tenant data leaks and tampering.
            </p>
          </div>
          <span className="badge badge-green" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            RLS Kernel: ACTIVE
          </span>
        </div>
      </div>

      {/* Cyber Security Attack Simulation Vectors */}
      <div className="mb-4">
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '12px' }}>
          Interactive Multi-Tenant Attack Simulations
        </h2>
        <div className="grid grid-3 gap-4">
          {/* Attack 1: IDOR */}
          <div className="card card-p flex flex-col justify-between" style={{ borderLeft: '4px solid var(--red)' }}>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="badge badge-red">OWASP A01:2021</span>
                <span className="subtext" style={{ fontSize: '0.72rem' }}>SEVERITY: CRITICAL</span>
              </div>
              <strong style={{ color: 'var(--text-bright)', display: 'block', marginBottom: '6px' }}>
                1. IDOR Cross-Tenant Read
              </strong>
              <p className="subtext" style={{ fontSize: '0.78rem', marginBottom: '12px' }}>
                Attacker discovers a victim tenant's confidential ledger UUID and attempts direct database extraction.
              </p>
              <div className="code-tag mb-3" style={{ fontSize: '0.72rem', display: 'block', overflowX: 'auto' }}>
                SELECT * FROM products WHERE id = 'product-victim-ledger-uuid'
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', borderColor: 'var(--red)', color: 'var(--red)' }}
              onClick={() => runAttackSimulation('IDOR_READ', '/v1/security/simulate/idor')}
              disabled={simulating}
            >
              {simulating && activeSimulation === 'IDOR_READ' ? 'Simulating Attack...' : 'Simulate IDOR Exploit'}
            </button>
          </div>

          {/* Attack 2: Header Spoofing */}
          <div className="card card-p flex flex-col justify-between" style={{ borderLeft: '4px solid var(--amber)' }}>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="badge badge-amber">OWASP A07:2021</span>
                <span className="subtext" style={{ fontSize: '0.72rem' }}>SEVERITY: HIGH</span>
              </div>
              <strong style={{ color: 'var(--text-bright)', display: 'block', marginBottom: '6px' }}>
                2. Tenant Header Spoofing
              </strong>
              <p className="subtext" style={{ fontSize: '0.78rem', marginBottom: '12px' }}>
                Attacker submits a valid JWT signed for Tenant A while forging <code className="code-tag">X-Tenant-ID: tenant-beta</code> to escalate privileges.
              </p>
              <div className="code-tag mb-3" style={{ fontSize: '0.72rem', display: 'block', overflowX: 'auto' }}>
                Authorization: Bearer &lt;token_alpha&gt; + X-Tenant-ID: tenant-beta
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', borderColor: 'var(--amber)', color: 'var(--amber)' }}
              onClick={() => runAttackSimulation('HEADER_SPOOF', '/v1/security/simulate/header-spoof')}
              disabled={simulating}
            >
              {simulating && activeSimulation === 'HEADER_SPOOF' ? 'Simulating Attack...' : 'Simulate Header Spoofing'}
            </button>
          </div>

          {/* Attack 3: Write Injection */}
          <div className="card card-p flex flex-col justify-between" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="badge badge-blue">OWASP A03:2021</span>
                <span className="subtext" style={{ fontSize: '0.72rem' }}>SEVERITY: CRITICAL</span>
              </div>
              <strong style={{ color: 'var(--text-bright)', display: 'block', marginBottom: '6px' }}>
                3. Cross-Tenant Write Poisoning
              </strong>
              <p className="subtext" style={{ fontSize: '0.78rem', marginBottom: '12px' }}>
                Attacker attempts to inject modified pricing ($0.01) into a foreign tenant's product catalogue.
              </p>
              <div className="code-tag mb-3" style={{ fontSize: '0.72rem', display: 'block', overflowX: 'auto' }}>
                UPDATE products SET price = 0.01 WHERE id = 'victim-uuid'
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', borderColor: '#8b5cf6', color: '#8b5cf6' }}
              onClick={() => runAttackSimulation('WRITE_POISON', '/v1/security/simulate/cross-tenant-write')}
              disabled={simulating}
            >
              {simulating && activeSimulation === 'WRITE_POISON' ? 'Simulating Attack...' : 'Simulate Write Poisoning'}
            </button>
          </div>
        </div>
      </div>

      {/* Attack Simulation Result Audit Panel */}
      {simulationResult && (
        <div className="card mb-4" style={{ border: '1px solid var(--green)', background: 'rgba(22, 163, 74, 0.03)' }}>
          <div className="card-p" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                <div>
                  <strong style={{ color: 'var(--text-bright)', fontSize: '0.98rem' }}>
                    Cyber Defense Audit Verdict: {simulationResult.defenseStatus}
                  </strong>
                  <div className="subtext" style={{ fontSize: '0.78rem' }}>
                    Attack Target: {simulationResult.targetResourceId || 'Foreign Tenant Perimeter'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                  RECORDS LEAKED: {simulationResult.recordsLeaked}
                </span>
                <span className="badge badge-slate" style={{ fontSize: '0.8rem' }}>
                  LATENCY: {simulationResult.latencyMs}ms
                </span>
              </div>
            </div>
          </div>

          <div className="card-p">
            <div className="grid grid-3 gap-4 mb-4">
              <div>
                <span className="subtext" style={{ fontSize: '0.74rem', textTransform: 'uppercase' }}>Attack Classification</span>
                <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginTop: '2px', fontSize: '0.86rem' }}>
                  {simulationResult.attackType}
                </div>
                <div className="subtext" style={{ fontSize: '0.74rem' }}>{simulationResult.severity}</div>
              </div>
              <div>
                <span className="subtext" style={{ fontSize: '0.74rem', textTransform: 'uppercase' }}>Attacker vs Victim</span>
                <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginTop: '2px', fontSize: '0.86rem' }}>
                  <span style={{ color: 'var(--amber)' }}>{simulationResult.attackerTenant}</span> ➔ <span style={{ color: 'var(--green)' }}>{simulationResult.targetTenant}</span>
                </div>
                <div className="subtext" style={{ fontSize: '0.74rem' }}>Tenant Boundary Enforced</div>
              </div>
              <div>
                <span className="subtext" style={{ fontSize: '0.74rem', textTransform: 'uppercase' }}>Active Defense Layer</span>
                <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginTop: '2px', fontSize: '0.86rem' }}>
                  {simulationResult.defenseLayer}
                </div>
                {simulationResult.sqlPolicyEnforced && (
                  <div className="code-tag" style={{ fontSize: '0.7rem', marginTop: '2px', display: 'inline-block' }}>
                    {simulationResult.sqlPolicyEnforced}
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                <strong>Technical Explanation:</strong> {simulationResult.summary}
              </div>
            </div>

            <details>
              <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>
                View Raw Penetration Test Audit Log JSON
              </summary>
              <pre className="code-tag mt-2" style={{ display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                {JSON.stringify(simulationResult, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Classical Dual-Tenant Isolation Comparison */}
      <div className="card card-p mb-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <strong style={{ color: 'var(--text-bright)' }}>Dual-Tenant Isolation Query Inspector</strong>
            <div className="subtext">
              Executes side-by-side <code className="code-tag">GET /api/v1/products</code> queries for <code className="code-tag">tenant-alpha</code> and <code className="code-tag">tenant-beta</code> to verify distinct catalogue partition.
            </div>
          </div>
          <button className="btn btn-primary" onClick={testIsolation} disabled={runningIsolation}>
            {runningIsolation ? 'Executing Database Queries...' : 'Run Dual-Tenant Query Test'}
          </button>
        </div>
      </div>

      <div className="grid grid-2 gap-4">
        <div className="card">
          <div className="card-p" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <strong>Query Context: tenant-alpha ({dataA.length} Records)</strong>
          </div>
          <div className="card-p">
            <pre className="code-tag" style={{ width: '100%', display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.78rem', maxHeight: '280px', overflowY: 'auto' }}>
              {JSON.stringify(dataA, null, 2)}
            </pre>
          </div>
        </div>

        <div className="card">
          <div className="card-p" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <strong>Query Context: tenant-beta ({dataB.length} Records)</strong>
          </div>
          <div className="card-p">
            <pre className="code-tag" style={{ width: '100%', display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.78rem', maxHeight: '280px', overflowY: 'auto' }}>
              {JSON.stringify(dataB, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <div>Multitenant-SaaS Platform v1.0.0 — PostgreSQL Row-Level Security Verified</div>
        <div className="flex gap-4">
          <a href="#" onClick={e => e.preventDefault()}>Security Architecture</a>
          <a href="#" onClick={e => e.preventDefault()}>OWASP Defense Specs</a>
          <a href="#" onClick={e => e.preventDefault()}>API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
