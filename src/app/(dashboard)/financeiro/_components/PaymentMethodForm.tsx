"use client";

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { PaymentMethod } from './PaymentMethodColumns';

// --- Schemas --- 

const paymentMethodFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  requires_approval: z.boolean().default(false),
  processing_fee_percentage: z.number().min(0).max(100).optional(),
});

type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;

// --- Component Props --- 

interface PaymentMethodFormProps {
  onSuccess: () => void;
  initialData?: PaymentMethod; // For editing
}

// --- Component --- 

export function PaymentMethodForm({ onSuccess, initialData }: PaymentMethodFormProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!initialData;

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      is_active: true,
      requires_approval: false,
      processing_fee_percentage: 0,
    },
  });

  async function onSubmit(values: PaymentMethodFormValues) {
    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Atualizando forma de pagamento..." : "Criando forma de pagamento...");
    try {
      if (isEditing) {
        // Update existing payment method
        const { error } = await supabase
          .from('payment_methods')
          .update(values)
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success("Forma de pagamento atualizada com sucesso!", { id: toastId });
      } else {
        // Create new payment method
        const { error } = await supabase
          .from('payment_methods')
          .insert(values);

        if (error) throw error;
        toast.success("Forma de pagamento criada com sucesso!", { id: toastId });
      }
      
      onSuccess(); // Close dialog and refresh table
    } catch (error: any) {
      console.error("Failed to save payment method:", error);
      toast.error(`Erro ao salvar forma de pagamento: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Cartão de Crédito, Boleto, PIX..." 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição detalhada da forma de pagamento..."
                  {...field}
                  value={field.value || ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Processing Fee Percentage Field */}
        <FormField
          control={form.control}
          name="processing_fee_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taxa de Processamento (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  value={field.value === undefined ? "" : field.value}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Active Field */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Ativo</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Requires Approval Field */}
        <FormField
          control={form.control}
          name="requires_approval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Requer Aprovação Manual</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Forma de Pagamento')}
        </Button>
      </form>
    </Form>
  );
}
