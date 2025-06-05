"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Trash2, Package, Truck, FileText, ShoppingBag, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

interface EstoqueItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  location: string;
  quantity: number;
  min_quantity: number;
  unit_of_measurement: string;
  last_update: string;
  created_at: string;
  updated_at: string;
}

interface Movimentacao {
  id: string;
  product_id: string;
  quantity: number;
  movement_type: string;
  reference_type: string;
  notes: string;
  created_at: string;
  created_by: string;
}

interface Produto {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
}

export default function EstoqueDetalhes() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [estoqueItem, setEstoqueItem] = useState<EstoqueItem | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    const fetchEstoqueItem = async () => {
      setLoading(true);
      try {
        // Buscar item de estoque
        const { data: estoqueData, error: estoqueError } = await supabase
          .from("stock_items")
          .select("*")
          .eq("id", params.id)
          .single();

        if (estoqueError) {
          throw estoqueError;
        }

        if (estoqueData) {
          setEstoqueItem(estoqueData);
          
          // Buscar produto relacionado
          const { data: produtoData, error: produtoError } = await supabase
            .from("products")
            .select("id, name, sku, price, cost")
            .eq("id", estoqueData.product_id)
            .single();

          if (!produtoError && produtoData) {
            setProduto(produtoData);
          }
          
          // Buscar movimentações de estoque
          const { data: movimentacoesData, error: movimentacoesError } = await supabase
            .from("stock_movements")
            .select("*")
            .eq("product_id", estoqueData.product_id)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!movimentacoesError && movimentacoesData) {
            setMovimentacoes(movimentacoesData);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do item de estoque:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do item de estoque.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEstoqueItem();
    }
  }, [params.id, supabase, toast]);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este item de estoque?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("stock_items")
        .delete()
        .eq("id", params.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Item de estoque excluído",
        description: "O item de estoque foi excluído com sucesso.",
      });
      
      router.push("/estoque");
    } catch (error) {
      console.error("Erro ao excluir item de estoque:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item de estoque.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMovementTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'entrada':
        return 'bg-green-100 text-green-800';
      case 'saída':
        return 'bg-red-100 text-red-800';
      case 'ajuste':
        return 'bg-yellow-100 text-yellow-800';
      case 'transferência':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstoqueStatus = () => {
    if (!estoqueItem) return { color: 'bg-gray-100 text-gray-800', text: 'Não disponível' };
    
    if (estoqueItem.quantity <= 0) {
      return { color: 'bg-red-100 text-red-800', text: 'Sem estoque' };
    } else if (estoqueItem.quantity < estoqueItem.min_quantity) {
      return { color: 'bg-yellow-100 text-yellow-800', text: 'Estoque baixo' };
    } else {
      return { color: 'bg-green-100 text-green-800', text: 'Estoque normal' };
    }
  };

  const calcularValorTotal = () => {
    if (!produto || !estoqueItem) return 0;
    return produto.cost * estoqueItem.quantity;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <p>Carregando detalhes do item de estoque...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!estoqueItem) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-lg font-medium mb-4">Item de estoque não encontrado</p>
              <Button onClick={() => router.push("/estoque")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista de estoque
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estoqueStatus = getEstoqueStatus();

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/estoque")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/estoque/editar/${params.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{estoqueItem.product_name}</CardTitle>
              <CardDescription>
                {estoqueItem.sku && `SKU: ${estoqueItem.sku}`}
              </CardDescription>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${estoqueStatus.color}`}>
              {estoqueStatus.text}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Quantidade em Estoque</h3>
              <p className="text-3xl font-bold">{estoqueItem.quantity} {estoqueItem.unit_of_measurement}</p>
              <p className="text-sm text-gray-500 mt-1">
                Estoque mínimo: {estoqueItem.min_quantity} {estoqueItem.unit_of_measurement}
              </p>
              {estoqueItem.quantity < estoqueItem.min_quantity && (
                <div className="flex items-center mt-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Abaixo do estoque mínimo</span>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Localização</h3>
              <p className="text-xl">{estoqueItem.location || 'Não especificada'}</p>
              <p className="text-sm text-gray-500 mt-1">
                Última atualização: {format(new Date(estoqueItem.last_update), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Valor em Estoque</h3>
              <p className="text-3xl font-bold">{formatCurrency(calcularValorTotal())}</p>
              <p className="text-sm text-gray-500 mt-1">
                Custo unitário: {formatCurrency(produto?.cost || 0)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => router.push(`/estoque/movimentacoes/nova?produto=${estoqueItem.product_id}&tipo=entrada`)}>
              Registrar Entrada
            </Button>
            <Button onClick={() => router.push(`/estoque/movimentacoes/nova?produto=${estoqueItem.product_id}&tipo=saida`)}>
              Registrar Saída
            </Button>
            <Button variant="outline" onClick={() => router.push(`/estoque/movimentacoes/nova?produto=${estoqueItem.product_id}&tipo=ajuste`)}>
              Ajuste de Estoque
            </Button>
            <Button variant="outline" onClick={() => router.push(`/produtos/${estoqueItem.product_id}`)}>
              Ver Produto
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-gray-500 border-t pt-4">
          <div className="w-full flex justify-between">
            <span>
              Cadastrado em: {estoqueItem.created_at && format(new Date(estoqueItem.created_at), "PPP", { locale: ptBR })}
            </span>
            <span>
              Última atualização: {estoqueItem.updated_at && format(new Date(estoqueItem.updated_at), "PPP", { locale: ptBR })}
            </span>
          </div>
        </CardFooter>
      </Card>

      <Tabs defaultValue="movimentacoes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="movimentacoes">Histórico de Movimentações</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos Relacionados</TabsTrigger>
          <TabsTrigger value="producao">Ordens de Produção</TabsTrigger>
        </TabsList>
        <TabsContent value="movimentacoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Histórico de Movimentações</CardTitle>
              <CardDescription>Últimas 20 movimentações deste item</CardDescription>
            </CardHeader>
            <CardContent>
              {movimentacoes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Data</th>
                        <th className="text-left py-3 px-4">Tipo</th>
                        <th className="text-right py-3 px-4">Quantidade</th>
                        <th className="text-left py-3 px-4">Referência</th>
                        <th className="text-left py-3 px-4">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimentacoes.map((movimentacao) => (
                        <tr key={movimentacao.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {format(new Date(movimentacao.created_at), "dd/MM/yyyy HH:mm")}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movimentacao.movement_type)}`}>
                              {movimentacao.movement_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {movimentacao.quantity} {estoqueItem.unit_of_measurement}
                          </td>
                          <td className="py-3 px-4">
                            {movimentacao.reference_type || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {movimentacao.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Nenhuma movimentação registrada para este item</p>
                  <Button onClick={() => router.push(`/estoque/movimentacoes/nova?produto=${estoqueItem.product_id}`)}>
                    Registrar Movimentação
                  </Button>
                </div>
              )}
            </CardContent>
            {movimentacoes.length > 0 && (
              <CardFooter>
                <Button onClick={() => router.push(`/estoque/movimentacoes?produto=${estoqueItem.product_id}`)}>
                  Ver Todas as Movimentações
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="pedidos">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Pedidos Relacionados</CardTitle>
              <CardDescription>Pedidos que incluem este produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Histórico de pedidos será implementado em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="producao">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ordens de Produção</CardTitle>
              <CardDescription>Ordens de produção que utilizam este produto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <Truck className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">Histórico de produção será implementado em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
