import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type'], duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// Toast Container Component
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

// Individual Toast Component
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const colors = {
        success: 'var(--accent-green)',
        error: 'var(--accent-red)',
        warning: 'var(--accent-amber)',
        info: 'var(--accent-cyan)'
    };

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-sm shadow-lg animate-slide-up cursor-pointer hover:opacity-90 transition-opacity"
            style={{
                backgroundColor: 'var(--bg-elevated)',
                border: `1px solid ${colors[toast.type]}`,
                borderLeft: `3px solid ${colors[toast.type]}`
            }}
            onClick={() => onRemove(toast.id)}
        >
            <i
                className={`fa-solid ${icons[toast.type]} text-sm`}
                style={{ color: colors[toast.type] }}
            ></i>
            <span
                className="text-xs font-mono uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
            >
                {toast.message}
            </span>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
                className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
            >
                <i className="fa-solid fa-times text-xs"></i>
            </button>
        </div>
    );
};

export default ToastProvider;
