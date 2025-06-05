"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Trash2, Package, List, Layers } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Component {
  id: string;
  name: string;
  description: string;
  unit_of_measurement_id: string;
  unit_of_measurement: {
    name: string;
    abbreviation: string;
  };
  cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Supply {
  id: string;
  supply_id: string;
  supply_name: string;
  quantity: number;
}

interface Product {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
}

export default function ComponentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [component, setComponent] = useState<Component | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchComponentDetails = async () => {
      setLoading(true);
      try {
        // Buscar detalhes do componente
        const { data: componentData, error: componentError } = await supabase
          .from("components")
          .select(`
            *,
            unit_of_measurement:unit_of_measurement_id (name, abbreviation)
          `)
          .eq("id", params.id)
          .single();

        if (componentError) throw componentError;
        setComponent(componentData);

        // Buscar insumos relacionados
        const { data: suppliesData, error: suppliesError } = await supabase
          .from("componente_insumo")
          .select(`
            id,
            supply_id,
            supplies:supply_id (name),
            quantity
          `)
          .eq("component_id", params.id);

        if (!suppliesError && suppliesData) {
          setSupplies(suppliesData.map(item => ({
            id: item.id,
            supply_id: item.supply_id,
            supply_name: item.supplies?.name || "Insumo desconhecido",
            quantity: item.quantity
          })));
        }

        // Buscar produtos que usam este componente
        const { data: productsData, error: productsError } = await supabase
          .from("produto_componente")
          .select(`
            id,
            product_id,
            products:product_id (name),
            quantity
          `)
          .eq("component_id", params.id);

        if (!productsError && productsData) {
          setProducts(productsData.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.products?.name || "Produto desconhecido",
            quantity: item.quantity
          })));
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do componente:", error);
        // TODO: Mostrar mensagem de erro
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchComponentDetails();
    }
  }, [params.id, supabase]);

  const handleEdit = () => {
    // Abrir modal de edição ou navegar para página de edição
    // Por enquanto, apenas mostra um alerta
    alert("Funcionalidade de edição será implementada em breve");
  };

  const handleDelete = async () => {
    if (!component) return;
    
    if (window.confirm(`Tem certeza que deseja excluir o componente ${component.name}?`)) {
      try {
        const { error } = await supabase
          .from("components")
          .delete()
          .eq("id", component.id);
          
        if (error) throw error;
        
        router.push("/componentes");
      } catch (error) {
        console.error("Erro ao excluir componente:", error);
        alert("Não foi possível excluir o componente. Verifique se não há registros relacionados.");
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes do componente...</p>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Componente não encontrado</p>
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
          <h1 className="text-2xl font-bold">Detalhes do Componente</h1>
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
          <TabsTrigger value="supplies">Insumos</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{component.name}</CardTitle>
              <CardDescription>
                {component.is_active ? (
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
                  <p><span className="font-medium">Unidade:</span> {component.unit_of_measurement?.name || "Não informado"} ({component.unit_of_measurement?.abbreviation || ""})</p>
                  <p><span className="font-medium">Custo:</span> {
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(component.cost)
                  }</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Informações Adicionais</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Data de Cadastro:</span> {
                    component.created_at ? format(new Date(component.created_at), "PPP", { locale: ptBR }) : "N/A"
                  }</p>
                  <p><span className="font-medium">Última Atualização:</span> {
                    component.updated_at ? format(new Date(component.updated_at), "PPP", { locale: ptBR }) : "N/A"
                  }</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {component.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{component.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="supplies">
          <Card>
            <CardHeader>
              <CardTitle>Insumos Utilizados</CardTitle>
              <CardDescription>
                Insumos necessários para este componente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplies.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Insumo</th>
                        <th className="text-left py-2 px-4">Quantidade</th>
                        <th className="text-right py-2 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplies.map((supply) => (
                        <tr key={supply.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{supply.supply_name}</td>
                          <td className="py-2 px-4">{supply.quantity}</td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/insumos/${supply.supply_id}`)}
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
                  <List className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Este componente não possui insumos registrados.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Adicionar Insumos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Relacionados</CardTitle>
              <CardDescription>
                Produtos que utilizam este componente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Produto</th>
                        <th className="text-left py-2 px-4">Quantidade</th>
                        <th className="text-right py-2 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{product.product_name}</td>
                          <td className="py-2 px-4">{product.quantity}</td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/produtos/${product.product_id}`)}
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
                    Este componente não está sendo utilizado em nenhum produto.
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
                Registro de alterações e atividades relacionadas a este componente
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
