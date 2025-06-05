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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputNumber } from "@/components/ui/input-number";
import { createRecord, updateRecord, useSupabaseData } from "@/lib/data-hooks";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

// Define Zod schema para validação do formulário de insumo
const insumoFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres." }),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  group_id: z.string().optional().nullable(),
  location_id: z.string().optional().nullable(),
  unit_of_measure: z.string().default("un"),
  quantity: z.number().default(0),
  min_quantity: z.number().default(0),
  cost_price: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
});

type InsumoFormValues = z.infer<typeof insumoFormSchema>;

interface InsumoFormProps {
  initialData?: any; // Para edição
  onSuccess?: () => void; // Callback após submissão bem-sucedida
}

export function InsumoForm({ initialData, onSuccess }: InsumoFormProps) {
  // Buscar dados relacionados para os dropdowns
  const { data: groups } = useSupabaseData('stock_groups', 'name');
  const { data: locations } = useSupabaseData('locations', 'name');
  const { data: units } = useSupabaseData('unit_of_measurement', 'name');
  
  const form = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
      group_id: initialData?.group_id || "",
      location_id: initialData?.location_id || "",
      unit_of_measure: initialData?.unit_of_measure || "un",
      quantity: initialData?.quantity || 0,
      min_quantity: initialData?.min_quantity || 0,
      cost_price: initialData?.cost_price || null,
      is_active: initialData?.is_active !== false,
    },
  });

  async function onSubmit(values: InsumoFormValues) {
    try {
      // Preparar dados para envio
      const insumoData = {
        ...values,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (initialData?.id) {
        // Atualizar insumo existente
        result = await updateRecord('stock_items', initialData.id, insumoData);
      } else {
        // Criar novo insumo
        result = await createRecord('stock_items', insumoData);
      }
      
      if (result.success) {
        toast.success(initialData ? "Insumo atualizado com sucesso" : "Insumo criado com sucesso");
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar insumo");
      }
    } catch (error) {
      console.error("Erro ao salvar insumo:", error);
      toast.error("Erro ao salvar insumo");
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
              <FormItem>
                <FormLabel>Nome do Insumo *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do insumo" {...field} value={field.value || ""} />
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
                  <Input placeholder="Código de referência" {...field} value={field.value || ""} />
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
                      <SelectValue placeholder="Selecione um grupo" />
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
                      <SelectValue placeholder="Selecione uma localização" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
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
            name="unit_of_measure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de Medida</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "un"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.length > 0 ? (
                      units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.symbol}>
                          {unit.name} ({unit.symbol})
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="un">Unidade (un)</SelectItem>
                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                        <SelectItem value="m">Metro (m)</SelectItem>
                        <SelectItem value="L">Litro (L)</SelectItem>
                        <SelectItem value="cx">Caixa (cx)</SelectItem>
                        <SelectItem value="pct">Pacote (pct)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantidade */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade em Estoque</FormLabel>
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
                <FormDescription>
                  Quantidade mínima para alertas de estoque baixo
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preço de Custo */}
          <FormField
            control={form.control}
            name="cost_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Custo (R$)</FormLabel>
                <FormControl>
                  <InputNumber 
                    allowNegative={false} 
                    placeholder="0.00" 
                    value={field.value || 0}
                    onChange={(value) => field.onChange(value)}
                    decimalPlaces={2}
                    formatAsCurrency={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição do insumo" 
                  {...field} 
                  value={field.value || ""} 
                  className="min-h-[100px]"
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status do Insumo</FormLabel>
                <FormDescription>
                  Insumo está ativo e disponível para uso?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? "Salvar Alterações" : "Criar Insumo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
