"use client";

import React, { useState } from "react";
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

// Define Zod schema para validação do formulário
const movementFormSchema = z.object({
  stock_item_id: z.string().min(1, { message: "Item de estoque é obrigatório." }),
  quantity: z.number().nonzero({ message: "Quantidade deve ser diferente de zero." }),
  movement_type: z.enum(["entrada", "saida", "ajuste", "transferencia"], { 
    required_error: "Tipo de movimentação é obrigatório." 
  }),
  source_location_id: z.string().optional(),
  destination_location_id: z.string().optional(),
  reference_document: z.string().optional(),
  notes: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementFormSchema>;

interface MovementFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function MovementForm({ initialData, onSuccess }: MovementFormProps) {
  const [movementType, setMovementType] = useState(initialData?.movement_type || "entrada");
  
  // Buscar dados relacionados para os dropdowns
  const { data: stockItems } = useSupabaseData('stock_items', 'name');
  const { data: locations } = useSupabaseData('locations', 'name');
  
  // Tipos de movimentação
  const movementTypes = [
    { value: "entrada", label: "Entrada" },
    { value: "saida", label: "Saída" },
    { value: "ajuste", label: "Ajuste de Inventário" },
    { value: "transferencia", label: "Transferência" },
  ];

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: initialData ? {
      stock_item_id: initialData.stock_item_id || "",
      quantity: initialData.quantity || 0,
      movement_type: initialData.movement_type || "entrada",
      source_location_id: initialData.source_location_id || "",
      destination_location_id: initialData.destination_location_id || "",
      reference_document: initialData.reference_document || "",
      notes: initialData.notes || "",
    } : {
      stock_item_id: "",
      quantity: 0,
      movement_type: "entrada",
      source_location_id: "",
      destination_location_id: "",
      reference_document: "",
      notes: "",
    },
  });

  // Atualizar o tipo de movimentação quando alterado
  const handleMovementTypeChange = (value: string) => {
    if (value === "entrada" || value === "saida" || value === "ajuste" || value === "transferencia") {
      setMovementType(value);
      form.setValue("movement_type", value as any);
    }
  };

  async function onSubmit(values: MovementFormValues) {
    try {
      // Validações específicas por tipo de movimentação
      if (values.movement_type === "transferencia") {
        if (!values.source_location_id || !values.destination_location_id) {
          toast.error("Para transferências, origem e destino são obrigatórios");
          return;
        }
        
        if (values.source_location_id === values.destination_location_id) {
          toast.error("Origem e destino não podem ser iguais");
          return;
        }
      }
      
      // Preparar dados para envio
      const movementData = {
        ...values,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (initialData?.id) {
        // Atualizar movimentação existente
        result = await updateRecord('stock_movements', initialData.id, movementData);
      } else {
        // Criar nova movimentação
        result = await createRecord('stock_movements', movementData);
      }
      
      if (result.success) {
        toast.success(initialData ? "Movimentação atualizada com sucesso" : "Movimentação registrada com sucesso");
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar movimentação");
      }
    } catch (error) {
      console.error("Erro ao salvar movimentação:", error);
      toast.error("Erro ao salvar movimentação");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Item de Estoque */}
          <FormField
            control={form.control}
            name="stock_item_id"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Item de Estoque *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stockItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de Movimentação */}
          <FormField
            control={form.control}
            name="movement_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Movimentação *</FormLabel>
                <Select 
                  onValueChange={(value) => handleMovementTypeChange(value)} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
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
                <FormLabel>Quantidade *</FormLabel>
                <FormControl>
                  <InputNumber 
                    allowNegative={movementType === "ajuste"}
                    placeholder="0" 
                    value={field.value || 0}
                    onChange={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormDescription>
                  {movementType === "entrada" && "Valor positivo para entrada de estoque"}
                  {movementType === "saida" && "Valor positivo para saída de estoque"}
                  {movementType === "ajuste" && "Valor positivo ou negativo para ajuste"}
                  {movementType === "transferencia" && "Valor positivo para transferência"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Localização de Origem (para transferências ou saídas) */}
          {(movementType === "transferencia" || movementType === "saida") && (
            <FormField
              control={form.control}
              name="source_location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização de Origem {movementType === "transferencia" ? "*" : ""}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a origem" />
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
          )}

          {/* Localização de Destino (para transferências ou entradas) */}
          {(movementType === "transferencia" || movementType === "entrada") && (
            <FormField
              control={form.control}
              name="destination_location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização de Destino {movementType === "transferencia" ? "*" : ""}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o destino" />
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
          )}

          {/* Documento de Referência */}
          <FormField
            control={form.control}
            name="reference_document"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Documento de Referência</FormLabel>
                <FormControl>
                  <Input placeholder="Número da NF, pedido, etc." {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Observações */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Observações sobre a movimentação" {...field} value={field.value || ""} />
                </FormControl>
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
            {initialData ? "Salvar Alterações" : "Registrar Movimentação"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
