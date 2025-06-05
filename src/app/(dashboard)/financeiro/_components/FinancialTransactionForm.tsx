"use client";

import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { InputNumber } from "@/components/ui/input-number";

// --- Schemas --- 

const financialTransactionSchema = z.object({
  date: z.date({
    required_error: "Data da transação é obrigatória",
  }),
  amount: z.number({
    required_error: "Valor é obrigatório",
  }).min(0.01, "Valor deve ser maior que zero"),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  category_id: z.string().uuid("Selecione uma categoria válida"),
  payment_method_id: z.string().uuid("Selecione uma forma de pagamento válida"),
  reference_type: z.enum(["order", "purchase", "other"], {
    required_error: "Selecione um tipo de referência",
  }),
  reference_id: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "completed", "cancelled"], {
    required_error: "Selecione um status",
  }).default("pending"),
});

type FinancialTransactionFormValues = z.infer<typeof financialTransactionSchema>;

// --- Types --- 

type FinancialCategory = {
  id: string;
  name: string;
  type: 'Receita' | 'Despesa';
};

type PaymentMethod = {
  id: string;
  name: string;
  is_active: boolean;
};

type Order = {
  id: string;
  order_ref: string;
  total_amount: number;
};

type Purchase = {
  id: string;
  purchase_ref: string;
  total_amount: number;
};

// --- Component Props --- 

interface FinancialTransactionFormProps {
  initialData?: Partial<FinancialTransactionFormValues> & { id: string };
  onSuccess: () => void;
  transactionType?: 'Receita' | 'Despesa'; // Optional to pre-filter categories
}

// --- Component --- 

export function FinancialTransactionForm({ 
  initialData, 
  onSuccess,
  transactionType 
}: FinancialTransactionFormProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [referenceType, setReferenceType] = useState<string>(initialData?.reference_type || "other");

  const form = useForm<FinancialTransactionFormValues>({
    resolver: zodResolver(financialTransactionSchema),
    defaultValues: {
      date: initialData?.date || new Date(),
      amount: initialData?.amount || undefined,
      description: initialData?.description || "",
      category_id: initialData?.category_id || undefined,
      payment_method_id: initialData?.payment_method_id || undefined,
      reference_type: initialData?.reference_type || "other",
      reference_id: initialData?.reference_id || undefined,
      notes: initialData?.notes || "",
      status: initialData?.status || "pending",
    },
  });

  // Watch reference type to show/hide reference selection
  const watchReferenceType = form.watch("reference_type");

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Categories (filtered by type if specified)
        let categoryQuery = supabase
          .from('financial_categories')
          .select('id, name, type');
        
        if (transactionType) {
          categoryQuery = categoryQuery.eq('type', transactionType);
        }
        
        const { data: categoryData, error: categoryError } = await categoryQuery.order('name');
        
        if (categoryError) throw new Error(`Erro ao buscar categorias: ${categoryError.message}`);
        setCategories(categoryData || []);

        // Fetch Payment Methods (only active ones)
        const { data: methodData, error: methodError } = await supabase
          .from('payment_methods')
          .select('id, name, is_active')
          .eq('is_active', true)
          .order('name');
        
        if (methodError) throw new Error(`Erro ao buscar formas de pagamento: ${methodError.message}`);
        setPaymentMethods(methodData || []);

        // Fetch Orders (for reference)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, order_ref, total_amount')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (orderError) throw new Error(`Erro ao buscar pedidos: ${orderError.message}`);
        setOrders(orderData || []);

        // Fetch Purchases (for reference)
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchase_orders')
          .select('id, purchase_ref, total_amount')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (purchaseError) throw new Error(`Erro ao buscar compras: ${purchaseError.message}`);
        setPurchases(purchaseData || []);

      } catch (error: any) {
        console.error("Error fetching form data:", error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase, transactionType]);

  // Handle reference type change
  useEffect(() => {
    // Reset reference_id when reference_type changes
    if (watchReferenceType !== referenceType) {
      form.setValue('reference_id', undefined);
      setReferenceType(watchReferenceType);
    }
  }, [watchReferenceType, referenceType, form]);

  // Handle form submission
  async function onSubmit(values: FinancialTransactionFormValues) {
    setIsLoading(true);
    const toastId = toast.loading(initialData?.id ? "Atualizando transação..." : "Criando transação...");
    
    try {
      // Prepare data for insert/update
      const data = {
        ...values,
        // Format date to ISO string
        date: values.date.toISOString(),
        // Only include reference_id if reference_type is not 'other'
        reference_id: values.reference_type !== 'other' ? values.reference_id : null,
      };

      if (initialData?.id) {
        // Update existing transaction
        const { error } = await supabase
          .from('financial_transactions')
          .update(data)
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success("Transação atualizada com sucesso!", { id: toastId });
      } else {
        // Create new transaction
        const { error } = await supabase
          .from('financial_transactions')
          .insert(data);

        if (error) throw error;
        toast.success("Transação criada com sucesso!", { id: toastId });
      }

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast.error(`Erro ao salvar transação: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Date Field */}
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
                      disabled={isLoading}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount Field */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor *</FormLabel>
              <FormControl>
                <InputNumber
                  placeholder="0,00"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                  min={0.01}
                  step={0.01}
                  prefix="R$"
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
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Descrição da transação"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Field */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading || categories.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Method Field */}
        <FormField
          control={form.control}
          name="payment_method_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading || paymentMethods.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma forma de pagamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
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

        {/* Reference Type Field */}
        <FormField
          control={form.control}
          name="reference_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Referência *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo de referência" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="order">Pedido</SelectItem>
                  <SelectItem value="purchase">Compra</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reference ID Field - Only show if reference_type is not 'other' */}
        {watchReferenceType !== 'other' && (
          <FormField
            control={form.control}
            name="reference_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {watchReferenceType === 'order' ? 'Pedido' : 'Compra'} *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Selecione um ${watchReferenceType === 'order' ? 'pedido' : 'compra'}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {watchReferenceType === 'order' ? (
                      orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_ref} - R$ {order.total_amount?.toFixed(2) || '0.00'}
                        </SelectItem>
                      ))
                    ) : (
                      purchases.map((purchase) => (
                        <SelectItem key={purchase.id} value={purchase.id}>
                          {purchase.purchase_ref} - R$ {purchase.total_amount?.toFixed(2) || '0.00'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Notes Field */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações adicionais (opcional)"
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Field */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? (initialData?.id ? "Salvando..." : "Criando...")
            : (initialData?.id ? "Salvar Alterações" : "Criar Transação")}
        </Button>
      </form>
    </Form>
  );
}
