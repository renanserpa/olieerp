"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react"; // Use Eye for view details
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Define the data structure for a Stock Movement
export type StockMovement = {
  id: string; // UUID
  item_id: string; // Foreign key to stock_items
  item_name?: string; // Added for display
  type: "Entrada" | "Saída" | "Ajuste Entrada" | "Ajuste Saída" | "Transferência";
  quantity: number;
  location_from_id?: string; // For transfers
  location_from_name?: string; // Added for display
  location_to_id?: string; // For transfers or entries
  location_to_name?: string; // Added for display
  user_id?: string; // User who performed the action
  user_name?: string; // Added for display
  reason?: string; // Reason for adjustment/movement
  related_document_id?: string; // e.g., Order ID, Purchase Order ID
  created_at: string;
};

// Placeholder view details function
const handleViewDetails = (movement: StockMovement) => {
  console.log("Viewing details for movement:", movement);
  alert(`Visualizando detalhes da movimentação ${movement.id} (placeholder)`);
};

export const movementColumns: ColumnDef<StockMovement>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data/Hora
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div className="text-sm">{format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>;
    },
  },
  {
    accessorKey: "item_name",
    header: "Item",
    cell: ({ row }) => <div className="font-medium">{row.original.item_name || "-"}</div>,
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as StockMovement["type"];
      let variant: "default" | "secondary" | "outline" = "secondary";
      if (type === "Entrada" || type === "Ajuste Entrada") variant = "default";
      if (type === "Saída" || type === "Ajuste Saída") variant = "outline";
      return <Badge variant={variant}>{type}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Quantidade</div>,
    cell: ({ row }) => {
      const type = row.original.type;
      const quantity = row.original.quantity;
      const sign = (type === "Saída" || type === "Ajuste Saída") ? "-" : "+";
      const color = (type === "Saída" || type === "Ajuste Saída") ? "text-red-600" : "text-green-600";
      return <div className={`text-right font-medium ${color}`}>{sign}{quantity}</div>;
    },
  },
  {
    accessorKey: "location_from_name",
    header: "Local Origem",
    cell: ({ row }) => <div>{row.original.location_from_name || "-"}</div>,
  },
  {
    accessorKey: "location_to_name",
    header: "Local Destino",
    cell: ({ row }) => <div>{row.original.location_to_name || "-"}</div>,
  },
  {
    accessorKey: "user_name",
    header: "Usuário",
    cell: ({ row }) => <div>{row.original.user_name || "-"}</div>,
  },
  {
    accessorKey: "reason",
    header: "Motivo/Doc",
    cell: ({ row }) => <div className="text-sm text-muted-foreground truncate max-w-[150px]">{row.original.reason || row.original.related_document_id || "-"}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const movement = row.original;

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
            <DropdownMenuItem onClick={() => handleViewDetails(movement)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            {/* Add other relevant actions if needed, e.g., revert movement (complex) */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

