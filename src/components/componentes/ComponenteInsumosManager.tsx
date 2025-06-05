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

interface Componente {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface Insumo {
  id: string;
  name: string;
  unit_of_measurement_id: string | null;
  unit_of_measurement?: {
    id: string;
    name: string;
    symbol: string;
  } | null;
}

interface ComponenteInsumo {
  id: string;
  componente_id: string;
  insumo_id: string;
  quantidade: number;
  unidade_medida_id: string | null;
  insumo?: Insumo;
  unidade_medida?: {
    id: string;
    name: string;
    symbol: string;
  } | null;
}

export default function ComponenteInsumosManager({ componenteId }: { componenteId: string }) {
  const supabase = createClient();
  const [componente, setComponente] = useState<Componente | null>(null);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [componenteInsumos, setComponenteInsumos] = useState<ComponenteInsumo[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<{ id: string; name: string; symbol: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentComponenteInsumo, setCurrentComponenteInsumo] = useState<ComponenteInsumo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    insumo_id: '',
    quantidade: 1,
    unidade_medida_id: ''
  });

  useEffect(() => {
    if (componenteId) {
      fetchComponente();
      fetchComponenteInsumos();
      fetchInsumos();
      fetchUnidadesMedida();
    }
  }, [componenteId]);

  const fetchComponente = async () => {
    try {
      const { data, error } = await supabase
        .from('components')
        .select('id, name, description, is_active')
        .eq('id', componenteId)
        .single();
      
      if (error) throw error;
      setComponente(data);
    } catch (error: any) {
      console.error("Erro ao buscar componente:", error);
      toast.error(`Erro ao buscar componente: ${error.message}`);
    }
  };

  const fetchComponenteInsumos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('componente_insumo')
        .select(`
          *,
          insumo:insumo_id(id, name, unit_of_measurement_id, unit_of_measurement:unit_of_measurement_id(id, name, symbol)),
          unidade_medida:unidade_medida_id(id, name, symbol)
        `)
        .eq('componente_id', componenteId);
      
      if (error) throw error;
      setComponenteInsumos(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar insumos do componente:", error);
      toast.error(`Erro ao buscar insumos do componente: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsumos = async () => {
    try {
      const { data, error } = await supabase
        .from('supplies')
        .select(`
          id, 
          name,
          unit_of_measurement_id,
          unit_of_measurement:unit_of_measurement_id(id, name, symbol)
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setInsumos(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar insumos:", error);
      toast.error(`Erro ao buscar insumos: ${error.message}`);
    }
  };

  const fetchUnidadesMedida = async () => {
    try {
      const { data, error } = await supabase
        .from('unit_of_measurement')
        .select('id, name, symbol')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setUnidadesMedida(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar unidades de medida:", error);
      toast.error(`Erro ao buscar unidades de medida: ${error.message}`);
    }
  };

  const handleOpenCreateDialog = () => {
    setCurrentComponenteInsumo(null);
    setFormData({
      insumo_id: '',
      quantidade: 1,
      unidade_medida_id: ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (componenteInsumo: ComponenteInsumo) => {
    setCurrentComponenteInsumo(componenteInsumo);
    setFormData({
      insumo_id: componenteInsumo.insumo_id,
      quantidade: componenteInsumo.quantidade,
      unidade_medida_id: componenteInsumo.unidade_medida_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (componenteInsumo: ComponenteInsumo) => {
    setCurrentComponenteInsumo(componenteInsumo);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'insumo_id') {
      const selectedInsumo = insumos.find(i => i.id === value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        unidade_medida_id: selectedInsumo?.unit_of_measurement_id || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredComponenteInsumos = componenteInsumos.filter(item => 
    item.insumo?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      if (!formData.insumo_id) {
        toast.error("Selecione um insumo");
        return;
      }

      if (formData.quantidade <= 0) {
        toast.error("A quantidade deve ser maior que zero");
        return;
      }

      if (currentComponenteInsumo) {
        // Editar relação existente
        const { error } = await supabase
          .from('componente_insumo')
          .update({
            quantidade: formData.quantidade,
            unidade_medida_id: formData.unidade_medida_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentComponenteInsumo.id);
        
        if (error) throw error;
        toast.success("Insumo atualizado com sucesso");
      } else {
        // Verificar se o insumo já está vinculado ao componente
        const { data: existingData, error: checkError } = await supabase
          .from('componente_insumo')
          .select('id')
          .eq('componente_id', componenteId)
          .eq('insumo_id', formData.insumo_id);
        
        if (checkError) throw checkError;
        
        if (existingData && existingData.length > 0) {
          toast.error("Este insumo já está vinculado ao componente");
          return;
        }

        // Criar nova relação
        const { error } = await supabase
          .from('componente_insumo')
          .insert({
            componente_id: componenteId,
            insumo_id: formData.insumo_id,
            quantidade: formData.quantidade,
            unidade_medida_id: formData.unidade_medida_id || null
          });
        
        if (error) throw error;
        toast.success("Insumo adicionado com sucesso");
      }
      
      setIsDialogOpen(false);
      fetchComponenteInsumos();
    } catch (error: any) {
      console.error("Erro ao salvar insumo do componente:", error);
      toast.error(`Erro ao salvar insumo do componente: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      if (!currentComponenteInsumo) return;

      const { error } = await supabase
        .from('componente_insumo')
        .delete()
        .eq('id', currentComponenteInsumo.id);
      
      if (error) throw error;
      
      toast.success("Insumo removido com sucesso");
      setIsDeleteDialogOpen(false);
      fetchComponenteInsumos();
    } catch (error: any) {
      console.error("Erro ao remover insumo do componente:", error);
      toast.error(`Erro ao remover insumo do componente: ${error.message}`);
    }
  };

  if (!componente) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <p>Componente não encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Insumos do Componente: {componente.name}</CardTitle>
          <CardDescription>Gerencie os insumos utilizados neste componente</CardDescription>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Insumo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar insumos..."
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
            <p>Carregando insumos...</p>
          </div>
        ) : filteredComponenteInsumos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? (
              <p>Nenhum insumo encontrado para "{searchTerm}"</p>
            ) : (
              <p>Nenhum insumo vinculado a este componente. Clique em "Adicionar Insumo" para começar.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Unidade de Medida</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComponenteInsumos.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.insumo?.name || "Insumo não encontrado"}</TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell>
                    {item.unidade_medida 
                      ? `${item.unidade_medida.name} (${item.unidade_medida.symbol})`
                      : item.insumo?.unit_of_measurement 
                        ? `${item.insumo.unit_of_measurement.name} (${item.insumo.unit_of_measurement.symbol})`
                        : "-"
                    }
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
                {currentComponenteInsumo ? "Editar Insumo" : "Adicionar Insumo"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!currentComponenteInsumo && (
                <div className="space-y-2">
                  <Label htmlFor="insumo_id">Insumo <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.insumo_id}
                    onValueChange={(value) => handleSelectChange('insumo_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {insumos.map((insumo) => (
                        <SelectItem key={insumo.id} value={insumo.id}>
                          {insumo.name}
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
                  min="0.01"
                  step="0.01"
                  value={formData.quantidade}
                  onChange={handleNumberInputChange}
                  placeholder="Quantidade necessária"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unidade_medida_id">Unidade de Medida</Label>
                <Select
                  value={formData.unidade_medida_id}
                  onValueChange={(value) => handleSelectChange('unidade_medida_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Padrão do insumo</SelectItem>
                    {unidadesMedida.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.name} ({unidade.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {currentComponenteInsumo ? "Salvar Alterações" : "Adicionar Insumo"}
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
                Tem certeza que deseja remover o insumo <strong>{currentComponenteInsumo?.insumo?.name}</strong> deste componente?
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
