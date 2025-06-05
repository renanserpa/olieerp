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
import { createRecord, updateRecord } from "@/lib/data-hooks";
import { toast } from "sonner";

// Define Zod schema based on the 'stock_groups' table
const groupFormSchema = z.object({
  name: z.string().min(2, { message: "Nome do grupo deve ter pelo menos 2 caracteres." }),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface GroupFormProps {
  initialData?: any; // For editing
  onSuccess?: () => void; // Callback after successful submission
}

export function GroupForm({ initialData, onSuccess }: GroupFormProps) {
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: initialData ? {
      name: initialData.name || "",
      description: initialData.description || "",
      is_active: initialData.is_active !== false
    } : {
      name: "",
      description: "",
      is_active: true
    },
  });

  async function onSubmit(values: GroupFormValues) {
    try {
      // Preparar dados para envio
      const groupData = {
        ...values,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (initialData?.id) {
        // Atualizar grupo existente
        result = await updateRecord('stock_groups', initialData.id, groupData);
      } else {
        // Criar novo grupo
        result = await createRecord('stock_groups', groupData);
      }
      
      if (result.success) {
        toast.success(initialData ? "Grupo atualizado com sucesso" : "Grupo criado com sucesso");
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar grupo");
      }
    } catch (error) {
      console.error("Erro ao salvar grupo:", error);
      toast.error("Erro ao salvar grupo");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Grupo *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do grupo de insumos" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição breve do grupo (opcional)" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? "Salvar Alterações" : "Criar Grupo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
