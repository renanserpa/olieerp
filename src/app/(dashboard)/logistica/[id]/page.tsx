"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Trash2, Truck, MapPin, Package, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Delivery {
  id: string;
  delivery_number: string;
  order_id: string | null;
  order: {
    order_number: string;
    customer_name: string;
  } | null;
  driver_id: string | null;
  driver: {
    name: string;
    phone: string;
  } | null;
  vehicle_id: string | null;
  vehicle: {
    plate: string;
    model: string;
  } | null;
  route_id: string | null;
  route: {
    name: string;
  } | null;
  status: string;
  scheduled_date: string;
  departure_date: string | null;
  delivery_date: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  tracking_code: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface DeliveryItem {
  id: string;
  product_id: string;
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  order_item_id: string | null;
}

interface DeliveryStatus {
  id: string;
  status: string;
  date: string;
  location: string | null;
  notes: string | null;
}

export default function DeliveryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<DeliveryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchDeliveryDetails = async () => {
      setLoading(true);
      try {
        // Buscar detalhes da entrega
        const { data: deliveryData, error: deliveryError } = await supabase
          .from("deliveries")
          .select(`
            *,
            order:order_id (order_number, customer_name),
            driver:driver_id (name, phone),
            vehicle:vehicle_id (plate, model),
            route:route_id (name)
          `)
          .eq("id", params.id)
          .single();

        if (deliveryError) throw deliveryError;
        setDelivery(deliveryData);

        // Buscar itens da entrega
        const { data: itemsData, error: itemsError } = await supabase
          .from("delivery_items")
          .select(`
            id,
            product_id,
            product:product_id (name, sku),
            quantity,
            order_item_id
          `)
          .eq("delivery_id", params.id);

        if (!itemsError) {
          setItems(itemsData || []);
        }

        // Buscar histórico de status
        const { data: statusData, error: statusError } = await supabase
          .from("delivery_status_history")
          .select("*")
          .eq("delivery_id", params.id)
          .order("date", { ascending: true });

        if (!statusError) {
          setStatusHistory(statusData || []);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes da entrega:", error);
        // TODO: Mostrar mensagem de erro
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDeliveryDetails();
    }
  }, [params.id, supabase]);

  const handleEdit = () => {
    // Abrir modal de edição ou navegar para página de edição
    // Por enquanto, apenas mostra um alerta
    alert("Funcionalidade de edição será implementada em breve");
  };

  const handleDelete = async () => {
    if (!delivery) return;
    
    if (window.confirm(`Tem certeza que deseja excluir esta entrega?`)) {
      try {
        const { error } = await supabase
          .from("deliveries")
          .delete()
          .eq("id", delivery.id);
          
        if (error) throw error;
        
        router.push("/logistica");
      } catch (error) {
        console.error("Erro ao excluir entrega:", error);
        alert("Não foi possível excluir a entrega. Verifique se não há registros relacionados.");
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'entregue':
      case 'concluída':
      case 'concluida':
        return 'bg-green-100 text-green-800';
      case 'em trânsito':
      case 'em transito':
      case 'em rota':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
      case 'aguardando':
      case 'agendada':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
      case 'devolvida':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes da entrega...</p>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Entrega não encontrada</p>
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
          <h1 className="text-2xl font-bold">Entrega #{delivery.delivery_number}</h1>
          <span className={`ml-2 px-3 py-1 rounded-full text-sm ${getStatusColor(delivery.status)}`}>
            {delivery.status}
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
          <TabsTrigger value="tracking">Rastreamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Datas</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Data Agendada:</span> {
                      format(new Date(delivery.scheduled_date), "PPP", { locale: ptBR })
                    }</p>
                    {delivery.departure_date && (
                      <p><span className="font-medium">Data de Saída:</span> {
                        format(new Date(delivery.departure_date), "PPP", { locale: ptBR })
                      }</p>
                    )}
                    {delivery.delivery_date && (
                      <p><span className="font-medium">Data de Entrega:</span> {
                        format(new Date(delivery.delivery_date), "PPP", { locale: ptBR })
                      }</p>
                    )}
                  </div>
                </div>

                {delivery.order && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Pedido Relacionado</h3>
                    <div className="mt-2">
                      <p><span className="font-medium">Número do Pedido:</span> {delivery.order.order_number}</p>
                      <p><span className="font-medium">Cliente:</span> {delivery.order.customer_name}</p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto mt-1" 
                        onClick={() => router.push(`/pedidos/${delivery.order_id}`)}
                      >
                        Ver detalhes do pedido
                      </Button>
                    </div>
                  </div>
                )}

                {delivery.tracking_code && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Código de Rastreamento</h3>
                    <p className="mt-1">{delivery.tracking_code}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>{delivery.shipping_address}</p>
                  <p>{delivery.shipping_city} - {delivery.shipping_state}</p>
                  <p>{delivery.shipping_postal_code}</p>
                  <p>{delivery.shipping_country}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(delivery.driver || delivery.vehicle) && (
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Transporte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {delivery.driver && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Motorista</h3>
                      <div className="mt-2 space-y-1">
                        <p><span className="font-medium">Nome:</span> {delivery.driver.name}</p>
                        <p><span className="font-medium">Telefone:</span> {delivery.driver.phone || "Não informado"}</p>
                      </div>
                    </div>
                  )}

                  {delivery.vehicle && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Veículo</h3>
                      <div className="mt-2 space-y-1">
                        <p><span className="font-medium">Placa:</span> {delivery.vehicle.plate}</p>
                        <p><span className="font-medium">Modelo:</span> {delivery.vehicle.model || "Não informado"}</p>
                      </div>
                    </div>
                  )}

                  {delivery.route && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Rota</h3>
                      <p className="mt-1">{delivery.route.name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {delivery.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{delivery.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Itens da Entrega</CardTitle>
              <CardDescription>
                Produtos incluídos nesta entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Produto</th>
                        <th className="text-left py-2 px-4">SKU</th>
                        <th className="text-left py-2 px-4">Quantidade</th>
                        <th className="text-right py-2 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{item.product.name}</td>
                          <td className="py-2 px-4">{item.product.sku}</td>
                          <td className="py-2 px-4">{item.quantity}</td>
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
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum item registrado para esta entrega.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Rastreamento</CardTitle>
              <CardDescription>
                Acompanhamento do status da entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusHistory.length > 0 ? (
                <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-muted">
                  {statusHistory.map((status, index) => (
                    <div key={status.id} className="relative">
                      <div className="absolute -left-8 mt-1.5 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                        <span className={`h-3 w-3 rounded-full ${getStatusColor(status.status).replace('bg-', 'bg-').replace('text-', '')}`}></span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status.status)}`}>
                            {status.status}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(status.date), "PPP 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {status.location && (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{status.location}</span>
                          </div>
                        )}
                        {status.notes && (
                          <p className="text-sm mt-1">{status.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum histórico de rastreamento disponível para esta entrega.
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
