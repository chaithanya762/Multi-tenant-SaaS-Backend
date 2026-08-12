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
          { id: 101, email: 'user@acme.com', total: 29, status: 'Completed' }, 
          { id: 102, email: 'admin@globex.com', total: 99, status: 'Pending' }
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
    
    // Debounce load if typing in filter
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [apiFetch, page, emailFilter]);

  const columns = [
    { key: 'id', label: 'Order Reference', render: (row) => <code className="code-tag">#{row.id}</code> },
    { key: 'email', label: 'Customer Email', render: (row) => <span style={{ fontWeight: 500 }}>{row.email}</span> },
    { key: 'status', label: 'Order Status', render: (row) => (
      <span className={`badge ${row.status === 'Completed' || row.status === 'SHIPPED' || row.status === 'DELIVERED' ? 'badge-green' : row.status === 'PROCESSING' ? 'badge-blue' : 'badge-yellow'}`}>
        ● {row.status}
      </span>
    )},
    { key: 'total', label: 'Total Amount', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${Number(row.total || 0).toFixed(2)}</span> }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Order Management</h1>
          <p>Track, filter, and transition order fulfillment states.</p>
        </div>
      </div>

      <div className="glass-card card-p mb-6">
        <div className="form-group" style={{ maxWidth: '360px' }}>
          <label>Filter by Customer Email</label>
          <input 
            className="input" 
            placeholder="e.g. customer@acme.com..." 
            value={emailFilter} 
            onChange={e => {
              setEmailFilter(e.target.value);
              setPage(0);
            }} 
          />
        </div>
      </div>

      <div className="glass-card card-p mt-6">
        <DataTable columns={columns} data={orders} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
