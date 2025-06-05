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
import { Plus, Pencil, Trash2, Search, X, FileText, Clock } from 'lucide-react';

interface OrdemProducao {
  id: string;
  produto_id: string;
  order_item_id: string | null;
  quantidade: number;
  data_inicio: string | null;
  data_prevista: string | null;
  data_conclusao: string | null;
  status: string;
  prioridade: string;
  observacoes: string | null;
  custo_estimado: number | null;
  created_at: string;
  updated_at: string;
  produto?: {
    id: string;
    name: string;
    sku: string | null;
  };
  order_item?: {
    id: string;
    order_id: string;
    order?: {
      id: string;
      codigo: string;
    };
  } | null;
}

export default function OrdensProducaoTable() {
  const supabase = createClient();
  const [ordensProducao, setOrdensProducao] = useState<OrdemProducao[]>([]);
  const [produtos, setProdutos] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentOrdemProducao, setCurrentOrdemProducao] = useState<OrdemProducao | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    produto_id: '',
    quantidade: 1,
    data_inicio: '',
    data_prevista: '',
    status: 'pendente',
    prioridade: 'normal',
    observacoes: ''
  });

  useEffect(() => {
    fetchOrdensProducao();
    fetchProdutos();
  }, []);

  const fetchOrdensProducao = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('production_orders')
        .select(`
          *,
          produto:produto_id(id, name, sku),
          order_item:order_item_id(id, order_id, order:order_id(id, codigo))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrdensProducao(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar ordens de produção:", error);
      toast.error(`Erro ao buscar ordens de produção: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setProdutos(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error);
      toast.error(`Erro ao buscar produtos: ${error.message}`);
    }
  };

  const handleOpenCreateDialog = () => {
    setCurrentOrdemProducao(null);
    setFormData({
      produto_id: '',
      quantidade: 1,
      data_inicio: '',
      data_prevista: '',
      status: 'pendente',
      prioridade: 'normal',
      observacoes: ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (ordemProducao: OrdemProducao) => {
    setCurrentOrdemProducao(ordemProducao);
    setFormData({
      produto_id: ordemProducao.produto_id,
      quantidade: ordemProducao.quantidade,
      data_inicio: ordemProducao.data_inicio || '',
      data_prevista: ordemProducao.data_prevista || '',
      status: ordemProducao.status,
      prioridade: ordemProducao.prioridade,
      observacoes: ordemProducao.observacoes || ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (ordemProducao: OrdemProducao) => {
    setCurrentOrdemProducao(ordemProducao);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenViewDialog = (ordemProducao: OrdemProducao) => {
    setCurrentOrdemProducao(ordemProducao);
    setIsViewDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const filteredOrdensProducao = ordensProducao.filter(ordem => {
    const matchesSearch = 
      ordem.produto?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ordem.produto?.sku && ordem.produto.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ordem.order_item?.order?.codigo && ordem.order_item.order.codigo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === '' || ordem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async () => {
    try {
      if (!formData.produto_id) {
        toast.error("Selecione um produto");
        return;
      }

      if (formData.quantidade <= 0) {
        toast.error("A quantidade deve ser maior que zero");
        return;
      }

      if (currentOrdemProducao) {
        // Editar ordem existente
        const { error } = await supabase
          .from('production_orders')
          .update({
            produto_id: formData.produto_id,
            quantidade: formData.quantidade,
            data_inicio: formData.data_inicio || null,
            data_prevista: formData.data_prevista || null,
            status: formData.status,
            prioridade: formData.prioridade,
            observacoes: formData.observacoes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentOrdemProducao.id);
        
        if (error) throw error;
        toast.success("Ordem de produção atualizada com sucesso");
      } else {
        // Criar nova ordem
        const { error } = await supabase
          .from('production_orders')
          .insert({
            produto_id: formData.produto_id,
            quantidade: formData.quantidade,
            data_inicio: formData.data_inicio || null,
            data_prevista: formData.data_prevista || null,
            status: formData.status,
            prioridade: formData.prioridade,
            observacoes: formData.observacoes || null
          });
        
        if (error) throw error;
        toast.success("Ordem de produção criada com sucesso");
      }
      
      setIsDialogOpen(false);
      fetchOrdensProducao();
    } catch (error: any) {
      console.error("Erro ao salvar ordem de produção:", error);
      toast.error(`Erro ao salvar ordem de produção: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      if (!currentOrdemProducao) return;

      // Verificar se a ordem já está em andamento ou concluída
      if (currentOrdemProducao.status !== 'pendente') {
        toast.error("Não é possível excluir uma ordem que já está em andamento ou concluída");
        setIsDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('production_orders')
        .delete()
        .eq('id', currentOrdemProducao.id);
      
      if (error) throw error;
      
      toast.success("Ordem de produção excluída com sucesso");
      setIsDeleteDialogOpen(false);
      fetchOrdensProducao();
    } catch (error: any) {
      console.error("Erro ao excluir ordem de produção:", error);
      toast.error(`Erro ao excluir ordem de produção: ${error.message}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pendente':
        return "bg-yellow-100 text-yellow-800";
      case 'em_andamento':
        return "bg-blue-100 text-blue-800";
      case 'concluida':
        return "bg-green-100 text-green-800";
      case 'cancelada':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return "Pendente";
      case 'em_andamento':
        return "Em Andamento";
      case 'concluida':
        return "Concluída";
      case 'cancelada':
        return "Cancelada";
      default:
        return status;
    }
  };

  const getPrioridadeBadgeClass = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa':
        return "bg-green-100 text-green-800";
      case 'normal':
        return "bg-blue-100 text-blue-800";
      case 'alta':
        return "bg-orange-100 text-orange-800";
      case 'urgente':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa':
        return "Baixa";
      case 'normal':
        return "Normal";
      case 'alta':
        return "Alta";
      case 'urgente':
        return "Urgente";
      default:
        return prioridade;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Ordens de Produção</CardTitle>
          <CardDescription>Gerencie as ordens de produção da empresa</CardDescription>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nova Ordem
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por produto, SKU ou código do pedido..."
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
          <div className="w-[200px]">
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <p>Carregando ordens de produção...</p>
          </div>
        ) : filteredOrdensProducao.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter ? (
              <p>Nenhuma ordem de produção encontrada com os filtros aplicados</p>
            ) : (
              <p>Nenhuma ordem de produção cadastrada. Clique em "Nova Ordem" para começar.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdensProducao.map((ordem) => (
                <TableRow key={ordem.id}>
                  <TableCell className="font-medium">
                    {ordem.produto?.name || "Produto não encontrado"}
                    {ordem.produto?.sku && <span className="block text-xs text-muted-foreground">SKU: {ordem.produto.sku}</span>}
                  </TableCell>
                  <TableCell>{ordem.quantidade}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(ordem.status)}`}>
                      {getStatusLabel(ordem.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeBadgeClass(ordem.prioridade)}`}>
                      {getPrioridadeLabel(ordem.prioridade)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(ordem.data_prevista)}</TableCell>
                  <TableCell>
                    {ordem.order_item?.order?.codigo || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenViewDialog(ordem)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenEditDialog(ordem)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {ordem.status === 'pendente' && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(ordem)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Diálogo de Criação/Edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentOrdemProducao ? "Editar Ordem de Produção" : "Nova Ordem de Produção"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="produto_id">Produto <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.produto_id}
                  onValueChange={(value) => handleSelectChange('produto_id', value)}
                  disabled={!!currentOrdemProducao?.order_item_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentOrdemProducao?.order_item_id && (
                  <p className="text-xs text-muted-foreground">
                    Produto não pode ser alterado pois esta ordem está vinculada a um pedido
                  </p>
                )}
              </div>
              
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
                  placeholder="Quantidade a produzir"
                  disabled={!!currentOrdemProducao?.order_item_id}
                />
                {currentOrdemProducao?.order_item_id && (
                  <p className="text-xs text-muted-foreground">
                    Quantidade não pode ser alterada pois esta ordem está vinculada a um pedido
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    name="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_prevista">Data Prevista</Label>
                  <Input
                    id="data_prevista"
                    name="data_prevista"
                    type="date"
                    value={formData.data_prevista}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.prioridade}
                  onValueChange={(value) => handleSelectChange('prioridade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Observações sobre a produção"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {currentOrdemProducao ? "Salvar Alterações" : "Criar Ordem"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Tem certeza que deseja excluir esta ordem de produção para o produto <strong>{currentOrdemProducao?.produto?.name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação não poderá ser desfeita.
              </p>
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

        {/* Diálogo de Visualização */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Ordem de Produção</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {currentOrdemProducao && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Produto</h3>
                    <p>{currentOrdemProducao.produto?.name || "Produto não encontrado"}</p>
                    {currentOrdemProducao.produto?.sku && (
                      <p className="text-sm text-muted-foreground">SKU: {currentOrdemProducao.produto.sku}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Quantidade</h3>
                      <p>{currentOrdemProducao.quantidade}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Pedido</h3>
                      <p>{currentOrdemProducao.order_item?.order?.codigo || "Produção Interna"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(currentOrdemProducao.status)}`}>
                        {getStatusLabel(currentOrdemProducao.status)}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Prioridade</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeBadgeClass(currentOrdemProducao.prioridade)}`}>
                        {getPrioridadeLabel(currentOrdemProducao.prioridade)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                      <p>{formatDate(currentOrdemProducao.created_at)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Data de Início</h3>
                      <p>{formatDate(currentOrdemProducao.data_inicio)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Data Prevista</h3>
                      <p>{formatDate(currentOrdemProducao.data_prevista)}</p>
                    </div>
                  </div>
                  
                  {currentOrdemProducao.data_conclusao && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Data de Conclusão</h3>
                      <p>{formatDate(currentOrdemProducao.data_conclusao)}</p>
                    </div>
                  )}
                  
                  {currentOrdemProducao.custo_estimado !== null && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Custo Estimado</h3>
                      <p>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(currentOrdemProducao.custo_estimado)}
                      </p>
                    </div>
                  )}
                  
                  {currentOrdemProducao.observacoes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Observações</h3>
                      <p>{currentOrdemProducao.observacoes}</p>
                    </div>
                  )}
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
