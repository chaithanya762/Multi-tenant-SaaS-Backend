import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';

export function Orders() {
  const { apiFetch, isDemoMode } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [emailFilter, setEmailFilter] = useState('');
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const emailQuery = emailFilter ? `&email=${encodeURIComponent(emailFilter)}` : '';
      const res = await apiFetch(`/v1/orders?page=${page}&size=10${emailQuery}`);
      
      if (res._demo) {
        let demoOrders = [
          { id: 'ORD-9821', email: 'customer@acme.com', total: 149.00, status: 'Completed' }, 
          { id: 'ORD-9822', email: 'admin@globex.com', total: 299.00, status: 'Pending' },
          { id: 'ORD-9823', email: 'user@enterprise.com', total: 49.00, status: 'Completed' }
        ];
        if (emailFilter) demoOrders = demoOrders.filter(o => o.email.includes(emailFilter));
        setOrders(demoOrders);
        setTotalPages(1);
      } else {
        setOrders(res.content || []);
        setTotalPages(res.totalPages || 1);
      }
      setLoading(false);
    };
    
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [apiFetch, page, emailFilter]);

  const columns = [
    { key: 'id', label: 'Order Reference', render: (row) => <code className="code-tag">#{row.id}</code> },
    { key: 'email', label: 'Customer Email', render: (row) => <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>{row.email}</span> },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`badge ${row.status === 'Completed' || row.status === 'SHIPPED' || row.status === 'DELIVERED' ? 'badge-green' : row.status === 'PROCESSING' ? 'badge-blue' : 'badge-amber'}`}>
        {row.status}
      </span>
    )},
    { key: 'total', label: 'Total Amount', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${Number(row.total || 0).toFixed(2)}</span> }
  ];

  return (
    <div className="orders-page">
      <div className="page-header mb-4">
        <h1>Order Management</h1>
        <p>Track, filter, and transition tenant order fulfillment states.</p>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Gross Order Volume</div>
          <div className="stat-value">
            ${orders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed Orders</div>
          <div className="stat-value">
            {orders.filter(o => o.status === 'Completed' || o.status === 'DELIVERED').length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending Processing</div>
          <div className="stat-value">
            {orders.filter(o => o.status !== 'Completed' && o.status !== 'DELIVERED').length}
          </div>
        </div>
      </div>

      <div className="card card-p">
        <div className="mb-4">
          <input 
            className="input" 
            placeholder="Filter by customer email..." 
            value={emailFilter} 
            onChange={e => {
              setEmailFilter(e.target.value);
              setPage(0);
            }} 
            style={{ maxWidth: '360px' }}
          />
        </div>

        <DataTable columns={columns} data={orders} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
