import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function CreateProductModal({ isOpen, onClose, onProductCreated }) {
  const { apiFetch, addToast, isDemoMode } = useAuth();
  const [form, setForm] = useState({ name: '', description: '', price: '', stockQuantity: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const priceNum = parseFloat(form.price);
    const stockNum = parseInt(form.stockQuantity, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock quantity must be 0 or greater');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: priceNum,
          stockQuantity: stockNum
        })
      });

      if (res._demo) {
        onProductCreated({
          id: Date.now(),
          name: form.name,
          description: form.description,
          price: priceNum,
          stockQuantity: stockNum
        });
      } else {
        onProductCreated(res);
      }
      
      addToast('Product created successfully', 'success');
      setForm({ name: '', description: '', price: '', stockQuantity: '' });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Create New Product</h2>
        </div>
        <div className="modal-body">
          {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</div>}
          <form id="create-product-form" onSubmit={handleSubmit} className="form-group">
            <label>Product Name</label>
            <input 
              required 
              className="input" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
            />
            
            <label>Description</label>
            <textarea 
              className="input" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
            
            <div className="grid-2">
              <div className="form-group">
                <label>Price</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  className="input" 
                  value={form.price} 
                  onChange={e => setForm({...form, price: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input 
                  required 
                  type="number" 
                  className="input" 
                  value={form.stockQuantity} 
                  onChange={e => setForm({...form, stockQuantity: e.target.value})} 
                />
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button form="create-product-form" type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
