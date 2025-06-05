"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { InputNumber } from "@/components/ui/input-number";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the schema for request items
const requestItemSchema = z.object({
  stock_item_id: z.string().uuid({ message: "Selecione um item válido." }),
  quantity: z.number().positive({ message: "Quantidade deve ser positiva." }),
  notes: z.string().optional(),
});

// Define the schema for the form using Zod
const purchaseRequestSchema = z.object({
  requester_id: z.string().uuid().optional(), // Auto-filled from current user
  department_id: z.string().uuid({ message: "Selecione um departamento." }),
  justification: z.string().min(10, { message: "Justificativa deve ter pelo menos 10 caracteres." }),
  items: z.array(requestItemSchema).min(1, { message: "Adicione pelo menos um item." }),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>;
type RequestItemValues = z.infer<typeof requestItemSchema>;

// Define types for dropdown data
type Department = { id: string; name: string };
type StockItem = { id: string; name: string; sku?: string | null; current_stock?: number };

interface PurchaseRequestFormProps {
  initialData?: Partial<PurchaseRequestFormValues> & { id: string };
  onSuccess?: () => void;
}

export function PurchaseRequestForm({ initialData, onSuccess }: PurchaseRequestFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const form = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      department_id: initialData?.department_id || "",
      justification: initialData?.justification || "",
      items: initialData?.items || [],
      status: initialData?.status || "pending",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingData(true);
      try {
        // Fetch Departments
        const { data: deptData, error: deptError } = await supabase
          .from("departments")
          .select("id, name")
          .order("name");
        if (deptError) throw new Error(`Erro ao buscar departamentos: ${deptError.message}`);
        setDepartments(deptData || []);

        // Fetch Stock Items (for selection in request items)
        const { data: itemsData, error: itemsError } = await supabase
          .from("stock_items")
          .select("id, name, sku, current_stock")
          .order("name");
        if (itemsError) throw new Error(`Erro ao buscar itens de estoque: ${itemsError.message}`);
        setStockItems(itemsData || []);

        // If editing, fetch full request details including items
        if (initialData?.id) {
          const { data: requestData, error: requestError } = await supabase
            .from("purchase_request_items")
            .select("stock_item_id, quantity, notes")
            .eq("purchase_request_id", initialData.id);
          
          if (requestError) throw new Error(`Erro ao buscar itens da solicitação: ${requestError.message}`);
          
          if (requestData && requestData.length > 0) {
            form.setValue("items", requestData);
          }
        }

      } catch (error: any) {
        toast.error(error.message);
        console.error("Fetch data error:", error);
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchData();
  }, [supabase, initialData, form]);

  // Add a new empty item to the form
  const addItem = () => {
    append({ stock_item_id: "", quantity: 1, notes: "" });
  };

  async function onSubmit(values: PurchaseRequestFormValues) {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const requestData = {
        requester_id: user.id,
        department_id: values.department_id,
        justification: values.justification,
        status: values.status,
      };

      let requestId = initialData?.id;
      let operation;

      if (initialData?.id) {
        // Update existing request
        const { error } = await supabase
          .from("purchase_requests")
          .update(requestData)
          .eq("id", initialData.id);
        
        if (error) throw error;
        operation = "atualizada";
      } else {
        // Create new request
        const { data, error } = await supabase
          .from("purchase_requests")
          .insert(requestData)
          .select("id")
          .single();
        
        if (error) throw error;
        if (!data) throw new Error("Falha ao criar solicitação de compra.");
        
        requestId = data.id;
        operation = "criada";
      }

      // Handle items - delete existing and insert new ones
      if (initialData?.id) {
        const { error: deleteError } = await supabase
          .from("purchase_request_items")
          .delete()
          .eq("purchase_request_id", initialData.id);
        
        if (deleteError) throw deleteError;
      }

      // Insert items
      const itemsToInsert = values.items.map(item => ({
        purchase_request_id: requestId,
        stock_item_id: item.stock_item_id,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { error: insertError } = await supabase
        .from("purchase_request_items")
        .insert(itemsToInsert);
      
      if (insertError) throw insertError;

      toast.success(`Solicitação de compra ${operation} com sucesso!`);
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao salvar solicitação de compra:", error);
      toast.error("Erro ao salvar solicitação de compra: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isFetchingData && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando dados...
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações da Solicitação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value} 
                    disabled={isLoading || isFetchingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
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
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo da solicitação..."
                      {...field}
                      rows={4}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Itens da Solicitação</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum item adicionado. Clique em "Adicionar Item" para começar.
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.stock_item_id`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Item *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value} 
                            disabled={isLoading || isFetchingData}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stockItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} {item.sku ? `(${item.sku})` : ''}
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
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>Qtd. *</FormLabel>
                          <FormControl>
                            <InputNumber
                              min={1}
                              {...field}
                              onChange={(value) => field.onChange(value)}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Observações sobre este item"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isLoading}
                      className="mb-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {form.formState.errors.items?.root && (
              <p className="text-sm text-red-500 mt-2">
                {form.formState.errors.items.root.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isLoading || isFetchingData}>
          {isLoading ? "Salvando..." : initialData?.id ? "Salvar Alterações" : "Criar Solicitação"}
        </Button>
      </form>
    </Form>
  );
}
