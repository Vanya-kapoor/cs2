import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 1;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 6000);
  }, [removeToast]);

  const iconFor = (type: ToastType) => {
    if (type === 'success') return <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />;
    if (type === 'info') return <Info size={16} className="text-blue-500 flex-shrink-0" />;
    return <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />;
  };

  const styleFor = (type: ToastType) => {
    if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (type === 'info') return 'border-blue-200 bg-blue-50 text-blue-800';
    return 'border-rose-200 bg-rose-50 text-rose-800';
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-lg text-xs font-medium leading-relaxed ${styleFor(t.type)}`}
            >
              {iconFor(t.type)}
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
