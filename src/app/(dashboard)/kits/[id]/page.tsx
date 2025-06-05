"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Trash2, Package, ShoppingBag, Layers } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Kit {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface KitProduct {
  id: string;
  product_id: string;
  product: {
    name: string;
    sku: string;
    price: number;
  };
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  total: number;
  status: string;
}

export default function KitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [kit, setKit] = useState<Kit | null>(null);
  const [products, setProducts] = useState<KitProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchKitDetails = async () => {
      setLoading(true);
      try {
        // Buscar detalhes do kit
        const { data: kitData, error: kitError } = await supabase
          .from("kits")
          .select("*")
          .eq("id", params.id)
          .single();

        if (kitError) throw kitError;
        setKit(kitData);

        // Buscar produtos do kit
        const { data: productsData, error: productsError } = await supabase
          .from("kit_products")
          .select(`
            id,
            product_id,
            product:product_id (name, sku, price),
            quantity
          `)
          .eq("kit_id", params.id);

        if (!productsError && productsData) {
          setProducts(productsData);
        }

        // Buscar pedidos relacionados
        const { data: ordersData, error: ordersError } = await supabase
          .from("order_items")
          .select(`
            order_id,
            orders:order_id (id, order_number, order_date, total, status)
          `)
          .eq("kit_id", params.id)
          .order("created_at", { ascending: false });

        if (!ordersError && ordersData) {
          // Filtrar pedidos únicos
          const uniqueOrders = ordersData
            .map(item => item.orders)
            .filter((order, index, self) => 
              order && index === self.findIndex(o => o?.id === order?.id)
            );
          
          setOrders(uniqueOrders || []);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do kit:", error);
        // TODO: Mostrar mensagem de erro
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchKitDetails();
    }
  }, [params.id, supabase]);

  const handleEdit = () => {
    // Abrir modal de edição ou navegar para página de edição
    // Por enquanto, apenas mostra um alerta
    alert("Funcionalidade de edição será implementada em breve");
  };

  const handleDelete = async () => {
    if (!kit) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o kit ${kit.name}?`)) {
      try {
        const { error } = await supabase
          .from("kits")
          .delete()
          .eq("id", kit.id);
          
        if (error) throw error;
        
        router.push("/kits");
      } catch (error) {
        console.error("Erro ao excluir kit:", error);
        alert("Não foi possível excluir o kit. Verifique se não há registros relacionados.");
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const calculateTotalCost = () => {
    return products.reduce((total, product) => {
      return total + (product.product?.price || 0) * product.quantity;
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluído':
      case 'concluida':
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      case 'em andamento':
      case 'processando':
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes do kit...</p>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Kit não encontrado</p>
        <Button onClick={handleBack} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const totalCost = calculateTotalCost();
  const margin = kit.price > 0 && totalCost > 0 
    ? ((kit.price - totalCost) / totalCost) * 100 
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Kit</h1>
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
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{kit.name}</CardTitle>
              <CardDescription>
                {kit.is_active ? (
                  <span className="text-green-600 font-medium">Ativo</span>
                ) : (
                  <span className="text-red-600 font-medium">Inativo</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Informações Básicas</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">SKU:</span> {kit.sku || "Não informado"}</p>
                  <p><span className="font-medium">Quantidade de Produtos:</span> {products.length}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Informações Financeiras</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Preço de Venda:</span> {
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(kit.price)
                  }</p>
                  <p><span className="font-medium">Custo Total:</span> {
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(totalCost)
                  }</p>
                  <p><span className="font-medium">Margem:</span> {
                    margin.toFixed(2)
                  }%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {kit.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{kit.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Data de Cadastro:</span> {
                  kit.created_at ? format(new Date(kit.created_at), "PPP", { locale: ptBR }) : "N/A"
                }</p>
                <p><span className="font-medium">Última Atualização:</span> {
                  kit.updated_at ? format(new Date(kit.updated_at), "PPP", { locale: ptBR }) : "N/A"
                }</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produtos do Kit</CardTitle>
              <CardDescription>
                Produtos que compõem este kit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Produto</th>
                        <th className="text-left py-2 px-4">SKU</th>
                        <th className="text-left py-2 px-4">Quantidade</th>
                        <th className="text-left py-2 px-4">Preço Unitário</th>
                        <th className="text-left py-2 px-4">Subtotal</th>
                        <th className="text-right py-2 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{item.product?.name || "Produto desconhecido"}</td>
                          <td className="py-2 px-4">{item.product?.sku || "-"}</td>
                          <td className="py-2 px-4">{item.quantity}</td>
                          <td className="py-2 px-4">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.product?.price || 0)}
                          </td>
                          <td className="py-2 px-4">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format((item.product?.price || 0) * item.quantity)}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/produtos/${item.product_id}`)}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td className="py-2 px-4 font-medium" colSpan={4}>Total</td>
                        <td className="py-2 px-4 font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(totalCost)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Este kit não possui produtos registrados.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Adicionar Produtos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Relacionados</CardTitle>
              <CardDescription>
                Pedidos que incluem este kit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Número</th>
                        <th className="text-left py-2 px-4">Data</th>
                        <th className="text-left py-2 px-4">Valor</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-right py-2 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{order.order_number}</td>
                          <td className="py-2 px-4">
                            {format(new Date(order.order_date), "dd/MM/yyyy")}
                          </td>
                          <td className="py-2 px-4">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(order.total)}
                          </td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/pedidos/${order.id}`)}
                            >
                              <Layers className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Este kit não foi incluído em nenhum pedido.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
              <CardDescription>
                Registro de alterações e atividades relacionadas a este kit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-4 text-muted-foreground">
                Histórico de atividades será implementado em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
