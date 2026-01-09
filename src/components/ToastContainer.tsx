import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useStore, useToasts } from '../store/useStore';
import type { ToastMessage } from '../types';
import { cn } from '../utils/helpers';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-success-500/10 border-success-500/30 text-success-300',
  error: 'bg-red-500/10 border-red-500/30 text-red-300',
  warning: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  info: 'bg-primary-500/10 border-primary-500/30 text-primary-300',
};

function Toast({ toast }: { toast: ToastMessage }) {
  const { removeToast } = useStore();
  const Icon = icons[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-lg shadow-lg',
        'min-w-[320px] max-w-[420px]',
        styles[toast.type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{toast.title}</p>
        <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
