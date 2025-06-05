"use client";

import React from 'react';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Copy, Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
// Import the dialog component
import { UpdateProductionStatusDialog } from "./UpdateProductionStatusDialog"; 
// TODO: Import ProductionOrderForm and DeleteProductionOrderAlert if needed for actions

// Define the data structure for a Production Order based on Mapeamento de Dados
export type ProductionOrder = {
  id: string; // UUID
  order_id: string; // UUID from orders table
  order_ref?: string; // User-friendly reference from the linked order
  status_id: string; // UUID, needs join to get status name
  status_name?: string; // Added for display
  status_color?: string; // Added for badge color
  priority_id?: string; // UUID, needs join to get priority name
  priority_name?: string; // Added for display
  priority_color?: string; // Added for badge color
  start_date?: string; // Date/Timestamp
  end_date?: string; // Date/Timestamp
  created_at: string;
  // Add other relevant fields like assigned user, current stage, etc.
};

// Helper function to format dates (optional)
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
  } catch (e) {
    return "Data inválida";
  }
};

// Define columns with type annotation including meta
export const columns: ColumnDef<ProductionOrder, any>[] = [
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
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          OP #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase font-mono text-xs">{row.getValue("id").substring(0, 8)}</div>,
  },
  {
    accessorKey: "order_ref", // Display linked order reference
    header: "Pedido Cliente",
    cell: ({ row }) => <div>{row.original.order_ref || "-"}</div>,
  },
  {
    accessorKey: "status_name",
    header: "Status",
    cell: ({ row }) => {
      const statusName = row.original.status_name || "Desconhecido";
      // TODO: Use status_color for dynamic badge styling
      return <Badge variant="outline">{statusName}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "priority_name",
    header: "Prioridade",
    cell: ({ row }) => {
      const priorityName = row.original.priority_name || "Normal";
      // TODO: Use priority_color for dynamic badge styling
      return <Badge variant="secondary">{priorityName}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "start_date",
    header: "Início Prev.",
    cell: ({ row }) => <div>{formatDate(row.original.start_date)}</div>,
  },
  {
    accessorKey: "end_date",
    header: "Fim Prev.",
    cell: ({ row }) => <div>{formatDate(row.original.end_date)}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const productionOrder = row.original;
      // Access meta functions passed from DataTable
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
            <DropdownMenuItem onClick={() => meta?.viewDetails(productionOrder.id)} disabled>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.editOrder(productionOrder.id)} disabled>
              <Edit className="mr-2 h-4 w-4" /> Editar Ordem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.updateStatus(productionOrder)}>
              <CheckCircle className="mr-2 h-4 w-4" /> Atualizar Status
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(productionOrder.id)}
            >
              <Copy className="mr-2 h-4 w-4" /> Copiar ID da OP
            </DropdownMenuItem>
            {/* TODO: Add actions like "Advance Stage", "Print Label", etc. */}
            {/* <DropdownMenuItem disabled>Avançar Etapa</DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.deleteOrder(productionOrder.id)} className="text-red-600" disabled>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Ordem
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
