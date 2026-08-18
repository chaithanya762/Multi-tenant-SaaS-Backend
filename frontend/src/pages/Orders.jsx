import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { CreateOrderModal } from '../components/modals/CreateOrderModal';

export function Orders() {
  const { apiFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [emailFilter, setEmailFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const loadOrders = async () => {
    setLoading(true);
    const emailQuery = emailFilter ? `&email=${encodeURIComponent(emailFilter)}` : '';
    try {
      const res = await apiFetch(`/v1/orders?page=${page}&size=10${emailQuery}`);
      setOrders(res.content || res || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadOrders, 300);
    return () => clearTimeout(timeout);
  }, [apiFetch, page, emailFilter]);

  const handleOrderCreated = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const columns = [
    { key: 'id', label: 'Order Reference', render: (row) => <code className="code-tag">#{row.id?.substring(0, 8) || row.id}</code> },
    { key: 'customerEmail', label: 'Customer Email', render: (row) => <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>{row.customerEmail || row.email}</span> },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`badge ${row.status === 'COMPLETED' || row.status === 'Completed' || row.status === 'DELIVERED' ? 'badge-green' : row.status === 'PROCESSING' ? 'badge-blue' : 'badge-amber'}`}>
        {row.status}
      </span>
    )},
    { key: 'totalAmount', label: 'Total Amount', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${Number(row.totalAmount || row.total || 0).toFixed(2)}</span> },
    { key: 'createdAt', label: 'Created At', render: (row) => <span className="text-secondary">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Just now'}</span> }
  ];

  const totalVolume = orders.reduce((acc, o) => acc + Number(o.totalAmount || o.total || 0), 0);
  const completedCount = orders.filter(o => o.status === 'COMPLETED' || o.status === 'Completed' || o.status === 'DELIVERED').length;
  const pendingCount = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'Completed' && o.status !== 'DELIVERED').length;

  return (
    <div className="orders-page">
      <div className="page-header mb-4 flex justify-between items-center">
        <div>
          <h1>Order Management</h1>
          <p>Track, filter, and transition tenant order fulfillment states.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create Order
        </button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Gross Order Volume</div>
          <div className="stat-value">
            ${totalVolume.toFixed(2)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed Orders</div>
          <div className="stat-value">
            {completedCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending Processing</div>
          <div className="stat-value">
            {pendingCount}
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

      <CreateOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onOrderCreated={handleOrderCreated} 
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
