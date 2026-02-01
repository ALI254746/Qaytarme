"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastContainer, Toast, ToastType } from "./Toast";

interface ToastContextType {
  showToast: (type: ToastType, message: string, options?: {
    duration?: number;
    action?: { label: string; onClick: () => void };
  }) => void;
  success: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => void;
  error: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => void;
  info: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => void;
  warning: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    type: ToastType,
    message: string,
    options?: {
      duration?: number;
      action?: { label: string; onClick: () => void };
    }
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      type,
      message,
      duration: options?.duration ?? 4000,
      action: options?.action,
    };

    setToasts((prev) => [...prev, newToast]);

    // Haptic feedback
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      const patterns = {
        success: [10],
        error: [20, 10, 20],
        info: [10],
        warning: [15, 10, 15],
      };
      window.navigator.vibrate(patterns[type]);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    showToast("success", message, options);
  }, [showToast]);

  const error = useCallback((message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    showToast("error", message, options);
  }, [showToast]);

  const info = useCallback((message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    showToast("info", message, options);
  }, [showToast]);

  const warning = useCallback((message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
    showToast("warning", message, options);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
