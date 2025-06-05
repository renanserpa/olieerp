"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Truck, Users } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ReportExporter } from "../../financeiro/_components/ReportExporter";

interface DashboardProps {
  className?: string;
}

interface KpiData {
  totalRevenue: number;
  totalExpenses: number;
  totalOrders: number;
  totalProducts: number;
  totalDeliveries: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
}

interface ChartData {
  salesByCategory: Array<{name: string; value: number}>;
  salesByMonth: Array<{name: string; receitas: number; despesas: number}>;
  topProducts: Array<{name: string; value: number}>;
  deliveryStatus: Array<{name: string; value: number}>;
  salesByDivision: Array<{name: string; value: number}>;
}

export function Dashboard({ className }: DashboardProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [kpiData, setKpiData] = useState<KpiData>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalDeliveries: 0,
    totalCustomers: 0,
    revenueChange: 0,
    ordersChange: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    salesByCategory: [],
    salesByMonth: [],
    topProducts: [],
    deliveryStatus: [],
    salesByDivision: []
  });
  const [divisions, setDivisions] = useState<Array<{id: string; name: string}>>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const DIVISION_COLORS = {
    'Ateliê': '#F0FFBE',
    'Casa': '#A5854E',
    'Pet': '#6B7280',
    'Music': '#8B5CF6',
    'Wood': '#D97706',
    'Brand': '#10B981'
  };
  
  // Carregar dados iniciais com debounce para evitar múltiplas chamadas
  const fetchInitialData = useCallback(async () => {
    try {
      // Buscar divisões da marca
      const { data: divisionsData, error: divisionsError } = await supabase
        .from("divisions")
        .select("id, name")
        .order("name");
        
      if (divisionsError) throw divisionsError;
      setDivisions(divisionsData || []);
      
      // Carregar dados do dashboard com os filtros iniciais
      await fetchDashboardData();
    } catch (error: any) {
      console.error("Erro ao carregar dados iniciais:", error);
      toast.error(`Erro ao carregar dados: ${error.message}`);
    }
  }, []);
  
  useEffect(() => {
    fetchInitialData();
    
    // Configurar atualização automática a cada 5 minutos
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchInitialData]);
  
  // Buscar dados do dashboard com base nos filtros
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Parâmetros de filtro
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      const divisionId = divisionFilter !== "all" ? divisionFilter : null;
      
      // 1. Buscar KPIs
      const kpis = await fetchKpiData(fromDate, toDate, divisionId);
      setKpiData(kpis);
      
      // 2. Buscar dados para gráficos
      const charts = await fetchChartData(fromDate, toDate, divisionId);
      setChartData(charts);
      
      toast.success("Dashboard atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao buscar dados do dashboard:", error);
      toast.error(`Erro ao carregar dashboard: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar dados de KPI
  const fetchKpiData = async (fromDate: string, toDate: string, divisionId: string | null): Promise<KpiData> => {
    try {
      // Período anterior para comparação (mesmo intervalo)
      const daysDiff = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24));
      const prevFromDate = format(subDays(new Date(fromDate), daysDiff), "yyyy-MM-dd");
      const prevToDate = format(subDays(new Date(toDate), 1), "yyyy-MM-dd");
      
      // 1. Total de Receitas
      let query = supabase
        .from("financial_transactions")
        .select("amount")
        .eq("type", "income")
        .gte("date", fromDate)
        .lte("date", toDate);
        
      if (divisionId) {
        query = query.eq("division_id", divisionId);
      }
      
      const { data: revenueData, error: revenueError } = await query;
      if (revenueError) throw revenueError;
      
      const totalRevenue = revenueData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      
      // 1.1 Receitas do período anterior para comparação
      let prevQuery = supabase
        .from("financial_transactions")
        .select("amount")
        .eq("type", "income")
        .gte("date", prevFromDate)
        .lte("date", prevToDate);
        
      if (divisionId) {
        prevQuery = prevQuery.eq("division_id", divisionId);
      }
      
      const { data: prevRevenueData, error: prevRevenueError } = await prevQuery;
      if (prevRevenueError) throw prevRevenueError;
      
      const prevTotalRevenue = prevRevenueData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const revenueChange = prevTotalRevenue > 0 
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
        : 100;
      
      // 2. Total de Despesas
      let expenseQuery = supabase
        .from("financial_transactions")
        .select("amount")
        .eq("type", "expense")
        .gte("date", fromDate)
        .lte("date", toDate);
        
      if (divisionId) {
        expenseQuery = expenseQuery.eq("division_id", divisionId);
      }
      
      const { data: expenseData, error: expenseError } = await expenseQuery;
      if (expenseError) throw expenseError;
      
      const totalExpenses = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      
      // 3. Total de Pedidos
      let orderQuery = supabase
        .from("orders")
        .select("id")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);
        
      if (divisionId) {
        orderQuery = orderQuery.eq("division_id", divisionId);
      }
      
      const { data: orderData, error: orderError } = await orderQuery;
      if (orderError) throw orderError;
      
      const totalOrders = orderData?.length || 0;
      
      // 3.1 Pedidos do período anterior para comparação
      let prevOrderQuery = supabase
        .from("orders")
        .select("id")
        .gte("created_at", prevFromDate)
        .lte("created_at", prevToDate);
        
      if (divisionId) {
        prevOrderQuery = prevOrderQuery.eq("division_id", divisionId);
      }
      
      const { data: prevOrderData, error: prevOrderError } = await prevOrderQuery;
      if (prevOrderError) throw prevOrderError;
      
      const prevTotalOrders = prevOrderData?.length || 0;
      const ordersChange = prevTotalOrders > 0 
        ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 
        : 100;
      
      // 4. Total de Produtos
      let productQuery = supabase
        .from("products")
        .select("id");
        
      if (divisionId) {
        productQuery = productQuery.eq("division_id", divisionId);
      }
      
      const { data: productData, error: productError } = await productQuery;
      if (productError) throw productError;
      
      const totalProducts = productData?.length || 0;
      
      // 5. Total de Entregas
      let deliveryQuery = supabase
        .from("deliveries")
        .select("id, orders!inner(division_id)")
        .gte("created_at", fromDate)
        .lte("created_at", toDate);
        
      if (divisionId) {
        deliveryQuery = deliveryQuery.eq("orders.division_id", divisionId);
      }
      
      const { data: deliveryData, error: deliveryError } = await deliveryQuery;
      if (deliveryError) throw deliveryError;
      
      const totalDeliveries = deliveryData?.length || 0;
      
      // 6. Total de Clientes
      let customerQuery = supabase
        .from("customers")
        .select("id");
        
      if (divisionId) {
        // Aqui precisaríamos de uma relação entre clientes e divisões,
        // ou buscar clientes que fizeram pedidos na divisão específica
        // Por simplicidade, vamos ignorar o filtro de divisão para clientes
      }
      
      const { data: customerData, error: customerError } = await customerQuery;
      if (customerError) throw customerError;
      
      const totalCustomers = customerData?.length || 0;
      
      return {
        totalRevenue,
        totalExpenses,
        totalOrders,
        totalProducts,
        totalDeliveries,
        totalCustomers,
        revenueChange,
        ordersChange
      };
    } catch (error) {
      console.error("Erro ao buscar KPIs:", error);
      throw error;
    }
  };
  
  // Buscar dados para gráficos
  const fetchChartData = async (fromDate: string, toDate: string, divisionId: string | null): Promise<ChartData> => {
    try {
      // 1. Vendas por Categoria
      let categoryQuery = supabase
        .from("order_items")
        .select(`
          quantity, price,
          products!inner(category_id, product_categories!inner(name)),
          orders!inner(created_at, division_id)
        `)
        .gte("orders.created_at", fromDate)
        .lte("orders.created_at", toDate);
        
      if (divisionId) {
        categoryQuery = categoryQuery.eq("orders.division_id", divisionId);
      }
      
      const { data: categoryData, error: categoryError } = await categoryQuery;
      if (categoryError) throw categoryError;
      
      // Agrupar por categoria
      const salesByCategory = categoryData?.reduce((acc, item) => {
        // Verificar se products e product_categories existem antes de acessar name
        // products e product_categories são arrays, então precisamos acessar o primeiro elemento de cada
        const categoryName = item.products && 
                            Array.isArray(item.products) && 
                            item.products[0]?.product_categories && 
                            Array.isArray(item.products[0].product_categories) && 
                            item.products[0].product_categories[0]?.name || "Sem categoria";
        const amount = item.quantity * item.price;
        
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        
        acc[categoryName] += amount;
        return acc;
      }, {} as Record<string, number>) || {};
      
      // Converter para array e ordenar
      const salesByCategoryArray = Object.entries(salesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Limitar a 6 categorias
      
      // 2. Vendas por Mês (últimos 6 meses)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: format(date, "yyyy-MM"),
          name: format(date, "MMM", { locale: ptBR })
        };
      }).reverse();
      
      const salesByMonth = await Promise.all(
        last6Months.map(async ({ month, name }) => {
          const startDate = `${month}-01`;
          const endDate = `${month}-${new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate()}`;
          
          // Receitas do mês
          let incomeQuery = supabase
            .from("financial_transactions")
            .select("amount")
            .eq("type", "income")
            .gte("date", startDate)
            .lte("date", endDate);
            
          if (divisionId) {
            incomeQuery = incomeQuery.eq("division_id", divisionId);
          }
          
          const { data: incomeData, error: incomeError } = await incomeQuery;
          if (incomeError) throw incomeError;
          
          const receitas = incomeData?.reduce((sum, item) => sum + item.amount, 0) || 0;
          
          // Despesas do mês
          let expenseQuery = supabase
            .from("financial_transactions")
            .select("amount")
            .eq("type", "expense")
            .gte("date", startDate)
            .lte("date", endDate);
            
          if (divisionId) {
            expenseQuery = expenseQuery.eq("division_id", divisionId);
          }
          
          const { data: expenseData, error: expenseError } = await expenseQuery;
          if (expenseError) throw expenseError;
          
          const despesas = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0;
          
          return { name, receitas, despesas };
        })
      );
      
      // 3. Top Produtos
      let productQuery = supabase
        .from("order_items")
        .select(`
          quantity, price,
          products!inner(name, division_id),
          orders!inner(created_at)
        `)
        .gte("orders.created_at", fromDate)
        .lte("orders.created_at", toDate);
        
      if (divisionId) {
        productQuery = productQuery.eq("products.division_id", divisionId);
      }
      
      const { data: productData, error: productError } = await productQuery;
      if (productError) throw productError;
      
      // Agrupar por produto
      const topProducts = productData?.reduce((acc, item) => {
        // products é um array, então precisamos acessar o primeiro elemento
        const productName = item.products && 
                           Array.isArray(item.products) && 
                           item.products[0]?.name || "Produto sem nome";
        const amount = item.quantity * item.price;
        
        if (!acc[productName]) {
          acc[productName] = 0;
        }
        
        acc[productName] += amount;
        return acc;
      }, {} as Record<string, number>) || {};
      
      // Converter para array e ordenar
      const topProductsArray = Object.entries(topProducts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 produtos
      
      // 4. Status de Entregas
      let deliveryStatusQuery = supabase
        .from("deliveries")
        .select(`
          id,
          global_statuses!inner(name),
          orders!inner(created_at, division_id)
        `)
        .gte("orders.created_at", fromDate)
        .lte("orders.created_at", toDate);
        
      if (divisionId) {
        deliveryStatusQuery = deliveryStatusQuery.eq("orders.division_id", divisionId);
      }
      
      const { data: deliveryStatusData, error: deliveryStatusError } = await deliveryStatusQuery;
      if (deliveryStatusError) throw deliveryStatusError;
      
      // Agrupar por status
      const deliveryStatus = deliveryStatusData?.reduce((acc, item) => {
        // global_statuses é um array, então precisamos acessar o primeiro elemento
        const statusName = item.global_statuses && 
                          Array.isArray(item.global_statuses) && 
                          item.global_statuses[0]?.name || "Status desconhecido";
        
        if (!acc[statusName]) {
          acc[statusName] = 0;
        }
        
        acc[statusName] += 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      // Converter para array
      const deliveryStatusArray = Object.entries(deliveryStatus)
        .map(([name, value]) => ({ name, value }));
      
      // 5. Vendas por Divisão (apenas quando não há filtro de divisão)
      let salesByDivision: Array<{name: string; value: number}> = [];
      
      if (!divisionId) {
        // Buscar vendas por divisão
        const { data: divisionSalesData, error: divisionSalesError } = await supabase
          .from("orders")
          .select(`
            total_amount,
            divisions!inner(name)
          `)
          .gte("created_at", fromDate)
          .lte("created_at", toDate);
          
        if (divisionSalesError) throw divisionSalesError;
        
        // Agrupar por divisão
        const salesByDivisionMap = divisionSalesData?.reduce((acc, item) => {
          // divisions é um array, então precisamos acessar o primeiro elemento
          const divisionName = item.divisions && 
                              Array.isArray(item.divisions) && 
                              item.divisions[0]?.name || "Divisão desconhecida";
          const amount = item.total_amount || 0;
          
          if (!acc[divisionName]) {
            acc[divisionName] = 0;
          }
          
          acc[divisionName] += amount;
          return acc;
        }, {} as Record<string, number>) || {};
        
        // Converter para array
        salesByDivision = Object.entries(salesByDivisionMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      }
      
      return {
        salesByCategory: salesByCategoryArray,
        salesByMonth,
        topProducts: topProductsArray,
        deliveryStatus: deliveryStatusArray,
        salesByDivision
      };
    } catch (error) {
      console.error("Erro ao buscar dados para gráficos:", error);
      throw error;
    }
  };
  
  // Aplicar filtros
  const handleApplyFilters = () => {
    fetchDashboardData();
  };
  
  // Resetar filtros
  const handleResetFilters = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    });
    setDivisionFilter("all");
    
    // Aplicar os filtros resetados
    setTimeout(() => {
      fetchDashboardData();
    }, 0);
  };
  
  // Períodos predefinidos
  const handlePredefinedPeriod = (period: string) => {
    const today = new Date();
    let from: Date, to: Date;
    
    switch (period) {
      case "today":
        from = today;
        to = today;
        break;
      case "yesterday":
        from = subDays(today, 1);
        to = subDays(today, 1);
        break;
      case "last7days":
        from = subDays(today, 6);
        to = today;
        break;
      case "last30days":
        from = subDays(today, 29);
        to = today;
        break;
      case "thisMonth":
        from = startOfMonth(today);
        to = today;
        break;
      default:
        from = startOfMonth(today);
        to = endOfMonth(today);
    }
    
    setDateRange({ from, to });
    
    // Aplicar o novo período
    setTimeout(() => {
      fetchDashboardData();
    }, 0);
  };
  
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Formatar percentual
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };
  
  // Renderizar indicador de tendência
  const renderTrend = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-500">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>{formatPercentage(value)}</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-500">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span>{formatPercentage(Math.abs(value))}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <span>0%</span>
        </div>
      );
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        
        <div className="flex flex-col md:flex-row gap-2">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full md:w-auto"
          />
          
          <Select
            value={divisionFilter}
            onValueChange={setDivisionFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Todas as divisões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as divisões</SelectItem>
              {divisions.map((division) => (
                <SelectItem key={division.id} value={division.id}>
                  {division.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleApplyFilters}>
            Aplicar
          </Button>
          
          <Button variant="outline" onClick={handleResetFilters}>
            Resetar
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePredefinedPeriod("today")}
        >
          Hoje
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePredefinedPeriod("yesterday")}
        >
          Ontem
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePredefinedPeriod("last7days")}
        >
          Últimos 7 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePredefinedPeriod("last30days")}
        >
          Últimos 30 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePredefinedPeriod("thisMonth")}
        >
          Este mês
        </Button>
      </div>
      
      <div className="flex justify-end">
        <ReportExporter
          data={[
            {
              totalRevenue: kpiData.totalRevenue,
              totalExpenses: kpiData.totalExpenses,
              totalOrders: kpiData.totalOrders,
              totalProducts: kpiData.totalProducts,
              totalDeliveries: kpiData.totalDeliveries,
              totalCustomers: kpiData.totalCustomers
            }
          ]}
          fileName="dashboard_kpis"
          fileType="xlsx"
          columns={[
            { key: 'totalRevenue', header: 'Receita Total' },
            { key: 'totalExpenses', header: 'Despesas Totais' },
            { key: 'totalOrders', header: 'Total de Pedidos' },
            { key: 'totalProducts', header: 'Total de Produtos' },
            { key: 'totalDeliveries', header: 'Total de Entregas' },
            { key: 'totalCustomers', header: 'Total de Clientes' }
          ]}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Carregando dados...</span>
        </div>
      ) : (
        <>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="sales">Vendas</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="deliveries">Entregas</TabsTrigger>
            </TabsList>
            
            {/* Tab: Visão Geral */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* KPI: Receita Total */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receita Total
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(kpiData.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {renderTrend(kpiData.revenueChange)} em relação ao período anterior
                    </p>
                  </CardContent>
                </Card>
                
                {/* KPI: Total de Pedidos */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Pedidos
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpiData.totalOrders}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {renderTrend(kpiData.ordersChange)} em relação ao período anterior
                    </p>
                  </CardContent>
                </Card>
                
                {/* KPI: Total de Produtos */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Produtos
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpiData.totalProducts}
                    </div>
                  </CardContent>
                </Card>
                
                {/* KPI: Total de Clientes */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Clientes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpiData.totalCustomers}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráfico: Receitas e Despesas por Mês */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Receitas e Despesas por Mês</CardTitle>
                  <CardDescription>
                    Comparativo dos últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.salesByMonth}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            compactDisplay: 'short',
                            currency: 'BRL',
                          }).format(value)
                        }
                      />
                      <Tooltip 
                        formatter={(value: number) => [
                          formatCurrency(value),
                          value === chartData.salesByMonth[0]?.receitas ? "Receitas" : "Despesas"
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="receitas" name="Receitas" fill="#10B981" />
                      <Bar dataKey="despesas" name="Despesas" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Gráfico: Vendas por Categoria */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vendas por Categoria</CardTitle>
                    <CardDescription>
                      Distribuição de vendas por categoria de produto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.salesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Gráfico: Top Produtos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Produtos</CardTitle>
                    <CardDescription>
                      Produtos com maior volume de vendas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData.topProducts}
                        layout="vertical"
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => 
                            new Intl.NumberFormat('pt-BR', {
                              notation: 'compact',
                              compactDisplay: 'short',
                              currency: 'BRL',
                            }).format(value)
                          }
                        />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="value" name="Valor" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Tab: Vendas */}
            <TabsContent value="sales" className="space-y-4">
              {/* Gráfico: Receitas e Despesas por Mês */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Receitas e Despesas por Mês</CardTitle>
                  <CardDescription>
                    Comparativo dos últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData.salesByMonth}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            compactDisplay: 'short',
                            currency: 'BRL',
                          }).format(value)
                        }
                      />
                      <Tooltip 
                        formatter={(value: number) => [
                          formatCurrency(value),
                          value === chartData.salesByMonth[0]?.receitas ? "Receitas" : "Despesas"
                        ]}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#10B981" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#EF4444" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Gráfico: Vendas por Divisão */}
              {!divisionFilter || divisionFilter === "all" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Vendas por Divisão</CardTitle>
                    <CardDescription>
                      Distribuição de vendas por divisão da empresa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.salesByDivision}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.salesByDivision.map((entry) => {
                            const color = DIVISION_COLORS[entry.name as keyof typeof DIVISION_COLORS] || 
                                         COLORS[chartData.salesByDivision.findIndex(e => e.name === entry.name) % COLORS.length];
                            return <Cell key={`cell-${entry.name}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
            
            {/* Tab: Produtos */}
            <TabsContent value="products" className="space-y-4">
              {/* Gráfico: Vendas por Categoria */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Categoria</CardTitle>
                  <CardDescription>
                    Distribuição de vendas por categoria de produto
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.salesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Gráfico: Top Produtos */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Produtos</CardTitle>
                  <CardDescription>
                    Produtos com maior volume de vendas
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.topProducts}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            compactDisplay: 'short',
                            currency: 'BRL',
                          }).format(value)
                        }
                      />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="value" name="Valor" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab: Entregas */}
            <TabsContent value="deliveries" className="space-y-4">
              {/* KPIs de Entregas */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* KPI: Total de Entregas */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Entregas
                    </CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpiData.totalDeliveries}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráfico: Status de Entregas */}
              <Card>
                <CardHeader>
                  <CardTitle>Status de Entregas</CardTitle>
                  <CardDescription>
                    Distribuição de entregas por status
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.deliveryStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.deliveryStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
