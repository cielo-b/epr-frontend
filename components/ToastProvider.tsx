"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-white border-green-100",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          accent: "bg-green-500",
          text: "text-gray-900"
        };
      case "error":
        return {
          bg: "bg-white border-red-100",
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          accent: "bg-red-500",
          text: "text-gray-900"
        };
      case "warning":
        return {
          bg: "bg-white border-amber-100",
          icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
          accent: "bg-amber-500",
          text: "text-gray-900"
        };
      case "info":
        return {
          bg: "bg-white border-blue-100",
          icon: <Info className="h-5 w-5 text-blue-500" />,
          accent: "bg-blue-500",
          text: "text-gray-900"
        };
      default:
        return {
          bg: "bg-white border-gray-100",
          icon: <Info className="h-5 w-5 text-gray-500" />,
          accent: "bg-gray-500",
          text: "text-gray-900"
        };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto flex items-center gap-4 min-w-[320px] max-w-md p-4 rounded-2xl border shadow-2xl transition-all duration-500 animate-in slide-in-from-right-10 fade-in
                ${styles.bg}
              `}
            >
              <div className="flex-shrink-0">
                {styles.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${styles.text}`}>{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${styles.accent}`} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
