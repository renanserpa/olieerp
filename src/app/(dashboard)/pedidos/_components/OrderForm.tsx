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
import { createSupabaseClient } from "@/lib/supabase/client"; // Use client for dynamic fetching

// Define Zod schema for order items
const orderItemSchema = z.object({
  product_id: z.string().uuid({ message: "Selecione um produto válido." }),
  quantity: z.number().min(1, { message: "Quantidade deve ser pelo menos 1." }),
  unit_price: z.number().nonnegative({ message: "Preço unitário não pode ser negativo." }),
  // Add customizations field if needed
  // customizations: z.string().optional(),
});

// Define Zod schema for the main order form
const orderFormSchema = z.object({
  customer_id: z.string().uuid({ message: "Selecione um cliente válido." }),
  date: z.date({ required_error: "A data do pedido é obrigatória." }),
  status_id: z.string().uuid({ message: "Selecione um status válido." }),
  channel_id: z.string().uuid({ message: "Selecione um canal de venda válido." }).optional(),
  order_items: z.array(orderItemSchema).min(1, { message: "O pedido deve ter pelo menos um item." }),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

// Define interfaces for fetched data
interface Customer {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
  price: number; // Assuming products have a base price
}
interface Status {
  id: string;
  name: string;
}
interface Channel {
  id: string;
  name: string;
}

interface OrderFormProps {
  initialData?: OrderFormValues & { id?: string }; // Include ID for editing
  onSuccess?: () => void;
}

export function OrderForm({ initialData, onSuccess }: OrderFormProps) {
  const supabase = createSupabaseClient();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [statuses, setStatuses] = React.useState<Status[]>([]);
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const [loadingRelatedData, setLoadingRelatedData] = React.useState(true);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initialData || {
      date: new Date(),
      order_items: [], // Start with empty items
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "order_items",
  });

  // Fetch related data on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingRelatedData(true);
      try {
        // Fetch Customers
        const { data: customersData, error: customersError } = await supabase
          .from("customers")
          .select("id, name")
          .order("name");
        if (customersError) throw customersError;
        setCustomers(customersData || []);

        // Fetch Products
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, price") // Assuming price is available
          .order("name");
        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch Statuses (e.g., applicable to 'orders')
        const { data: statusesData, error: statusesError } = await supabase
          .from("global_statuses")
          .select("id, name")
          // .contains('applicable_to', ['orders']) // Adjust filter as needed
          .order("name");
        if (statusesError) throw statusesError;
        setStatuses(statusesData || []);

        // Fetch Channels
        const { data: channelsData, error: channelsError } = await supabase
          .from("sales_channels")
          .select("id, name")
          .order("name");
        if (channelsError) throw channelsError;
        setChannels(channelsData || []);

      } catch (error) {
        console.error("Error fetching related data:", error);
        // TODO: Show error toast to user
      } finally {
        setLoadingRelatedData(false);
      }
    };
    fetchData();
  }, [supabase]);

  // Function to add a new empty item row
  const addOrderItem = () => {
    append({ product_id: "", quantity: 1, unit_price: 0 });
  };

  // Handle product selection change to update unit price
  const handleProductChange = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    form.setValue(`order_items.${index}.unit_price`, selectedProduct?.price || 0);
    form.setValue(`order_items.${index}.product_id`, productId);
    form.trigger(`order_items.${index}.unit_price`); // Trigger validation if needed
  };

  // Calculate total amount (optional display)
  const calculateTotal = () => {
    const items = form.getValues("order_items");
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  async function onSubmit(values: OrderFormValues) {
    console.log("Submitting order form:", values);
    const total_amount = calculateTotal();
    const orderData = {
        customer_id: values.customer_id,
        date: values.date.toISOString(),
        status_id: values.status_id,
        channel_id: values.channel_id || null,
        total_amount: total_amount,
    };

    try {
        let orderId = initialData?.id;

        if (initialData?.id) {
            // Update Order
            const { error: updateOrderError } = await supabase
                .from('orders')
                .update(orderData)
                .eq('id', initialData.id);
            if (updateOrderError) throw updateOrderError;

            // TODO: Handle order items update (delete existing and insert new? Or diff?)
            // Simplest: Delete existing items and insert new ones
            const { error: deleteItemsError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', initialData.id);
            if (deleteItemsError) throw deleteItemsError;

        } else {
            // Create Order
            const { data: newOrder, error: insertOrderError } = await supabase
                .from('orders')
                .insert(orderData)
                .select('id')
                .single();
            if (insertOrderError) throw insertOrderError;
            if (!newOrder) throw new Error("Failed to retrieve new order ID");
            orderId = newOrder.id;
        }

        if (!orderId) throw new Error("Order ID is missing");

        // Insert Order Items
        const itemsToInsert = values.order_items.map(item => ({
            ...item,
            order_id: orderId,
        }));
        const { error: insertItemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);
        if (insertItemsError) throw insertItemsError;

        console.log("Order saved successfully!");
        onSuccess?.(); // Close dialog/sheet on success
        // TODO: Add success toast

    } catch (error) {
        console.error("Failed to save order:", error);
        // TODO: Show error message to user (toast)
        alert(`Erro ao salvar pedido: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingRelatedData}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRelatedData ? "Carregando..." : "Selecione o cliente"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
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
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Pedido *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
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
                    // disabled={(date) =>
                    //   date > new Date() || date < new Date("1900-01-01")
                    // }
                    initialFocus
                    locale={ptBR}
                  />
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

        {/* Sales Channel Selection */}
        <FormField
          control={form.control}
          name="channel_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canal de Venda</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingRelatedData}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingRelatedData ? "Carregando..." : "Selecione o canal (opcional)"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Order Items Section */}
        <div>
          <h3 className="text-lg font-medium mb-2">Itens do Pedido *</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-end gap-2 mb-4 p-3 border rounded-md">
              <FormField
                control={form.control}
                name={`order_items.${index}.product_id`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Produto</FormLabel>
                    <Select 
                      onValueChange={(value) => handleProductChange(index, value)} 
                      defaultValue={field.value} 
                      disabled={loadingRelatedData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingRelatedData ? "Carregando..." : "Selecione"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
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
                name={`order_items.${index}.quantity`}
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
                name={`order_items.${index}.unit_price`}
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel>Preço Unit.</FormLabel>
                    <FormControl>
                      {/* Display price, potentially read-only or adjustable */}
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        readOnly // Make readOnly if price comes directly from product
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
                className="mb-1" // Align with form field bottom edge
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOrderItem}
            disabled={loadingRelatedData}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
          <Controller
              name="order_items" // Hidden controller to show array-level errors
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
          {form.formState.isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Criar Pedido")}
        </Button>
      </form>
    </Form>
  );
}

