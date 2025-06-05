"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// TODO: Import CategoryForm and AlertDialog for deletion

// Define the data structure for a Product Category
export type ProductCategory = {
  id: string; // UUID
  name: string;
  description?: string;
  parent_category_id?: string; // For subcategories
  parent_category_name?: string; // Added for display
  created_at: string;
};

// Placeholder delete function
const handleDeleteCategory = async (categoryId: string, categoryName: string, onDelete: (id: string, name: string) => void) => {
  onDelete(categoryId, categoryName);
};

export const categoryColumns = (onEdit: (category: ProductCategory) => void, onDelete: (categoryId: string, categoryName: string) => void): ColumnDef<ProductCategory>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todas as categorias"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar categoria"
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
          Nome da Categoria
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <div className="text-sm text-muted-foreground truncate max-w-xs">{row.original.description || "-"}</div>,
  },
  // TODO: Add column for parent category if needed
  // {
  //   accessorKey: "parent_category_name",
  //   header: "Categoria Pai",
  //   cell: ({ row }) => <div>{row.original.parent_category_name || "-"}</div>,
  // },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const category = row.original;

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
              onClick={() => navigator.clipboard.writeText(category.id)}
            >
              Copiar ID Categoria
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Enable Edit action */}
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="mr-2 h-4 w-4" /> Editar Categoria
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Enable Delete action */}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-100/50"
              onClick={() => handleDeleteCategory(category.id, category.name, onDelete)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Categoria
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

