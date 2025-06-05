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
import { toast } from "sonner";
import { createRecord, updateRecord } from "@/lib/data-hooks";

// Define Zod schema para validação do formulário de filtros avançados
const filterFormSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  created_after: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

export type FilterOption = {
  id: string;
  label: string;
  type: "text" | "select" | "date";
  options?: { value: string; label: string }[];
};

interface AdvancedFiltersProps {
  filterOptions: FilterOption[];
  onFilterChange: (filters: { [key: string]: string }) => void;
}

export function AdvancedFilters({ filterOptions, onFilterChange }: AdvancedFiltersProps) {
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {},
  });

  function onSubmit(values: FilterFormValues) {
    // Remover valores vazios
    const cleanedValues: { [key: string]: string } = {};
    Object.entries(values).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        cleanedValues[key] = value;
      }
    });
    
    onFilterChange(cleanedValues);
    toast.success("Filtros aplicados");
  }

  function handleClearFilters() {
    form.reset();
    onFilterChange({});
    toast.success("Filtros limpos");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterOptions.map((option) => (
            <FormField
              key={option.id}
              control={form.control}
              name={option.id as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{option.label}</FormLabel>
                  <FormControl>
                    {option.type === "text" && (
                      <Input
                        placeholder={`Filtrar por ${option.label.toLowerCase()}`}
                        {...field}
                        value={field.value || ""}
                      />
                    )}
                    {option.type === "select" && option.options && (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Selecione ${option.label.toLowerCase()}`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {option.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {option.type === "date" && (
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
          >
            Limpar Filtros
          </Button>
          <Button type="submit">Aplicar Filtros</Button>
        </div>
      </form>
    </Form>
  );
}
