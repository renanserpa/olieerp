"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye, Truck } from "lucide-react"; // Added icons
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Define the data structure for a Delivery
export type Delivery = {
  id: string; 
  order_id: string; 
  order_ref?: string; 
  status_id: string; 
  status_name?: string; 
  status_color?: string; 
  delivery_date?: string; // Changed from scheduled_date for consistency with getDeliveries
  completed_date?: string; 
  driver_id?: string | null; // Allow null
  driver_name?: string | null; // Allow null
  created_at: string;
  // Add other relevant fields as needed
};

// Define the expected structure for table meta passed down
export interface DeliveryTableMeta {
  updateStatus: (delivery: Delivery) => void;
  editDelivery: (deliveryId: string) => void;
  deleteDelivery: (deliveryId: string, orderRef?: string) => void;
  viewDetails: (deliveryId: string) => void;
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    // Attempt to format assuming it might be ISO 8601 or similar
    return new Date(dateString).toLocaleDateString("pt-BR", { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
  } catch (e) {
    return "Data inválida";
  }
};

export const deliveryColumns: ColumnDef<Delivery, DeliveryTableMeta>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todas as linhas"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Entrega #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase font-mono text-xs">{row.getValue("id").substring(0, 8)}</div>,
  },
  {
    accessorKey: "order_ref",
    header: "Pedido Cliente",
    cell: ({ row }) => <div>{row.original.order_ref || "-"}</div>,
  },
  {
    accessorKey: "delivery_date",
    header: "Data Entrega",
    cell: ({ row }) => <div>{formatDate(row.original.delivery_date)}</div>,
  },
  {
    accessorKey: "driver_name",
    header: "Motorista",
    cell: ({ row }) => <div>{row.original.driver_name || "-"}</div>,
  },
  {
    accessorKey: "status_name",
    header: "Status",
    cell: ({ row }) => {
      const statusName = row.original.status_name || "Desconhecido";
      // TODO: Apply color based on status_color if available
      return <Badge variant="outline">{statusName}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const delivery = row.original;
      const meta = table.options.meta;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => meta?.viewDetails(delivery.id)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.updateStatus(delivery)}>
              <Truck className="mr-2 h-4 w-4" /> Atualizar Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.editDelivery(delivery.id)}>
               <Edit className="mr-2 h-4 w-4" /> Editar Entrega
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => meta?.deleteDelivery(delivery.id, delivery.order_ref)}
              className="text-red-600 focus:text-red-700 focus:bg-red-100"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Entrega
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

