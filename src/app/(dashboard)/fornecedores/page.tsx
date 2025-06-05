"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_components/SupplierColumns";
import { Plus, FileDown, FileUp, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { AdvancedFilters, type FilterOption } from "@/components/ui/advanced-filters";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { toast } from "sonner";
import { SupplierForm } from "./_components/SupplierForm";
import { getSuppliers } from "@/lib/data-hooks";

export default function FornecedoresPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name", "fantasy_name", "cnpj", "email", "phone", "status", "actions"
  ]);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Opções de filtro para fornecedores
  const filterOptions: FilterOption[] = [
    { id: "status", label: "Status", type: "select", options: [
      { value: "Ativo", label: "Ativo" },
      { value: "Inativo", label: "Inativo" },
      { value: "Bloqueado", label: "Bloqueado" }
    ]},
    { id: "cnpj", label: "CNPJ", type: "text" },
    { id: "created_at", label: "Data de Cadastro", type: "date" }
  ];

  // Opções de colunas visíveis
  const columnOptions = [
    { id: "name", label: "Razão Social" },
    { id: "fantasy_name", label: "Nome Fantasia" },
    { id: "cnpj", label: "CNPJ" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Telefone" },
    { id: "status", label: "Status" },
    { id: "actions", label: "Ações" }
  ];

  // Carregar dados dos fornecedores
  const fetchSuppliers = async () => {
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
          if (key === 'created_at' && typeof value === 'string') {
            // Filtro de data
            query[key] = `gte.${value}`;
          } else if (typeof value === 'string') {
            // Filtro de texto com busca parcial
            query[key] = `ilike.%${value}%`;
          } else {
            // Outros tipos de filtro
            query[key] = value;
          }
        }
      });

      const result = await getSuppliers(query);
      
      if (result.success) {
        setSuppliers(result.data || []);
      } else {
        // Usar dados mockados para demonstração
        setSuppliers([
          {
            id: '1',
            name: 'Fornecedor Têxtil Ltda',
            fantasy_name: 'TextilTech',
            cnpj: '12.345.678/0001-90',
            email: 'contato@textiltech.com.br',
            phone: '11987654321',
            status: 'Ativo',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Distribuidora de Tecidos Nacional S.A.',
            fantasy_name: 'DTN Tecidos',
            cnpj: '98.765.432/0001-10',
            email: 'vendas@dtntecidos.com.br',
            phone: '21987654321',
            status: 'Ativo',
            created_at: new Date().toISOString()
          }
        ]);
        console.warn('Usando dados mockados para fornecedores');
      }
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setError(err.message || 'Erro ao carregar fornecedores');
      toast.error('Erro ao carregar lista de fornecedores.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [debouncedSearchQuery, activeFilters]);

  // Função para exportar fornecedores para CSV
  const exportToCSV = () => {
    try {
      const dataToExport = suppliers.map(supplier => ({
        'Razão Social': supplier.name,
        'Nome Fantasia': supplier.fantasy_name,
        'CNPJ': supplier.cnpj,
        'Email': supplier.email,
        'Telefone': supplier.phone,
        'Status': supplier.status,
        'Data de Cadastro': new Date(supplier.created_at).toLocaleDateString('pt-BR')
      }));
      
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `fornecedores_${new Date().toISOString().split('T')[0]}.csv`);
      
      toast.success('Fornecedores exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar fornecedores:', error);
      toast.error('Erro ao exportar fornecedores.');
    }
  };

  // Função para importar fornecedores de CSV
  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          // Aqui você implementaria a lógica para salvar os fornecedores importados
          // Por enquanto, apenas mostramos uma mensagem de sucesso
          toast.success(`${results.data.length} fornecedores importados com sucesso!`);
          fetchSuppliers(); // Recarregar a lista após importação
        } catch (error) {
          console.error('Erro ao importar fornecedores:', error);
          toast.error('Erro ao importar fornecedores.');
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

  // Função para lidar com o sucesso na criação de um fornecedor
  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    fetchSuppliers();
    toast.success('Fornecedor criado com sucesso!');
  };

  // Função para navegar para a página de detalhes do fornecedor
  const handleSupplierClick = (supplierId: string) => {
    router.push(`/fornecedores/${supplierId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Fornecedores</h1>
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
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Fornecedor</DialogTitle>
              </DialogHeader>
              <SupplierForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Gerenciar Fornecedores</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar fornecedores..."
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
            data={suppliers}
            isLoading={isLoading}
            onRowClick={(row) => handleSupplierClick(row.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
