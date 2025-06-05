"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Download, Filter, PieChart as PieChartIcon, BarChart as BarChartIcon, ArrowUp, ArrowDown, LineChart as LineChartIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { ReportExporter } from "./ReportExporter";

interface FinancialTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category_id: string;
  category_name: string;
  payment_method_id: string;
  payment_method_name: string;
  type: 'income' | 'expense';
  status: string;
  division_id?: string;
  division_name?: string;
}

interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
}

interface Division {
  id: string;
  name: string;
}

interface FinancialReportProps {
  className?: string;
}

export function FinancialReport({ className }: FinancialReportProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  
  // Cores para gráficos
  const COLORS = ['#4ade80', '#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#34d399'];
  const DIVISION_COLORS = {
    'Ateliê': '#F0FFBE',
    'Casa': '#A5854E',
    'Pet': '#6B7280',
    'Music': '#8B5CF6',
    'Wood': '#D97706',
    'Brand': '#10B981'
  };
  
  // Carregar dados iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Buscar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("financial_categories")
          .select("id, name, type")
          .order("name");
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        
        // Buscar divisões
        const { data: divisionsData, error: divisionsError } = await supabase
          .from("divisions")
          .select("id, name")
          .order("name");
          
        if (divisionsError) throw divisionsError;
        setDivisions(divisionsData || []);
        
        // Carregar transações com os filtros iniciais
        await fetchTransactions();
        
        // Carregar dados mensais para gráficos
        await fetchMonthlyData();
      } catch (error: any) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error(`Erro ao carregar dados: ${error.message}`);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Buscar transações com base nos filtros
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Construir a query base
      let query = supabase
        .from("financial_transactions")
        .select(`
          id, 
          date, 
          amount, 
          description, 
          type,
          status,
          financial_categories!inner(id, name),
          payment_methods!inner(id, name),
          divisions(id, name)
        `)
        .gte("date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("date", format(dateRange.to, "yyyy-MM-dd"))
        .order("date", { ascending: false });
      
      // Aplicar filtro de categoria
      if (categoryFilter !== "all") {
        query = query.eq("financial_categories.id", categoryFilter);
      }
      
      // Aplicar filtro de tipo (receita/despesa)
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }
      
      // Aplicar filtro de divisão
      if (divisionFilter !== "all") {
        query = query.eq("division_id", divisionFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transformar os dados para o formato esperado
      const formattedData = data?.map(item => ({
        id: item.id,
        date: item.date,
        amount: item.amount,
        description: item.description,
        category_id: item.financial_categories.id,
        category_name: item.financial_categories.name,
        payment_method_id: item.payment_methods.id,
        payment_method_name: item.payment_methods.name,
        type: item.type,
        status: item.status,
        division_id: item.divisions?.id,
        division_name: item.divisions?.name
      })) || [];
      
      setTransactions(formattedData);
    } catch (error: any) {
      console.error("Erro ao buscar transações:", error);
      toast.error(`Erro ao buscar transações: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar dados mensais para gráficos
  const fetchMonthlyData = async () => {
    try {
      // Obter os últimos 12 meses
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: format(date, "yyyy-MM"),
          name: format(date, "MMM/yy", { locale: ptBR })
        };
      }).reverse();
      
      const monthlyResults = await Promise.all(
        months.map(async ({ month, name }) => {
          const startDate = `${month}-01`;
          const endDate = `${month}-${new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate()}`;
          
          // Receitas do mês
          let incomeQuery = supabase
            .from("financial_transactions")
            .select("amount")
            .eq("type", "income")
            .gte("date", startDate)
            .lte("date", endDate);
            
          if (divisionFilter !== "all") {
            incomeQuery = incomeQuery.eq("division_id", divisionFilter);
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
            
          if (divisionFilter !== "all") {
            expenseQuery = expenseQuery.eq("division_id", divisionFilter);
          }
          
          const { data: expenseData, error: expenseError } = await expenseQuery;
          if (expenseError) throw expenseError;
          
          const despesas = expenseData?.reduce((sum, item) => sum + item.amount, 0) || 0;
          
          return { name, receitas, despesas, resultado: receitas - despesas };
        })
      );
      
      setMonthlyData(monthlyResults);
    } catch (error: any) {
      console.error("Erro ao buscar dados mensais:", error);
      toast.error(`Erro ao carregar gráficos: ${error.message}`);
    }
  };
  
  // Aplicar filtros
  const handleApplyFilters = () => {
    fetchTransactions();
    fetchMonthlyData();
  };
  
  // Resetar filtros
  const handleResetFilters = () => {
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    });
    setCategoryFilter("all");
    setTypeFilter("all");
    setDivisionFilter("all");
    
    // Aplicar os filtros resetados
    setTimeout(() => {
      fetchTransactions();
      fetchMonthlyData();
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
        to = endOfMonth(today);
        break;
      default:
        return;
    }
    
    setDateRange({ from, to });
    
    // Aplicar o novo período
    setTimeout(() => {
      fetchTransactions();
    }, 0);
  };
  
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Calcular totais
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpense;
  
  // Agrupar por categoria
  const categorySummary = transactions.reduce((acc, transaction) => {
    const key = `${transaction.category_id}-${transaction.type}`;
    if (!acc[key]) {
      acc[key] = {
        category_id: transaction.category_id,
        category_name: transaction.category_name,
        type: transaction.type,
        total: 0
      };
    }
    acc[key].total += transaction.amount;
    return acc;
  }, {} as Record<string, { category_id: string; category_name: string; type: string; total: number }>);
  
  // Converter para array e ordenar
  const categorySummaryArray = Object.values(categorySummary).sort((a, b) => b.total - a.total);
  
  // Agrupar por divisão
  const divisionSummary = transactions.reduce((acc, transaction) => {
    if (!transaction.division_id) return acc;
    
    const key = `${transaction.division_id}-${transaction.type}`;
    if (!acc[key]) {
      acc[key] = {
        division_id: transaction.division_id,
        division_name: transaction.division_name || 'Sem divisão',
        type: transaction.type,
        total: 0
      };
    }
    acc[key].total += transaction.amount;
    return acc;
  }, {} as Record<string, { division_id: string; division_name: string; type: string; total: number }>);
  
  // Converter para array e ordenar
  const divisionSummaryArray = Object.values(divisionSummary).sort((a, b) => b.total - a.total);
  
  // Dados para gráfico de pizza de receitas por categoria
  const incomeByCategoryData = categorySummaryArray
    .filter(c => c.type === "income")
    .map(c => ({
      name: c.category_name,
      value: c.total
    }));
  
  // Dados para gráfico de pizza de despesas por categoria
  const expenseByCategoryData = categorySummaryArray
    .filter(c => c.type === "expense")
    .map(c => ({
      name: c.category_name,
      value: c.total
    }));
  
  // Dados para gráfico de barras por divisão
  const incomeByDivisionData = divisionSummaryArray
    .filter(d => d.type === "income")
    .map(d => ({
      name: d.division_name,
      value: d.total
    }));
  
  const expenseByDivisionData = divisionSummaryArray
    .filter(d => d.type === "expense")
    .map(d => ({
      name: d.division_name,
      value: d.total
    }));
  
  // Combinar dados por divisão para gráfico de barras
  const divisionChartData = divisions.map(division => {
    const incomeItem = incomeByDivisionData.find(d => d.name === division.name);
    const expenseItem = expenseByDivisionData.find(d => d.name === division.name);
    
    return {
      name: division.name,
      receitas: incomeItem?.value || 0,
      despesas: expenseItem?.value || 0,
      resultado: (incomeItem?.value || 0) - (expenseItem?.value || 0)
    };
  });
  
  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Relatório Financeiro</CardTitle>
          <CardDescription>
            Visualize e analise receitas e despesas por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Divisão</label>
                <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as divisões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as divisões</SelectItem>
                    {divisions.map(division => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                <Button variant="outline" onClick={handleResetFilters}>
                  Limpar
                </Button>
              </div>
            </div>
            
            {/* Períodos predefinidos */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePredefinedPeriod("today")}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePredefinedPeriod("yesterday")}>
                Ontem
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePredefinedPeriod("last7days")}>
                Últimos 7 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePredefinedPeriod("last30days")}>
                Últimos 30 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePredefinedPeriod("thisMonth")}>
                Este mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-50 dark:bg-green-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                  Total de Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalIncome)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                  Total de Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpense)}
                </div>
              </CardContent>
            </Card>
            
            <Card className={balance >= 0 ? "bg-blue-50 dark:bg-blue-950" : "bg-amber-50 dark:bg-amber-950"}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                  Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold flex items-center ${balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {balance >= 0 ? (
                    <ArrowUp className="h-5 w-5 mr-1" />
                  ) : (
                    <ArrowDown className="h-5 w-5 mr-1" />
                  )}
                  {formatCurrency(Math.abs(balance))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Conteúdo principal */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="summary">
                <PieChart className="h-4 w-4 mr-2" />
                Resumo por Categoria
              </TabsTrigger>
              <TabsTrigger value="trends">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Tendências
              </TabsTrigger>
              <TabsTrigger value="divisions">
                <BarChart className="h-4 w-4 mr-2" />
                Divisões
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <BarChart className="h-4 w-4 mr-2" />
                Transações
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-6">
              {categorySummaryArray.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhuma transação encontrada para o período selecionado.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Gráficos de categoria */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Receitas por Categoria */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Receitas por Categoria</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {incomeByCategoryData.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            Nenhuma receita encontrada para o período selecionado.
                          </p>
                        ) : (
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={incomeByCategoryData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {incomeByCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: number) => [
                                    formatCurrency(value),
                                    "Valor"
                                  ]}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Despesas por Categoria */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Despesas por Categoria</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {expenseByCategoryData.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            Nenhuma despesa encontrada para o período selecionado.
                          </p>
                        ) : (
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={expenseByCategoryData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {expenseByCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: number) => [
                                    formatCurrency(value),
                                    "Valor"
                                  ]}
                                />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Tabelas de categoria */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Receitas por Categoria</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {categorySummaryArray.filter(c => c.type === "income").length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            Nenhuma receita encontrada para o período selecionado.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {categorySummaryArray
                              .filter(c => c.type === "income")
                              .map((category, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{category.category_name}</span>
                                    <span className="text-green-600 font-medium">{formatCurrency(category.total)}</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full" 
                                      style={{ 
                                        width: `${(category.total / totalIncome) * 100}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Despesas por Categoria</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {categorySummaryArray.filter(c => c.type === "expense").length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">
                            Nenhuma despesa encontrada para o período selecionado.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {categorySummaryArray
                              .filter(c => c.type === "expense")
                              .map((category, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{category.category_name}</span>
                                    <span className="text-red-600 font-medium">{formatCurrency(category.total)}</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-red-500 h-2 rounded-full" 
                                      style={{ 
                                        width: `${(category.total / totalExpense) * 100}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Financeira</CardTitle>
                  <CardDescription>
                    Tendência de receitas e despesas nos últimos 12 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                          tickFormatter={(value) => 
                            new Intl.NumberFormat('pt-BR', {
                              notation: 'compact',
                              compactDisplay: 'short',
                              currency: 'BRL'
                            }).format(value)
                          } 
                        />
                        <Tooltip 
                          formatter={(value: number) => [
                            formatCurrency(value),
                            ""
                          ]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#4ade80" strokeWidth={2} />
                        <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#f87171" strokeWidth={2} />
                        <Line type="monotone" dataKey="resultado" name="Resultado" stroke="#60a5fa" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 flex justify-end space-x-2">
                <ReportExporter
                  data={monthlyData}
                  fileName="evolucao_financeira"
                  fileType="xlsx"
                  columns={[
                    { key: 'name', header: 'Mês' },
                    { key: 'receitas', header: 'Receitas' },
                    { key: 'despesas', header: 'Despesas' },
                    { key: 'resultado', header: 'Resultado' }
                  ]}
                />
                
                <ReportExporter
                  data={monthlyData}
                  fileName="evolucao_financeira"
                  fileType="pdf"
                  columns={[
                    { key: 'name', header: 'Mês' },
                    { key: 'receitas', header: 'Receitas' },
                    { key: 'despesas', header: 'Despesas' },
                    { key: 'resultado', header: 'Resultado' }
                  ]}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="divisions">
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho por Divisão</CardTitle>
                  <CardDescription>
                    Comparativo financeiro entre as divisões da marca
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={divisionChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                          tickFormatter={(value) => 
                            new Intl.NumberFormat('pt-BR', {
                              notation: 'compact',
                              compactDisplay: 'short',
                              currency: 'BRL'
                            }).format(value)
                          } 
                        />
                        <Tooltip 
                          formatter={(value: number) => [
                            formatCurrency(value),
                            ""
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="receitas" name="Receitas" fill="#4ade80" />
                        <Bar dataKey="despesas" name="Despesas" fill="#f87171" />
                        <Bar dataKey="resultado" name="Resultado" fill="#60a5fa" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 flex justify-end space-x-2">
                <ReportExporter
                  data={divisionChartData}
                  fileName="desempenho_por_divisao"
                  fileType="xlsx"
                  columns={[
                    { key: 'name', header: 'Divisão' },
                    { key: 'receitas', header: 'Receitas' },
                    { key: 'despesas', header: 'Despesas' },
                    { key: 'resultado', header: 'Resultado' }
                  ]}
                />
                
                <ReportExporter
                  data={divisionChartData}
                  fileName="desempenho_por_divisao"
                  fileType="csv"
                  columns={[
                    { key: 'name', header: 'Divisão' },
                    { key: 'receitas', header: 'Receitas' },
                    { key: 'despesas', header: 'Despesas' },
                    { key: 'resultado', header: 'Resultado' }
                  ]}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma transação encontrada para o período selecionado.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Data</th>
                            <th className="text-left py-3 px-4">Descrição</th>
                            <th className="text-left py-3 px-4">Categoria</th>
                            <th className="text-left py-3 px-4">Divisão</th>
                            <th className="text-left py-3 px-4">Método</th>
                            <th className="text-right py-3 px-4">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(transaction => (
                            <tr key={transaction.id} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                {format(parseISO(transaction.date), "dd/MM/yyyy")}
                              </td>
                              <td className="py-3 px-4">{transaction.description}</td>
                              <td className="py-3 px-4">{transaction.category_name}</td>
                              <td className="py-3 px-4">{transaction.division_name || '-'}</td>
                              <td className="py-3 px-4">{transaction.payment_method_name}</td>
                              <td className={`py-3 px-4 text-right font-medium ${
                                transaction.type === "income" 
                                  ? "text-green-600" 
                                  : "text-red-600"
                              }`}>
                                {transaction.type === "income" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="mt-6 flex justify-end space-x-2">
                <ReportExporter
                  data={transactions.map(t => ({
                    data: format(parseISO(t.date), "dd/MM/yyyy"),
                    descricao: t.description,
                    categoria: t.category_name,
                    divisao: t.division_name || '-',
                    metodo: t.payment_method_name,
                    tipo: t.type === "income" ? "Receita" : "Despesa",
                    valor: t.amount
                  }))}
                  fileName="transacoes_financeiras"
                  fileType="xlsx"
                  columns={[
                    { key: 'data', header: 'Data' },
                    { key: 'descricao', header: 'Descrição' },
                    { key: 'categoria', header: 'Categoria' },
                    { key: 'divisao', header: 'Divisão' },
                    { key: 'metodo', header: 'Método' },
                    { key: 'tipo', header: 'Tipo' },
                    { key: 'valor', header: 'Valor' }
                  ]}
                />
                
                <ReportExporter
                  data={transactions.map(t => ({
                    data: format(parseISO(t.date), "dd/MM/yyyy"),
                    descricao: t.description,
                    categoria: t.category_name,
                    divisao: t.division_name || '-',
                    metodo: t.payment_method_name,
                    tipo: t.type === "income" ? "Receita" : "Despesa",
                    valor: t.amount
                  }))}
                  fileName="transacoes_financeiras"
                  fileType="csv"
                  columns={[
                    { key: 'data', header: 'Data' },
                    { key: 'descricao', header: 'Descrição' },
                    { key: 'categoria', header: 'Categoria' },
                    { key: 'divisao', header: 'Divisão' },
                    { key: 'metodo', header: 'Método' },
                    { key: 'tipo', header: 'Tipo' },
                    { key: 'valor', header: 'Valor' }
                  ]}
                />
                
                <ReportExporter
                  data={transactions.map(t => ({
                    data: format(parseISO(t.date), "dd/MM/yyyy"),
                    descricao: t.description,
                    categoria: t.category_name,
                    divisao: t.division_name || '-',
                    metodo: t.payment_method_name,
                    tipo: t.type === "income" ? "Receita" : "Despesa",
                    valor: t.amount
                  }))}
                  fileName="transacoes_financeiras"
                  fileType="pdf"
                  columns={[
                    { key: 'data', header: 'Data' },
                    { key: 'descricao', header: 'Descrição' },
                    { key: 'categoria', header: 'Categoria' },
                    { key: 'divisao', header: 'Divisão' },
                    { key: 'metodo', header: 'Método' },
                    { key: 'tipo', header: 'Tipo' },
                    { key: 'valor', header: 'Valor' }
                  ]}
                />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
