import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { CreateProductModal } from '../components/modals/CreateProductModal';
import { Package, Plus, Search, Layers, DollarSign, Archive } from 'lucide-react';

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
    { key: 'id', label: 'SKU / ID', render: (row) => <code className="code-tag" style={{ color: 'var(--cyan)' }}>{row.id}</code> },
    { key: 'name', label: 'Product Name', render: (row) => <strong className="text-bright">{row.name}</strong> },
    { key: 'description', label: 'Description', render: (row) => <span className="text-secondary">{row.description || '—'}</span> },
    { key: 'price', label: 'Price', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--emerald)' }}>${Number(row.price).toFixed(2)}</span> },
    { key: 'stockQuantity', label: 'In Stock', render: (row) => (
      <span className={`badge ${row.stockQuantity > 20 ? 'badge-green' : row.stockQuantity > 0 ? 'badge-yellow' : 'badge-red'}`}>
        {row.stockQuantity} units
      </span>
    )}
  ];

  const handleProductCreated = (newProduct) => {
    setProducts([newProduct, ...products]);
  };

  return (
    <div className="products-page">
      <div className="page-header flex-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-cyan flex items-center gap-1">
              <Package size={12} /> Inventory & Items
            </span>
          </div>
          <h1>Product Catalog</h1>
          <p>Manage software packages, computing items, and tenant inventory.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> New Product
        </button>
      </div>

      {/* Quick Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card card-p flex items-center gap-3">
          <div className="stat-icon" style={{ background: 'var(--cyan-soft)', color: 'var(--cyan)' }}>
            <Layers size={18} />
          </div>
          <div>
            <div className="text-xs text-secondary">Total Products</div>
            <div className="text-xl font-bold text-bright">{products.length}</div>
          </div>
        </div>

        <div className="glass-card card-p flex items-center gap-3">
          <div className="stat-icon" style={{ background: 'var(--emerald-soft)', color: 'var(--emerald)' }}>
            <Archive size={18} />
          </div>
          <div>
            <div className="text-xs text-secondary font-medium">Total Stock Units</div>
            <div className="text-xl font-bold text-bright">{products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0)}</div>
          </div>
        </div>

        <div className="glass-card card-p flex items-center gap-3">
          <div className="stat-icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
            <DollarSign size={18} />
          </div>
          <div>
            <div className="text-xs text-secondary font-medium">Avg Product Price</div>
            <div className="text-xl font-bold text-bright">
              ${products.length ? (products.reduce((acc, p) => acc + Number(p.price || 0), 0) / products.length).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card card-p">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-3 text-secondary" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input pl-9" 
              placeholder="Search products by SKU or name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredProducts} loading={loading} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <CreateProductModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onProductCreated={handleProductCreated} 
      />
    </div>
  );
}
