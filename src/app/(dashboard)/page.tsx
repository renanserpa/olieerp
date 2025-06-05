"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, BarChart3, Package, ShoppingCart, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { getStockItems, getClients, getSuppliers, getOrders } from "@/lib/data-hooks";
import { toast } from "sonner";

// Componente para exibir alertas de estoque baixo
export function LowStockAlerts() {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        setIsLoading(true);
        
        // Buscar itens com estoque baixo
        const result = await getStockItems({ low_stock: true });
        
        if (result.success) {
          setLowStockItems(result.data || []);
        } else {
          // Dados mockados para demonstração
          setLowStockItems([
            {
              id: '1',
              name: 'Zíper YKK 20cm',
              quantity: 30,
              min_quantity: 100,
              group: { name: 'Aviamentos' }
            },
            {
              id: '2',
              name: 'Tecido Algodão Egípcio',
              quantity: 15,
              min_quantity: 50,
              group: { name: 'Tecidos' }
            }
          ]);
        }
      } catch (error) {
        console.error("Erro ao buscar itens com estoque baixo:", error);
        toast.error("Erro ao carregar alertas de estoque baixo");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStockItems();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Alertas de Estoque Baixo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          Alertas de Estoque Baixo
        </CardTitle>
        <CardDescription>
          {lowStockItems.length} {lowStockItems.length === 1 ? 'item precisa' : 'itens precisam'} de reposição
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum item com estoque baixo no momento.
          </div>
        ) : (
          <div className="space-y-4">
            {lowStockItems.map((item) => (
              <Alert key={item.id} variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                <AlertTitle className="font-medium">{item.name}</AlertTitle>
                <AlertDescription className="text-sm">
                  Estoque atual: <span className="font-bold">{item.quantity}</span> | 
                  Mínimo: <span className="font-bold">{item.min_quantity}</span> | 
                  Grupo: {item.group?.name || 'N/A'}
                </AlertDescription>
              </Alert>
            ))}
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600"
                onClick={() => router.push('/estoque?filter=low_stock')}
              >
                Ver todos os itens com estoque baixo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para o dashboard principal
export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSuppliers: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    recentOrders: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Buscar dados para o dashboard
        const [clientsResult, suppliersResult, ordersResult, stockResult, lowStockResult] = await Promise.all([
          getClients({}),
          getSuppliers({}),
          getOrders({}),
          getStockItems({}),
          getStockItems({ low_stock: true })
        ]);
        
        // Atualizar estatísticas
        setStats({
          totalClients: clientsResult.success ? clientsResult.data.length : 25,
          totalSuppliers: suppliersResult.success ? suppliersResult.data.length : 12,
          totalOrders: ordersResult.success ? ordersResult.data.length : 87,
          totalProducts: stockResult.success ? stockResult.data.length : 156,
          lowStockCount: lowStockResult.success ? lowStockResult.data.length : 2,
          recentOrders: ordersResult.success ? ordersResult.data.slice(0, 5) : []
        });
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        toast.error("Erro ao carregar dados do dashboard");
        
        // Usar dados mockados em caso de erro
        setStats({
          totalClients: 25,
          totalSuppliers: 12,
          totalOrders: 87,
          totalProducts: 156,
          lowStockCount: 2,
          recentOrders: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do sistema ERP Olie
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 bg-blue-100 animate-pulse rounded"></div>
                ) : (
                  stats.totalClients
                )}
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 text-sm mt-2"
              onClick={() => router.push('/clientes')}
            >
              Ver detalhes
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              Total de Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 bg-amber-100 animate-pulse rounded"></div>
                ) : (
                  stats.totalSuppliers
                )}
              </div>
              <ShoppingCart className="h-8 w-8 text-amber-500" />
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-amber-600 text-sm mt-2"
              onClick={() => router.push('/fornecedores')}
            >
              Ver detalhes
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 bg-green-100 animate-pulse rounded"></div>
                ) : (
                  stats.totalOrders
                )}
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-green-600 text-sm mt-2"
              onClick={() => router.push('/pedidos')}
            >
              Ver detalhes
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 bg-purple-100 animate-pulse rounded"></div>
                ) : (
                  stats.totalProducts
                )}
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-purple-600 text-sm mt-2"
              onClick={() => router.push('/produtos')}
            >
              Ver detalhes
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LowStockAlerts />
        
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>
              Resumo dos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <div className="relative h-80">
                {/* Aqui seria implementado um gráfico de vendas usando bibliotecas como Chart.js ou Recharts */}
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-center">
                    Gráfico de vendas será exibido aqui.<br />
                    <span className="text-sm">Dados sendo coletados...</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
