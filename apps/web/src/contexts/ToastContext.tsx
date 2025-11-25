/**
 * Toast Context - Sistema de notificaciones global
 * Siguiendo MEJORES_PRACTICAS.md - Context Pattern
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration || 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-hide después de la duración especificada
      if (newToast.duration) {
        setTimeout(() => {
          hideToast(id);
        }, newToast.duration);
      }
    },
    [hideToast]
  );

  const success = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'success', title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'error', title, message, duration: 7000 });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'warning', title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'info', title, message });
    },
    [showToast]
  );

  const value: ToastContextValue = {
    toasts,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Este hook se exporta junto con el provider por diseño para simplificar el consumo del contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Componente de contenedor de toasts
const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </div>
  );
};

// Componente individual de toast
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({
  toast,
  onClose,
}) => {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const styles = {
    success: 'bg-success-50 border-success-500 text-success-700',
    error: 'bg-error-50 border-error-500 text-error-700',
    warning: 'bg-warning-50 border-warning-500 text-warning-700',
    info: 'bg-info-50 border-info-500 text-info-700',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg animate-fade-in max-w-md ${styles[toast.type]}`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{toast.title}</p>
        {toast.message && <p className="text-sm mt-1 opacity-90">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Cerrar notificación"
      >
        <X size={18} />
      </button>
    </div>
  );
};
