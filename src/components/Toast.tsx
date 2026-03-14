"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-100 flex flex-col gap-2"
          aria-live="assertive"
          aria-atomic="true"
          role="log"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="animate-slide-up rounded-lg border border-border bg-(--color-surface) px-4 py-3 shadow-lg text-sm flex items-center gap-2"
              role="alert"
              aria-live="assertive"
            >
              <span className="sr-only">
                {toast.type === "error" ? "Error:" : toast.type === "success" ? "Success:" : "Info:"}
              </span>
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 p-1 rounded text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext>
  );
}
