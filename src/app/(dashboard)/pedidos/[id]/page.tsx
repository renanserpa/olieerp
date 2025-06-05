"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, FileText, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  date: string;
  total: number;
  status: string;
  payment_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  channel_id: string;
  payment_method_id: string;
  channel: {
    name: string;
  };
  payment_method: {
    name: string;
  };
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string;
  product: {
    name: string;
    sku: string;
  };
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            channel:channel_id(name),
            payment_method:payment_method_id(name)
          `)
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setOrder(data);

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(`
            *,
            product:product_id(name, sku)
          `)
          .eq("order_id", params.id);

        if (itemsError) throw itemsError;
        setOrderItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching order details:", error);
        // TODO: Show error toast
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, supabase]);

  const handleDelete = async () => {
    try {
      // First delete order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", params.id);

      if (itemsError) throw itemsError;
      
      // Then delete the order
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", params.id);

      if (error) throw error;
      
      // Navigate back to orders list
      router.push("/pedidos");
      // TODO: Show success toast
    } catch (error) {
      console.error("Error deleting order:", error);
      // TODO: Show error toast
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleGenerateProductionOrder = async (orderItemId: string) => {
    try {
      // Update the order item to trigger production order generation
      const { error } = await supabase
        .from("order_items")
        .update({ gerar_ordem_producao: true })
        .eq("id", orderItemId);

      if (error) throw error;
      
      // Refresh order items
      const { data, error: refreshError } = await supabase
        .from("order_items")
        .select(`
          *,
          product:product_id(name, sku)
        `)
        .eq("order_id", params.id);

      if (refreshError) throw refreshError;
      setOrderItems(data || []);
      
      // TODO: Show success toast
    } catch (error) {
      console.error("Error generating production order:", error);
      // TODO: Show error toast
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes do pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Pedido não encontrado.</p>
        <Button onClick={() => router.push("/pedidos")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista de pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/pedidos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/pedidos/editar/${order.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pedido #{order.order_number}</CardTitle>
            <CardDescription>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                  order.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {order.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.payment_status === 'Pago' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items">Itens</TabsTrigger>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="notes">Observações</TabsTrigger>
              </TabsList>
              <TabsContent value="items" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Produto</th>
                        <th className="text-left py-2">SKU</th>
                        <th className="text-right py-2">Qtd</th>
                        <th className="text-right py-2">Preço Unit.</th>
                        <th className="text-right py-2">Total</th>
                        <th className="text-right py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2">{item.product?.name || "Produto não encontrado"}</td>
                          <td className="py-2">{item.product?.sku || "-"}</td>
                          <td className="py-2 text-right">{item.quantity}</td>
                          <td className="py-2 text-right">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.unit_price)}
                          </td>
                          <td className="py-2 text-right">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.total_price)}
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateProductionOrder(item.id)}
                              title="Gerar ordem de produção"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={4} className="py-2 text-right font-medium">Total:</td>
                        <td className="py-2 text-right font-bold">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(order.total)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                    <p>{order.customer_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data do Pedido</h3>
                    <p>{format(new Date(order.date), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Canal de Venda</h3>
                    <p>{order.channel?.name || "Não informado"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Método de Pagamento</h3>
                    <p>{order.payment_method?.name || "Não informado"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status do Pedido</h3>
                    <p>{order.status}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status do Pagamento</h3>
                    <p>{order.payment_status}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Criação</h3>
                    <p>
                      {order.created_at
                        ? format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : "Data não disponível"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Última Atualização</h3>
                    <p>
                      {order.updated_at
                        ? format(new Date(order.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : "Data não disponível"}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  {order.notes ? (
                    <p className="whitespace-pre-wrap">{order.notes}</p>
                  ) : (
                    <p className="text-gray-500">Nenhuma observação registrada.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total de Itens</h3>
              <p className="text-2xl font-bold">{orderItems.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Valor Total</h3>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(order.total)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
              <p>{order.customer_name}</p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-sm"
                onClick={() => router.push(`/clientes/${order.client_id}`)}
              >
                Ver detalhes do cliente
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/producao/novo?pedido=${order.id}`)}
            >
              <Package className="mr-2 h-4 w-4" /> Criar Ordem de Produção
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/pedidos/duplicar/${order.id}`)}
            >
              <FileText className="mr-2 h-4 w-4" /> Duplicar Pedido
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
