"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Define the data structure for a Stock Item based on the actual database schema
export type StockItem = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  group_id: string | null;
  location_id: string | null;
  unit_of_measurement_id: string | null;
  current_quantity: number;
  min_quantity: number | null;
  max_quantity: number | null;
  cost_price: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
  // Relações
  group?: {
    id: string;
    name: string;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
  unit_of_measurement?: {
    id: string;
    name: string;
    symbol: string;
  } | null;
};

export const stockItemColumns = (onEdit: (item: StockItem) => void, onDelete: (item: StockItem) => void): ColumnDef<StockItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos os itens"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar item"
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
          Nome do Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link href={`/estoque/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <div>{row.original.sku || "-"}</div>,
  },
  {
    accessorKey: "group.name",
    header: "Grupo",
    cell: ({ row }) => <div>{row.original.group?.name || "-"}</div>,
  },
  {
    accessorKey: "location.name",
    header: "Localização",
    cell: ({ row }) => <div>{row.original.location?.name || "-"}</div>,
  },
  {
    accessorKey: "current_quantity",
    header: () => <div className="text-right">Qtd. Atual</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.current_quantity} {row.original.unit_of_measurement?.symbol || ""}
      </div>
    ),
  },
  {
    accessorKey: "min_quantity",
    header: () => <div className="text-right">Qtd. Mínima</div>,
    cell: ({ row }) => <div className="text-right">{row.original.min_quantity ?? "-"}</div>,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active !== false;
      
      // Determinar status baseado na quantidade atual vs. mínima
      let status = "OK";
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      
      if (!isActive) {
        status = "Inativo";
        variant = "secondary";
      } else if (row.original.min_quantity !== null && row.original.current_quantity <= row.original.min_quantity) {
        status = "Crítico";
        variant = "destructive";
      } else if (row.original.min_quantity !== null && row.original.current_quantity <= row.original.min_quantity * 1.5) {
        status = "Baixo";
        variant = "outline";
      }
      
      return <Badge variant={variant}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      const isActive = row.original.is_active !== false;
      return (value.includes("Ativo") && isActive) || (value.includes("Inativo") && !isActive);
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;

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
              onClick={() => navigator.clipboard.writeText(item.id)}
            >
              Copiar ID Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Item
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.location.href = `/estoque/${item.id}`}
            >
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.location.href = `/estoque/movimentacoes?item_id=${item.id}`}
            >
              Ver Movimentações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-100/50"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Export columns alias para compatibilidade com a página
export const columns = stockItemColumns;
