// /src/app/producao/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
// import wixClient from "@/lib/wixClient"; // No longer needed
import { obterOrdemProducaoPorId, atualizarStatusOrdemProducao, callVeloApi } from "@/lib/api"; // Import API functions
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, PlayCircle, XCircle } from "lucide-react"; // Icons for status actions
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define type based on backend ordensProducao.js
type OrdemProducao = {
  _id: string;
  produtoId: string;
  quantidade: number;
  statusId: string; // Assuming statusId is the key used in backend
  dataCriacao: string | Date;
  dataPrevista?: string | Date | null;
  prioridade?: number;
  observacoes?: string;
  dataAtualizacaoStatus?: string | Date;
  // Add related data fetched separately
  produtoNome?: string;
  statusDescricao?: string;
};

// TODO: Fetch actual statuses from backend (e.g., a Status collection)
// Using the same mock as before the reset
const STATUS_PRODUCAO_MOCK = {
  AGUARDANDO_INICIO: "Aguardando Início",
  EM_ANDAMENTO: "Em Andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export default function OrdemProducaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [ordem, setOrdem] = useState<OrdemProducao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // --- Fetch Data Function ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch order details using api.ts function
      const ordemData = await obterOrdemProducaoPorId(id);

      if (!ordemData) {
        throw new Error("Ordem de produção não encontrada.");
      }

      // TODO: Fetch related data like produtoNome
      // For now, use placeholder logic and map statusId to description
      const enrichedOrdemData = {
        ...ordemData,
        produtoNome: ordemData.produtoId, // Placeholder - fetch actual name if possible
        // Assuming ordemData.statusId holds the key like 'AGUARDANDO_INICIO'
        statusDescricao: STATUS_PRODUCAO_MOCK[ordemData.statusId as keyof typeof STATUS_PRODUCAO_MOCK] || ordemData.statusId,
      };

      setOrdem(enrichedOrdemData);

    } catch (err: any) {
      console.error("Erro ao buscar dados da ordem de produção:", err);
      setError(err.message || "Ocorreu um erro ao buscar os detalhes da ordem.");
    } finally {
      setLoading(false);
    }
  }, [id]);
  // --- End Fetch Data ---

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  // --- Handle Status Update ---
  const handleUpdateStatus = async (novoStatusId: string) => {
    if (!ordem) return;

    setIsUpdatingStatus(true);
    try {
      // 1. Update the status using the api.ts function
      // Note: The api.ts function expects { _id: id, novoStatus: novoStatusId }
      await atualizarStatusOrdemProducao(ordem._id, novoStatusId);

      // 2. *** TRIGGER AUTOMATIC STOCK DEDUCTION (BACKEND LOGIC NEEDED) ***
      // Check if the new status requires stock deduction (e.g., CONCLUIDO or EM_ANDAMENTO)
      if (novoStatusId === "CONCLUIDO" || novoStatusId === "EM_ANDAMENTO") { 
        console.log(`Status updated to ${novoStatusId}. Attempting to trigger stock deduction...`);
        try {
          // **ASSUMPTION:** A backend function `baixarEstoqueOrdemProducao` exists.
          // Use callVeloApi for this potentially generic/complex function
          const baixaResult = await callVeloApi(
            "producao/ordensProducao", // Or "estoque/integracoes" or wherever it resides
            "baixarEstoqueOrdemProducao", 
            { ordemProducaoId: ordem._id } // Pass ID in the body
          );
          console.log("Resultado da baixa de estoque:", baixaResult);
          toast({ 
            title: "Estoque Atualizado",
            description: "Baixa de estoque correspondente à ordem de produção realizada com sucesso.",
          });
        } catch (baixaError: any) {
          console.error("*** FALHA NA BAIXA AUTOMÁTICA DE ESTOQUE (BACKEND) ***:", baixaError);
          toast({ 
            title: "Aviso: Falha na Baixa de Estoque",
            description: `O status da ordem foi atualizado, mas a baixa automática de estoque falhou: ${baixaError.message}. Verifique o backend Velo ou realize a baixa manualmente.`,
            variant: "destructive",
            duration: 10000, // Show longer
          });
          // Continue even if stock deduction fails, as status update succeeded
        }
      } else {
         toast({ 
            title: "Status Atualizado",
            description: `Status da ordem atualizado para ${STATUS_PRODUCAO_MOCK[novoStatusId as keyof typeof STATUS_PRODUCAO_MOCK] || novoStatusId}.`,
          });
      }

      // Refetch data to show the updated status
      await fetchData();

    } catch (err: any) {
      console.error("Erro ao atualizar status da ordem:", err);
      toast({ 
        title: "Erro ao Atualizar Status",
        description: err.message || "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  // --- End Handle Status Update ---

  // --- Format Date Function ---
  const formatDate = (date: string | Date | undefined | null, includeTime = false) => {
    if (!date) return "-";
    try {
      const formatString = includeTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy";
      return format(new Date(date), formatString, { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };
  // --- End Format Date ---

  // --- Render Logic ---
  return (
    <div className="container mx-auto py-6">
      <Button variant="outline" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Lista
      </Button>

      {/* --- Loading and Error States --- */} 
      {loading && (
         <div className="space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      )}
      {error && (
         <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/producao">Ver Lista de Ordens</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {/* --- End Loading and Error States --- */} 

      {!loading && !error && ordem && (
        <div className="space-y-6">
          {/* --- Ordem Details Card --- */} 
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Ordem de Produção #{ordem._id.substring(0, 8)}...</CardTitle>
              <CardDescription>Detalhes da Ordem</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Produto:</span>
                <span className="font-semibold">{ordem.produtoNome}</span> {/* Displaying ID/Placeholder */} 
              </div>
               <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Quantidade:</span>
                <span className="font-semibold">{ordem.quantidade}</span>
              </div>
               <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Status Atual:</span>
                <Badge variant={ordem.statusId === "CONCLUIDO" ? "default" : ordem.statusId === "CANCELADO" ? "destructive" : "secondary"}>
                  {ordem.statusDescricao}
                </Badge>
              </div>
               <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Prioridade:</span>
                <span>{ordem.prioridade ?? "-"}</span>
              </div>
               <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Data Criação:</span>
                <span>{formatDate(ordem.dataCriacao)}</span>
              </div>
               <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Data Prevista:</span>
                <span>{formatDate(ordem.dataPrevista)}</span>
              </div>
               <div className="col-span-full pt-2">
                <span className="text-muted-foreground">Observações:</span>
                <p className="mt-1">{ordem.observacoes || "Nenhuma."}</p>
              </div>
            </CardContent>
          </Card>
          {/* --- End Ordem Details Card --- */} 

          {/* --- Status Update Card --- */} 
          <Card>
            <CardHeader>
              <CardTitle>Atualizar Status</CardTitle>
              <CardDescription>Selecione o novo status para esta ordem de produção.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-grow">
                <Label htmlFor="statusSelect">Novo Status</Label>
                <Select 
                  // Use ordem.statusId which should hold the key like 'AGUARDANDO_INICIO'
                  value={ordem.statusId} 
                  onValueChange={(value) => handleUpdateStatus(value)} 
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger id="statusSelect">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_PRODUCAO_MOCK).map(([key, value]) => (
                      <SelectItem key={key} value={key} disabled={key === ordem.statusId}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
             <CardContent className="text-xs text-muted-foreground border-t pt-2">
               <p className="font-semibold">Importante:</p>
               <p>Ao atualizar o status para "Em Andamento" ou "Concluído", o sistema tentará realizar a baixa automática dos insumos necessários no estoque. Certifique-se de que a função `baixarEstoqueOrdemProducao` esteja implementada corretamente no backend Velo.</p>
             </CardContent>
          </Card>
          {/* --- End Status Update Card --- */} 

        </div>
      )}
    </div>
  );
}

