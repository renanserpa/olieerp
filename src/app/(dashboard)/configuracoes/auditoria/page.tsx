"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useAudit, AuditAction } from '@/lib/audit-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Search, 
  FileDown, 
  Filter, 
  RefreshCw, 
  Eye, 
  User, 
  Calendar, 
  Tag, 
  FileText 
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Tipos
type AuditLog = {
  id: string;
  user_id: string | null;
  action_type: AuditAction;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string;
};

// Componente principal
export default function AuditLogPage() {
  const { hasPermission } = useAuth();
  const auditService = useAudit();
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    userId: '',
    actionType: '',
    entityType: '',
    dateRange: { from: undefined, to: undefined } as { from: Date | undefined, to: Date | undefined },
  });
  
  // Estado para logs
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Estado para detalhes do log
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Verificar permissão
  if (!hasPermission('permissions.manage')) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // Buscar logs
  const fetchLogs = async () => {
    setIsLoading(true);
    
    try {
      const { data, count, error } = await auditService.getAuditLogs({
        userId: filters.userId || undefined,
        actionType: filters.actionType as AuditAction || undefined,
        entityType: filters.entityType || undefined,
        startDate: filters.dateRange.from,
        endDate: filters.dateRange.to,
        limit: pageSize,
        offset: page * pageSize,
      });
      
      if (error) {
        toast.error('Erro ao buscar logs de auditoria');
        console.error('Erro ao buscar logs:', error);
        return;
      }
      
      // Adicionar emails de usuários (em produção, isso seria feito via join no banco)
      const logsWithUserInfo = await Promise.all((data || []).map(async (log) => {
        if (!log.user_id) return { ...log, user_email: 'Sistema' };
        
        try {
          const { data: userData } = await auditService.supabase
            .from('user_profiles')
            .select('full_name')
            .eq('id', log.user_id)
            .single();
            
          return { 
            ...log, 
            user_email: userData?.full_name || log.user_id 
          };
        } catch (e) {
          return { ...log, user_email: log.user_id };
        }
      }));
      
      setLogs(logsWithUserInfo);
      setTotalLogs(count || 0);
    } catch (error) {
      toast.error('Erro ao buscar logs de auditoria');
      console.error('Erro ao buscar logs:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Visualizar detalhes do log
  const viewLogDetails = async (logId: string) => {
    try {
      const { data, error } = await auditService.getAuditLogDetails(logId);
      
      if (error) {
        toast.error('Erro ao buscar detalhes do log');
        return;
      }
      
      if (data) {
        setSelectedLog(data);
        setIsDetailsOpen(true);
      }
    } catch (error) {
      toast.error('Erro ao buscar detalhes do log');
      console.error('Erro ao buscar detalhes:', error);
    }
  };
  
  // Exportar logs
  const exportLogs = async () => {
    try {
      const { data, error } = await auditService.getAuditLogs({
        userId: filters.userId || undefined,
        actionType: filters.actionType as AuditAction || undefined,
        entityType: filters.entityType || undefined,
        startDate: filters.dateRange.from,
        endDate: filters.dateRange.to,
        limit: 1000, // Limite maior para exportação
      });
      
      if (error) {
        toast.error('Erro ao exportar logs');
        return;
      }
      
      if (!data || data.length === 0) {
        toast.warning('Nenhum log para exportar');
        return;
      }
      
      // Formatar dados para CSV
      const headers = ['Data', 'Usuário', 'Ação', 'Entidade', 'ID Entidade'];
      const rows = data.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        log.user_id || 'Sistema',
        log.action_type,
        log.entity_type,
        log.entity_id || '-'
      ]);
      
      // Criar conteúdo CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Criar blob e link para download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_auditoria_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Logs exportados com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar logs');
      console.error('Erro ao exportar logs:', error);
    }
  };
  
  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      userId: '',
      actionType: '',
      entityType: '',
      dateRange: { from: undefined, to: undefined },
    });
  };
  
  // Definir colunas da tabela
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Data',
      cell: ({ row }) => format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
    },
    {
      accessorKey: 'user_email',
      header: 'Usuário',
    },
    {
      accessorKey: 'action_type',
      header: 'Ação',
    },
    {
      accessorKey: 'entity_type',
      header: 'Entidade',
    },
    {
      accessorKey: 'entity_id',
      header: 'ID Entidade',
      cell: ({ row }) => row.original.entity_id || '-',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => viewLogDetails(row.original.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  
  // Renderizar componente
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Visualize e analise todas as ações realizadas no sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={exportLogs}
            disabled={isLoading || logs.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Usuário</Label>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input
                  id="userId"
                  placeholder="ID ou nome do usuário"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="actionType">Tipo de Ação</Label>
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <Select
                  value={filters.actionType}
                  onValueChange={(value) => setFilters({ ...filters, actionType: value })}
                >
                  <SelectTrigger id="actionType">
                    <SelectValue placeholder="Selecione uma ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="CREATE">Criação</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="VIEW">Visualização</SelectItem>
                    <SelectItem value="EXPORT">Exportação</SelectItem>
                    <SelectItem value="IMPORT">Importação</SelectItem>
                    <SelectItem value="APPROVE">Aprovação</SelectItem>
                    <SelectItem value="REJECT">Rejeição</SelectItem>
                    <SelectItem value="STATUS_CHANGE">Mudança de Status</SelectItem>
                    <SelectItem value="PERMISSION_CHANGE">Mudança de Permissão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entityType">Tipo de Entidade</Label>
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input
                  id="entityType"
                  placeholder="Ex: products, orders"
                  value={filters.entityType}
                  onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Período</Label>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <DateRangePicker
                  value={filters.dateRange}
                  onChange={(range) => setFilters({ ...filters, dateRange: range })}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={clearFilters}>
            Limpar Filtros
          </Button>
          <Button onClick={fetchLogs} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </CardFooter>
      </Card>
      
      {/* Tabela de Logs */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={logs}
            isLoading={isLoading}
            pageCount={Math.ceil(totalLogs / pageSize)}
            pageIndex={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
      
      {/* Modal de Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a ação registrada.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Data e Hora</h3>
                  <p>{format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Usuário</h3>
                  <p>{selectedLog.user_email || selectedLog.user_id || 'Sistema'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Ação</h3>
                  <p>{selectedLog.action_type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Entidade</h3>
                  <p>{selectedLog.entity_type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">ID da Entidade</h3>
                  <p>{selectedLog.entity_id || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">IP</h3>
                  <p>{selectedLog.ip_address || '-'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Detalhes</h3>
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-xs overflow-auto max-h-80">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
              
              {selectedLog.user_agent && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">User Agent</h3>
                  <p className="text-xs text-muted-foreground break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
