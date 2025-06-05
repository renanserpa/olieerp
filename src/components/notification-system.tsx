"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bell, X, Check, AlertCircle, Info, ShoppingCart, Truck, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/auth-context";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos
export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  entity_type: string;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  sendNotification: (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    entityType: string,
    entityId?: string
  ) => Promise<void>;
}

// Contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar notificações ao carregar ou quando o usuário mudar
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      
      // Configurar subscription para notificações em tempo real
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Mostrar toast para notificação em tempo real
            toast(
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(newNotification.type)}
                </div>
                <div>
                  <p className="font-medium">{newNotification.title}</p>
                  <p className="text-sm text-muted-foreground">{newNotification.message}</p>
                </div>
              </div>
            );
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  // Buscar notificações
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar como lida
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error: any) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  // Excluir notificação
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação');
    }
  };

  // Atualizar notificações
  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // Enviar notificação
  const sendNotification = async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    entityType: string,
    entityId?: string
  ) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title,
          message,
          type,
          entity_type: entityType,
          entity_id: entityId || null,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Não precisamos atualizar o estado aqui porque a subscription vai capturar
      return data;
    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  };

  // Valor do contexto
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    sendNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook para usar o contexto
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
}

// Componente de ícone de notificação
function getNotificationIcon(type: string) {
  switch (type) {
    case 'success':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

// Componente de ícone de entidade
function getEntityIcon(entityType: string) {
  switch (entityType.toLowerCase()) {
    case 'order':
    case 'orders':
      return <ShoppingCart className="h-4 w-4" />;
    case 'delivery':
    case 'deliveries':
      return <Truck className="h-4 w-4" />;
    case 'financial':
    case 'finance':
      return <DollarSign className="h-4 w-4" />;
    case 'product':
    case 'products':
      return <Package className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

// Componente de notificação individual
export function NotificationItem({ notification, onRead, onDelete }: { 
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`p-4 border-b last:border-b-0 ${notification.read ? 'bg-background' : 'bg-muted/30'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getEntityIcon(notification.entity_type)}
          </div>
          <div>
            <p className="font-medium">{notification.title}</p>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
              <Badge variant="outline" className="text-xs">
                {notification.entity_type}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!notification.read && (
            <Button variant="ghost" size="icon" onClick={onRead} className="h-6 w-6">
              <Check className="h-3 w-3" />
              <span className="sr-only">Marcar como lida</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-6 w-6">
            <X className="h-3 w-3" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente de menu de notificações
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notificações</h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={refreshNotifications}
            >
              Atualizar
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => markAsRead(notification.id)}
                onDelete={() => deleteNotification(notification.id)}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Componente para enviar notificações de sistema
export function SystemNotifications() {
  return null; // Este componente é apenas para carregar o provider
}
