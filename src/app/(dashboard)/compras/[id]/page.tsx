"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Trash2, FileText, Truck, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier: {
    name: string;
    contact_name: string;
    email: string;
    phone: string;
  };
  order_date: string;
  expected_delivery_date: string | null;
  delivery_date: string | null;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_cost: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface PurchaseItem {
  id: string;
  product_id: string | null;
  supply_id: string | null;
  product: {
    name: string;
    sku: string;
  } | null;
  supply: {
    name: string;
  } | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PurchaseHistory {
  id: string;
  status: string;
  date: string;
  user: string;
  notes: string;
}

export default function PurchaseOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchPurchaseOrderDetails = async () => {
      setLoading(true);
      try {
        // Buscar detalhes do pedido de compra
        const { data: orderData, error: orderError } = await supabase
          .from("purchase_orders")
          .select(`
            *,
            supplier:supplier_id (name, contact_name, email, phone)
          `)
          .eq("id", params.id)
          .single();

        if (orderError) throw orderError;
        setPurchaseOrder(orderData);

        // Buscar itens do pedido
        const { data: itemsData, error: itemsError } = await supabase
          .from("purchase_order_items")
          .select(`
            id,
            product_id,
            supply_id,
            product:product_id (name, sku),
            supply:supply_id (name),
            description,
            quantity,
            unit_price,
            total_price
          `)
          .eq("purchase_order_id", params.id);

        if (!itemsError) {
          setItems(itemsData || []);
        }

        // Buscar histórico do pedido
        const { data: historyData, error: historyError } = await supabase
          .from("purchase_order_history")
          .select("*")
          .eq("purchase_order_id", params.id)
          .order("date", { ascending: false });

        if (!historyError) {
          setHistory(historyData || []);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do pedido de compra:", error);
        // TODO: Mostrar mensagem de erro
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPurchaseOrderDetails();
    }
  }, [params.id, supabase]);

  const handleEdit = () => {
    // Abrir modal de edição ou navegar para página de edição
    // Por enquanto, apenas mostra um alerta
    alert("Funcionalidade de edição será implementada em breve");
  };

  const handleDelete = async () => {
    if (!purchaseOrder) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o pedido de compra ${purchaseOrder.order_number}?`)) {
      try {
        const { error } = await supabase
          .from("purchase_orders")
          .delete()
          .eq("id", purchaseOrder.id);
          
        if (error) throw error;
        
        router.push("/compras");
      } catch (error) {
        console.error("Erro ao excluir pedido de compra:", error);
        alert("Não foi possível excluir o pedido de compra. Verifique se não há registros relacionados.");
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluído':
      case 'concluida':
      case 'finalizado':
      case 'entregue':
        return 'bg-green-100 text-green-800';
      case 'em andamento':
      case 'processando':
      case 'enviado':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pago':
      case 'quitado':
        return 'bg-green-100 text-green-800';
      case 'parcial':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
      case 'estornado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes do pedido de compra...</p>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Pedido de compra não encontrado</p>
        <Button onClick={handleBack} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Pedido de Compra #{purchaseOrder.order_number}</h1>
          <span className={`ml-2 px-3 py-1 rounded-full text-sm ${getStatusColor(purchaseOrder.status)}`}>
            {purchaseOrder.status}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Datas</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Data do Pedido:</span> {
                      format(new Date(purchaseOrder.order_date), "PPP", { locale: ptBR })
                    }</p>
                    <p><span className="font-medium">Previsão de Entrega:</span> {
                      purchaseOrder.expected_delivery_date 
                        ? format(new Date(purchaseOrder.expected_delivery_date), "PPP", { locale: ptBR })
                        : "Não informada"
                    }</p>
                    <p><span className="font-medium">Data de Entrega:</span> {
                      purchaseOrder.delivery_date 
                        ? format(new Date(purchaseOrder.delivery_date), "PPP", { locale: ptBR })
                        : "Não entregue"
                    }</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Pagamento</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Método de Pagamento:</span> {purchaseOrder.payment_method}</p>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Status do Pagamento:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(purchaseOrder.payment_status)}`}>
                        {purchaseOrder.payment_status}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fornecedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{purchaseOrder.supplier.name}</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Contato:</span> {purchaseOrder.supplier.contact_name || "Não informado"}</p>
                    <p><span className="font-medium">Email:</span> {purchaseOrder.supplier.email || "Não informado"}</p>
                    <p><span className="font-medium">Telefone:</span> {purchaseOrder.supplier.phone || "Não informado"}</p>
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-2" 
                    onClick={() => router.push(`/fornecedores/${purchaseOrder.supplier_id}`)}
                  >
                    Ver detalhes do fornecedor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(purchaseOrder.total - purchaseOrder.shipping_cost + purchaseOrder.discount - purchaseOrder.tax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(purchaseOrder.shipping_cost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Impostos:</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(purchaseOrder.tax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span>
                    -{new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(purchaseOrder.discount)}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(purchaseOrder.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {purchaseOrder.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{purchaseOrder.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
              <CardDescription>
                Produtos e insumos incluídos neste pedido de compra
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Item</th>
                        <th className="text-left py-2 px-4">Descrição</th>
                        <th className="text-left py-2 px-4">Quantidade</th>
                        <th className="text-left py-2 px-4">Preço Unitário</th>
                        <th className="text-left py-2 px-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">
                            {item.product?.name || item.supply?.name || "Item personalizado"}
                          </td>
                          <td className="py-2 px-4">{item.description || "-"}</td>
                          <td className="py-2 px-4">{item.quantity}</td>
                          <td className="py-2 px-4">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.unit_price)}
                          </td>
                          <td className="py-2 px-4">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td className="py-2 px-4 font-medium" colSpan={4}>Subtotal</td>
                        <td className="py-2 px-4 font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(items.reduce((sum, item) => sum + item.total_price, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum item registrado para este pedido de compra.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico do Pedido</CardTitle>
              <CardDescription>
                Registro de alterações e atividades relacionadas a este pedido de compra
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(entry.date), "PPP 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <span className="text-sm">{entry.user}</span>
                      </div>
                      {entry.notes && (
                        <p className="mt-2 text-sm">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum registro de histórico para este pedido de compra.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
