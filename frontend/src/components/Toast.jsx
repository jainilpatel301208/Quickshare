import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast-item ${toast.type || 'info'}`}
          id={`toast-${toast.id}`}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} color="#ffffff" />}
          {toast.type === 'error' && <AlertCircle size={18} color="#ffffff" />}
          {toast.type !== 'success' && toast.type !== 'error' && <Info size={18} color="#ffffff" />}
          
          <span style={{ flex: 1 }}>{toast.message}</span>

          <button 
            className="icon-btn" 
            onClick={() => onDismiss(toast.id)} 
            style={{ width: 24, height: 24, padding: 0, color: '#ffffff' }}
            aria-label="Close notification"
          >
            <X size={14} color="#ffffff" />
          </button>
        </div>
      ))}
    </div>
  );
}
