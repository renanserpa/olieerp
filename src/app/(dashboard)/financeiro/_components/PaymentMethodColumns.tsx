"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Define the data structure for a Payment Method
export type PaymentMethod = {
  id: string; // UUID
  name: string;
  description?: string | null;
  is_active: boolean;
  requires_approval: boolean;
  processing_fee_percentage?: number | null;
  created_at: string;
};

// Define the expected structure for table meta passed down
export interface PaymentMethodTableMeta {
  editPaymentMethod: (method: PaymentMethod) => void;
  deletePaymentMethod: (methodId: string, methodName: string) => void;
}

export const paymentMethodColumns: ColumnDef<PaymentMethod, PaymentMethodTableMeta>[] = [
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
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Ativo" : "Inativo"}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "requires_approval",
    header: "Aprovação",
    cell: ({ row }) => {
      const requiresApproval = row.getValue("requires_approval");
      return <Badge variant={requiresApproval ? "outline" : "secondary"}>{requiresApproval ? "Manual" : "Automática"}</Badge>;
    },
  },
  {
    accessorKey: "processing_fee_percentage",
    header: "Taxa (%)",
    cell: ({ row }) => {
      const fee = row.getValue("processing_fee_percentage");
      return <div>{fee !== null && fee !== undefined ? `${Number(fee).toFixed(2)}%` : "-"}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <div className="text-sm text-muted-foreground truncate max-w-xs">{row.getValue("description") || "-"}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const method = row.original;
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
            <DropdownMenuItem onClick={() => meta?.editPaymentMethod(method)}>
               <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => meta?.deletePaymentMethod(method.id, method.name)}
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
