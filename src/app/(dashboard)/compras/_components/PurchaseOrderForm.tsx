"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { createSupabaseClient } from "@/lib/supabase/client";

// Define Zod schema for purchase order items
const purchaseOrderItemSchema = z.object({
  stock_item_id: z.string().uuid({ message: "Selecione um insumo válido." }), // Link to stock_items
  quantity: z.number().min(1, { message: "Quantidade deve ser pelo menos 1." }),
  unit_price: z.number().nonnegative({ message: "Preço unitário não pode ser negativo." }),
});

// Define Zod schema for the main purchase order form
const purchaseOrderFormSchema = z.object({
  supplier_id: z.string().uuid({ message: "Selecione um fornecedor válido." }),
  order_date: z.date({ required_error: "A data da ordem é obrigatória." }),
  expected_delivery_date: z.date().optional(),
  status_id: z.string().uuid({ message: "Selecione um status válido." }), // Link to global_statuses
  // Add reference to purchase_request_id if needed
  // purchase_request_id: z.string().uuid().optional(),
  purchase_order_items: z.array(purchaseOrderItemSchema).min(1, { message: "A ordem de compra deve ter pelo menos um item." }),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

// Define interfaces for fetched data
interface Supplier {
  id: string;
  name: string;
}
interface StockItem {
  id: string;
  name: string;
  cost_price?: number; // Assuming items might have a default cost price
}
interface Status {
  id: string;
  name: string;
}

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrderFormValues & { id?: string }; // Include ID for editing
  onSuccess?: () => void;
}

export function PurchaseOrderForm({ initialData, onSuccess }: PurchaseOrderFormProps) {
  const supabase = createSupabaseClient();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [stockItems, setStockItems] = React.useState<StockItem[]>([]);
  const [statuses, setStatuses] = React.useState<Status[]>([]);
  const [loadingRelatedData, setLoadingRelatedData] = React.useState(true);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: initialData || {
      order_date: new Date(),
      purchase_order_items: [], // Start with empty items
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "purchase_order_items",
  });

  // Fetch related data on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingRelatedData(true);
      try {
        // Fetch Suppliers
        const { data: suppliersData, error: suppliersError } = await supabase
          .from("suppliers")
          .select("id, name")
          .order("name");
        if (suppliersError) throw suppliersError;
        setSuppliers(suppliersData || []);

        // Fetch Stock Items (Insumos)
        const { data: itemsData, error: itemsError } = await supabase
          .from("stock_items")
          .select("id, name, cost_price") // Fetch cost_price if available
          .order("name");
        if (itemsError) throw itemsError;
        setStockItems(itemsData || []);

        // Fetch Statuses (e.g., applicable to 'purchase_orders')
        const { data: statusesData, error: statusesError } = await supabase
          .from("global_statuses")
          .select("id, name")
          // .contains('applicable_to', ['purchase_orders']) // Adjust filter as needed
          .order("name");
        if (statusesError) throw statusesError;
        setStatuses(statusesData || []);

      } catch (error) {
        console.error("Error fetching related data for Purchase Order:", error);
        // TODO: Show error toast to user
      } finally {
        setLoadingRelatedData(false);
      }
    };
    fetchData();
  }, [supabase]);

  // Function to add a new empty item row
  const addPurchaseOrderItem = () => {
    append({ stock_item_id: "", quantity: 1, unit_price: 0 });
  };

  // Handle stock item selection change to update unit price (optional)
  const handleStockItemChange = (index: number, itemId: string) => {
    const selectedItem = stockItems.find(i => i.id === itemId);
    form.setValue(`purchase_order_items.${index}.unit_price`, selectedItem?.cost_price || 0);
    form.setValue(`purchase_order_items.${index}.stock_item_id`, itemId);
    form.trigger(`purchase_order_items.${index}.unit_price`);
  };

  // Calculate total amount (optional display)
  const calculateTotal = () => {
    const items = form.getValues("purchase_order_items");
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  async function onSubmit(values: PurchaseOrderFormValues) {
    console.log("Submitting purchase order form:", values);
    const total_amount = calculateTotal();
    const purchaseOrderData = {
        supplier_id: values.supplier_id,
        order_date: values.order_date.toISOString(),
        expected_delivery_date: values.expected_delivery_date?.toISOString() || null,
        status_id: values.status_id,
        total_amount: total_amount,
        // purchase_request_id: values.purchase_request_id || null,
    };

    try {
        let purchaseOrderId = initialData?.id;

        if (initialData?.id) {
            // Update Purchase Order
            const { error: updateError } = await supabase
                .from('purchase_orders')
                .update(purchaseOrderData)
                .eq('id', initialData.id);
            if (updateError) throw updateError;

            // Update items (delete existing, insert new - simplest approach)
            const { error: deleteItemsError } = await supabase
                .from('purchase_order_items')
                .delete()
                .eq('purchase_order_id', initialData.id);
            if (deleteItemsError) throw deleteItemsError;

        } else {
            // Create Purchase Order
            const { data: newPO, error: insertError } = await supabase
                .from('purchase_orders')
                .insert(purchaseOrderData)
                .select('id')
                .single();
            if (insertError) throw insertError;
            if (!newPO) throw new Error("Failed to retrieve new purchase order ID");
            purchaseOrderId = newPO.id;
        }

        if (!purchaseOrderId) throw new Error("Purchase Order ID is missing");

        // Insert Purchase Order Items
        const itemsToInsert = values.purchase_order_items.map(item => ({
            ...item,
            purchase_order_id: purchaseOrderId,
        }));
        const { error: insertItemsError } = await supabase
            .from('purchase_order_items')
            .insert(itemsToInsert);
        if (insertItemsError) throw insertItemsError;

        console.log("Purchase Order saved successfully!");
        onSuccess?.();
        // TODO: Add success toast

    } catch (error) {
        console.error("Failed to save purchase order:", error);
        // TODO: Show error message to user (toast)
        alert(`Erro ao salvar ordem de compra: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Supplier Selection */}
        <FormField
          control={form.control}
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingRelatedData}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRelatedData ? "Carregando..." : "Selecione o fornecedor"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Order Date */}
        <FormField
          control={form.control}
          name="order_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Ordem *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expected Delivery Date */}
        <FormField
          control={form.control}
          name="expected_delivery_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Prev. Entrega</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data (opcional)</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
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
              <FormLabel>Status *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingRelatedData}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRelatedData ? "Carregando..." : "Selecione o status inicial"} />
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

        {/* Purchase Order Items Section */}
        <div>
          <h3 className="text-lg font-medium mb-2">Itens da Ordem de Compra *</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-end gap-2 mb-4 p-3 border rounded-md">
              <FormField
                control={form.control}
                name={`purchase_order_items.${index}.stock_item_id`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Insumo</FormLabel>
                    <Select 
                      onValueChange={(value) => handleStockItemChange(index, value)} 
                      defaultValue={field.value} 
                      disabled={loadingRelatedData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingRelatedData ? "Carregando..." : "Selecione"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stockItems.map((sItem) => (
                          <SelectItem key={sItem.id} value={sItem.id}>
                            {sItem.name}
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
                name={`purchase_order_items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel>Qtd.</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`purchase_order_items.${index}.unit_price`}
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel>Preço Unit.</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      /> 
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
                className="mb-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPurchaseOrderItem}
            disabled={loadingRelatedData}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
          <Controller
              name="purchase_order_items"
              control={form.control}
              render={({ fieldState }) => (
                  fieldState.error && <p className="text-sm font-medium text-destructive mt-2">{fieldState.error.message}</p>
              )}
          />
        </div>

        {/* Display Total (Optional) */}
        <div className="text-right font-semibold">
            Total: {calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting || loadingRelatedData}>
          {form.formState.isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Criar Ordem de Compra")}
        </Button>
      </form>
    </Form>
  );
}

