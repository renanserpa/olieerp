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
import { Textarea } from "@/components/ui/textarea";
// TODO: Import API functions for fetching parent categories
// TODO: Import API function for creating/updating categories

// Define Zod schema based on the 'product_categories' table
const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Nome da categoria deve ter pelo menos 2 caracteres." }),
  description: z.string().optional(),
  parent_category_id: z.string().optional(), // Foreign key for subcategories
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  initialData?: CategoryFormValues; // For editing
  onSuccess?: () => void; // Callback after successful submission
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialData || {},
  });

  // TODO: Fetch related data for dropdowns (parent categories)
  const parentCategories = [{ id: "cat-parent-1", name: "Categoria Pai Exemplo" }]; // Placeholder

  async function onSubmit(values: CategoryFormValues) {
    console.log("Submitting category form:", values);
    // TODO: Implement API call to create or update category
    // try {
    //   if (initialData) { /* Update */ } else { /* Create */ }
    //   onSuccess?.();
    // } catch (error) { /* Handle error */ }
    alert("Submissão de categoria (placeholder) - Ver console");
    onSuccess?.(); // Simulate success
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
              <FormLabel>Nome da Categoria *</FormLabel>
              <FormControl>
                <Input placeholder="Nome da categoria" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent Category */}
        <FormField
          control={form.control}
          name="parent_category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria Pai (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria pai (se aplicável)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem> {/* Option for no parent */}
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Deixe em branco se for uma categoria principal.</FormDescription>
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
                <Textarea placeholder="Descrição breve da categoria (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {initialData ? "Salvar Alterações" : "Criar Categoria"}
        </Button>
      </form>
    </Form>
  );
}

