"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputNumber } from "@/components/ui/input-number";

// --- Schemas --- 

const allocationSchema = z.object({
  component_product_id: z.string(), // ID of the required component (from product_components)
  component_name: z.string().optional(), // Name of the required component
  required_quantity: z.number(), // Quantity needed based on product_components * order quantity
  insumo_id: z.string().min(1, { message: "Selecione o insumo." }), // ID of the stock_item (insumo) to allocate
  allocated_quantity: z.number().positive({ message: "Quantidade deve ser positiva." })
    .max(999999, { message: "Quantidade muito alta." }), // Add validation based on required_quantity?
});

const productionOrderFormSchema = z.object({
  order_id: z.string().uuid({ message: "Selecione um pedido de cliente válido." }),
  status_id: z.string().uuid({ message: "Selecione um status inicial válido." }),
  priority_id: z.string().uuid({ message: "Selecione uma prioridade válida." }).optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  // Array for allocated insumos
  allocations: z.array(allocationSchema).optional(),
});

// --- Types --- 

type ProductionOrderFormValues = z.infer<typeof productionOrderFormSchema>;
type AllocationValues = z.infer<typeof allocationSchema>;

type CustomerOrder = { id: string; order_ref: string; order_items: { product_id: string; quantity: number }[] }; // Simplified
type ProductionStatus = { id: string; name: string };
type ProductionPriority = { id: string; name: string };
type ProductComponent = { component_product_id: string; quantity: number; products: { name: string } | null }; // From product_components join products
type StockItem = { id: string; name: string; current_stock: number; sku?: string | null }; // Insumo

// --- Props --- 

interface ProductionOrderFormProps {
  initialData?: Partial<ProductionOrderFormValues> & { id: string }; // For editing (needs more fields)
  onSuccess?: () => void;
}

// --- Component --- 

export function ProductionOrderForm({ initialData, onSuccess }: ProductionOrderFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [statuses, setStatuses] = useState<ProductionStatus[]>([]);
  const [priorities, setPriorities] = useState<ProductionPriority[]>([]);
  const [requiredComponents, setRequiredComponents] = useState<AllocationValues[]>([]);
  const [availableInsumos, setAvailableInsumos] = useState<StockItem[]>([]);

  const form = useForm<ProductionOrderFormValues>({
    resolver: zodResolver(productionOrderFormSchema),
    defaultValues: {
      order_id: initialData?.order_id || undefined,
      status_id: initialData?.status_id || undefined,
      priority_id: initialData?.priority_id || undefined,
      start_date: initialData?.start_date ? new Date(initialData.start_date) : undefined,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : undefined,
      allocations: initialData?.allocations || [],
    },
  });

  const { fields: allocationFields, replace: replaceAllocations } = useFieldArray({
    control: form.control,
    name: "allocations",
  });

  const selectedOrderId = useWatch({ control: form.control, name: "order_id" });

  // Fetch initial dropdown data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsFetchingData(true);
      try {
        // Fetch Customer Orders (simplified query)
        // TODO: Verify table names and structure (`orders`, `order_items`)
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(`id, order_ref, order_items ( product_id, quantity )`)
          // .eq("status", "Aguardando Produção") // Example filter
          .order("created_at", { ascending: false });
        if (ordersError) throw new Error(`Erro ao buscar pedidos: ${ordersError.message}`);
        setCustomerOrders(ordersData || []);

        // Fetch Production Statuses
        // TODO: Verify table name `production_statuses`
        const { data: statusData, error: statusError } = await supabase
          .from("production_statuses")
          .select("id, name")
          .order("name");
        if (statusError) throw new Error(`Erro ao buscar status de produção: ${statusError.message}`);
        setStatuses(statusData || []);
        // Set default status if creating
        if (!initialData?.status_id && statusData?.length > 0) {
            const defaultStatus = statusData.find(s => s.name.toLowerCase() === 'planejada' || s.name.toLowerCase() === 'aguardando') || statusData[0];
            if (defaultStatus) form.setValue('status_id', defaultStatus.id);
        }

        // Fetch Production Priorities
        // TODO: Verify table name `production_priorities`
        const { data: priorityData, error: priorityError } = await supabase
          .from("production_priorities")
          .select("id, name")
          .order("name");
        if (priorityError) throw new Error(`Erro ao buscar prioridades: ${priorityError.message}`);
        setPriorities(priorityData || []);

        // Fetch Available Insumos (Stock Items)
        // TODO: Verify table name `stock_items` and columns
        const { data: insumosData, error: insumosError } = await supabase
          .from("stock_items")
          .select("id, name, sku, current_stock")
          .gt("current_stock", 0) // Only show items with stock > 0 ?
          .order("name");
        if (insumosError) throw new Error(`Erro ao buscar insumos: ${insumosError.message}`);
        setAvailableInsumos(insumosData || []);

      } catch (error: any) {
        toast.error(error.message);
        console.error("Fetch initial data error:", error);
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchInitialData();
  }, [supabase, initialData, form]);

  // Fetch required components when selectedOrderId changes
  useEffect(() => {
    const fetchRequiredComponents = async () => {
      if (!selectedOrderId) {
        setRequiredComponents([]);
        replaceAllocations([]); // Clear allocations if order is deselected
        return;
      }

      const selectedOrder = customerOrders.find(o => o.id === selectedOrderId);
      if (!selectedOrder || !selectedOrder.order_items || selectedOrder.order_items.length === 0) {
        setRequiredComponents([]);
        replaceAllocations([]);
        return;
      }

      setIsLoading(true); // Indicate loading components
      try {
        const productIds = selectedOrder.order_items.map(item => item.product_id);
        const orderQuantitiesMap = new Map(selectedOrder.order_items.map(item => [item.product_id, item.quantity]));

        // Fetch components for all products in the order
        // TODO: Verify table names `product_components`, `products`
        const { data: componentsData, error: componentsError } = await supabase
          .from("product_components")
          .select(`
            product_id, 
            component_product_id, 
            quantity,
            products!product_components_component_product_id_fkey ( name )
          `)
          .in("product_id", productIds);

        if (componentsError) throw new Error(`Erro ao buscar componentes do produto: ${componentsError.message}`);

        // Calculate total required quantity for each component
        const requiredMap = new Map<string, { name?: string; totalQuantity: number }>();
        componentsData?.forEach(comp => {
          const orderQuantity = orderQuantitiesMap.get(comp.product_id) || 0;
          const totalNeeded = comp.quantity * orderQuantity;
          const existing = requiredMap.get(comp.component_product_id);
          requiredMap.set(comp.component_product_id, {
            name: comp.products?.name || 'Componente Desconhecido',
            totalQuantity: (existing?.totalQuantity || 0) + totalNeeded,
          });
        });

        const newRequiredComponents: AllocationValues[] = Array.from(requiredMap.entries()).map(([componentId, details]) => ({
          component_product_id: componentId,
          component_name: details.name,
          required_quantity: details.totalQuantity,
          insumo_id: "", // Needs to be selected by user
          allocated_quantity: details.totalQuantity, // Default to required, user can adjust?
        }));

        setRequiredComponents(newRequiredComponents);
        replaceAllocations(newRequiredComponents); // Populate the form array

      } catch (error: any) {
        toast.error(error.message);
        console.error("Fetch components error:", error);
        setRequiredComponents([]);
        replaceAllocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequiredComponents();
  }, [selectedOrderId, customerOrders, supabase, replaceAllocations]);

  // Submit Logic
  async function onSubmit(values: ProductionOrderFormValues) {
    if (!values.allocations || values.allocations.length === 0) {
        // Allow creating order without allocation?
        // toast.info("Nenhum insumo alocado. Verifique os componentes necessários.");
        // return;
        console.warn("Criando ordem de produção sem alocação de insumos.");
    }

    // Validate if allocated quantity exceeds available stock (optional, better done server-side/function)
    for (const alloc of values.allocations || []) {
        const insumo = availableInsumos.find(i => i.id === alloc.insumo_id);
        if (insumo && alloc.allocated_quantity > insumo.current_stock) {
            toast.error(`Estoque insuficiente para ${insumo.name}. Disponível: ${insumo.current_stock}, Alocado: ${alloc.allocated_quantity}`);
            return;
        }
    }

    setIsLoading(true);
    const toastId = toast.loading("Criando ordem de produção...");
    try {
      // 1. Create Production Order
      // TODO: Verify table name `production_orders`
      const { data: orderData, error: orderError } = await supabase
        .from("production_orders")
        .insert({
          order_id: values.order_id,
          status_id: values.status_id,
          priority_id: values.priority_id,
          start_date: values.start_date,
          end_date: values.end_date,
          // Add other fields like created_by, etc.
        })
        .select("id")
        .single();

      if (orderError) throw new Error(`Erro ao criar ordem de produção: ${orderError.message}`);
      const productionOrderId = orderData.id;
      if (!productionOrderId) throw new Error("Falha ao obter ID da ordem de produção criada.");

      // 2. Create Allocations
      if (values.allocations && values.allocations.length > 0) {
        const allocationsToInsert = values.allocations.map(alloc => ({
          production_order_id: productionOrderId,
          stock_item_id: alloc.insumo_id,
          quantity_allocated: alloc.allocated_quantity,
          component_product_id: alloc.component_product_id, // Store which component this fulfills
        }));
        // TODO: Verify table name `production_order_allocations`
        const { error: allocError } = await supabase
          .from("production_order_allocations")
          .insert(allocationsToInsert);
        if (allocError) throw new Error(`Erro ao salvar alocações: ${allocError.message}`);

        // 3. (Optional but Recommended) Update Stock Levels
        // This should ideally be a Supabase Function for atomicity
        // Example client-side (less safe):
        /*
        for (const alloc of values.allocations) {
          const insumo = availableInsumos.find(i => i.id === alloc.insumo_id);
          if (insumo) {
            const newStock = insumo.current_stock - alloc.allocated_quantity;
            await supabase.from("stock_items").update({ current_stock: newStock }).eq("id", alloc.insumo_id);
            // TODO: Add error handling and potentially rollback logic
          }
        }
        */
        console.warn("Atualização de estoque não implementada automaticamente. Deve ser feita via Supabase Function ou manualmente.");
      }

      toast.success("Ordem de produção criada com sucesso!", { id: toastId });
      form.reset();
      setRequiredComponents([]); // Clear components list
      router.refresh();
      onSuccess?.();

    } catch (error: any) {
      console.error("Erro ao criar ordem de produção:", error);
      toast.error(`Erro: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }

  // --- Render --- 

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {isFetchingData && (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando dados...
            </div>
        )}

        {/* --- Basic Info Card --- */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Ordem de Produção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order Selection */}
              <FormField control={form.control} name="order_id" render={({ field }) => (<FormItem><FormLabel>Pedido do Cliente *</FormLabel><Select onValueChange={(value) => { field.onChange(value); replaceAllocations([]); setRequiredComponents([]); }} value={field.value} disabled={isLoading || isFetchingData || customerOrders.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={customerOrders.length === 0 ? "Carregando..." : "Selecione o pedido"} /></SelectTrigger></FormControl><SelectContent>{customerOrders.map((order) => (<SelectItem key={order.id} value={order.id}>{order.order_ref}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              {/* Status Selection */}
              <FormField control={form.control} name="status_id" render={({ field }) => (<FormItem><FormLabel>Status Inicial *</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isFetchingData || statuses.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={statuses.length === 0 ? "Carregando..." : "Selecione o status"} /></SelectTrigger></FormControl><SelectContent>{statuses.map((status) => (<SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              {/* Priority Selection */}
              <FormField control={form.control} name="priority_id" render={({ field }) => (<FormItem><FormLabel>Prioridade</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isFetchingData}><FormControl><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger></FormControl><SelectContent>{priorities.map((priority) => (<SelectItem key={priority.id} value={priority.id}>{priority.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              {/* Start Date */}
              <FormField control={form.control} name="start_date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data Início Prevista</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isLoading || isFetchingData}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              {/* End Date */}
              <FormField control={form.control} name="end_date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data Fim Prevista</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isLoading || isFetchingData}>{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
            </div>
          </CardContent>
        </Card>

        {/* --- Allocation Card --- */}
        {selectedOrderId && (
          <Card>
            <CardHeader>
              <CardTitle>Alocação de Insumos</CardTitle>
              <CardDescription>Selecione os insumos do estoque para os componentes necessários.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !isFetchingData && (
                  <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando componentes...</div>
              )}
              {!isLoading && allocationFields.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum componente encontrado para o produto deste pedido ou o pedido não foi selecionado.</p>
              )}
              {allocationFields.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Componente Necessário</TableHead>
                        <TableHead className="text-right">Qtd. Necessária</TableHead>
                        <TableHead>Insumo a Alocar (Estoque)</TableHead>
                        <TableHead className="text-right">Qtd. a Alocar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allocationFields.map((field, index) => {
                        const currentInsumoId = form.watch(`allocations.${index}.insumo_id`);
                        const selectedInsumo = availableInsumos.find(i => i.id === currentInsumoId);
                        return (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">
                              {form.getValues(`allocations.${index}.component_name`) || `ID: ${form.getValues(`allocations.${index}.component_product_id`).substring(0, 8)}...`}
                            </TableCell>
                            <TableCell className="text-right">
                              {form.getValues(`allocations.${index}.required_quantity`)}
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`allocations.${index}.insumo_id`}
                                render={({ field: itemField }) => (
                                  <FormItem>
                                    <Select onValueChange={itemField.onChange} value={itemField.value} disabled={isLoading || isFetchingData || availableInsumos.length === 0}>
                                      <FormControl>
                                        <SelectTrigger className="min-w-[200px]">
                                          <SelectValue placeholder={availableInsumos.length === 0 ? "Carregando..." : "Selecione o insumo"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {availableInsumos.map((insumo) => (
                                          <SelectItem key={insumo.id} value={insumo.id}>
                                            {insumo.name} ({insumo.sku || 'Sem SKU'}) - Estoque: {insumo.current_stock}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <FormField
                                control={form.control}
                                name={`allocations.${index}.allocated_quantity`}
                                render={({ field: itemField }) => (
                                  <FormItem>
                                    <FormControl>
                                      <InputNumber
                                        allowNegative={false}
                                        placeholder="Qtd"
                                        {...itemField}
                                        value={itemField.value ?? 0}
                                        disabled={isLoading || isFetchingData}
                                        onChange={value => itemField.onChange(value ?? 0)}
                                        className="w-24 text-right"
                                        max={selectedInsumo?.current_stock} // Add max based on stock?
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* --- Submit Button --- */}
        <Button type="submit" disabled={isLoading || isFetchingData}>
          {(isLoading || isFetchingData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Salvando..." : isFetchingData ? "Carregando..." : initialData?.id ? "Salvar Alterações" : "Criar Ordem de Produção"}
        </Button>
      </form>
    </Form>
  );
}

