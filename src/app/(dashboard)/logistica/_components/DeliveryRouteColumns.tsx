"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Define the data structure for a Delivery Route based on the actual database schema
export type DeliveryRoute = {
  id: string;
  name: string;
  description?: string | null;
  delivery_date: string;
  status: string;
  driver_name?: string | null;
  vehicle_info?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export const deliveryRouteColumns = (
  onEdit: (route: DeliveryRoute) => void,
  onDelete: (route: DeliveryRoute) => void
): ColumnDef<DeliveryRoute>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome da Rota
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link href={`/logistica/rotas/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <div className="truncate max-w-sm">{row.original.description || "-"}</div>,
  },
  {
    accessorKey: "delivery_date",
    header: "Data de Entrega",
    cell: ({ row }) => {
      const date = new Date(row.original.delivery_date);
      return <div>{date.toLocaleDateString("pt-BR")}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      
      switch (status) {
        case "pending":
          variant = "secondary";
          break;
        case "in_progress":
          variant = "default";
          break;
        case "completed":
          variant = "outline";
          break;
        default:
          variant = "secondary";
      }
      
      const statusLabels: Record<string, string> = {
        pending: "Pendente",
        in_progress: "Em Andamento",
        completed: "Concluída",
      };
      
      return <Badge variant={variant}>{statusLabels[status] || status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "driver_name",
    header: "Motorista",
    cell: ({ row }) => <div>{row.original.driver_name || "-"}</div>,
  },
  {
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div>{date.toLocaleDateString("pt-BR")}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const route = row.original;

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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(route.id)}
            >
              Copiar ID da Rota
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(route)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Rota
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.location.href = `/logistica/rotas/${route.id}`}
            >
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-700 focus:bg-red-100/50"
              onClick={() => onDelete(route)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Rota
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
