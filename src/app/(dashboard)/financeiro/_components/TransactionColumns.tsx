"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
// TODO: Import forms/alerts for actions

// Define the data structure for a Financial Transaction based on Mapeamento de Dados
export type FinancialTransaction = {
  id: string; // UUID
  date: string; // Date/Timestamp
  amount: number;
  type_id: string; // UUID, needs join to get type details (income/expense)
  type_name?: string; // Added for display
  is_income?: boolean; // Added for styling/logic
  category_id?: string; // UUID, needs join to get category name
  category_name?: string; // Added for display
  status_id: string; // UUID, needs join to get status name
  status_name?: string; // Added for display
  status_color?: string; // Added for badge color
  reference_id?: string; // UUID (e.g., order_id, purchase_order_id)
  reference_type?: string; // e.g., 'order', 'purchase'
  payment_method_id?: string; // UUID, needs join
  payment_method_name?: string; // Added for display
  description?: string;
  created_at: string;
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
  const value = Math.abs(amount); // Show absolute value, sign indicated by type
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const transactionColumns: ColumnDef<FinancialTransaction>[] = [
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
    cell: ({ row }) => <div>{formatDate(row.original.date)}</div>,
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.description || "-"}</div>,
  },
  {
    accessorKey: "category_name",
    header: "Categoria",
    cell: ({ row }) => <div>{row.original.category_name || "-"}</div>,
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
        const isIncome = row.original.is_income;
        const amount = row.original.amount;
        const color = isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
        const Icon = isIncome ? TrendingUp : TrendingDown;
        return (
            <div className={`text-right font-medium flex items-center justify-end ${color}`}>
                 <Icon className="mr-1 h-4 w-4" />
                {formatCurrency(amount)}
            </div>
        );
    },
  },
  {
    accessorKey: "payment_method_name",
    header: "Forma Pgto.",
    cell: ({ row }) => <div>{row.original.payment_method_name || "-"}</div>,
  },
  {
    accessorKey: "status_name",
    header: "Status",
    cell: ({ row }) => {
      const statusName = row.original.status_name || "-";
      // TODO: Get color from status_color and apply to Badge
      return <Badge variant="secondary">{statusName}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
   {
    accessorKey: "reference_id",
    header: "Referência",
    cell: ({ row }) => {
        const refId = row.original.reference_id;
        const refType = row.original.reference_type;
        if (!refId) return "-";
        // TODO: Make this a link to the order/purchase page?
        return <div className="lowercase text-xs">{refType}: {refId.substring(0, 8)}...</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const transaction = row.original;

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
              onClick={() => navigator.clipboard.writeText(transaction.id)}
            >
              Copiar ID Lançamento
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Edit action */}
            <DropdownMenuItem disabled>Editar Lançamento</DropdownMenuItem>
            {/* TODO: Add View Details action */}
            <DropdownMenuItem disabled>Ver Detalhes</DropdownMenuItem>
            {/* TODO: Add action like "Conciliate" */}
            <DropdownMenuItem disabled>Conciliar</DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Delete action */}
            <DropdownMenuItem disabled className="text-red-600">Excluir Lançamento</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

