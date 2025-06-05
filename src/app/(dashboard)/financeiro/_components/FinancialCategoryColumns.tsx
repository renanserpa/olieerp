"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Define the data structure for a Financial Category
export type FinancialCategory = {
  id: string; // UUID
  name: string;
  description?: string | null;
  type: 'Receita' | 'Despesa'; // Or 'income' | 'expense'
  created_at: string;
};

// Define the expected structure for table meta passed down
export interface FinancialCategoryTableMeta {
  editCategory: (category: FinancialCategory) => void;
  deleteCategory: (categoryId: string, categoryName: string) => void;
  // viewDetails?: (categoryId: string) => void; // Optional
}

export const financialCategoryColumns: ColumnDef<FinancialCategory, FinancialCategoryTableMeta>[] = [
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
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type");
      const variant = type === 'Receita' ? "default" : "destructive";
      return <Badge variant={variant as any}>{type}</Badge>; // Cast variant type
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <div className="text-sm text-muted-foreground truncate max-w-xs">{row.getValue("description") || "-"}</div>,
  },
   {
    accessorKey: "created_at",
    header: "Criado em",
    cell: ({ row }) => {
      const date = row.getValue("created_at") ? new Date(row.getValue("created_at") as string).toLocaleDateString("pt-BR") : "-";
      return <div>{date}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const category = row.original;
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
            <DropdownMenuItem onClick={() => meta?.editCategory(category)}>
               <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            {/* <DropdownMenuItem onClick={() => meta?.viewDetails(category.id)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => meta?.deleteCategory(category.id, category.name)}
              className="text-red-600 focus:text-red-700 focus:bg-red-100"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

