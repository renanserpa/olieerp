"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Definição do tipo de notificação
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

// Interface do contexto de notificações
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

// Criação do contexto com valor padrão para evitar erros quando usado fora do provider
const defaultValue: NotificationContextType = {
  notifications: [],
  addNotification: () => console.warn("useNotifications usado fora do NotificationProvider - usando fallback"),
  removeNotification: () => console.warn("useNotifications usado fora do NotificationProvider - usando fallback")
};

// Criação do contexto com valor padrão
const NotificationContext = createContext<NotificationContextType>(defaultValue);

// Hook personalizado para usar o contexto com fallback
export const useNotifications = () => {
  // Tenta usar o contexto, mas se não estiver disponível, usa o valor padrão
  const context = useContext(NotificationContext);
  return context; // Sempre retorna um valor válido, mesmo fora do provider
};

// Props do provider
interface NotificationProviderProps {
  children: ReactNode;
}

// Componente Provider
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Adicionar uma nova notificação
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications((prev) => [...prev, newNotification]);
    
    // Remover automaticamente após a duração especificada (ou 5 segundos por padrão)
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  // Remover uma notificação pelo ID
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
