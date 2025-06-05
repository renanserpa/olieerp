"use client";

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Delivery } from "./DeliveryColumns";
import { toast } from "sonner";
import { Loader2, Truck, CheckCircle } from 'lucide-react';

// --- Schemas --- 

const updateDeliveryStatusSchema = z.object({
  status_id: z.string().uuid({ message: "Selecione um novo status válido." }),
  notes: z.string().optional(),
  notify_customer: z.boolean().default(false),
});

type UpdateDeliveryStatusFormValues = z.infer<typeof updateDeliveryStatusSchema>;

// --- Types --- 

interface Status {
  id: string;
  name: string;
  color?: string;
  is_final?: boolean;
}

interface UpdateDeliveryStatusDialogProps {
  delivery: Delivery;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// --- Helper Functions --- 

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
      toast.warning(`Não foi possível registrar o evento no histórico de entrega: ${error.message}`);
    }
  } catch (error: any) {
    console.error(`Error in addDeliveryHistory:`, error);
  }
}

// --- Component --- 

export function UpdateDeliveryStatusDialog({ 
  delivery, 
  open, 
  onOpenChange, 
  onSuccess 
}: UpdateDeliveryStatusDialogProps) {
  const supabase = createClient();
  const [statuses, setStatuses] = React.useState<Status[]>([]);
  const [loadingStatuses, setLoadingStatuses] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(null);

  const form = useForm<UpdateDeliveryStatusFormValues>({
    resolver: zodResolver(updateDeliveryStatusSchema),
    defaultValues: {
      status_id: delivery.status_id,
      notes: "",
      notify_customer: false,
    },
  });

  // Fetch statuses applicable to deliveries
  React.useEffect(() => {
    const fetchStatuses = async () => {
      setLoadingStatuses(true);
      try {
        const { data, error } = await supabase
          .from("global_statuses")
          .select("id, name, color, is_final")
          .order("name");
        if (error) throw error;
        setStatuses(data || []);
      } catch (error: any) {
        console.error("Error fetching delivery statuses:", error);
        toast.error(`Erro ao buscar status de entrega: ${error.message}`);
      } finally {
        setLoadingStatuses(false);
      }
    };

    if (open) {
      fetchStatuses();
      form.reset({ 
        status_id: delivery.status_id, 
        notes: "",
        notify_customer: false
      });
    }
  }, [open, supabase, delivery.status_id, form]);

  // Update selected status when status_id changes
  React.useEffect(() => {
    const statusId = form.watch("status_id");
    const status = statuses.find(s => s.id === statusId);
    setSelectedStatus(status || null);
  }, [form.watch("status_id"), statuses]);

  async function onSubmit(values: UpdateDeliveryStatusFormValues) {
    if (values.status_id === delivery.status_id) {
        toast.info("O status selecionado é o mesmo status atual.");
        onOpenChange(false);
        return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading("Atualizando status da entrega...");
    try {
      const oldStatus = statuses.find(s => s.id === delivery.status_id);
      const newStatus = statuses.find(s => s.id === values.status_id);

      // 1. Update the delivery status
      const { error: updateError } = await supabase
        .from("deliveries")
        .update({ 
          status_id: values.status_id,
          updated_at: new Date().toISOString()
        })
        .eq("id", delivery.id);

      if (updateError) throw updateError;

      // 2. Add history entry
      await addDeliveryHistory(supabase, delivery.id, 'STATUS_CHANGE', {
        old_status_id: delivery.status_id,
        old_status_name: oldStatus?.name || 'Desconhecido',
        new_status_id: values.status_id,
        new_status_name: newStatus?.name || 'Desconhecido',
        notes: values.notes,
        notify_customer: values.notify_customer,
      });

      // 3. If notify_customer is true, send notification (placeholder)
      if (values.notify_customer) {
        // In a real implementation, this would call an API to send SMS/email
        console.log(`Notification would be sent to customer for delivery ${delivery.id}`);
        toast.success("Notificação enviada ao cliente sobre a atualização de status.");
      }

      toast.success("Status da entrega atualizado com sucesso!", { id: toastId });
      onSuccess();
    } catch (error: any) {
      console.error("Failed to update delivery status:", error);
      toast.error(`Erro ao atualizar status: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Atualizar Status da Entrega
          </DialogTitle>
          <DialogDescription>
            Selecione o novo status para a entrega do pedido {delivery.order_ref}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Current Status Display */}
            <div className="bg-muted p-3 rounded-md mb-4">
              <p className="text-sm font-medium mb-1">Status Atual:</p>
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: statuses.find(s => s.id === delivery.status_id)?.color || '#888' }}
                />
                <span>{delivery.status_name || "Desconhecido"}</span>
              </div>
            </div>
            
            {/* Status Selection */}
            <FormField
              control={form.control}
              name="status_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Status *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value} 
                    disabled={loadingStatuses || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingStatuses ? "Carregando..." : "Selecione o status"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: status.color || '#888' }}
                            />
                            {status.name}
                            {status.is_final && (
                              <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Cliente ausente, endereço incorreto..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notify Customer Checkbox */}
            <FormField
              control={form.control}
              name="notify_customer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Notificar cliente</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificação ao cliente sobre a mudança de status
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={loadingStatuses || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Salvando..." : "Salvar Status"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
