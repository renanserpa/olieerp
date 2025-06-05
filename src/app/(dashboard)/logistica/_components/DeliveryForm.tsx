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

// --- Schemas --- 

const deliveryFormSchema = z.object({
  order_id: z.string().uuid({ message: "Selecione um pedido válido." }),
  driver_id: z.string().uuid({ message: "Selecione um motorista." }).optional().nullable(),
  delivery_date: z.date({ required_error: "Data de entrega é obrigatória." }),
  status_id: z.string().uuid({ message: "Selecione um status inicial." }),
  // Add other fields as needed, e.g., address, notes
});

type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

// --- Types --- 

interface Order {
  id: string;
  // Add display info like customer name or order number if needed
}

interface Driver {
  id: string;
  name: string;
}

interface Status {
  id: string;
  name: string;
}

interface DeliveryFormProps {
  onSuccess: () => void;
  initialData?: Partial<DeliveryFormValues>; // For editing later
}

// --- Component --- 

export function DeliveryForm({ onSuccess, initialData }: DeliveryFormProps) {
  const supabase = createClient();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [statuses, setStatuses] = React.useState<Status[]>([]);
  const [loadingRelated, setLoadingRelated] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: initialData || {
      order_id: undefined,
      driver_id: null,
      delivery_date: undefined,
      status_id: undefined, // Default to a specific status like 'Scheduled' if desired
    },
  });

  // Fetch related data (Orders, Drivers, Statuses)
  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingRelated(true);
      try {
        // Fetch Orders (example: fetch recent pending orders)
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders') // TODO: Verify table name and filtering logic
          .select('id')
          // .eq('status', 'pending_delivery') // Example filter
          .limit(50); // Limit results
        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Fetch Drivers (Users with 'driver' role?)
        const { data: driversData, error: driversError } = await supabase
          .from('users') // TODO: Verify table/view name for drivers
          .select('id, full_name') // Assuming 'full_name'
          // .eq('role', 'driver') // Example filter
          .limit(50);
        if (driversError) throw driversError;
        setDrivers(driversData?.map(d => ({ id: d.id, name: d.full_name || `User ${d.id.substring(0,5)}` })) || []);

        // Fetch Statuses (Applicable to deliveries)
        const { data: statusesData, error: statusesError } = await supabase
          .from('global_statuses') // TODO: Verify table name
          .select('id, name')
          // .contains('applicable_to', ['deliveries']) // Example filter
          .order('name');
        if (statusesError) throw statusesError;
        setStatuses(statusesData || []);

        // Set default status if not editing (e.g., 'Scheduled')
        if (!initialData && statusesData?.length > 0) {
            const scheduledStatus = statusesData.find(s => s.name.toLowerCase() === 'agendada');
            if (scheduledStatus) {
                form.setValue('status_id', scheduledStatus.id);
            }
        }

      } catch (error: any) {
        console.error("Error fetching related data for delivery form:", error);
        toast.error(`Erro ao carregar dados: ${error.message}`);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchData();
  }, [supabase, initialData, form]);

  async function onSubmit(values: DeliveryFormValues) {
    setIsSubmitting(true);
    const toastId = toast.loading(initialData ? "Atualizando entrega..." : "Criando entrega...");
    try {
      const dataToSave = {
        ...values,
        delivery_date: format(values.delivery_date, 'yyyy-MM-dd'), // Format date for DB
      };

      // TODO: Implement update logic if initialData exists
      if (initialData) {
        console.warn("Update logic not implemented yet.");
        throw new Error("Update logic not implemented yet.");
      }

      const { error } = await supabase
        .from('deliveries') // TODO: Verify table name
        .insert(dataToSave);

      if (error) throw error;

      toast.success("Entrega criada com sucesso!", { id: toastId });
      onSuccess(); // Close dialog and refresh table
    } catch (error: any) {
      console.error("Failed to save delivery:", error);
      toast.error(`Erro ao salvar entrega: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Order Selection */}
        <FormField
          control={form.control}
          name="order_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pedido Cliente *</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={loadingRelated || isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRelated ? "Carregando pedidos..." : "Selecione o pedido"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      Pedido #{order.id.substring(0, 8)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Delivery Date */}
        <FormField
          control={form.control}
          name="delivery_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Entrega *</FormLabel>
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
                disabled={loadingRelated || isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRelated ? "Carregando motoristas..." : "Selecione o motorista"} />
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

        {/* Status Selection */}
        <FormField
          control={form.control}
          name="status_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Inicial *</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value} // Use value for controlled component
                disabled={loadingRelated || isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRelated ? "Carregando status..." : "Selecione o status inicial"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loadingRelated || isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Entrega')}
        </Button>
      </form>
    </Form>
  );
}

