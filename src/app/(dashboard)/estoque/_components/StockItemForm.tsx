"use client";

import React, { useEffect, useState } from "react";
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
import { InputNumber } from "@/components/ui/input-number";
import { createRecord, updateRecord, useSupabaseData } from "@/lib/data-hooks";
import { toast } from "sonner";

// Define Zod schema para validação do formulário
const stockItemFormSchema = z.object({
  name: z.string().min(2, { message: "Nome do item deve ter pelo menos 2 caracteres." }),
  sku: z.string().optional(),
  group_id: z.string().optional(),
  location_id: z.string().optional(),
  unit_of_measurement_id: z.string().optional(),
  quantity: z.number().nonnegative({ message: "Quantidade não pode ser negativa." }).default(0),
  min_quantity: z.number().nonnegative({ message: "Quantidade mínima não pode ser negativa." }).optional(),
  is_active: z.boolean().optional().default(true),
});

type StockItemFormValues = z.infer<typeof stockItemFormSchema>;

interface StockItemFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function StockItemForm({ initialData, onSuccess }: StockItemFormProps) {
  // Buscar dados relacionados para os dropdowns
  const { data: groups } = useSupabaseData('stock_groups', 'name');
  const { data: locations } = useSupabaseData('locations', 'name');
  const { data: units } = useSupabaseData('unit_of_measurement', 'name');
  
  // Status possíveis
  const statuses = [
    { value: true, label: "Ativo" },
    { value: false, label: "Inativo" }
  ];

  // Preparar valores iniciais para o formulário
  const defaultValues = initialData ? {
    name: initialData.name || "",
    sku: initialData.sku || "",
    group_id: initialData.group_id || "",
    location_id: initialData.location_id || "",
    unit_of_measurement_id: initialData.unit_of_measurement_id || "",
    quantity: initialData.quantity || 0,
    min_quantity: initialData.min_quantity || 0,
    is_active: initialData.is_active !== false,
  } : {
    name: "",
    sku: "",
    group_id: "",
    location_id: "",
    unit_of_measurement_id: "",
    quantity: 0,
    min_quantity: 0,
    is_active: true,
  };

  const form = useForm<StockItemFormValues>({
    resolver: zodResolver(stockItemFormSchema),
    defaultValues,
  });

  // Função para enviar o formulário
  async function onSubmit(values: StockItemFormValues) {
    try {
      // Preparar dados para envio
      const itemData = {
        ...values,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (initialData?.id) {
        // Atualizar item existente
        result = await updateRecord('stock_items', initialData.id, itemData);
      } else {
        // Criar novo item
        result = await createRecord('stock_items', itemData);
      }
      
      if (result.success) {
        toast.success(initialData ? "Item atualizado com sucesso" : "Item criado com sucesso");
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar item de estoque");
      }
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      toast.error("Erro ao salvar item de estoque");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nome do Item *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do item de estoque" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SKU */}
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Código SKU" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Grupo */}
          <FormField
            control={form.control}
            name="group_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grupo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Localização */}
          <FormField
            control={form.control}
            name="location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localização</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a localização" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unidade de Medida */}
          <FormField
            control={form.control}
            name="unit_of_measurement_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade Medida</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Selecione</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantidade Atual */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade Atual *</FormLabel>
                <FormControl>
                  <InputNumber 
                    allowNegative={false} 
                    placeholder="0" 
                    value={field.value || 0}
                    onChange={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantidade Mínima */}
          <FormField
            control={form.control}
            name="min_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade Mínima</FormLabel>
                <FormControl>
                  <InputNumber 
                    allowNegative={false} 
                    placeholder="0" 
                    value={field.value || 0}
                    onChange={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           {/* Status */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "true")} 
                  value={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Define se o item está ativo no estoque.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? "Salvar Alterações" : "Criar Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
