import React from 'react';

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>{title}</h2>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
