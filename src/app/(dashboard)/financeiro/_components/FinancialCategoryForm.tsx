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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { FinancialCategory } from './FinancialCategoryColumns';

// --- Schemas --- 

const financialCategoryFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  description: z.string().optional(),
  type: z.enum(['Receita', 'Despesa'], { 
    required_error: "Selecione o tipo da categoria." 
  }),
});

type FinancialCategoryFormValues = z.infer<typeof financialCategoryFormSchema>;

// --- Component Props --- 

interface FinancialCategoryFormProps {
  onSuccess: () => void;
  initialData?: FinancialCategory; // For editing
}

// --- Component --- 

export function FinancialCategoryForm({ onSuccess, initialData }: FinancialCategoryFormProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!initialData;

  const form = useForm<FinancialCategoryFormValues>({
    resolver: zodResolver(financialCategoryFormSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      type: "Despesa", // Default to expense
    },
  });

  async function onSubmit(values: FinancialCategoryFormValues) {
    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Atualizando categoria..." : "Criando categoria...");
    try {
      if (isEditing) {
        // Update existing category
        const { error } = await supabase
          .from('financial_categories') // TODO: Verify table name
          .update(values)
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success("Categoria atualizada com sucesso!", { id: toastId });
      } else {
        // Create new category
        const { error } = await supabase
          .from('financial_categories') // TODO: Verify table name
          .insert(values);

        if (error) throw error;
        toast.success("Categoria criada com sucesso!", { id: toastId });
      }
      
      onSuccess(); // Close dialog and refresh table
    } catch (error: any) {
      console.error("Failed to save financial category:", error);
      toast.error(`Erro ao salvar categoria: ${error.message}`, { id: toastId });
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
                  placeholder="Ex: Salários, Aluguel, Vendas..." 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type Field */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-4"
                  disabled={isSubmitting}
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Receita" />
                    </FormControl>
                    <FormLabel className="font-normal text-green-600">
                      Receita
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Despesa" />
                    </FormControl>
                    <FormLabel className="font-normal text-red-600">
                      Despesa
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
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
                  placeholder="Descrição detalhada da categoria..."
                  {...field}
                  value={field.value || ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? (isEditing ? 'Salvando...' : 'Criando...') : (isEditing ? 'Salvar Alterações' : 'Criar Categoria')}
        </Button>
      </form>
    </Form>
  );
}
