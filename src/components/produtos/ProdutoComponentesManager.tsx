"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Search, X, FileText } from 'lucide-react';

interface Produto {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface Componente {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface ProdutoComponente {
  id: string;
  produto_id: string;
  componente_id: string;
  quantidade: number;
  obrigatorio: boolean;
  componente?: Componente;
}

export default function ProdutoComponentesManager({ produtoId }: { produtoId: string }) {
  const supabase = createClient();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [produtoComponentes, setProdutoComponentes] = useState<ProdutoComponente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProdutoComponente, setCurrentProdutoComponente] = useState<ProdutoComponente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    componente_id: '',
    quantidade: 1,
    obrigatorio: false
  });

  useEffect(() => {
    if (produtoId) {
      fetchProduto();
      fetchProdutoComponentes();
      fetchComponentes();
    }
  }, [produtoId]);

  const fetchProduto = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, is_active')
        .eq('id', produtoId)
        .single();
      
      if (error) throw error;
      setProduto(data);
    } catch (error: any) {
      console.error("Erro ao buscar produto:", error);
      toast.error(`Erro ao buscar produto: ${error.message}`);
    }
  };

  const fetchProdutoComponentes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produto_componente')
        .select(`
          *,
          componente:componente_id(id, name, description, is_active)
        `)
        .eq('produto_id', produtoId);
      
      if (error) throw error;
      setProdutoComponentes(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar componentes do produto:", error);
      toast.error(`Erro ao buscar componentes do produto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchComponentes = async () => {
    try {
      const { data, error } = await supabase
        .from('components')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setComponentes(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar componentes:", error);
      toast.error(`Erro ao buscar componentes: ${error.message}`);
    }
  };

  const handleOpenCreateDialog = () => {
    setCurrentProdutoComponente(null);
    setFormData({
      componente_id: '',
      quantidade: 1,
      obrigatorio: false
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (produtoComponente: ProdutoComponente) => {
    setCurrentProdutoComponente(produtoComponente);
    setFormData({
      componente_id: produtoComponente.componente_id,
      quantidade: produtoComponente.quantidade,
      obrigatorio: produtoComponente.obrigatorio
    });
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (produtoComponente: ProdutoComponente) => {
    setCurrentProdutoComponente(produtoComponente);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, obrigatorio: checked }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredProdutoComponentes = produtoComponentes.filter(item => 
    item.componente?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.componente?.description && item.componente.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async () => {
    try {
      if (!formData.componente_id) {
        toast.error("Selecione um componente");
        return;
      }

      if (formData.quantidade <= 0) {
        toast.error("A quantidade deve ser maior que zero");
        return;
      }

      if (currentProdutoComponente) {
        // Editar relação existente
        const { error } = await supabase
          .from('produto_componente')
          .update({
            quantidade: formData.quantidade,
            obrigatorio: formData.obrigatorio,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProdutoComponente.id);
        
        if (error) throw error;
        toast.success("Componente atualizado com sucesso");
      } else {
        // Verificar se o componente já está vinculado ao produto
        const { data: existingData, error: checkError } = await supabase
          .from('produto_componente')
          .select('id')
          .eq('produto_id', produtoId)
          .eq('componente_id', formData.componente_id);
        
        if (checkError) throw checkError;
        
        if (existingData && existingData.length > 0) {
          toast.error("Este componente já está vinculado ao produto");
          return;
        }

        // Criar nova relação
        const { error } = await supabase
          .from('produto_componente')
          .insert({
            produto_id: produtoId,
            componente_id: formData.componente_id,
            quantidade: formData.quantidade,
            obrigatorio: formData.obrigatorio
          });
        
        if (error) throw error;
        toast.success("Componente adicionado com sucesso");
      }
      
      setIsDialogOpen(false);
      fetchProdutoComponentes();
    } catch (error: any) {
      console.error("Erro ao salvar componente do produto:", error);
      toast.error(`Erro ao salvar componente do produto: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      if (!currentProdutoComponente) return;

      const { error } = await supabase
        .from('produto_componente')
        .delete()
        .eq('id', currentProdutoComponente.id);
      
      if (error) throw error;
      
      toast.success("Componente removido com sucesso");
      setIsDeleteDialogOpen(false);
      fetchProdutoComponentes();
    } catch (error: any) {
      console.error("Erro ao remover componente do produto:", error);
      toast.error(`Erro ao remover componente do produto: ${error.message}`);
    }
  };

  if (!produto) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <p>Produto não encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Componentes do Produto: {produto.name}</CardTitle>
          <CardDescription>Gerencie os componentes utilizados neste produto</CardDescription>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Componente
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar componentes..."
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
            <p>Carregando componentes...</p>
          </div>
        ) : filteredProdutoComponentes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? (
              <p>Nenhum componente encontrado para "{searchTerm}"</p>
            ) : (
              <p>Nenhum componente vinculado a este produto. Clique em "Adicionar Componente" para começar.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Componente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Obrigatório</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProdutoComponentes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.componente?.name || "Componente não encontrado"}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.componente?.description || "-"}</TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.obrigatorio
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {item.obrigatorio ? "Sim" : "Não"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleOpenDeleteDialog(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Diálogo de Adição/Edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentProdutoComponente ? "Editar Componente" : "Adicionar Componente"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!currentProdutoComponente && (
                <div className="space-y-2">
                  <Label htmlFor="componente_id">Componente <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.componente_id}
                    onValueChange={(value) => handleSelectChange('componente_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um componente" />
                    </SelectTrigger>
                    <SelectContent>
                      {componentes.map((componente) => (
                        <SelectItem key={componente.id} value={componente.id}>
                          {componente.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade <span className="text-red-500">*</span></Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantidade}
                  onChange={handleNumberInputChange}
                  placeholder="Quantidade necessária"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="obrigatorio"
                  checked={formData.obrigatorio}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="obrigatorio">Componente obrigatório</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {currentProdutoComponente ? "Salvar Alterações" : "Adicionar Componente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Remoção</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Tem certeza que deseja remover o componente <strong>{currentProdutoComponente?.componente?.name}</strong> deste produto?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
