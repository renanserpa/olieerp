"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Truck, Map, Upload, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { deliveryColumns, type Delivery } from "./_components/DeliveryColumns";
import { deliveryRouteColumns, type DeliveryRoute } from "./_components/DeliveryRouteColumns";
import { DeliveryForm } from "./_components/DeliveryForm";
import { DeliveryRouteForm } from "./_components/DeliveryRouteForm";
import { UpdateDeliveryStatusDialog } from "./_components/UpdateDeliveryStatusDialog";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { AdvancedFilters, type FilterOption } from "./_components/AdvancedFilters";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { toast } from "sonner";

// Define structure for related data (for filters)
interface StatusFilter {
  id: string;
  name: string;
}
interface DriverFilter {
  id: string;
  name: string;
}

// Fetch Delivery data with filtering
async function getDeliveries(supabase: ReturnType<typeof createClient>, filters: { 
  orderId?: string; 
  statusId?: string; 
  driverId?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<Delivery[]> {
  let query = supabase
    .from('deliveries')
    .select(`
      id,
      delivery_date,
      order_id,
      driver_id,
      status_id,
      status:global_statuses ( id, name ),
      created_at
    `)
    .order('delivery_date', { ascending: false });

  // Apply filters
  if (filters.orderId) {
    query = query.eq('order_id', filters.orderId);
  }
  if (filters.statusId) {
    query = query.eq('status_id', filters.statusId);
  }
  if (filters.driverId) {
    query = query.eq('driver_id', filters.driverId);
  }
  if (filters.startDate) {
    query = query.gte('delivery_date', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('delivery_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching deliveries:", error);
    return [];
  }

  const mappedData = data?.map(item => ({
    id: item.id,
    order_id: item.order_id,
    order_ref: `Pedido #${item.order_id?.substring(0, 8)}...`, // Placeholder ref
    delivery_date: item.delivery_date,
    driver_id: item.driver_id,
    driver_name: `Motorista ${item.driver_id?.substring(0, 5)}...`, // Placeholder name
    status_id: item.status_id,
    status_name: (item.status as { name: string })?.name || 'Desconhecido',
    created_at: item.created_at,
  })) || [];

  return mappedData;
}

// Fetch Delivery Route data with filtering
async function getDeliveryRoutes(supabase: ReturnType<typeof createClient>, filters: { 
  routeName?: string; 
  driverId?: string; 
  startDate?: string;
  endDate?: string;
} = {}): Promise<DeliveryRoute[]> {
  let query = supabase
    .from('delivery_routes')
    .select(`
      id,
      route_name,
      route_date,
      driver_id,
      created_at
    `)
    .order('route_date', { ascending: false });

  // Apply filters
  if (filters.routeName) {
    query = query.ilike('route_name', `%${filters.routeName}%`);
  }
  if (filters.driverId) {
    query = query.eq('driver_id', filters.driverId);
  }
  if (filters.startDate) {
    query = query.gte('route_date', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('route_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching delivery routes:", error);
    return [];
  }

  const mappedData = data?.map(item => ({
    id: item.id,
    route_name: item.route_name,
    route_date: item.route_date,
    driver_id: item.driver_id,
    driver_name: `Motorista ${item.driver_id?.substring(0, 5)}...`, // Placeholder name
    created_at: item.created_at,
  })) || [];

  return mappedData;
}

// Fetch related data for filters
async function getStatusesForFilter(supabase: ReturnType<typeof createClient>): Promise<StatusFilter[]> {
    console.log("Fetching delivery statuses for filter...");
    try {
      const { data, error } = await supabase
        .from("global_statuses")
        .select("id, name")
        // .contains("applicable_to", ["deliveries"]) // Example filter
        .order("name");
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching delivery statuses:", error);
      return [];
    }
}

async function getDriversForFilter(supabase: ReturnType<typeof createClient>): Promise<DriverFilter[]> {
    console.log("Fetching drivers for filter...");
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name")
        // .eq("role", "driver") // Example filter
        .limit(50);
      if (error) throw error;
      return data?.map(d => ({ id: d.id, name: d.full_name || `User ${d.id.substring(0,5)}` })) || [];
    } catch (error) {
      console.error("Error fetching drivers:", error);
      return [];
    }
}

// CSV Export functions
const handleExportDeliveriesCSV = (data: Delivery[]) => {
  if (data.length === 0) { 
    toast.warning('Não há dados para exportar.');
    return; 
  }
  const exportData = data.map(del => ({
    ID_Entrega: del.id,
    Referencia_Pedido: del.order_ref || '',
    Data_Entrega: del.delivery_date ? new Date(del.delivery_date).toLocaleDateString('pt-BR') : '',
    Motorista: del.driver_name || '',
    Status: del.status_name || '',
    Data_Criacao: del.created_at ? new Date(del.created_at).toLocaleString('pt-BR') : '',
  }));
  const csv = Papa.unparse(exportData);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `entregas_${new Date().toISOString().split('T')[0]}.csv`);
  toast.success(`${data.length} entregas exportadas com sucesso.`);
};

const handleExportRoutesCSV = (data: DeliveryRoute[]) => {
  if (data.length === 0) { 
    toast.warning('Não há dados para exportar.');
    return; 
  }
  const exportData = data.map(route => ({
    ID_Rota: route.id,
    Nome_Rota: route.route_name || '',
    Data_Rota: route.route_date ? new Date(route.route_date).toLocaleDateString('pt-BR') : '',
    Motorista: route.driver_name || '',
    Data_Criacao: route.created_at ? new Date(route.created_at).toLocaleString('pt-BR') : '',
  }));
  const csv = Papa.unparse(exportData);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `rotas_entrega_${new Date().toISOString().split('T')[0]}.csv`);
  toast.success(`${data.length} rotas exportadas com sucesso.`);
};

// CSV Import functions (Placeholders - require complex mapping)
const handleImportDeliveriesCSV = (file: File) => {
  toast.info(`Importação de entregas do arquivo ${file.name} iniciada.`);
  // Placeholder for actual implementation
  setTimeout(() => {
    toast.warning("Funcionalidade de importação ainda não implementada completamente.");
  }, 1500);
};

const handleImportRoutesCSV = (file: File) => {
  toast.info(`Importação de rotas do arquivo ${file.name} iniciada.`);
  // Placeholder for actual implementation
  setTimeout(() => {
    toast.warning("Funcionalidade de importação ainda não implementada completamente.");
  }, 1500);
};

// Filter options configuration
const deliveryFilterOptionsBase: FilterOption[] = [
  {
    id: "orderId",
    label: "ID do Pedido",
    type: "text",
  },
  {
    id: "statusId",
    label: "Status",
    type: "select",
    options: [], // Populated dynamically
  },
  {
    id: "driverId",
    label: "Motorista",
    type: "select",
    options: [], // Populated dynamically
  },
  {
    id: "startDate",
    label: "Data Inicial",
    type: "date",
  },
  {
    id: "endDate",
    label: "Data Final",
    type: "date",
  },
];

const routeFilterOptionsBase: FilterOption[] = [
  {
    id: "routeName",
    label: "Nome da Rota",
    type: "text",
  },
  {
    id: "driverId",
    label: "Motorista",
    type: "select",
    options: [], // Populated dynamically
  },
  {
    id: "startDate",
    label: "Data Inicial",
    type: "date",
  },
  {
    id: "endDate",
    label: "Data Final",
    type: "date",
  },
];

export default function LogisticaPage() {
  const supabase = createClient();
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = React.useState(false);
  const [isRouteFormOpen, setIsRouteFormOpen] = React.useState(false);
  const [deliveries, setDeliveries] = React.useState<Delivery[]>([]);
  const [routes, setRoutes] = React.useState<DeliveryRoute[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = React.useState(true);
  const [loadingRoutes, setLoadingRoutes] = React.useState(true);
  const deliveryFileInputRef = React.useRef<HTMLInputElement>(null);
  const routeFileInputRef = React.useRef<HTMLInputElement>(null);

  // Status update dialog state
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = React.useState(false);
  const [selectedDeliveryForStatusUpdate, setSelectedDeliveryForStatusUpdate] = React.useState<Delivery | null>(null);

  // Filtering state
  const [deliveryFilters, setDeliveryFilters] = React.useState<{[key: string]: string}>({});
  const [routeFilters, setRouteFilters] = React.useState<{[key: string]: string}>({});
  const debouncedDeliveryFilters = useDebounce(deliveryFilters, 500);
  const debouncedRouteFilters = useDebounce(routeFilters, 500);
  
  // State for dynamic filter options
  const [dynamicDeliveryFilterOptions, setDynamicDeliveryFilterOptions] = React.useState<FilterOption[]>(deliveryFilterOptionsBase);
  const [dynamicRouteFilterOptions, setDynamicRouteFilterOptions] = React.useState<FilterOption[]>(routeFilterOptionsBase);

  // Fetch statuses and drivers on mount
  React.useEffect(() => {
    Promise.all([
      getStatusesForFilter(supabase),
      getDriversForFilter(supabase)
    ]).then(([statusesData, driversData]) => {
      const driverOptions = driversData.map(d => ({ value: d.id, label: d.name }));
      const statusOptions = statusesData.map(s => ({ value: s.id, label: s.name }));

      setDynamicDeliveryFilterOptions(prev => 
        prev.map(option => {
          if (option.id === 'statusId') return { ...option, options: statusOptions };
          if (option.id === 'driverId') return { ...option, options: driverOptions };
          return option;
        })
      );
      setDynamicRouteFilterOptions(prev => 
        prev.map(option => 
          option.id === 'driverId' 
            ? { ...option, options: driverOptions } 
            : option
        )
      );
    });
  }, [supabase]);

  // Fetch data based on filters
  const fetchAndSetDeliveries = React.useCallback(() => {
    setLoadingDeliveries(true);
    getDeliveries(supabase, {
      orderId: debouncedDeliveryFilters.orderId,
      statusId: debouncedDeliveryFilters.statusId,
      driverId: debouncedDeliveryFilters.driverId,
      startDate: debouncedDeliveryFilters.startDate,
      endDate: debouncedDeliveryFilters.endDate,
    })
      .then(setDeliveries)
      .finally(() => setLoadingDeliveries(false));
  }, [supabase, debouncedDeliveryFilters]);

  const fetchAndSetRoutes = React.useCallback(() => {
    setLoadingRoutes(true);
    getDeliveryRoutes(supabase, {
      routeName: debouncedRouteFilters.routeName,
      driverId: debouncedRouteFilters.driverId,
      startDate: debouncedRouteFilters.startDate,
      endDate: debouncedRouteFilters.endDate,
    })
      .then(setRoutes)
      .finally(() => setLoadingRoutes(false));
  }, [supabase, debouncedRouteFilters]);

  React.useEffect(() => {
    fetchAndSetDeliveries();
  }, [fetchAndSetDeliveries]);

  React.useEffect(() => {
    fetchAndSetRoutes();
  }, [fetchAndSetRoutes]);

  // Success handlers for forms
  const handleDeliverySuccess = () => {
    setIsDeliveryFormOpen(false);
    fetchAndSetDeliveries();
  };
  const handleRouteSuccess = () => {
    setIsRouteFormOpen(false);
    fetchAndSetRoutes();
  };
  const handleStatusUpdateSuccess = () => {
    setIsUpdateStatusDialogOpen(false);
    setSelectedDeliveryForStatusUpdate(null);
    fetchAndSetDeliveries();
  };

  // Filter change handlers
  const handleDeliveryFilterChange = (newFilters: {[key: string]: string}) => {
    setDeliveryFilters(newFilters);
  };
  const handleRouteFilterChange = (newFilters: {[key: string]: string}) => {
    setRouteFilters(newFilters);
  };

  // File input triggers
  const triggerDeliveryFileInput = () => deliveryFileInputRef.current?.click();
  const triggerRouteFileInput = () => routeFileInputRef.current?.click();

  // File selection handlers
  const onDeliveryFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportDeliveriesCSV(file);
      if (deliveryFileInputRef.current) deliveryFileInputRef.current.value = "";
    }
  };
  const onRouteFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportRoutesCSV(file);
      if (routeFileInputRef.current) routeFileInputRef.current.value = "";
    }
  };

  // Table action handlers
  const handleUpdateDeliveryStatus = (delivery: Delivery) => {
    setSelectedDeliveryForStatusUpdate(delivery);
    setIsUpdateStatusDialogOpen(true);
  };

  const handleEditDelivery = (deliveryId: string) => {
    toast.info(`Edição da entrega ${deliveryId.substring(0, 8)}... solicitada.`);
    toast.warning("Funcionalidade de edição ainda não implementada completamente.");
  };

  const handleDeleteDelivery = (deliveryId: string, orderRef?: string) => {
    if (confirm(`Tem certeza que deseja excluir a entrega ${deliveryId.substring(0, 8)}... do pedido ${orderRef || 'desconhecido'}?`)) {
      toast.info(`Exclusão da entrega ${deliveryId.substring(0, 8)}... solicitada.`);
      toast.warning("Funcionalidade de exclusão ainda não implementada completamente.");
    }
  };

  const handleViewDeliveryDetails = (deliveryId: string) => {
    toast.info(`Visualização de detalhes da entrega ${deliveryId.substring(0, 8)}... solicitada.`);
    toast.warning("Funcionalidade de visualização de detalhes ainda não implementada completamente.");
  };

  // Table meta for actions
  const deliveryTableMeta = {
    updateStatus: handleUpdateDeliveryStatus,
    editDelivery: handleEditDelivery,
    deleteDelivery: handleDeleteDelivery,
    viewDetails: handleViewDeliveryDetails,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Gestão de Logística</h1>
      </div>

      <Tabs defaultValue="entregas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
          <TabsTrigger value="rotas">Rotas de Entrega</TabsTrigger>
        </TabsList>

        {/* Deliveries Tab */}
        <TabsContent value="entregas" className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-wrap justify-end items-center gap-2">
              <input type="file" ref={deliveryFileInputRef} onChange={onDeliveryFileSelected} accept=".csv" style={{ display: 'none' }} />
              <Button variant="outline" onClick={triggerDeliveryFileInput}><Upload className="mr-2 h-4 w-4" /> Importar</Button>
              <Button variant="outline" onClick={() => handleExportDeliveriesCSV(deliveries)} disabled={deliveries.length === 0}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
              <Button onClick={() => setIsDeliveryFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Nova Entrega</Button>
            </div>
            <AdvancedFilters 
              filterOptions={dynamicDeliveryFilterOptions} 
              onFilterChange={handleDeliveryFilterChange}
            />
            <DataTable 
              columns={deliveryColumns} 
              data={deliveries} 
              loading={loadingDeliveries}
              meta={deliveryTableMeta}
            />
          </div>
        </TabsContent>

        {/* Delivery Routes Tab */}
        <TabsContent value="rotas" className="mt-4">
          <div className="space-y-4">
             <div className="flex flex-wrap justify-end items-center gap-2">
              <input type="file" ref={routeFileInputRef} onChange={onRouteFileSelected} accept=".csv" style={{ display: 'none' }} />
              <Button variant="outline" onClick={triggerRouteFileInput}><Upload className="mr-2 h-4 w-4" /> Importar</Button>
              <Button variant="outline" onClick={() => handleExportRoutesCSV(routes)} disabled={routes.length === 0}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
              <Button onClick={() => setIsRouteFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Nova Rota</Button>
            </div>
            <AdvancedFilters 
              filterOptions={dynamicRouteFilterOptions} 
              onFilterChange={handleRouteFilterChange}
            />
            <DataTable 
              columns={deliveryRouteColumns} 
              data={routes} 
              loading={loadingRoutes}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog for DeliveryForm */}
      <Dialog open={isDeliveryFormOpen} onOpenChange={setIsDeliveryFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Entrega</DialogTitle>
            <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
          </DialogHeader>
          <DeliveryForm onSuccess={handleDeliverySuccess} />
        </DialogContent>
      </Dialog>

      {/* Dialog for DeliveryRouteForm */}
      <Dialog open={isRouteFormOpen} onOpenChange={setIsRouteFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Rota de Entrega</DialogTitle>
            <DialogDescription>Preencha os detalhes abaixo.</DialogDescription>
          </DialogHeader>
          <DeliveryRouteForm onSuccess={handleRouteSuccess} />
        </DialogContent>
      </Dialog>

      {/* Dialog for UpdateDeliveryStatus */}
      {selectedDeliveryForStatusUpdate && (
        <UpdateDeliveryStatusDialog
          delivery={selectedDeliveryForStatusUpdate}
          open={isUpdateStatusDialogOpen}
          onOpenChange={setIsUpdateStatusDialogOpen}
          onSuccess={handleStatusUpdateSuccess}
        />
      )}
    </div>
  );
}
