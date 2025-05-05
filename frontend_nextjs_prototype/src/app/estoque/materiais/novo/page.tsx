// /src/app/estoque/materiais/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Keep if needed for description
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import wixClient from "@/lib/wixClient";
import { ArrowLeft } from "lucide-react";

// TODO: Fetch grupos de insumos dynamically if needed for grupoId selection
const unidadesMedida = ["metro", "unidade", "kg", "litro", "pacote", "rolo"];

// Define Zod schema for validation, matching backend criarMaterialBasico
const materialFormSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  codigo: z.string().optional(), // Assuming código is optional or generated backend-side
  // grupoId: z.string().optional(), // TODO: Add if grupo selection is implemented
  unidadeMedida: z.string().min(1, { message: "Unidade de medida é obrigatória." }),
  precoUnitario: z.coerce
    .number({ invalid_type_error: "Preço deve ser um número." })
    .positive({ message: "Preço deve ser positivo." })
    .optional(), // Assuming price is optional or can be 0
  // ativo is set to true by backend
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

export default function NovoMaterialPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      nome: "",
      codigo: "",
      // grupoId: "",
      unidadeMedida: "",
      precoUnitario: 0,
    },
  });

  async function onSubmit(values: MaterialFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Call the backend function using wixClient.functions.execute
      const result = await wixClient.functions.execute(
        "estoque/materiaisBasicos",
        "criarMaterialBasico",
        values // Pass validated form values
      );

      console.log("Material Básico criado com sucesso:", result);
      toast({
        title: "Sucesso!",
        description: `Material "${result.nome}" criado com ID: ${result._id}.`,
      });
      // Redirect back to the materials list page
      router.push("/estoque/materiais");

    } catch (err: any) {
      console.error("Erro ao criar material básico:", err);
      const errorMessage = err.message || "Ocorreu um erro desconhecido ao tentar criar o material.";
      setError(errorMessage);
      toast({
        title: "Erro ao Criar Material",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-6">
       <Button variant="outline" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      <h1 className="text-3xl font-bold mb-6">Novo Material Básico</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Material *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Tecido Algodão Cru" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código (SKU)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: TEC-ALG-CRU" {...field} />
                </FormControl>
                 <FormDescription>
                  Código único para identificar o material (opcional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* TODO: Add Grupo de Insumo selection if needed */}
          {/* <FormField ... name="grupoId" ... /> */}

          <FormField
            control={form.control}
            name="unidadeMedida"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade de Medida *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unidadesMedida.map((unidade) => (
                      <SelectItem key={unidade} value={unidade}>
                        {unidade.charAt(0).toUpperCase() + unidade.slice(1)} {/* Capitalize */}
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
            name="precoUnitario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Unitário (R$)</FormLabel>
                <FormControl>
                  {/* Use type="number" and step for currency */}
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                 <FormDescription>
                  Preço de custo ou referência por unidade de medida.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Material"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

