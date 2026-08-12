import React from 'react';

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button 
        className="page-btn" 
        onClick={() => onPageChange(page - 1)} 
        disabled={page === 0}
      >
        &lt;
      </button>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0 8px' }}>
        Page {page + 1} of {totalPages}
      </span>
      <button 
        className="page-btn" 
        onClick={() => onPageChange(page + 1)} 
        disabled={page >= totalPages - 1}
      >
        &gt;
      </button>
    </div>
  );
}
