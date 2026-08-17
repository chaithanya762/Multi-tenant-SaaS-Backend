import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { CreateProductModal } from '../components/modals/CreateProductModal';

export function Products() {
  const { apiFetch, isDemoMode } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch(`/v1/products?page=${page}&size=10`);
      if (res._demo) {
        setProducts([
          { id: 'prod-101', name: 'Cloud SaaS Basic', price: 29.00, stockQuantity: 99, description: 'Starter multi-tenant package' },
          { id: 'prod-102', name: 'Enterprise SaaS Pro', price: 99.00, stockQuantity: 45, description: 'High scale processing cluster' },
          { id: 'prod-103', name: 'RLS Security Addon', price: 149.00, stockQuantity: 12, description: 'Automated database policy enforcement' }
        ]);
        setTotalPages(1);
      } else {
        setProducts(res.content || []);
        setTotalPages(res.totalPages || 1);
      }
      setLoading(false);
    };
    load();
  }, [apiFetch, page]);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.id?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'id', label: 'SKU / ID', render: (row) => <code className="code-tag">{row.id}</code> },
    { key: 'name', label: 'Product Name', render: (row) => <strong style={{ color: 'var(--text-bright)' }}>{row.name}</strong> },
    { key: 'description', label: 'Description', render: (row) => <span className="text-secondary">{row.description || ''}</span> },
    { key: 'price', label: 'Price', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${Number(row.price).toFixed(2)}</span> },
    { key: 'stockQuantity', label: 'Stock Level', render: (row) => (
      <span className={`badge ${row.stockQuantity > 20 ? 'badge-green' : row.stockQuantity > 0 ? 'badge-amber' : 'badge-red'}`}>
        {row.stockQuantity} units
      </span>
    )}
  ];

  const handleProductCreated = (newProduct) => {
    setProducts([newProduct, ...products]);
  };

  return (
    <div className="products-page">
      <div className="page-header flex justify-between items-center mb-4 flex-wrap gap-4">
        <div>
          <h1>Product Catalog</h1>
          <p>Manage software packages, pricing models, and tenant product inventory.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Add Product
        </button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-label">Total SKUs</div>
          <div className="stat-value">{products.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Stock Units</div>
          <div className="stat-value">{products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Item Price</div>
          <div className="stat-value">
            ${products.length ? (products.reduce((acc, p) => acc + Number(p.price || 0), 0) / products.length).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      <div className="card card-p">
        <div className="mb-4">
          <input 
            type="text" 
            className="input" 
            placeholder="Search by product SKU or name..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ maxWidth: '360px' }}
          />
        </div>

        <DataTable columns={columns} data={filteredProducts} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <CreateProductModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onProductCreated={handleProductCreated} 
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
