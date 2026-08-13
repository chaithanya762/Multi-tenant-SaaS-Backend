import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { ShoppingBag, Search, DollarSign, CheckCircle2, Clock } from 'lucide-react';

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
    { key: 'id', label: 'Order Reference', render: (row) => <code className="code-tag" style={{ color: 'var(--cyan)' }}>#{row.id}</code> },
    { key: 'email', label: 'Customer Email', render: (row) => <span className="text-bright font-medium">{row.email}</span> },
    { key: 'status', label: 'Order Status', render: (row) => (
      <span className={`badge ${row.status === 'Completed' || row.status === 'SHIPPED' || row.status === 'DELIVERED' ? 'badge-green' : row.status === 'PROCESSING' ? 'badge-cyan' : 'badge-yellow'}`}>
        ● {row.status}
      </span>
    )},
    { key: 'total', label: 'Total Amount', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--emerald)' }}>${Number(row.total || 0).toFixed(2)}</span> }
  ];

  return (
    <div className="orders-page">
      <div className="page-header mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-emerald flex items-center gap-1">
              <ShoppingBag size={12} /> Transactions & Fulfillment
            </span>
          </div>
          <h1>Order Management</h1>
          <p>Track, filter, and transition order fulfillment states in real-time.</p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card card-p flex items-center gap-3">
          <div className="stat-icon" style={{ background: 'var(--emerald-soft)', color: 'var(--emerald)' }}>
            <DollarSign size={18} />
          </div>
          <div>
            <div className="text-xs text-secondary">Total Gross Volume</div>
            <div className="text-xl font-bold text-bright">
              ${orders.reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="glass-card card-p flex items-center gap-3">
          <div className="stat-icon" style={{ background: 'var(--cyan-soft)', color: 'var(--cyan)' }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-xs text-secondary">Completed Orders</div>
            <div className="text-xl font-bold text-bright">
              {orders.filter(o => o.status === 'Completed' || o.status === 'DELIVERED').length}
            </div>
          </div>
        </div>

        <div className="glass-card card-p flex items-center gap-3">
          <div className="stat-icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
            <Clock size={18} />
          </div>
          <div>
            <div className="text-xs text-secondary">Pending Processing</div>
            <div className="text-xl font-bold text-bright">
              {orders.filter(o => o.status !== 'Completed' && o.status !== 'DELIVERED').length}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card card-p">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              placeholder="Filter by customer email..." 
              value={emailFilter} 
              onChange={e => {
                setEmailFilter(e.target.value);
                setPage(0);
              }} 
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <DataTable columns={columns} data={orders} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
