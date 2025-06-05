// src/components/ui/toast-provider.tsx
"use client";

// src/components/ui/toast-provider.tsx
import React, { createContext, useState, ReactNode } from "react";

type Toast = { title: string; description?: string; variant?: string };
type ToastContextType = {
  toast: (toast: Toast) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(toast: Toast) {
    setToasts((prev) => [...prev, toast]);
    // Aqui você pode implementar lógica para mostrar/hide toasts
    // Por exemplo, remover toast após alguns segundos
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Renderize os toasts, se desejar */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t, i) => (
          <div key={i} className={`px-4 py-2 rounded shadow ${t.variant === 'destructive' ? 'bg-red-600' : 'bg-gray-800'} text-white`}>
            <strong>{t.title}</strong>
            {t.description && <div>{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
