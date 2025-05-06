// /src/app/page.tsx (Dashboard)
"use client";

import { useEffect, useState, useCallback } from "react";
// import wixClient from "@/lib/wixClient"; // No longer needed for API calls here
import { 
  obterResumoDashboard, 
  listarProdutosRecentes, 
  listarMateriaisEstoqueBaixo 
} from "@/lib/api"; // Import API functions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Box, CheckCircle, Clock, ListOrdered, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// --- Types for Dashboard Data (Assumed based on metrics) ---
type DashboardSummary = {
  pedidosAbertosCount: number;
  ordensProducaoAtivasCount: number;
  materiaisEstoqueBaixoCount: number;
  movimentacoesSemanaCount: number;
  // Add more specific counts if needed
};

type ProdutoRecente = {
  _id: string;
  nome: string;
  dataCriacao?: string | Date;
};

type MaterialEstoqueBaixo = {
  _id: string;
  nome: string;
  codigo?: string;
  saldoAtual: number;
  quantidadeMinima?: number;
};
// --- End Types ---

// Helper component for summary cards
const SummaryCard = ({ title, value, icon: Icon, isLoading, description, link }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  isLoading: boolean;
  description?: string;
  link?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-1/2" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {description && !isLoading && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {link && !isLoading && (
         <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
           <Link href={link}>Ver detalhes</Link>
         </Button>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [produtosRecentes, setProdutosRecentes] = useState<ProdutoRecente[]>([]);
  const [materiaisBaixo, setMateriaisBaixo] = useState<MaterialEstoqueBaixo[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [loadingMateriais, setLoadingMateriais] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoadingSummary(true);
    setLoadingProdutos(true);
    setLoadingMateriais(true);
    setError(null);

    try {
      // Fetch all dashboard data concurrently using api.ts functions
      const [summaryData, produtosData, materiaisData] = await Promise.all([
        obterResumoDashboard()
          .catch(err => { console.error("Error fetching summary:", err); return null; }),
        listarProdutosRecentes(5) // Fetch 5 most recent
          .catch(err => { console.error("Error fetching recent products:", err); return []; }),
        listarMateriaisEstoqueBaixo()
          .catch(err => { console.error("Error fetching low stock materials:", err); return []; }),
      ]);

      // Simulate data if backend functions don't exist yet or fail
      const finalSummaryData = summaryData || {
        pedidosAbertosCount: 0, // Placeholder
        ordensProducaoAtivasCount: 0, // Placeholder
        materiaisEstoqueBaixoCount: (materiaisData || []).length, // Use length from fetched low stock items
        movimentacoesSemanaCount: 0, // Placeholder - Requires another backend function
      };

      setSummary(finalSummaryData);
      setProdutosRecentes(produtosData || []);
      setMateriaisBaixo(materiaisData || []);

    } catch (err: any) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError("Falha ao carregar informações do dashboard. Verifique a conexão e as funções do backend Velo.");
    } finally {
      setLoadingSummary(false);
      setLoadingProdutos(false);
      setLoadingMateriais(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {error && <p className="text-red-600 bg-red-100 border border-red-400 p-4 rounded">{error}</p>}

      {/* Summary Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Pedidos em Aberto"
          value={summary?.pedidosAbertosCount ?? 0}
          icon={ShoppingCart}
          isLoading={loadingSummary}
          description="Status: Pendente ou Confirmado"
          link="/pedidos"
        />
        <SummaryCard
          title="Produção Ativa"
          value={summary?.ordensProducaoAtivasCount ?? 0}
          icon={Clock}
          isLoading={loadingSummary}
          description="Status: Não Iniciada ou Em Andamento"
          link="/producao"
        />
        <SummaryCard
          title="Materiais com Estoque Baixo"
          // Use summary count if available, otherwise fallback to array length
          value={summary?.materiaisEstoqueBaixoCount ?? materiaisBaixo.length}
          icon={AlertTriangle}
          isLoading={loadingSummary || loadingMateriais} // Loading if either summary or materials are loading
          description="Abaixo da quantidade mínima definida"
          link="/estoque/materiais?filtro=baixo_estoque" // Example link with filter
        />
        <SummaryCard
          title="Movimentações (Últimos 7 dias)"
          value={summary?.movimentacoesSemanaCount ?? 0}
          icon={TrendingUp}
          isLoading={loadingSummary}
          description="Entradas, saídas e ajustes"
          link="/estoque/movimentacoes" // Assuming a dedicated page exists
        />
      </div>

      {/* Recent Products and Low Stock Materials Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Products Card */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Recentes</CardTitle>
            <CardDescription>Últimos 5 produtos cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProdutos ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/6" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : produtosRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto recente.</p>
            ) : (
              <ul className="space-y-2">
                {produtosRecentes.map(produto => (
                  <li key={produto._id} className="flex items-center justify-between text-sm border-b pb-1 last:border-0 last:pb-0">
                    <Link href={`/produtos/${produto._id}`} className="hover:underline font-medium">
                      {produto.nome}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {produto.dataCriacao ? new Date(produto.dataCriacao).toLocaleDateString("pt-BR") : "-"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Materials Card */}
        <Card>
          <CardHeader>
            <CardTitle>Alerta de Estoque Baixo</CardTitle>
            <CardDescription>Materiais que atingiram ou estão abaixo do estoque mínimo.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMateriais ? (
              <div className="space-y-2">
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-6 w-5/6" />
                 <Skeleton className="h-6 w-full" />
              </div>
            ) : materiaisBaixo.length === 0 ? (
              <div className="flex items-center justify-center py-4 text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">Nenhum material com estoque baixo.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiaisBaixo.map(material => (
                    <TableRow key={material._id}>
                      <TableCell>
                        <Link href={`/estoque/materiais/${material._id}`} className="hover:underline font-medium">
                          {material.nome}
                        </Link>
                        {material.codigo && <span className="block text-xs text-muted-foreground">{material.codigo}</span>}
                      </TableCell>
                      <TableCell className="text-right font-bold text-destructive">{material.saldoAtual}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{material.quantidadeMinima ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

