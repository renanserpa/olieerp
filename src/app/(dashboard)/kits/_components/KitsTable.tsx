"use client";

import React, { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSupabaseData, createRecord, updateRecord, deleteRecord } from "@/lib/data-hooks";
import { Loader2, Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { toast } from "sonner";

export default function KitsTable() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_percentage: '',
    active: true
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productQuantities, setProductQuantities] = useState<{[key: string]: number}>({});

  // Buscar dados de kits
  const { data: kits, loading, error, refresh } = useSupabaseData('produtos_compostos', 'name');
  
  // Buscar produtos para o select
  const { data: products } = useSupabaseData('products', 'name');
  
  // Buscar itens de kits para o produto atual
  const { data: kitItems, refresh: refreshKitItems } = useSupabaseData(
    'itens_produto_composto', 
    'created_at',
    { 
      filters: currentItem ? [{ column: 'kit_id', operator: 'eq', value: currentItem?.id }] : [] 
    }
  );

  // Filtrar kits com base no termo de busca
  const filteredKits = kits.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        discount_percentage: item.discount_percentage?.toString() || '',
        active: item.active !== false
      });
    } else {
      setCurrentItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        discount_percentage: '',
        active: true
      });
    }
    setIsOpen(true);
  };

  const handleOpenItemsDialog = (item: any) => {
    setCurrentItem(item);
    
    // Preparar os produtos selecionados e suas quantidades
    const selected: string[] = [];
    const quantities: {[key: string]: number} = {};
    
    kitItems.forEach(kitItem => {
      if (kitItem.product_id) {
        selected.push(kitItem.product_id);
        quantities[kitItem.product_id] = kitItem.quantity || 1;
      }
    });
    
    setSelectedProducts(selected);
    setProductQuantities(quantities);
    setIsItemsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: any) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        // Remove o produto
        const newSelected = prev.filter(id => id !== productId);
        
        // Remove a quantidade
        const newQuantities = { ...productQuantities };
        delete newQuantities[productId];
        setProductQuantities(newQuantities);
        
        return newSelected;
      } else {
        // Adiciona o produto com quantidade padrão 1
        setProductQuantities(prev => ({ ...prev, [productId]: 1 }));
        return [...prev, productId];
      }
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity) // Garante que a quantidade seja pelo menos 1
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Converter valores numéricos
      const numericData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null
      };

      let kitId;
      
      if (currentItem) {
        // Atualizar kit existente
        const result = await updateRecord('produtos_compostos', currentItem.id, numericData);
        kitId = currentItem.id;
      } else {
        // Criar novo kit
        const result = await createRecord('produtos_compostos', numericData);
        kitId = result.data?.[0]?.id;
      }
      
      // Fechar diálogo e atualizar lista
      setIsOpen(false);
      refresh();
    } catch (error) {
      console.error("Erro ao salvar kit:", error);
      toast.error("Erro ao salvar kit");
    }
  };

  const handleSaveItems = async () => {
    if (!currentItem?.id) return;
    
    try {
      // Primeiro, excluir todos os itens existentes
      const supabase = createClient();
      await supabase
        .from('itens_produto_composto')
        .delete()
        .eq('kit_id', currentItem.id);
      
      // Depois, inserir os novos itens
      const itemsToInsert = selectedProducts.map(productId => ({
        kit_id: currentItem.id,
        product_id: productId,
        quantity: productQuantities[productId] || 1
      }));
      
      if (itemsToInsert.length > 0) {
        await supabase
          .from('itens_produto_composto')
          .insert(itemsToInsert);
      }
      
      toast.success("Itens do kit atualizados com sucesso");
      setIsItemsDialogOpen(false);
      refreshKitItems();
    } catch (error) {
      console.error("Erro ao salvar itens do kit:", error);
      toast.error("Erro ao salvar itens do kit");
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;
    
    try {
      // Primeiro excluir os itens relacionados
      const supabase = createClient();
      await supabase
        .from('itens_produto_composto')
        .delete()
        .eq('kit_id', currentItem.id);
      
      // Depois excluir o kit
      await deleteRecord('produtos_compostos', currentItem.id);
      setIsDeleteDialogOpen(false);
      refresh();
    } catch (error) {
      console.error("Erro ao excluir kit:", error);
      toast.error("Erro ao excluir kit");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/15 p-4 rounded-md text-destructive">
        Erro ao carregar kits: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar kits..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Kit
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum kit encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredKits.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>R$ {item.price?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{item.discount_percentage ? `${item.discount_percentage}%` : '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${item.active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleOpenItemsDialog(item)}>
                      <Package className="h-4 w-4 mr-1" />
                      Gerenciar
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de Criação/Edição */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentItem ? 'Editar Kit' : 'Novo Kit'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nome</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Descrição</label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">Preço (R$)</label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="discount_percentage" className="text-sm font-medium">Desconto (%)</label>
                <Input
                  id="discount_percentage"
                  name="discount_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Kit ativo
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {currentItem ? 'Salvar Alterações' : 'Criar Kit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Gerenciamento de Itens */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Itens do Kit: {currentItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <Input
                placeholder="Buscar produtos..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="border rounded-md max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleProductSelection(product.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>R$ {product.price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        {selectedProducts.includes(product.id) && (
                          <Input
                            type="number"
                            min="1"
                            value={productQuantities[product.id] || 1}
                            onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                            className="w-20"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {selectedProducts.length} produto(s) selecionado(s)
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItems}>
              Salvar Itens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir o kit "{currentItem?.name}"?</p>
            <p className="text-sm text-muted-foreground mt-2">Esta ação não pode ser desfeita.</p>
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
