"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package
} from "lucide-react";
import { useSupabaseData, getRecordById, deleteRecord } from "@/lib/data-hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StockItemForm } from "./StockItemForm";

export default function EstoqueTable() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  
  // Usar o hook genérico para buscar dados do estoque
  const { 
    data: estoque, 
    loading, 
    error, 
    refresh 
  } = useSupabaseData('stock_items', 'name', {
    select: `
      id, 
      name, 
      sku, 
      location_id, 
      quantity, 
      min_quantity,
      unit_of_measurement_id, 
      updated_at,
      locations:location_id(name),
      unit_of_measurement:unit_of_measurement_id(symbol)
    `
  });

  // Filtrar itens de estoque com base no termo de pesquisa
  const filteredEstoque = estoque.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.locations?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  // Obter classe de cor com base no nível de estoque
  const getStockLevelClass = (quantity: number, minQuantity: number) => {
    if (quantity === 0) {
      return "bg-red-100 text-red-800";
    } else if (quantity < minQuantity) {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-green-100 text-green-800";
    }
  };

  // Obter texto de status com base no nível de estoque
  const getStockLevelText = (quantity: number, minQuantity: number) => {
    if (quantity === 0) {
      return "Sem estoque";
    } else if (quantity < minQuantity) {
      return "Estoque baixo";
    } else {
      return "Estoque normal";
    }
  };

  const handleOpenFormDialog = (item?: any) => {
    setCurrentItem(item || null);
    setIsFormDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: any) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/estoque/${id}`);
  };

  const handleDelete = async () => {
    if (!currentItem?.id) return;
    
    try {
      const result = await deleteRecord('stock_items', currentItem.id);
      
      if (result.success) {
        toast.success("Item de estoque excluído com sucesso");
        refresh();
      } else {
        toast.error("Erro ao excluir item de estoque");
      }
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      toast.error("Erro ao excluir item de estoque");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleFormSuccess = () => {
    setIsFormDialogOpen(false);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar no estoque..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="bg-olie-primary hover:bg-olie-primary/90"
          onClick={() => handleOpenFormDialog()}
        >
          Adicionar Item
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>Carregando itens de estoque...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center py-8 text-red-500">
          <p>Erro ao carregar estoque: {error}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstoque.length > 0 ? (
                filteredEstoque.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku || "-"}</TableCell>
                    <TableCell>{item.locations?.name || "-"}</TableCell>
                    <TableCell>{item.quantity || 0}</TableCell>
                    <TableCell>{item.unit_of_measurement?.symbol || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStockLevelClass(item.quantity || 0, item.min_quantity || 0)}`}
                      >
                        {getStockLevelText(item.quantity || 0, item.min_quantity || 0)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(item.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="flex items-center"
                            onClick={() => handleViewDetails(item.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center"
                            onClick={() => handleOpenFormDialog(item)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center text-red-600"
                            onClick={() => handleOpenDeleteDialog(item)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                    {searchTerm 
                      ? `Nenhum item de estoque encontrado para "${searchTerm}".` 
                      : "Nenhum item de estoque cadastrado."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo de Formulário */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentItem ? "Editar Item de Estoque" : "Adicionar Item de Estoque"}
            </DialogTitle>
          </DialogHeader>
          <StockItemForm 
            initialData={currentItem} 
            onSuccess={handleFormSuccess} 
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir o item "{currentItem?.name}"?</p>
            <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
