import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

export function ErrorAlert({
  message,
  onDismiss,
  autoHide = true,
  duration = 6000,
}: ErrorAlertProps) {
  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed top-20 left-0 right-0 z-50 px-4 flex justify-center"
      >
        <div className="w-full max-w-md rounded-lg border border-red-500/50 bg-gradient-to-r from-red-950/80 to-red-900/80 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-100">{message}</p>
            </div>
            <button
              onClick={onDismiss}
              className="text-red-300 hover:text-red-200 transition"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
