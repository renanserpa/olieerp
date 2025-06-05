"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Define the data structure for an Insumo based on the actual database schema
export type Insumo = {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  group_id?: string | null;
  location_id?: string | null;
  unit_of_measurement_id?: string | null;
  quantity: number;
  min_quantity?: number | null;
  cost_price?: number | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at?: string | null;
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

// Define columns as a function to accept callbacks
export const insumoColumns = (onEdit: (insumo: Insumo) => void, onDelete: (insumo: Insumo) => void): ColumnDef<Insumo>[] => [
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
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link href={`/insumos/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
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
    accessorKey: "quantity",
    header: "Quantidade",
    cell: ({ row }) => {
      const quantity = row.original.quantity || 0;
      const unit = row.original.unit_of_measurement?.symbol || "un";
      const minQuantity = row.original.min_quantity || 0;
      
      // Verificar se está abaixo do estoque mínimo
      const isLowStock = quantity < minQuantity;
      
      return (
        <div className={isLowStock ? "text-red-600 font-medium" : ""}>
          {quantity} {unit}
          {isLowStock && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-800">
              Baixo
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "unit_of_measurement.symbol",
    header: "Unidade",
    cell: ({ row }) => <div>{row.original.unit_of_measurement?.symbol || "un"}</div>,
  },
  {
    accessorKey: "cost_price",
    header: "Preço de Custo",
    cell: ({ row }) => {
      const price = row.original.cost_price;
      return <div>{price ? `R$ ${price.toFixed(2)}` : "-"}</div>;
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active !== false;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Ativo" : "Inativo"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id) !== false;
      return (value.includes("Ativo") && isActive) || (value.includes("Inativo") && !isActive);
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const insumo = row.original;

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
              onClick={() => navigator.clipboard.writeText(insumo.id)}
            >
              Copiar ID Insumo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(insumo)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Insumo
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => window.location.href = `/insumos/${insumo.id}`}
            >
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-100/50"
              onClick={() => onDelete(insumo)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Insumo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Export columns alias para compatibilidade com a página
export const columns = insumoColumns;
