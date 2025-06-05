"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, FileText, Bell, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeliveryHistoryEvent {
  id: string;
  delivery_id: string;
  event_type: string;
  details: any;
  user_id: string | null;
  created_at: string;
  user_name?: string;
}

interface DeliveryHistoryViewProps {
  deliveryId: string;
}

export function DeliveryHistoryView({ deliveryId }: DeliveryHistoryViewProps) {
  const supabase = createClient();
  const [history, setHistory] = useState<DeliveryHistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("delivery_history")
          .select("*")
          .eq("delivery_id", deliveryId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Extrair IDs de usuários únicos
        const userIds = Array.from(new Set(
          data?.filter(item => item.user_id).map(item => item.user_id) || []
        )) as string[];
        
        // Buscar nomes de usuários se houver IDs
        if (userIds.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, name")
            .in("id", userIds);
            
          if (!userError && userData) {
            const userMap: Record<string, string> = {};
            userData.forEach(user => {
              userMap[user.id] = user.name;
            });
            setUserNames(userMap);
          }
        }
        
        setHistory(data || []);
      } catch (error: any) {
        console.error("Erro ao buscar histórico de entrega:", error);
        toast.error(`Erro ao carregar histórico: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (deliveryId) {
      fetchHistory();
    }
  }, [deliveryId, supabase]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'STATUS_CHANGE':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'NOTE_ADDED':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'NOTIFICATION_SENT':
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventTitle = (event: DeliveryHistoryEvent) => {
    switch (event.event_type) {
      case 'STATUS_CHANGE':
        return `Status alterado para "${event.details?.new_status_name || 'Desconhecido'}"`;
      case 'NOTE_ADDED':
        return "Observação adicionada";
      case 'NOTIFICATION_SENT':
        return "Notificação enviada ao cliente";
      default:
        return "Evento registrado";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum registro encontrado no histórico desta entrega.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Entrega</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {history.map((event) => (
            <div key={event.id} className="relative pl-8 pb-6 border-l-2 border-muted last:border-l-transparent">
              {/* Ícone do evento */}
              <div className="absolute -left-[13px] p-1 bg-background rounded-full border-2 border-muted">
                {getEventIcon(event.event_type)}
              </div>
              
              {/* Conteúdo do evento */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <h4 className="font-medium">{getEventTitle(event)}</h4>
                  <Badge variant="outline" className="shrink-0">
                    {formatDate(event.created_at)}
                  </Badge>
                </div>
                
                {/* Detalhes específicos do tipo de evento */}
                {event.event_type === 'STATUS_CHANGE' && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: '#888' }}
                        />
                        <span>De: {event.details?.old_status_name || 'Desconhecido'}</span>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: '#0ea5e9' }}
                        />
                        <span>Para: {event.details?.new_status_name || 'Desconhecido'}</span>
                      </div>
                    </div>
                    
                    {event.details?.notes && (
                      <div className="bg-background p-3 rounded-md text-sm mt-2">
                        <p className="font-medium mb-1">Observações:</p>
                        <p>{event.details.notes}</p>
                      </div>
                    )}
                    
                    {event.details?.notify_customer && (
                      <div className="flex items-center gap-2 text-sm text-purple-600 mt-2">
                        <Bell className="h-4 w-4" />
                        <span>Cliente notificado sobre esta mudança</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Informações do usuário */}
                {event.user_id && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <User className="h-3 w-3" />
                    <span>Por: {userNames[event.user_id] || 'Usuário desconhecido'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
