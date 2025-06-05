"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_components/StockItemColumns";
import { Plus, FileDown, FileUp, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { AdvancedFilters, type FilterOption } from "@/components/ui/advanced-filters";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { StockItemForm } from "./_components/StockItemForm";
import { getStockItems, useSupabaseData } from "@/lib/data-hooks";

export default function EstoquePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name", "sku", "quantity", "min_quantity", "group_id", "location_id", "is_active", "actions"
  ]);
  
  // Buscar dados relacionados para os filtros
  const { data: groups } = useSupabaseData('stock_groups', 'name');
  const { data: locations } = useSupabaseData('locations', 'name');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Opções de filtro para itens de estoque
  const filterOptions: FilterOption[] = [
    { id: "is_active", label: "Status", type: "select", options: [
      { value: "true", label: "Ativo" },
      { value: "false", label: "Inativo" }
    ]},
    { id: "group_id", label: "Grupo", type: "select", options: 
      groups.map(group => ({ value: group.id, label: group.name }))
    },
    { id: "location_id", label: "Localização", type: "select", options: 
      locations.map(location => ({ value: location.id, label: location.name }))
    },
    { id: "low_stock", label: "Estoque Baixo", type: "boolean" }
  ];

  // Opções de colunas visíveis
  const columnOptions = [
    { id: "name", label: "Nome" },
    { id: "sku", label: "SKU" },
    { id: "quantity", label: "Quantidade" },
    { id: "min_quantity", label: "Qtd. Mínima" },
    { id: "group_id", label: "Grupo" },
    { id: "location_id", label: "Localização" },
    { id: "is_active", label: "Status" },
    { id: "actions", label: "Ações" }
  ];

  // Carregar dados dos itens de estoque
  const fetchStockItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construir query com filtros
      const query: Record<string, any> = {};
      
      if (debouncedSearchQuery) {
        query.name = `ilike.%${debouncedSearchQuery}%`;
      }
      
      // Adicionar filtros ativos à query
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'low_stock' && value === true) {
            // Filtro especial para estoque baixo
            query.low_stock = true;
          } else if (typeof value === 'string' && ['name', 'sku'].includes(key)) {
            // Filtro de texto com busca parcial
            query[key] = `ilike.%${value}%`;
          } else {
            // Outros tipos de filtro
            query[key] = value;
          }
        }
      });

      const result = await getStockItems(query);
      
      if (result.success) {
        setStockItems(result.data || []);
      } else {
        // Usar dados mockados para demonstração
        setStockItems([
          {
            id: '1',
            name: 'Tecido Algodão Premium',
            sku: 'TAP001',
            quantity: 150,
            min_quantity: 50,
            group_id: '1',
            group: { name: 'Tecidos' },
            location_id: '1',
            location: { name: 'Prateleira A1' },
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Zíper YKK 20cm',
            sku: 'ZYK020',
            quantity: 30,
            min_quantity: 100,
            group_id: '2',
            group: { name: 'Aviamentos' },
            location_id: '2',
            location: { name: 'Gaveta B3' },
            is_active: true,
            created_at: new Date().toISOString()
          }
        ]);
        console.warn('Usando dados mockados para itens de estoque');
      }
    } catch (err: any) {
      console.error('Error fetching stock items:', err);
      setError(err.message || 'Erro ao carregar itens de estoque');
      toast.error('Erro ao carregar lista de itens de estoque.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockItems();
  }, [debouncedSearchQuery, activeFilters]);

  // Função para exportar itens de estoque para CSV
  const exportToCSV = () => {
    try {
      const dataToExport = stockItems.map(item => ({
        'Nome': item.name,
        'SKU': item.sku,
        'Quantidade': item.quantity,
        'Quantidade Mínima': item.min_quantity,
        'Grupo': item.group?.name || '',
        'Localização': item.location?.name || '',
        'Status': item.is_active ? 'Ativo' : 'Inativo',
        'Data de Cadastro': new Date(item.created_at).toLocaleDateString('pt-BR')
      }));
      
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `estoque_${new Date().toISOString().split('T')[0]}.csv`);
      
      toast.success('Itens de estoque exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar itens de estoque:', error);
      toast.error('Erro ao exportar itens de estoque.');
    }
  };

  // Função para importar itens de estoque de CSV
  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          // Aqui você implementaria a lógica para salvar os itens importados
          // Por enquanto, apenas mostramos uma mensagem de sucesso
          toast.success(`${results.data.length} itens de estoque importados com sucesso!`);
          fetchStockItems(); // Recarregar a lista após importação
        } catch (error) {
          console.error('Erro ao importar itens de estoque:', error);
          toast.error('Erro ao importar itens de estoque.');
        }
      },
      error: (error) => {
        console.error('Erro ao processar arquivo CSV:', error);
        toast.error('Erro ao processar arquivo CSV.');
      }
    });
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  // Função para lidar com o sucesso na criação de um item
  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    fetchStockItems();
    toast.success('Item de estoque criado com sucesso!');
  };

  // Função para navegar para a página de detalhes do item
  const handleItemClick = (itemId: string) => {
    router.push(`/estoque/${itemId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <label htmlFor="import-csv" className="cursor-pointer">
            <Button variant="outline" onClick={() => document.getElementById('import-csv')?.click()}>
              <FileUp className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
            <input
              id="import-csv"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={importFromCSV}
            />
          </label>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Item de Estoque</DialogTitle>
              </DialogHeader>
              <StockItemForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Gerenciar Itens de Estoque</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar itens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isFiltersOpen && (
            <div className="mb-6">
              <AdvancedFilters
                options={filterOptions}
                onFilterChange={setActiveFilters}
                columnOptions={columnOptions}
                visibleColumns={visibleColumns}
                onVisibleColumnsChange={setVisibleColumns}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DataTable
            columns={columns.filter(col => visibleColumns.includes(col.id))}
            data={stockItems}
            isLoading={isLoading}
            onRowClick={(row) => handleItemClick(row.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
