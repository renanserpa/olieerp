"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  cost: number;
  category_id: string;
  unit_of_measurement_id: string;
  min_stock: number;
  is_active: boolean;
  is_manufactured: boolean;
  created_at: string;
  updated_at: string;
  category: {
    name: string;
  };
  unit_of_measurement: {
    name: string;
    abbreviation: string;
  };
}

interface StockItem {
  id: string;
  location_id: string;
  quantity: number;
  min_quantity: number;
  location: {
    name: string;
  };
}

interface Component {
  id: string;
  component_id: string;
  quantity: number;
  component: {
    name: string;
  };
}

interface Supply {
  id: string;
  supply_id: string;
  quantity: number;
  supply: {
    name: string;
  };
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [product, setProduct] = useState<Product | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            category:category_id(name),
            unit_of_measurement:unit_of_measurement_id(name, abbreviation)
          `)
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setProduct(data);

        // Fetch stock items
        const { data: stockData, error: stockError } = await supabase
          .from("stock_items")
          .select(`
            id,
            location_id,
            quantity,
            min_quantity,
            location:location_id(name)
          `)
          .eq("product_id", params.id);

        if (stockError) throw stockError;
        setStockItems(stockData || []);

        // Fetch components
        const { data: componentsData, error: componentsError } = await supabase
          .from("produto_componente")
          .select(`
            id,
            component_id,
            quantity,
            component:component_id(name)
          `)
          .eq("product_id", params.id);

        if (componentsError) throw componentsError;
        setComponents(componentsData || []);

        // Fetch supplies
        const { data: suppliesData, error: suppliesError } = await supabase
          .from("produto_insumo")
          .select(`
            id,
            supply_id,
            quantity,
            supply:supply_id(name)
          `)
          .eq("product_id", params.id);

        if (suppliesError) throw suppliesError;
        setSupplies(suppliesData || []);

      } catch (error) {
        console.error("Error fetching product details:", error);
        // TODO: Show error toast
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, supabase]);

  const handleDelete = async () => {
    try {
      // First delete related records
      await Promise.all([
        supabase.from("produto_componente").delete().eq("product_id", params.id),
        supabase.from("produto_insumo").delete().eq("product_id", params.id),
        supabase.from("stock_items").delete().eq("product_id", params.id)
      ]);
      
      // Then delete the product
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", params.id);

      if (error) throw error;
      
      // Navigate back to products list
      router.push("/produtos");
      // TODO: Show success toast
    } catch (error) {
      console.error("Error deleting product:", error);
      // TODO: Show error toast
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes do produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Produto não encontrado.</p>
        <Button onClick={() => router.push("/produtos")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista de produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/produtos")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/produtos/editar/${product.id}`)}>
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
                  Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
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
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>
              <div className="flex gap-2">
                <span className="text-gray-500">SKU: {product.sku || "Não definido"}</span>
                {product.is_active ? (
                  <span className="text-green-600 font-medium">Ativo</span>
                ) : (
                  <span className="text-red-600 font-medium">Inativo</span>
                )}
                {product.is_manufactured && (
                  <span className="text-blue-600 font-medium">Fabricação Própria</span>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="stock">Estoque</TabsTrigger>
                <TabsTrigger value="components">Componentes</TabsTrigger>
                <TabsTrigger value="description">Descrição</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Preço de Venda</h3>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(product.price)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Custo</h3>
                    <p>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(product.cost)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Margem</h3>
                    <p>
                      {product.cost > 0
                        ? `${Math.round(((product.price - product.cost) / product.cost) * 100)}%`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Categoria</h3>
                    <p>{product.category?.name || "Não categorizado"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Unidade de Medida</h3>
                    <p>{product.unit_of_measurement?.name || "Não definida"} ({product.unit_of_measurement?.abbreviation || "-"})</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Estoque Mínimo</h3>
                    <p>{product.min_stock} {product.unit_of_measurement?.abbreviation || "un"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Criação</h3>
                    <p>
                      {product.created_at
                        ? format(new Date(product.created_at), "dd/MM/yyyy", { locale: ptBR })
                        : "Data não disponível"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Última Atualização</h3>
                    <p>
                      {product.updated_at
                        ? format(new Date(product.updated_at), "dd/MM/yyyy", { locale: ptBR })
                        : "Data não disponível"}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="stock" className="mt-4">
                {stockItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Localização</th>
                          <th className="text-right py-2">Quantidade</th>
                          <th className="text-right py-2">Mínimo</th>
                          <th className="text-right py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockItems.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2">{item.location?.name || "Localização não definida"}</td>
                            <td className="py-2 text-right">{item.quantity}</td>
                            <td className="py-2 text-right">{item.min_quantity || product.min_stock}</td>
                            <td className="py-2 text-right">
                              {item.quantity <= (item.min_quantity || product.min_stock) ? (
                                <span className="text-red-600 font-medium">Baixo</span>
                              ) : (
                                <span className="text-green-600 font-medium">OK</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t">
                          <td className="py-2 font-medium">Total:</td>
                          <td className="py-2 text-right font-bold">
                            {stockItems.reduce((sum, item) => sum + item.quantity, 0)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">Este produto ainda não possui itens em estoque.</p>
                )}
                <div className="mt-4">
                  <Button onClick={() => router.push("/estoque/movimentacoes/novo?produto=" + product.id)}>
                    Registrar Movimentação
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="components" className="mt-4">
                {product.is_manufactured ? (
                  <div>
                    <h3 className="font-medium mb-2">Componentes</h3>
                    {components.length > 0 ? (
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Componente</th>
                              <th className="text-right py-2">Quantidade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {components.map((comp) => (
                              <tr key={comp.id} className="border-b">
                                <td className="py-2">{comp.component?.name || "Componente não encontrado"}</td>
                                <td className="py-2 text-right">{comp.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 mb-6">Este produto não possui componentes registrados.</p>
                    )}

                    <h3 className="font-medium mb-2">Insumos Diretos</h3>
                    {supplies.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Insumo</th>
                              <th className="text-right py-2">Quantidade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplies.map((supply) => (
                              <tr key={supply.id} className="border-b">
                                <td className="py-2">{supply.supply?.name || "Insumo não encontrado"}</td>
                                <td className="py-2 text-right">{supply.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">Este produto não possui insumos diretos registrados.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Este produto não é fabricado internamente.</p>
                )}
              </TabsContent>
              <TabsContent value="description" className="mt-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  {product.description ? (
                    <p className="whitespace-pre-wrap">{product.description}</p>
                  ) : (
                    <p className="text-gray-500">Nenhuma descrição registrada.</p>
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
              <h3 className="text-sm font-medium text-gray-500">Estoque Total</h3>
              <p className="text-2xl font-bold">
                {stockItems.reduce((sum, item) => sum + item.quantity, 0)} {product.unit_of_measurement?.abbreviation || "un"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Valor em Estoque</h3>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stockItems.reduce((sum, item) => sum + item.quantity, 0) * product.cost)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tipo de Produto</h3>
              <p>{product.is_manufactured ? "Fabricação Própria" : "Revenda/Terceiros"}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/pedidos/novo?produto=${product.id}`)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Criar Pedido com este Produto
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/producao/novo?produto=${product.id}`)}
            >
              Criar Ordem de Produção
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
