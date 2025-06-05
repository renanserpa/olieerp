"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// TODO: Import OrderForm and DeleteOrderAlert if needed for actions

// Define the data structure for an Order based on Mapeamento de Dados
export type Order = {
  id: string; // UUID
  customer_id: string; // UUID, needs join to get customer name
  customer_name?: string; // Added for display
  date: string; // Date/Timestamp
  status_id: string; // UUID, needs join to get status name
  status_name?: string; // Added for display
  total_amount: number;
  channel_id?: string; // UUID, needs join to get channel name
  channel_name?: string; // Added for display
  created_at: string;
  // Add other relevant fields from the mapping
};

export const columns: ColumnDef<Order>[] = [
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
    accessorKey: "id", // Or a more user-friendly order number if available
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Pedido #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("id").substring(0, 8)}...</div>, // Display partial ID or order number
  },
  {
    accessorKey: "customer_name", // Display joined customer name
    header: "Cliente",
    cell: ({ row }) => <div>{row.original.customer_name || "-"}</div>,
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      const formatted = date.toLocaleDateString("pt-BR");
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "total_amount",
    header: () => <div className="text-right">Valor Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"));
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status_name", // Display joined status name
    header: "Status",
    cell: ({ row }) => <div>{row.original.status_name || "-"}</div>, // TODO: Add badge/color based on status
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
              Copiar ID do Pedido
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Edit action with OrderForm */}
            <DropdownMenuItem disabled>Editar Pedido</DropdownMenuItem>
            {/* TODO: Add View Details action */}
            <DropdownMenuItem disabled>Ver Detalhes</DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Delete action with DeleteOrderAlert */}
            <DropdownMenuItem disabled className="text-red-600">Excluir Pedido</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

