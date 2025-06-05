"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
// TODO: Import forms/alerts for actions

// Define the data structure for an Employee based on Mapeamento de Dados
export type Employee = {
  id: string; // UUID
  name: string;
  cpf?: string;
  role?: string;
  hire_date?: string; // Date/Timestamp
  status?: string; // e.g., Ativo, Inativo, Férias
  contact_info?: string; // Could be JSON or separate fields
  email?: string; // Assuming email is part of contact_info or separate
  phone?: string; // Assuming phone is part of contact_info or separate
  created_at: string;
  // Add other relevant fields like employment_type_id, etc.
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR");
  } catch (e) {
    return "Data inválida";
  }
};

export const employeeColumns: ColumnDef<Employee>[] = [
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
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "role",
    header: "Cargo",
    cell: ({ row }) => <div>{row.original.role || "-"}</div>,
  },
  {
    accessorKey: "email", // Assuming email exists
    header: "Email",
    cell: ({ row }) => <div>{row.original.email || "-"}</div>,
  },
   {
    accessorKey: "phone", // Assuming phone exists
    header: "Telefone",
    cell: ({ row }) => <div>{row.original.phone || "-"}</div>,
  },
  {
    accessorKey: "hire_date",
    header: "Data Admissão",
    cell: ({ row }) => <div>{formatDate(row.original.hire_date)}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "-";
      // TODO: Add badge variants based on status
      return <Badge variant={status === 'Ativo' ? 'default' : 'secondary'}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const employee = row.original;

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
              onClick={() => navigator.clipboard.writeText(employee.id)}
            >
              Copiar ID Colaborador
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Edit action */}
            <DropdownMenuItem disabled>Editar Colaborador</DropdownMenuItem>
            {/* TODO: Add View Details action */}
            <DropdownMenuItem disabled>Ver Detalhes</DropdownMenuItem>
            {/* TODO: Add actions like "Register Time", "Request Leave" */}
            <DropdownMenuItem disabled>Registrar Ponto</DropdownMenuItem>
            <DropdownMenuItem disabled>Solicitar Férias/Licença</DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Delete/Deactivate action */}
            <DropdownMenuItem disabled className="text-red-600">Desativar Colaborador</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

