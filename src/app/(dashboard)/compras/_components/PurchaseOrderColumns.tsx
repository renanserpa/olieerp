"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
// TODO: Import forms/alerts for actions

// Define the data structure for a Purchase Order based on Mapeamento de Dados
export type PurchaseOrder = {
  id: string; // UUID
  supplier_id: string; // UUID, needs join to get supplier name
  supplier_name?: string; // Added for display
  date: string; // Date/Timestamp
  status_id: string; // UUID, needs join to get status name
  status_name?: string; // Added for display
  status_color?: string; // Added for badge color
  payment_terms?: string;
  delivery_date?: string; // Date/Timestamp
  total_amount?: number; // Likely calculated from items
  created_at: string;
  // Add other relevant fields like linked request, items, etc.
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
  } catch (e) {
    return "Data inválida";
  }
};

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

export const orderColumns: ColumnDef<PurchaseOrder>[] = [
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
          Ordem #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("id").substring(0, 8)}...</div>,
  },
  {
    accessorKey: "date",
    header: "Data Emissão",
    cell: ({ row }) => <div>{formatDate(row.original.date)}</div>,
  },
  {
    accessorKey: "supplier_name",
    header: "Fornecedor",
    cell: ({ row }) => <div>{row.original.supplier_name || "-"}</div>,
  },
  {
    accessorKey: "delivery_date",
    header: "Data Entrega Prev.",
    cell: ({ row }) => <div>{formatDate(row.original.delivery_date)}</div>,
  },
  {
    accessorKey: "total_amount",
    header: () => <div className="text-right">Valor Total</div>,
    cell: ({ row }) => <div className="text-right font-medium">{formatCurrency(row.original.total_amount)}</div>,
  },
  {
    accessorKey: "status_name",
    header: "Status",
    cell: ({ row }) => {
      const statusName = row.original.status_name || "-";
      // TODO: Get color from status_color and apply to Badge
      return <Badge variant="outline">{statusName}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const order = row.original;

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
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Copiar ID da Ordem
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Edit action */}
            <DropdownMenuItem disabled>Editar Ordem</DropdownMenuItem>
            {/* TODO: Add View Details action */}
            <DropdownMenuItem disabled>Ver Detalhes</DropdownMenuItem>
            {/* TODO: Add action like "Receive Items", "Mark as Paid" */}
            <DropdownMenuItem disabled>Receber Itens</DropdownMenuItem>
            <DropdownMenuItem disabled>Marcar como Pago</DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Delete action */}
            <DropdownMenuItem disabled className="text-red-600">Excluir Ordem</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

