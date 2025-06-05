"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Search, X, FileText, BarChart3 } from 'lucide-react';

// Componentes de gráficos
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DashboardBI {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  periodo: string;
  configuracao: any;
  created_at: string;
  updated_at: string;
}

export default function BIDashboardTable() {
  const supabase = createClient();
  const [dashboards, setDashboards] = useState<DashboardBI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentDashboard, setCurrentDashboard] = useState<DashboardBI | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bi_dashboards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDashboards(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar dashboards:", error);
      toast.error(`Erro ao buscar dashboards: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewDialog = async (dashboard: DashboardBI) => {
    setCurrentDashboard(dashboard);
    setIsViewDialogOpen(true);
    await fetchChartData(dashboard);
  };

  const fetchChartData = async (dashboard: DashboardBI) => {
    try {
      setLoadingChart(true);
      setChartData([]);

      // Determinar qual função RPC chamar com base no tipo de dashboard
      let rpcFunction = '';
      let params = {};

      switch (dashboard.tipo) {
        case 'vendas_por_periodo':
          rpcFunction = 'get_vendas_por_periodo';
          params = { p_periodo: dashboard.periodo };
          break;
        case 'produtos_mais_vendidos':
          rpcFunction = 'get_produtos_mais_vendidos';
          params = { p_limite: dashboard.configuracao?.limite || 10 };
          break;
        case 'estoque_critico':
          rpcFunction = 'get_produtos_estoque_critico';
          break;
        case 'faturamento_por_cliente':
          rpcFunction = 'get_faturamento_por_cliente';
          params = { p_periodo: dashboard.periodo, p_limite: dashboard.configuracao?.limite || 10 };
          break;
        case 'producao_por_status':
          rpcFunction = 'get_producao_por_status';
          break;
        default:
          toast.error('Tipo de dashboard não suportado');
          setLoadingChart(false);
          return;
      }

      const { data, error } = await supabase.rpc(rpcFunction, params);
      
      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        setChartData(data);
      } else {
        setChartData([]);
        toast.error('Dados não disponíveis para este dashboard');
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados do gráfico:", error);
      toast.error(`Erro ao buscar dados do gráfico: ${error.message}`);
      setChartData([]);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredDashboards = dashboards.filter(dashboard => 
    dashboard.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dashboard.descricao && dashboard.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTipoDashboardLabel = (tipo: string) => {
    switch (tipo) {
      case 'vendas_por_periodo':
        return 'Vendas por Período';
      case 'produtos_mais_vendidos':
        return 'Produtos Mais Vendidos';
      case 'estoque_critico':
        return 'Estoque Crítico';
      case 'faturamento_por_cliente':
        return 'Faturamento por Cliente';
      case 'producao_por_status':
        return 'Produção por Status';
      default:
        return tipo;
    }
  };

  const getPeriodoLabel = (periodo: string) => {
    switch (periodo) {
      case 'dia':
        return 'Diário';
      case 'semana':
        return 'Semanal';
      case 'mes':
        return 'Mensal';
      case 'trimestre':
        return 'Trimestral';
      case 'ano':
        return 'Anual';
      case 'todos':
        return 'Todo o período';
      default:
        return periodo;
    }
  };

  const renderChart = () => {
    if (!currentDashboard || loadingChart) {
      return (
        <div className="flex justify-center items-center h-64">
          <p>Carregando dados...</p>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <p>Nenhum dado disponível para exibição</p>
        </div>
      );
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A5854E', '#8884D8', '#82CA9D'];

    switch (currentDashboard.tipo) {
      case 'vendas_por_periodo':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="valor_total" name="Valor Total" stroke="#A5854E" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="quantidade" name="Quantidade" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'produtos_mais_vendidos':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome_produto" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantidade_vendida" name="Quantidade Vendida" fill="#A5854E" />
              <Bar dataKey="valor_total" name="Valor Total" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'estoque_critico':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nome_produto" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="estoque_atual" name="Estoque Atual" fill="#FF8042" />
              <Bar dataKey="estoque_minimo" name="Estoque Mínimo" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'faturamento_por_cliente':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="valor_total"
                nameKey="nome_cliente"
                label={({ nome_cliente, valor_total }) => `${nome_cliente}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor_total)}`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'producao_por_status':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="quantidade"
                nameKey="status"
                label={({ status, quantidade }) => `${status}: ${quantidade}`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <div className="flex justify-center items-center h-64">
            <p>Tipo de gráfico não suportado</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Dashboards de BI</CardTitle>
          <CardDescription>Visualize os dashboards de Business Intelligence</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar dashboards por título ou descrição..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button
                type="button"
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <p>Carregando dashboards...</p>
          </div>
        ) : filteredDashboards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? (
              <p>Nenhum dashboard encontrado para "{searchTerm}"</p>
            ) : (
              <p>Nenhum dashboard disponível.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDashboards.map((dashboard) => (
                <TableRow key={dashboard.id}>
                  <TableCell className="font-medium">{dashboard.titulo}</TableCell>
                  <TableCell>{getTipoDashboardLabel(dashboard.tipo)}</TableCell>
                  <TableCell>{getPeriodoLabel(dashboard.periodo)}</TableCell>
                  <TableCell>{formatDate(dashboard.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenViewDialog(dashboard)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenViewDialog(dashboard)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Diálogo de Visualização */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{currentDashboard?.titulo}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {currentDashboard && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                    <p>{currentDashboard.descricao || "-"}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Tipo</h3>
                      <p>{getTipoDashboardLabel(currentDashboard.tipo)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Período</h3>
                      <p>{getPeriodoLabel(currentDashboard.periodo)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
                      <p>{formatDate(currentDashboard.updated_at)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Visualização</h3>
                    {renderChart()}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
