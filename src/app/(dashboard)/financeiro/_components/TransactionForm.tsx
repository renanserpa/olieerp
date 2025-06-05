"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
// TODO: Import API functions for fetching categories, statuses, payment methods, transaction types
// TODO: Import API function for creating/updating transactions

// Define Zod schema based on the 'financial_transactions' table
const transactionFormSchema = z.object({
  date: z.date({ required_error: "A data do lançamento é obrigatória." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser positivo." }), // Use coerce for string input
  type_id: z.string().uuid({ message: "Selecione um tipo válido (Receita/Despesa)." }),
  category_id: z.string().uuid({ message: "Selecione uma categoria válida." }).optional(),
  status_id: z.string().uuid({ message: "Selecione um status válido." }),
  payment_method_id: z.string().uuid({ message: "Selecione uma forma de pagamento válida." }).optional(),
  description: z.string().max(500, { message: "Descrição muito longa." }).optional(),
  // reference_id and reference_type might be set automatically or selected based on context
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  initialData?: TransactionFormValues; // For editing
  onSuccess?: () => void; // Callback after successful submission
}

export function TransactionForm({ initialData, onSuccess }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: initialData || {
      date: new Date(),
      // Other fields will be selected/entered
    },
  });

  // TODO: Fetch related data for dropdowns
  const types = [{ id: "uuid-type-income", name: "Receita", is_income: true }, { id: "uuid-type-expense", name: "Despesa", is_income: false }]; // Placeholder
  const categories = [{ id: "uuid-cat-1", name: "Vendas" }, { id: "uuid-cat-2", name: "Matéria Prima" }]; // Placeholder
  const statuses = [{ id: "uuid-fin-status-1", name: "Pendente" }, { id: "uuid-fin-status-2", name: "Conciliado" }]; // Placeholder
  const methods = [{ id: "uuid-method-1", name: "PIX" }, { id: "uuid-method-2", name: "Boleto" }]; // Placeholder

  async function onSubmit(values: TransactionFormValues) {
    console.log("Submitting transaction form:", values);
    // Adjust amount sign based on type before sending to API if needed
    const selectedType = types.find(t => t.id === values.type_id);
    const finalAmount = selectedType?.is_income ? values.amount : -values.amount;
    const payload = { ...values, amount: finalAmount };
    console.log("Payload to send:", payload);

    // TODO: Implement API call to create or update transaction
    // try {
    //   if (initialData) { /* Update */ } else { /* Create */ }
    //   onSuccess?.();
    // } catch (error) { /* Handle error */ }
    alert("Submissão de lançamento (placeholder) - Ver console");
    onSuccess?.(); // Simulate success
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$) *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type (Income/Expense) */}
          <FormField
            control={form.control}
            name="type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione Receita ou Despesa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status inicial" />
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

          {/* Payment Method */}
          <FormField
            control={form.control}
            name="payment_method_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {methods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Adicione uma descrição ou observação (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* TODO: Add fields for reference_id/type if needed */}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {initialData ? "Salvar Alterações" : "Criar Lançamento"}
        </Button>
      </form>
    </Form>
  );
}

