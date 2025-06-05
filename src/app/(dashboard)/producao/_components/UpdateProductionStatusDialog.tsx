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
import { createSupabaseClient } from "@/lib/supabase/client";
import { ProductionOrder } from "./columns"; // Assuming type is exported from columns
import { toast } from "sonner";

// Define Zod schema for status update
const updateStatusSchema = z.object({
  status_id: z.string().uuid({ message: "Selecione um novo status válido." }),
  notes: z.string().optional(),
});

type UpdateStatusFormValues = z.infer<typeof updateStatusSchema>;

interface Status {
  id: string;
  name: string;
}

interface UpdateProductionStatusDialogProps {
  productionOrder: ProductionOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback on successful update
}

export function UpdateProductionStatusDialog({ 
  productionOrder, 
  open, 
  onOpenChange, 
  onSuccess 
}: UpdateProductionStatusDialogProps) {
  const supabase = createSupabaseClient();
  const [statuses, setStatuses] = React.useState<Status[]>([]);
  const [loadingStatuses, setLoadingStatuses] = React.useState(true);

  const form = useForm<UpdateStatusFormValues>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status_id: productionOrder.status_id,
      notes: "",
    },
  });

  // Fetch statuses applicable to production orders
  React.useEffect(() => {
    const fetchStatuses = async () => {
      setLoadingStatuses(true);
      try {
        const { data, error } = await supabase
          .from("global_statuses") // Or a specific production_statuses table if exists
          .select("id, name")
          // .contains("applicable_to", ["production_orders"]) // Example filter
          .order("name");
        if (error) throw error;
        setStatuses(data || []);
      } catch (error) {
        console.error("Error fetching production statuses:", error);
        toast.error("Erro ao carregar status de produção");
      } finally {
        setLoadingStatuses(false);
      }
    };

    if (open) { // Fetch only when dialog is open
      fetchStatuses();
      form.reset({ status_id: productionOrder.status_id, notes: "" }); // Reset form with current status
    }
  }, [open, supabase, productionOrder.status_id, form]);

  async function onSubmit(values: UpdateStatusFormValues) {
    console.log("Updating status for OP:", productionOrder.id, "to:", values.status_id);
    const toastId = toast.loading("Atualizando status...");
    try {
      // 1. Update the production order status
      const { error: updateError } = await supabase
        .from("production_orders")
        .update({ status_id: values.status_id })
        .eq("id", productionOrder.id);

      if (updateError) throw updateError;

      // 2. Create a history entry for this status change
      const { error: historyError } = await supabase
        .from("production_status_history")
        .insert({
          production_order_id: productionOrder.id,
          status_id: values.status_id,
          notes: values.notes || null,
          // created_by: user.id, // If you have user context
        });

      if (historyError) throw historyError;

      toast.success("Status atualizado com sucesso!", { id: toastId });
      onSuccess(); // Trigger data refresh and close dialog
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(`Erro ao atualizar status: ${error instanceof Error ? error.message : String(error)}`, { id: toastId });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Status da Ordem de Produção</DialogTitle>
          <DialogDescription>
            Selecione o novo status para a OP #{productionOrder.id.substring(0, 8)}...
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="status_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Status *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value} 
                    disabled={loadingStatuses || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingStatuses ? "Carregando..." : "Selecione o status"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre esta mudança de status (opcional)" 
                      {...field} 
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={loadingStatuses || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Status"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
