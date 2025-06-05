"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProductionOrder {
  id: string;
  order_item_id: string;
  product_id: string;
  quantity: number;
  status: string;
  estimated_cost: number;
  actual_cost: number;
  start_date: string | null;
  end_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  product: {
    name: string;
    sku: string;
  };
  order_item: {
    order_id: string;
    order: {
      order_number: string;
      customer_name: string;
    };
  } | null;
}

interface ProductionStage {
  id: string;
  production_order_id: string;
  etapa: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  responsavel: string | null;
  observacoes: string;
}

interface ProductionSupply {
  id: string;
  production_order_id: string;
  supply_id: string;
  quantity: number;
  cost: number;
  supply: {
    name: string;
    unit_of_measurement_id: string;
    unit_of_measurement: {
      abbreviation: string;
    };
  };
}

export default function ProductionOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [productionOrder, setProductionOrder] = useState<ProductionOrder | null>(null);
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [supplies, setSupplies] = useState<ProductionSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProductionOrder = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("production_orders")
          .select(`
            *,
            product:product_id(name, sku),
            order_item:order_item_id(
              order_id,
              order:order_id(order_number, customer_name)
            )
          `)
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setProductionOrder(data);

        // Fetch production stages
        const { data: stagesData, error: stagesError } = await supabase
          .from("historico_etapas_producao")
          .select("*")
          .eq("production_order_id", params.id)
          .order("data_inicio", { ascending: true });

        if (stagesError) throw stagesError;
        setStages(stagesData || []);

        // Fetch production supplies
        const { data: suppliesData, error: suppliesError } = await supabase
          .from("insumos_ordem_producao")
          .select(`
            *,
            supply:supply_id(
              name, 
              unit_of_measurement_id,
              unit_of_measurement:unit_of_measurement_id(abbreviation)
            )
          `)
          .eq("production_order_id", params.id);

        if (suppliesError) throw suppliesError;
        setSupplies(suppliesData || []);

      } catch (error) {
        console.error("Error fetching production order details:", error);
        // TODO: Show error toast
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProductionOrder();
    }
  }, [params.id, supabase]);

  const handleDelete = async () => {
    try {
      // First delete related records
      await Promise.all([
        supabase.from("historico_etapas_producao").delete().eq("production_order_id", params.id),
        supabase.from("insumos_ordem_producao").delete().eq("production_order_id", params.id)
      ]);
      
      // Then delete the production order
      const { error } = await supabase
        .from("production_orders")
        .delete()
        .eq("id", params.id);

      if (error) throw error;
      
      // Navigate back to production orders list
      router.push("/producao");
      // TODO: Show success toast
    } catch (error) {
      console.error("Error deleting production order:", error);
      // TODO: Show error toast
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleCompleteProduction = async () => {
    try {
      // Update production order status
      const { error } = await supabase
        .from("production_orders")
        .update({ 
          status: "Concluído",
          end_date: new Date().toISOString(),
          actual_cost: supplies.reduce((sum, supply) => sum + supply.cost, 0)
        })
        .eq("id", params.id);

      if (error) throw error;
      
      // Add final stage if not exists
      const finalStage = stages.find(stage => stage.etapa === "Finalização");
      if (!finalStage) {
        const { error: stageError } = await supabase
          .from("historico_etapas_producao")
          .insert({
            production_order_id: params.id,
            etapa: "Finalização",
            status: "Concluído",
            data_inicio: new Date().toISOString(),
            data_fim: new Date().toISOString(),
            observacoes: "Produção finalizada"
          });
        
        if (stageError) throw stageError;
      } else {
        // Update existing final stage
        const { error: updateStageError } = await supabase
          .from("historico_etapas_producao")
          .update({
            status: "Concluído",
            data_fim: new Date().toISOString()
          })
          .eq("id", finalStage.id);
        
        if (updateStageError) throw updateStageError;
      }
      
      // Update stock
      if (productionOrder?.product_id) {
        // Get default stock location
        const { data: locationData } = await supabase
          .from("stock_locations")
          .select("id")
          .eq("name", "Produção")
          .single();
        
        const locationId = locationData?.id;
        
        if (locationId) {
          // Register stock movement
          const { error: movementError } = await supabase
            .from("stock_movements")
            .insert({
              product_id: productionOrder.product_id,
              location_id: locationId,
              quantity: productionOrder.quantity,
              movement_type: "entrada",
              reference_id: params.id,
              reference_type: "production_order",
              notes: "Entrada por produção"
            });
          
          if (movementError) throw movementError;
        }
      }
      
      // Refresh data
      const { data, error: refreshError } = await supabase
        .from("production_orders")
        .select(`
          *,
          product:product_id(name, sku),
          order_item:order_item_id(
            order_id,
            order:order_id(order_number, customer_name)
          )
        `)
        .eq("id", params.id)
        .single();

      if (refreshError) throw refreshError;
      setProductionOrder(data);
      
      // Refresh stages
      const { data: stagesData, error: stagesError } = await supabase
        .from("historico_etapas_producao")
        .select("*")
        .eq("production_order_id", params.id)
        .order("data_inicio", { ascending: true });

      if (stagesError) throw stagesError;
      setStages(stagesData || []);
      
      // TODO: Show success toast
    } catch (error) {
      console.error("Error completing production order:", error);
      // TODO: Show error toast
    } finally {
      setCompleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes da ordem de produção...</p>
      </div>
    );
  }

  if (!productionOrder) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Ordem de produção não encontrada.</p>
        <Button onClick={() => router.push("/producao")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista de ordens de produção
        </Button>
      </div>
    );
  }

  const isCompleted = productionOrder.status === "Concluído";
  const isCancelled = productionOrder.status === "Cancelado";

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/producao")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          {!isCompleted && !isCancelled && (
            <>
              <Button variant="outline" onClick={() => router.push(`/producao/editar/${productionOrder.id}`)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>

              <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Produção
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Finalizar produção</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja finalizar esta ordem de produção? Isso irá atualizar o estoque e não poderá ser desfeito.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCompleteProduction}>Finalizar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          {!isCompleted && (
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
                    Tem certeza que deseja excluir esta ordem de produção? Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ordem de Produção: {productionOrder.product?.name}</CardTitle>
            <CardDescription>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  productionOrder.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                  productionOrder.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                  productionOrder.status === 'Em Produção' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {productionOrder.status}
                </span>
                {productionOrder.order_item && (
                  <span className="text-gray-500">
                    Pedido #{productionOrder.order_item.order?.order_number}
                  </span>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="stages">Etapas</TabsTrigger>
                <TabsTrigger value="supplies">Insumos</TabsTrigger>
                <TabsTrigger value="notes">Observações</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Produto</h3>
                    <p>{productionOrder.product?.name || "Produto não encontrado"}</p>
                    <p className="text-sm text-gray-500">SKU: {productionOrder.product?.sku || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Quantidade</h3>
                    <p>{productionOrder.quantity}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custo Estimado</h3>
                    <p>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(productionOrder.estimated_cost)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custo Real</h3>
                    <p>
                      {productionOrder.actual_cost > 0 
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(productionOrder.actual_cost)
                        : "Não finalizado"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Início</h3>
                    <p>
                      {productionOrder.start_date
                        ? format(new Date(productionOrder.start_date), "dd/MM/yyyy", { locale: ptBR })
                        : "Não iniciada"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Término</h3>
                    <p>
                      {productionOrder.end_date
                        ? format(new Date(productionOrder.end_date), "dd/MM/yyyy", { locale: ptBR })
                        : "Em andamento"}
                    </p>
                  </div>
                  {productionOrder.order_item && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                      <p>{productionOrder.order_item.order?.customer_name || "Cliente não encontrado"}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Criação</h3>
                    <p>
                      {productionOrder.created_at
                        ? format(new Date(productionOrder.created_at), "dd/MM/yyyy", { locale: ptBR })
                        : "Data não disponível"}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="stages" className="mt-4">
                {stages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      {/* Timeline items */}
                      {stages.map((stage, index) => (
                        <div key={stage.id} className="relative pl-10 pb-8">
                          {/* Timeline dot */}
                          <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${
                            stage.status === 'Concluído' ? 'bg-green-100' :
                            stage.status === 'Em Andamento' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            {stage.status === 'Concluído' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="bg-white p-4 rounded-lg border">
                            <h4 className="font-medium">{stage.etapa}</h4>
                            <p className="text-sm text-gray-500">
                              Status: <span className={
                                stage.status === 'Concluído' ? 'text-green-600' :
                                stage.status === 'Em Andamento' ? 'text-blue-600' :
                                'text-yellow-600'
                              }>{stage.status}</span>
                            </p>
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                              <span>Início: {format(new Date(stage.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</span>
                              {stage.data_fim && (
                                <span>Fim: {format(new Date(stage.data_fim), "dd/MM/yyyy", { locale: ptBR })}</span>
                              )}
                            </div>
                            {stage.responsavel && (
                              <p className="text-sm text-gray-500">Responsável: {stage.responsavel}</p>
                            )}
                            {stage.observacoes && (
                              <p className="text-sm mt-2">{stage.observacoes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhuma etapa registrada para esta ordem de produção.</p>
                )}
                {!isCompleted && !isCancelled && (
                  <div className="mt-4">
                    <Button onClick={() => router.push(`/producao/etapas/nova?ordem=${productionOrder.id}`)}>
                      Adicionar Nova Etapa
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="supplies" className="mt-4">
                {supplies.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Insumo</th>
                          <th className="text-right py-2">Quantidade</th>
                          <th className="text-right py-2">Custo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplies.map((supply) => (
                          <tr key={supply.id} className="border-b">
                            <td className="py-2">{supply.supply?.name || "Insumo não encontrado"}</td>
                            <td className="py-2 text-right">
                              {supply.quantity} {supply.supply?.unit_of_measurement?.abbreviation || "un"}
                            </td>
                            <td className="py-2 text-right">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(supply.cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t">
                          <td colSpan={2} className="py-2 text-right font-medium">Total:</td>
                          <td className="py-2 text-right font-bold">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(supplies.reduce((sum, supply) => sum + supply.cost, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum insumo registrado para esta ordem de produção.</p>
                )}
                {!isCompleted && !isCancelled && (
                  <div className="mt-4">
                    <Button onClick={() => router.push(`/producao/insumos/novo?ordem=${productionOrder.id}`)}>
                      Adicionar Insumo
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  {productionOrder.notes ? (
                    <p className="whitespace-pre-wrap">{productionOrder.notes}</p>
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
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className={`text-lg font-bold ${
                productionOrder.status === 'Concluído' ? 'text-green-600' :
                productionOrder.status === 'Cancelado' ? 'text-red-600' :
                productionOrder.status === 'Em Produção' ? 'text-blue-600' :
                'text-yellow-600'
              }`}>
                {productionOrder.status}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Etapas Concluídas</h3>
              <p className="text-2xl font-bold">
                {stages.filter(stage => stage.status === 'Concluído').length}/{stages.length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Custo Total</h3>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(supplies.reduce((sum, supply) => sum + supply.cost, 0))}
              </p>
            </div>
            {productionOrder.start_date && !productionOrder.end_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tempo em Produção</h3>
                <p>
                  {Math.ceil((new Date().getTime() - new Date(productionOrder.start_date).getTime()) / (1000 * 60 * 60 * 24))} dias
                </p>
              </div>
            )}
          </CardContent>
          {productionOrder.order_item && (
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/pedidos/${productionOrder.order_item?.order_id}`)}
              >
                Ver Pedido Original
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
