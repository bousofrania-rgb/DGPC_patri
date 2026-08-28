import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'info',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colorMap = {
    danger: {
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    },
    info: {
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    },
  };

  const colors = colorMap[type];

  return (
    <AnimatePresence>
      <div id="confirm-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-100 transition-all dark:bg-slate-900 dark:ring-slate-800"
        >
          {/* Close button */}
          <button
            id="close-confirm-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start space-x-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.iconBg}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              id="confirm-modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:outline-none dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {cancelText}
            </button>
            <button
              id="confirm-modal-action-btn"
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none ${colors.btnBg}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
