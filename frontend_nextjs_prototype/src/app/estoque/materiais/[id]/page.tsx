// /src/app/estoque/materiais/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import wixClient from "@/lib/wixClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, PlusCircle, MinusCircle, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

// Import Dialog components for manual movement
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// --- Types (reuse from list page if possible, add specific ones) ---
type MaterialBasico = {
  _id: string;
  nome: string;
  codigo?: string;
  grupoId?: any;
  unidadeMedida?: string;
  precoUnitario?: number;
  ativo?: boolean;
  dataCriacao?: string | Date;
  ultimaAtualizacao?: string | Date;
  // Add field for stock level
  saldoAtual?: number | null;
};

type EstoqueInsumo = {
  _id: string;
  insumoId: string;
  quantidadeAtual: number;
  quantidadeMinima?: number;
  localizacao?: string;
};

type MovimentacaoEstoque = {
  _id: string;
  insumoId: string;
  tipoMovimentacao: "ENTRADA" | "SAIDA" | "AJUSTE_ENTRADA" | "AJUSTE_SAIDA";
  quantidade: number;
  dataMovimentacao: string | Date;
  usuarioId?: string; // Assuming user ID is stored
  observacao?: string;
  pedidoCompraItemId?: string; // Link to purchase order
  ordemProducaoId?: string; // Link to production order
};

// --- Manual Movement Form State ---
type ManualMovementForm = {
  tipoMovimentacao: "ENTRADA" | "SAIDA" | "AJUSTE_ENTRADA" | "AJUSTE_SAIDA";
  quantidade: number;
  observacao?: string;
};

export default function MaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [material, setMaterial] = useState<MaterialBasico | null>(null);
  const [estoque, setEstoque] = useState<EstoqueInsumo | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);
  const [movementForm, setMovementForm] = useState<ManualMovementForm>({
    tipoMovimentacao: "ENTRADA",
    quantidade: 0,
    observacao: "",
  });
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);

  // --- Fetch Data Function ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch material, stock, and movements concurrently
      const [materialData, estoqueData, movimentacoesData] = await Promise.all([
        wixClient.functions.execute("estoque/materiaisBasicos", "obterMaterialBasicoPorId", id)
          .catch(err => { console.error("Error fetching material:", err); return null; }),
        wixClient.functions.execute("estoque/estoqueDeInsumos", "obterEstoqueDoInsumo", id)
          .catch(err => { console.error("Error fetching stock:", err); return null; }),
        wixClient.functions.execute("estoque/movimentacoesDeEstoque", "listarMovimentacoesPorInsumo", id)
          .catch(err => { console.error("Error fetching movements:", err); return []; }),
      ]);

      if (!materialData) {
        throw new Error("Material básico não encontrado.");
      }

      setMaterial(materialData);
      setEstoque(estoqueData);
      setMovimentacoes(movimentacoesData || []);

    } catch (err: any) {
      console.error("Erro ao buscar dados do material:", err);
      setError(err.message || "Ocorreu um erro ao buscar os detalhes do material.");
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

  // --- Handle Manual Movement Submission ---
  const handleMovementSubmit = async () => {
    if (!material || movementForm.quantidade <= 0) {
      toast({
        title: "Erro de Validação",
        description: "Selecione um tipo de movimentação e insira uma quantidade positiva.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingMovement(true);
    try {
      const movementPayload = {
        insumoId: material._id,
        tipoMovimentacao: movementForm.tipoMovimentacao,
        quantidade: movementForm.quantidade,
        observacao: movementForm.observacao || `Movimentação manual - ${movementForm.tipoMovimentacao}`,
        // usuarioId: "MANUAL_USER", // TODO: Get actual user ID if possible
      };

      const result = await wixClient.functions.execute(
        "estoque/movimentacoesDeEstoque",
        "registrarMovimentacao",
        movementPayload
      );

      toast({
        title: "Movimentação Registrada!",
        description: `Movimentação de ${result.quantidade} ${material.unidadeMedida}(s) registrada com sucesso.`,
      });

      // Reset form and close dialog
      setMovementForm({ tipoMovimentacao: "ENTRADA", quantidade: 0, observacao: "" });
      setIsMovementDialogOpen(false);

      // Refetch data to update stock and movement list
      await fetchData();

    } catch (err: any) {
      console.error("Erro ao registrar movimentação manual:", err);
      toast({
        title: "Erro ao Registrar Movimentação",
        description: err.message || "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingMovement(false);
    }
  };
  // --- End Handle Manual Movement ---

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
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
            <CardContent><Skeleton className="h-20 w-full" /></CardContent>
          </Card>
        </div>
      )}
      {error && (
         <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/estoque/materiais">Ver Lista de Materiais</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {/* --- End Loading and Error States --- */} 

      {!loading && !error && material && (
        <div className="space-y-6">
          {/* --- Material Details Card --- */} 
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{material.nome}</CardTitle>
                <CardDescription>{material.codigo ? `Código: ${material.codigo}` : "Sem código"}</CardDescription>
              </div>
              <Badge variant={material.ativo ? "default" : "destructive"}>
                {material.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Unidade de Medida:</span>
                <span>{material.unidadeMedida ?? "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Preço Unitário:</span>
                <span>{material.precoUnitario ? `R$ ${material.precoUnitario.toFixed(2)}` : "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Grupo:</span>
                <span>{material.grupoId?.nome ?? "-"}</span> {/* Assuming grupoId is populated or has name */} 
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Data Criação:</span>
                <span>{formatDate(material.dataCriacao)}</span>
              </div>
            </CardContent>
            {/* <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" /> Editar Material
              </Button>
            </CardFooter> */} 
          </Card>
          {/* --- End Material Details Card --- */} 

          {/* --- Stock Info Card --- */} 
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informações de Estoque</CardTitle>
              {/* --- Manual Movement Dialog Trigger --- */} 
              <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4 text-green-600" />
                    <MinusCircle className="mr-2 h-4 w-4 text-red-600" />
                    Movimentar Estoque
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Registrar Movimentação Manual</DialogTitle>
                    <DialogDescription>
                      Registre uma entrada, saída ou ajuste no estoque de "{material.nome}".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tipoMov" className="text-right">Tipo *</Label>
                      <Select 
                        value={movementForm.tipoMovimentacao}
                        onValueChange={(value: ManualMovementForm["tipoMovimentacao"]) => setMovementForm(prev => ({ ...prev, tipoMovimentacao: value }))}
                      >
                        <SelectTrigger id="tipoMov" className="col-span-3">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ENTRADA">Entrada (+)</SelectItem>
                          <SelectItem value="SAIDA">Saída (-)</SelectItem>
                          <SelectItem value="AJUSTE_ENTRADA">Ajuste de Entrada (+)</SelectItem>
                          <SelectItem value="AJUSTE_SAIDA">Ajuste de Saída (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="quantidade" className="text-right">Quantidade *</Label>
                      <Input 
                        id="quantidade" 
                        type="number" 
                        min="0.01" 
                        step="any" 
                        className="col-span-3" 
                        value={movementForm.quantidade}
                        onChange={(e) => setMovementForm(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="observacao" className="text-right">Observação</Label>
                      <Textarea 
                        id="observacao" 
                        className="col-span-3" 
                        placeholder="Ex: Contagem de inventário, Recebimento NF 123..." 
                        value={movementForm.observacao}
                        onChange={(e) => setMovementForm(prev => ({ ...prev, observacao: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleMovementSubmit} disabled={isSubmittingMovement}>
                      {isSubmittingMovement ? "Registrando..." : "Registrar Movimentação"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* --- End Manual Movement Dialog --- */} 
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-3xl font-bold">{estoque?.quantidadeAtual ?? 0}</p>
                <p className="text-xs text-muted-foreground">{material.unidadeMedida}(s)</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Estoque Mínimo</p>
                <p className="text-xl font-semibold">{estoque?.quantidadeMinima ?? "-"}</p>
                {estoque?.quantidadeMinima !== undefined && estoque?.quantidadeAtual !== undefined && estoque.quantidadeAtual < estoque.quantidadeMinima && (
                  <Badge variant="destructive" className="mt-1">Abaixo do Mínimo</Badge>
                )}
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Localização</p>
                <p className="text-lg font-medium">{estoque?.localizacao ?? "-"}</p>
              </div>
            </CardContent>
          </Card>
          {/* --- End Stock Info Card --- */} 

          {/* --- Movement History Card --- */} 
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Últimas movimentações registradas para este material.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Observação / Origem</TableHead>
                    {/* <TableHead>Usuário</TableHead> */} 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">Nenhuma movimentação registrada.</TableCell>
                    </TableRow>
                  ) : (
                    movimentacoes.map((mov) => (
                      <TableRow key={mov._id}>
                        <TableCell>{formatDate(mov.dataMovimentacao, true)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={mov.tipoMovimentacao.includes("ENTRADA") ? "default" : "secondary"}
                            className={mov.tipoMovimentacao.includes("SAIDA") ? "bg-red-100 text-red-800 hover:bg-red-200" : ""}
                          >
                            {mov.tipoMovimentacao.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${mov.tipoMovimentacao.includes("ENTRADA") ? "text-green-600" : "text-red-600"}`}>
                          {mov.tipoMovimentacao.includes("ENTRADA") ? "+" : "-"}{mov.quantidade}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {mov.observacao}
                          {mov.pedidoCompraItemId && <span className="block">Pedido Compra: {mov.pedidoCompraItemId.substring(0,8)}...</span>}
                          {mov.ordemProducaoId && <span className="block">Ordem Produção: {mov.ordemProducaoId.substring(0,8)}...</span>}
                        </TableCell>
                        {/* <TableCell>{mov.usuarioId ?? "-"}</TableCell> */} 
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {/* --- End Movement History Card --- */} 
        </div>
      )}
    </div>
  );
}

