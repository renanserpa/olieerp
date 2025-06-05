"use client";

import React from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

// --- Schemas --- 

const deliveryRouteFormSchema = z.object({
  route_name: z.string().min(3, { message: "Nome da rota deve ter pelo menos 3 caracteres." }),
  driver_id: z.string().uuid({ message: "Selecione um motorista." }).optional().nullable(),
  route_date: z.date({ required_error: "Data da rota é obrigatória." }),
  notes: z.string().optional(),
  // Add other fields as needed
});

type DeliveryRouteFormValues = z.infer<typeof deliveryRouteFormSchema>;

// --- Types --- 

interface Driver {
  id: string;
  name: string;
}

interface DeliveryRouteFormProps {
  onSuccess: () => void;
  initialData?: Partial<DeliveryRouteFormValues>; // For editing later
}

// --- Component --- 

export function DeliveryRouteForm({ onSuccess, initialData }: DeliveryRouteFormProps) {
  const supabase = createClient();
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<DeliveryRouteFormValues>({
    resolver: zodResolver(deliveryRouteFormSchema),
    defaultValues: initialData || {
      route_name: "",
      driver_id: null,
      route_date: undefined,
      notes: "",
    },
  });

  // Fetch drivers
  React.useEffect(() => {
    const fetchDrivers = async () => {
      setLoadingDrivers(true);
      try {
        const { data, error } = await supabase
          .from('users') // TODO: Verify table/view name for drivers
          .select('id, full_name') // Assuming 'full_name'
          // .eq('role', 'driver') // Example filter
          .limit(50);
        if (error) throw error;
        setDrivers(data?.map(d => ({ id: d.id, name: d.full_name || `User ${d.id.substring(0,5)}` })) || []);
      } catch (error: any) {
        console.error("Error fetching drivers:", error);
        toast.error(`Erro ao carregar motoristas: ${error.message}`);
      } finally {
        setLoadingDrivers(false);
      }
    };
    fetchDrivers();
  }, [supabase]);

  async function onSubmit(values: DeliveryRouteFormValues) {
    setIsSubmitting(true);
    const toastId = toast.loading(initialData ? "Atualizando rota..." : "Criando rota...");
    try {
      const dataToSave = {
        ...values,
        route_date: format(values.route_date, 'yyyy-MM-dd'), // Format date for DB
      };

      // TODO: Implement update logic if initialData exists
      if (initialData) {
        console.warn("Update logic not implemented yet.");
        throw new Error("Update logic not implemented yet.");
      }

      const { error } = await supabase
        .from('delivery_routes') // TODO: Verify table name
        .insert(dataToSave);

      if (error) throw error;

      toast.success("Rota criada com sucesso!", { id: toastId });
      onSuccess(); // Close dialog and refresh table
    } catch (error: any) {
      console.error("Failed to save delivery route:", error);
      toast.error(`Erro ao salvar rota: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Route Name */}
        <FormField
          control={form.control}
          name="route_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Rota *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Zona Sul - Terça" 
                  {...field} 
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Route Date */}
        <FormField
          control={form.control}
          name="route_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Rota *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isSubmitting}
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
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1)) || isSubmitting}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Driver Selection */}
        <FormField
          control={form.control}
          name="driver_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motorista (Opcional)</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value ?? undefined} 
                disabled={loadingDrivers || isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDrivers ? "Carregando motoristas..." : "Selecione o motorista"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem> 
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Instruções ou observações sobre a rota..."
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Rota')}
        </Button>
      </form>
    </Form>
  );
}
