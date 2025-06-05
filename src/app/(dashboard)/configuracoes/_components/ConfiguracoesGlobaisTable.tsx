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
import { Plus, Pencil, Trash2, Search, X, FileText, Settings } from 'lucide-react';

interface ConfiguracaoGlobal {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  tipo: string;
  categoria: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export default function ConfiguracoesGlobaisTable() {
  const supabase = createClient();
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentConfiguracao, setCurrentConfiguracao] = useState<ConfiguracaoGlobal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [formData, setFormData] = useState({
    chave: '',
    valor: '',
    descricao: '',
    tipo: 'texto',
    categoria: 'geral',
    is_active: true
  });

  const categorias = [
    { value: 'geral', label: 'Geral' },
    { value: 'sistema', label: 'Sistema' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'estoque', label: 'Estoque' },
    { value: 'producao', label: 'Produção' },
    { value: 'vendas', label: 'Vendas' },
    { value: 'email', label: 'E-mail' },
    { value: 'notificacoes', label: 'Notificações' }
  ];

  const tipos = [
    { value: 'texto', label: 'Texto' },
    { value: 'numero', label: 'Número' },
    { value: 'booleano', label: 'Booleano' },
    { value: 'data', label: 'Data' },
    { value: 'json', label: 'JSON' },
    { value: 'email', label: 'E-mail' },
    { value: 'url', label: 'URL' },
    { value: 'senha', label: 'Senha' }
  ];

  useEffect(() => {
    fetchConfiguracoes();
  }, []);

  const fetchConfiguracoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracoes_globais')
        .select('*')
        .order('categoria')
        .order('chave');
      
      if (error) throw error;
      setConfiguracoes(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar configurações:", error);
      toast.error(`Erro ao buscar configurações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setCurrentConfiguracao(null);
    setFormData({
      chave: '',
      valor: '',
      descricao: '',
      tipo: 'texto',
      categoria: 'geral',
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (configuracao: ConfiguracaoGlobal) => {
    setCurrentConfiguracao(configuracao);
    setFormData({
      chave: configuracao.chave,
      valor: configuracao.valor,
      descricao: configuracao.descricao || '',
      tipo: configuracao.tipo,
      categoria: configuracao.categoria,
      is_active: configuracao.is_active
    });
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (configuracao: ConfiguracaoGlobal) => {
    setCurrentConfiguracao(configuracao);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenViewDialog = (configuracao: ConfiguracaoGlobal) => {
    setCurrentConfiguracao(configuracao);
    setIsViewDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoriaFilterChange = (value: string) => {
    setCategoriaFilter(value);
  };

  const filteredConfiguracoes = configuracoes.filter(config => {
    const matchesSearch = 
      config.chave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.valor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (config.descricao && config.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategoria = categoriaFilter === '' || config.categoria === categoriaFilter;
    
    return matchesSearch && matchesCategoria;
  });

  const handleSubmit = async () => {
    try {
      if (!formData.chave.trim()) {
        toast.error("Chave da configuração é obrigatória");
        return;
      }

      if (!formData.valor.trim()) {
        toast.error("Valor da configuração é obrigatório");
        return;
      }

      // Validar formato do valor de acordo com o tipo
      if (formData.tipo === 'numero' && isNaN(Number(formData.valor))) {
        toast.error("O valor deve ser um número válido");
        return;
      }

      if (formData.tipo === 'booleano' && !['true', 'false'].includes(formData.valor.toLowerCase())) {
        toast.error("O valor para tipo booleano deve ser 'true' ou 'false'");
        return;
      }

      if (formData.tipo === 'data') {
        const date = new Date(formData.valor);
        if (isNaN(date.getTime())) {
          toast.error("O valor deve ser uma data válida");
          return;
        }
      }

      if (formData.tipo === 'json') {
        try {
          JSON.parse(formData.valor);
        } catch (e) {
          toast.error("O valor deve ser um JSON válido");
          return;
        }
      }

      if (formData.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.valor)) {
        toast.error("O valor deve ser um e-mail válido");
        return;
      }

      if (formData.tipo === 'url' && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(formData.valor)) {
        toast.error("O valor deve ser uma URL válida");
        return;
      }

      if (currentConfiguracao) {
        // Editar configuração existente
        const { error } = await supabase
          .from('configuracoes_globais')
          .update({
            valor: formData.valor,
            descricao: formData.descricao || null,
            tipo: formData.tipo,
            categoria: formData.categoria,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentConfiguracao.id);
        
        if (error) throw error;
        toast.success("Configuração atualizada com sucesso");
      } else {
        // Verificar se a chave já existe
        const { data: existingConfig, error: checkError } = await supabase
          .from('configuracoes_globais')
          .select('id')
          .eq('chave', formData.chave)
          .limit(1);
        
        if (checkError) throw checkError;
        
        if (existingConfig && existingConfig.length > 0) {
          toast.error("Esta chave de configuração já existe");
          return;
        }

        // Criar nova configuração
        const { error } = await supabase
          .from('configuracoes_globais')
          .insert({
            chave: formData.chave,
            valor: formData.valor,
            descricao: formData.descricao || null,
            tipo: formData.tipo,
            categoria: formData.categoria,
            is_active: formData.is_active
          });
        
        if (error) throw error;
        toast.success("Configuração criada com sucesso");
      }
      
      setIsDialogOpen(false);
      fetchConfiguracoes();
    } catch (error: any) {
      console.error("Erro ao salvar configuração:", error);
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      if (!currentConfiguracao) return;

      const { error } = await supabase
        .from('configuracoes_globais')
        .delete()
        .eq('id', currentConfiguracao.id);
      
      if (error) throw error;
      
      toast.success("Configuração excluída com sucesso");
      setIsDeleteDialogOpen(false);
      fetchConfiguracoes();
    } catch (error: any) {
      console.error("Erro ao excluir configuração:", error);
      toast.error(`Erro ao excluir configuração: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoriaLabel = (categoria: string) => {
    const found = categorias.find(c => c.value === categoria);
    return found ? found.label : categoria;
  };

  const getTipoLabel = (tipo: string) => {
    const found = tipos.find(t => t.value === tipo);
    return found ? found.label : tipo;
  };

  const getFormattedValue = (valor: string, tipo: string) => {
    if (tipo === 'senha') {
      return '••••••••';
    }
    return valor;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Configurações Globais</CardTitle>
          <CardDescription>Gerencie as configurações globais do sistema</CardDescription>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nova Configuração
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar configurações por chave, valor ou descrição..."
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
              value={categoriaFilter}
              onValueChange={handleCategoriaFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.value} value={categoria.value}>
                    {categoria.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <p>Carregando configurações...</p>
          </div>
        ) : filteredConfiguracoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || categoriaFilter ? (
              <p>Nenhuma configuração encontrada com os filtros aplicados</p>
            ) : (
              <p>Nenhuma configuração cadastrada. Clique em "Nova Configuração" para começar.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chave</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfiguracoes.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">{config.chave}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {getFormattedValue(config.valor, config.tipo)}
                  </TableCell>
                  <TableCell>{getTipoLabel(config.tipo)}</TableCell>
                  <TableCell>{getCategoriaLabel(config.categoria)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      config.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {config.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenViewDialog(config)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenEditDialog(config)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleOpenDeleteDialog(config)}
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

        {/* Diálogo de Criação/Edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentConfiguracao ? "Editar Configuração" : "Nova Configuração"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chave">Chave <span className="text-red-500">*</span></Label>
                <Input
                  id="chave"
                  name="chave"
                  value={formData.chave}
                  onChange={handleInputChange}
                  placeholder="Nome da chave (ex: taxa_juros, email_suporte)"
                  disabled={!!currentConfiguracao}
                />
                {currentConfiguracao && (
                  <p className="text-xs text-muted-foreground">
                    A chave não pode ser alterada após a criação
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valor">Valor <span className="text-red-500">*</span></Label>
                <Input
                  id="valor"
                  name="valor"
                  type={formData.tipo === 'senha' ? 'password' : 'text'}
                  value={formData.valor}
                  onChange={handleInputChange}
                  placeholder="Valor da configuração"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Descrição da configuração"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleSelectChange('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => handleSelectChange('categoria', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.value} value={categoria.value}>
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="is_active">Configuração ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {currentConfiguracao ? "Salvar Alterações" : "Criar Configuração"}
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
                Tem certeza que deseja excluir a configuração <strong>{currentConfiguracao?.chave}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta ação não poderá ser desfeita e pode afetar o funcionamento do sistema.
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
              <DialogTitle>Detalhes da Configuração</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {currentConfiguracao && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Chave</h3>
                    <p className="font-medium">{currentConfiguracao.chave}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Valor</h3>
                    <p>{getFormattedValue(currentConfiguracao.valor, currentConfiguracao.tipo)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                    <p>{currentConfiguracao.descricao || "-"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Tipo</h3>
                      <p>{getTipoLabel(currentConfiguracao.tipo)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Categoria</h3>
                      <p>{getCategoriaLabel(currentConfiguracao.categoria)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentConfiguracao.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {currentConfiguracao.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Criado em</h3>
                      <p>{formatDate(currentConfiguracao.created_at)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Atualizado em</h3>
                      <p>{formatDate(currentConfiguracao.updated_at)}</p>
                    </div>
                  </div>
                  
                  {currentConfiguracao.created_by && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Criado por</h3>
                      <p>{currentConfiguracao.created_by}</p>
                    </div>
                  )}
                  
                  {currentConfiguracao.updated_by && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Atualizado por</h3>
                      <p>{currentConfiguracao.updated_by}</p>
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
