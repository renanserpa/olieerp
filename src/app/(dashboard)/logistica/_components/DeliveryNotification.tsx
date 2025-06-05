"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Bell, Send, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DeliveryNotificationProps {
  deliveryId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  orderRef: string;
  statusName: string;
}

export function DeliveryNotification({
  deliveryId,
  customerName,
  customerPhone,
  customerEmail,
  orderRef,
  statusName
}: DeliveryNotificationProps) {
  const supabase = createClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  
  // Gerar texto padrão da notificação baseado no status
  const generateDefaultMessage = () => {
    const greeting = `Olá ${customerName},`;
    
    let statusMessage = '';
    if (statusName.toLowerCase().includes('preparação')) {
      statusMessage = `Seu pedido #${orderRef} está em preparação. Em breve iniciaremos a entrega.`;
    } else if (statusName.toLowerCase().includes('rota')) {
      statusMessage = `Seu pedido #${orderRef} está a caminho! O entregador está se dirigindo ao seu endereço.`;
    } else if (statusName.toLowerCase().includes('entreg')) {
      statusMessage = `Seu pedido #${orderRef} foi entregue com sucesso! Agradecemos a preferência.`;
    } else if (statusName.toLowerCase().includes('cancel')) {
      statusMessage = `Seu pedido #${orderRef} foi cancelado. Entre em contato conosco para mais informações.`;
    } else {
      statusMessage = `Seu pedido #${orderRef} teve seu status atualizado para "${statusName}".`;
    }
    
    return `${greeting}\n\n${statusMessage}\n\nAtenciosamente,\nEquipe Olie`;
  };
  
  // Abrir o diálogo de notificação
  const handleOpenDialog = () => {
    setNotificationText(generateDefaultMessage());
    setIsDialogOpen(true);
  };
  
  // Enviar notificação
  const handleSendNotification = async () => {
    if (!notificationText.trim()) {
      toast.error("O texto da notificação não pode estar vazio.");
      return;
    }
    
    if (!sendSms && !sendEmail) {
      toast.error("Selecione pelo menos um método de envio (SMS ou Email).");
      return;
    }
    
    setIsSending(true);
    const toastId = toast.loading("Enviando notificação...");
    
    try {
      // Simular envio de notificação (em produção, isso chamaria uma API real)
      // Aguardar 1.5 segundos para simular o processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Registrar no histórico
      await addDeliveryHistory(
        supabase,
        deliveryId,
        'NOTIFICATION_SENT',
        {
          message: notificationText,
          channels: {
            sms: sendSms,
            email: sendEmail
          },
          recipient: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail
          }
        }
      );
      
      toast.success("Notificação enviada com sucesso!", { id: toastId });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao enviar notificação:", error);
      toast.error(`Falha ao enviar notificação: ${error.message}`, { id: toastId });
    } finally {
      setIsSending(false);
    }
  };
  
  // Adicionar ao histórico de entrega
  async function addDeliveryHistory(
    supabase: ReturnType<typeof createClient>,
    deliveryId: string,
    eventType: string,
    details: Record<string, any>
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      const { error } = await supabase
        .from("delivery_history")
        .insert({
          delivery_id: deliveryId,
          event_type: eventType,
          details: details,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`Failed to log delivery history event (${eventType}):`, error);
        throw new Error(`Não foi possível registrar o evento no histórico: ${error.message}`);
      }
    } catch (error: any) {
      console.error(`Error in addDeliveryHistory:`, error);
      throw error;
    }
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações ao Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Cliente: {customerName}</span>
              </div>
              
              {customerPhone ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Telefone: {customerPhone}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Telefone não cadastrado</span>
                </div>
              )}
              
              {customerEmail ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Email: {customerEmail}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Email não cadastrado</span>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleOpenDialog} 
              className="w-full"
              disabled={!customerPhone && !customerEmail}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Notificação
            </Button>
            
            {!customerPhone && !customerEmail && (
              <p className="text-xs text-muted-foreground text-center">
                Não é possível enviar notificações sem telefone ou email cadastrados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Enviar Notificação ao Cliente
            </DialogTitle>
            <DialogDescription>
              Envie uma notificação personalizada sobre o status da entrega
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notification-text">Mensagem</Label>
              <Textarea
                id="notification-text"
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder="Digite a mensagem para o cliente..."
                rows={6}
                disabled={isSending}
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será enviada pelos canais selecionados abaixo.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="send-sms">Enviar por SMS</Label>
                  <p className="text-xs text-muted-foreground">
                    {customerPhone ? `Para: ${customerPhone}` : "Telefone não cadastrado"}
                  </p>
                </div>
                <Switch
                  id="send-sms"
                  checked={sendSms}
                  onCheckedChange={setSendSms}
                  disabled={isSending || !customerPhone}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="send-email">Enviar por Email</Label>
                  <p className="text-xs text-muted-foreground">
                    {customerEmail ? `Para: ${customerEmail}` : "Email não cadastrado"}
                  </p>
                </div>
                <Switch
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                  disabled={isSending || !customerEmail}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSendNotification} 
              disabled={isSending || (!sendSms && !sendEmail)}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Notificação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
