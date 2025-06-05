"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Trash2, Package, AlertTriangle, Truck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Supply {
  id: string;
  name: string;
  description: string;
  unit_of_measurement_id: string;
  unit_of_measurement: {
    name: string;
    abbreviation: string;
  };
  cost: number;
  current_stock: number;
  min_stock: number;
  supplier_id: string;
  supplier: {
    name: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Component {
  id: string;
  component_id: string;
  component_name: string;
  quantity: number;
}

interface StockMovement {
  id: string;
  quantity: number;
  movement_type: string;
  reference_type: string;
  notes: string;
  created_at: string;
}

export default function SupplyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [supply, setSupply] = useState<Supply | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchSupplyDetails = async () => {
      setLoading(true);
      try {
        // Buscar detalhes do insumo
        const { data: supplyData, error: supplyError } = await supabase
          .from("supplies")
          .select(`
            *,
            unit_of_measurement:unit_of_measurement_id (name, abbreviation),
            supplier:supplier_id (name)
          `)
          .eq("id", params.id)
          .single();

        if (supplyError) throw supplyError;
        setSupply(supplyData);

        // Buscar componentes relacionados
        const { data: componentsData, error: componentsError } = await supabase
          .from("componente_insumo")
          .select(`
            id,
            component_id,
            components:component_id (name),
            quantity
          `)
          .eq("supply_id", params.id);

        if (!componentsError && componentsData) {
          setComponents(componentsData.map(item => ({
            id: item.id,
            component_id: item.component_id,
            component_name: item.components?.name || "Componente desconhecido",
            quantity: item.quantity
          })));
        }

        // Buscar movimentações de estoque
        const { data: movementsData, error: movementsError } = await supabase
          .from("stock_movements")
          .select("*")
          .eq("product_id", params.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!movementsError) {
          setStockMovements(movementsData || []);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do insumo:", error);
        // TODO: Mostrar mensagem de erro
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSupplyDetails();
    }
  }, [params.id, supabase]);

  const handleEdit = () => {
    // Abrir modal de edição ou navegar para página de edição
    // Por enquanto, apenas mostra um alerta
    alert("Funcionalidade de edição será implementada em breve");
  };

  const handleDelete = async () => {
    if (!supply) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o insumo ${supply.name}?`)) {
      try {
        const { error } = await supabase
          .from("supplies")
          .delete()
          .eq("id", supply.id);
          
        if (error) throw error;
        
        router.push("/insumos");
      } catch (error) {
        console.error("Erro ao excluir insumo:", error);
        alert("Não foi possível excluir o insumo. Verifique se não há registros relacionados.");
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getStockStatus = () => {
    if (!supply) return { text: "Desconhecido", class: "bg-gray-100 text-gray-800" };
    
    if (supply.current_stock === 0) {
      return { text: "Sem estoque", class: "bg-red-100 text-red-800" };
    } else if (supply.current_stock < supply.min_stock) {
      return { text: "Estoque baixo", class: "bg-yellow-100 text-yellow-800" };
    } else {
      return { text: "Estoque normal", class: "bg-green-100 text-green-800" };
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'entrada':
        return 'bg-green-100 text-green-800';
      case 'saída':
      case 'saida':
        return 'bg-red-100 text-red-800';
      case 'ajuste':
        return 'bg-blue-100 text-blue-800';
      case 'transferência':
      case 'transferencia':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes do insumo...</p>
      </div>
    );
  }

  if (!supply) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Insumo não encontrado</p>
        <Button onClick={handleBack} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Insumo</h1>
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
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{supply.name}</CardTitle>
              <CardDescription>
                {supply.is_active ? (
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
                  <p><span className="font-medium">Unidade:</span> {supply.unit_of_measurement?.name || "Não informado"} ({supply.unit_of_measurement?.abbreviation || ""})</p>
                  <p><span className="font-medium">Custo:</span> {
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(supply.cost)
                  }</p>
                  <p><span className="font-medium">Fornecedor:</span> {
                    supply.supplier ? (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto" 
                        onClick={() => router.push(`/fornecedores/${supply.supplier_id}`)}
                      >
                        {supply.supplier.name}
                      </Button>
                    ) : "Não informado"
                  }</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Estoque</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <p><span className="font-medium">Quantidade Atual:</span> {supply.current_stock} {supply.unit_of_measurement?.abbreviation || "un"}</p>
                    <span className={`px-3 py-1 rounded-full text-sm ${stockStatus.class}`}>
                      {stockStatus.text}
                    </span>
                  </div>
                  <p><span className="font-medium">Estoque Mínimo:</span> {supply.min_stock} {supply.unit_of_measurement?.abbreviation || "un"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {supply.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{supply.description}</p>
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
                  supply.created_at ? format(new Date(supply.created_at), "PPP", { locale: ptBR }) : "N/A"
                }</p>
                <p><span className="font-medium">Última Atualização:</span> {
                  supply.updated_at ? format(new Date(supply.updated_at), "PPP", { locale: ptBR }) : "N/A"
                }</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações de Estoque</CardTitle>
              <CardDescription>
                Últimas movimentações deste insumo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockMovements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Data</th>
                        <th className="text-left py-2 px-4">Tipo</th>
                        <th className="text-left py-2 px-4">Quantidade</th>
                        <th className="text-left py-2 px-4">Referência</th>
                        <th className="text-left py-2 px-4">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockMovements.map((movement) => (
                        <tr key={movement.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">
                            {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm")}
                          </td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getMovementTypeColor(movement.movement_type)}`}>
                              {movement.movement_type}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            {movement.quantity} {supply.unit_of_measurement?.abbreviation || "un"}
                          </td>
                          <td className="py-2 px-4">{movement.reference_type || "-"}</td>
                          <td className="py-2 px-4">{movement.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhuma movimentação de estoque registrada para este insumo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                {supply.current_stock < supply.min_stock ? (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Estoque abaixo do mínimo</p>
                      <p className="text-sm text-muted-foreground">
                        O estoque atual ({supply.current_stock} {supply.unit_of_measurement?.abbreviation || "un"}) 
                        está abaixo do mínimo recomendado ({supply.min_stock} {supply.unit_of_measurement?.abbreviation || "un"}).
                      </p>
                    </div>
                    <Button variant="outline" className="ml-auto" onClick={() => router.push("/compras")}>
                      <Truck className="h-4 w-4 mr-2" />
                      Solicitar Compra
                    </Button>
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    Não há alertas de estoque para este insumo.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Componentes Relacionados</CardTitle>
              <CardDescription>
                Componentes que utilizam este insumo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {components.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Componente</th>
                        <th className="text-left py-2 px-4">Quantidade</th>
                        <th className="text-right py-2 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.map((component) => (
                        <tr key={component.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{component.component_name}</td>
                          <td className="py-2 px-4">{component.quantity} {supply.unit_of_measurement?.abbreviation || "un"}</td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/componentes/${component.component_id}`)}
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
                    Este insumo não está sendo utilizado em nenhum componente.
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
                Registro de alterações e atividades relacionadas a este insumo
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
