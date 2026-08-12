import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function ToastContainer() {
  const { toasts } = useAuth();

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let toastClass = 'toast-info';
        if (toast.type === 'danger' || toast.type === 'error') toastClass = 'toast-error';
        if (toast.type === 'success') toastClass = 'toast-success';
        if (toast.type === 'warning') toastClass = 'toast-warning';
        
        return (
          <div key={toast.id} className={`toast ${toastClass}`}>
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
