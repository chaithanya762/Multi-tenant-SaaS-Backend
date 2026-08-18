import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function CreateOrderModal({ isOpen, onClose, onOrderCreated }) {
  const { apiFetch, addToast } = useAuth();
  const [form, setForm] = useState({ customerEmail: '', totalAmount: '', status: 'COMPLETED' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(form.totalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Total amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerEmail: form.customerEmail,
          totalAmount: amountNum,
          status: form.status
        })
      });

      onOrderCreated(res);
      addToast('Order created successfully', 'success');
      setForm({ customerEmail: '', totalAmount: '', status: 'COMPLETED' });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box card card-p">
        <div className="modal-header mb-4">
          <h2>Create New Order</h2>
        </div>
        <div className="modal-body mb-4">
          {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</div>}
          <form id="create-order-form" onSubmit={handleSubmit} className="form-group gap-3">
            <div className="form-group">
              <label>Customer Email</label>
              <input 
                required 
                type="email"
                className="input" 
                placeholder="customer@example.com"
                value={form.customerEmail} 
                onChange={e => setForm({...form, customerEmail: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-2 gap-3">
              <div className="form-group">
                <label>Total Amount ($)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  className="input" 
                  placeholder="299.99"
                  value={form.totalAmount} 
                  onChange={e => setForm({...form, totalAmount: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  className="input"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer flex justify-between">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button form="create-order-form" type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
