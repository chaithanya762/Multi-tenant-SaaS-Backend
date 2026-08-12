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
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiFetch(`/v1/products?page=${page}&size=10`);
      if (res._demo) {
        setProducts([{ id: 1, name: 'SaaS Basic', price: 29, stockQuantity: 99, description: 'Basic tier' }, { id: 2, name: 'SaaS Pro', price: 99, stockQuantity: 45, description: 'Pro tier' }]);
        setTotalPages(1);
      } else {
        setProducts(res.content || []);
        setTotalPages(res.totalPages || 1);
      }
      setLoading(false);
    };
    load();
  }, [apiFetch, page]);

  const columns = [
    { key: 'id', label: 'SKU / ID', render: (row) => <code className="code-tag">{row.id}</code> },
    { key: 'name', label: 'Product Name', render: (row) => <strong style={{ fontWeight: 600 }}>{row.name}</strong> },
    { key: 'description', label: 'Description', render: (row) => <span className="text-secondary">{row.description || '—'}</span> },
    { key: 'price', label: 'Price', render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>${Number(row.price).toFixed(2)}</span> },
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
    <div>
      <div className="page-header">
        <div>
          <h1>Product Catalog</h1>
          <p>Manage software packages, computing items, and tenant inventory.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ New Product</button>
      </div>

      <div className="glass-card card-p">
        <DataTable columns={columns} data={products} loading={loading} />
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
