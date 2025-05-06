// /src/app/pedidos/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// import { getPedidoById, Pedido, ItemPedido, getProdutos, Produto } from "@/data/mockData"; // Remove mock data imports
import {
    veloObterPedido,
    veloListarProdutos, // Needed for the item selection dropdown
    veloAdicionarItemPedido // Needed to add items
} from "@/lib/velo-sim"; // Import simulated Velo functions
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

// Define basic types based on velo-sim return for now
// Aligning with mockData.ts which uses 'id'
// TODO: Refine these types based on actual backend function returns
type Produto = {
  id: string; // Changed from _id to match mockData
  nome: string;
  precoBase?: number;
};

type ItemPedido = {
  id: string; // Changed from _id to match mockData
  pedidoId: string;
  produtoId: string;
  nomeProduto?: string; // Added in sim for display
  quantidade: number;
  valorUnitario?: number;
  valorTotal?: number;
};

type Pedido = {
  id: string; // Changed from _id to match mockData
  numero?: string;
  clienteNome?: string;
  data?: string;
  status?: string;
  valorTotal?: number;
  itens: ItemPedido[]; // Expect items to be included or fetched separately
};


export default function PedidoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for adding/editing items
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
  const [selectedProdutoId, setSelectedProdutoId] = useState<string>("");
  const [quantidadeItem, setQuantidadeItem] = useState<number>(1);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState<string | null>(null);

  // Function to fetch pedido details
  const fetchPedidoData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch pedido and available products concurrently
      const [pedidoData, produtosData] = await Promise.all([
        veloObterPedido(id), // Use simulated Velo function
        veloListarProdutos(), // Fetch products for the dropdown
      ]);

      if (pedidoData) {
        // Type should now match due to local type definition change
        setPedido(pedidoData);
      } else {
        // veloObterPedido throws error if not found
        setError("Pedido não encontrado.");
      }
      // Assuming veloListarProdutos returns Produto[] with 'id'
      setProdutosDisponiveis(produtosData);
    } catch (err: any) {
      console.error("Erro ao buscar dados do pedido (simulado):", err);
      setError(err.message || "Ocorreu um erro ao buscar os detalhes do pedido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPedidoData();
    }
  }, [id]);

  const handleAddItem = async () => {
      // Use 'id' for comparison
      const produtoSelecionado = produtosDisponiveis.find(p => p.id === selectedProdutoId);
      if (!produtoSelecionado || quantidadeItem <= 0) {
          setAddItemError("Selecione um produto e informe uma quantidade válida.");
          return;
      }

      setIsAddingItem(true);
      setAddItemError(null);

      const dadosItem = {
          produtoId: produtoSelecionado.id, // Use 'id'
          quantidade: quantidadeItem,
          // Backend should calculate price based on product
      };

      try {
          // Call the simulated Velo function to add the item
          await veloAdicionarItemPedido(id, dadosItem);

          // Refetch pedido data to show the updated item list and total
          await fetchPedidoData(); 

          // Reset form and close dialog
          setSelectedProdutoId("");
          setQuantidadeItem(1);
          setIsItemDialogOpen(false);
      } catch (err: any) {
          console.error("Erro ao adicionar item (simulado):", err);
          setAddItemError(err.message || "Falha ao adicionar item.");
      } finally {
          setIsAddingItem(false);
      }
  };

  if (loading) {
    return <p>Carregando detalhes do pedido...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!pedido) {
    return <p>Pedido não encontrado.</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Detalhes do Pedido: {pedido.numero ?? pedido.id}</h1>
        {/* Add Edit button later if needed */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Informações Gerais</h3>
            <p><strong>ID:</strong> {pedido.id}</p>
            <p><strong>Número:</strong> {pedido.numero ?? "-"}</p>
            <p><strong>Cliente:</strong> {pedido.clienteNome ?? "-"}</p>
            <p><strong>Data:</strong> {pedido.data ? new Date(pedido.data).toLocaleDateString("pt-BR") : "-"}</p>
            <p><strong>Status:</strong> {pedido.status ?? "-"}</p>
        </div>
        <div className="border rounded-lg p-4 md:col-span-2">
            <h3 className="font-semibold mb-2">Valores</h3>
            <p><strong>Valor Total:</strong> R$ {(pedido.valorTotal ?? 0).toFixed(2)}</p>
            {/* Add other value details if needed */}
        </div>
      </div>

      {/* Itens do Pedido Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Itens do Pedido</h2>
            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Adicionar Item</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Item ao Pedido</DialogTitle>
                  <DialogDescription>
                    Selecione o produto e informe a quantidade.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="produto" className="text-right">
                      Produto
                    </Label>
                    <Select value={selectedProdutoId} onValueChange={setSelectedProdutoId}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                            {produtosDisponiveis.map(p => (
                                <SelectItem key={p.id} value={p.id}> {/* Use 'id' */}
                                    {p.nome} (R$ {(p.precoBase ?? 0).toFixed(2)})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantidade" className="text-right">
                      Quantidade
                    </Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={quantidadeItem}
                      onChange={(e) => setQuantidadeItem(parseInt(e.target.value, 10) || 1)}
                      className="col-span-3"
                    />
                  </div>
                  {addItemError && <p className="col-span-4 text-red-500 text-sm">{addItemError}</p>}
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    onClick={handleAddItem} 
                    disabled={!selectedProdutoId || quantidadeItem <= 0 || isAddingItem}
                  >
                      {isAddingItem ? "Adicionando..." : "Adicionar Item"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableCaption>Itens incluídos neste pedido.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Preço Unit. (R$)</TableHead>
                <TableHead className="text-right">Preço Total (R$)</TableHead>
                {/* <TableHead className="text-right">Ações</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.itens && pedido.itens.length > 0 ? (
                pedido.itens.map((item) => (
                  <TableRow key={item.id}> {/* Use 'id' */}
                    <TableCell>{item.nomeProduto ?? item.produtoId}</TableCell> {/* Display name or ID */} 
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">{(item.valorUnitario ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.valorTotal ?? 0).toFixed(2)}</TableCell>
                    {/* <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Editar</Button>
                        <Button variant="ghost" size="sm" className="text-red-500">Remover</Button>
                    </TableCell> */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum item adicionado a este pedido ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Button variant="outline" className="mt-4" asChild>
        <Link href="/pedidos">Voltar para Lista</Link>
      </Button>
    </div>
  );
}

