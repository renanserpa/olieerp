"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { ArrowUpDown, MoreHorizontal, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { PurchaseRequestForm } from "./PurchaseRequestForm";
import { PurchaseRequestApprovalDialog } from "./PurchaseRequestApprovalDialog";

// Define the type based on the actual Supabase schema for purchase_requests
export type PurchaseRequest = {
  id: string;
  requester_id: string | null;
  department_id: string | null;
  justification: string;
  status_id: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  // Relações
  status?: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
  } | null;
  requester?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
};

// Helper function to handle status updates (Approve/Reject)
const handleStatusUpdate = async (id: string, newStatusId: string, router: ReturnType<typeof useRouter>) => {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("purchase_requests")
      .update({ status_id: newStatusId, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    toast.success(`Status da solicitação atualizado com sucesso!`);
    router.refresh(); // Refresh data in the table
  } catch (error: any) {
    console.error(`Erro ao atualizar status da solicitação:`, error);
    toast.error(`Erro ao atualizar status: ${error.message}`);
  }
};

// Helper function to handle deletion
const handleDelete = async (id: string, router: ReturnType<typeof useRouter>) => {
  const supabase = createClient();
  if (!confirm("Tem certeza que deseja excluir esta solicitação?")) return;

  try {
    const { error } = await supabase
      .from("purchase_requests")
      .delete()
      .eq("id", id);

    if (error) throw error;

    toast.success("Solicitação excluída com sucesso!");
    router.refresh(); // Refresh data in the table
  } catch (error: any) {
    console.error("Erro ao excluir solicitação:", error);
    toast.error("Erro ao excluir solicitação: " + error.message);
  }
};

export const purchaseRequestColumns = (): ColumnDef<PurchaseRequest>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="text-xs truncate w-16">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data Criação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString("pt-BR"),
  },
  {
    accessorKey: "requester.name",
    header: "Solicitante",
    cell: ({ row }) => {
      const requester = row.original.requester;
      return requester?.name || "N/A";
    },
  },
  {
    accessorKey: "department.name",
    header: "Departamento",
    cell: ({ row }) => {
      const department = row.original.department;
      return department?.name || "N/A";
    },
  },
  {
    accessorKey: "justification",
    header: "Justificativa",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.getValue("justification")}</div>,
  },
  {
    accessorKey: "status.name",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      if (!status) return <Badge variant="secondary">Desconhecido</Badge>;
      
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      
      // Determine variant based on status name or color
      if (status.name.toLowerCase().includes("aprovad")) variant = "default";
      if (status.name.toLowerCase().includes("rejeitad")) variant = "destructive";
      if (status.name.toLowerCase().includes("pendent")) variant = "outline";
      
      return <Badge variant={variant}>{status.name}</Badge>;
    },
    filterFn: (row, id, value) => {
      const status = row.original.status;
      if (!status) return false;
      return value.includes(status.name);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const request = row.original;
      const router = useRouter();

      const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
      const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");

      // Check if request is in a pending state
      const isPending = request.status?.name.toLowerCase().includes("pendent") || false;

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(request.id)}>
                Copiar ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isPending && (
                <>
                  <DropdownMenuItem
                    className="text-green-600 focus:text-green-700 focus:bg-green-100"
                    onClick={() => {
                      setApprovalAction("approve");
                      setApprovalDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-100"
                    onClick={() => {
                      setApprovalAction("reject");
                      setApprovalDialogOpen(true);
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px]">
                      <PurchaseRequestForm 
                        initialData={request}
                        onSuccess={() => router.refresh()}
                      />
                    </DialogContent>
                  </Dialog>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700 focus:bg-red-100"
                    onClick={() => handleDelete(request.id, router)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </>
              )}
              {!isPending && (
                <DropdownMenuItem disabled>
                  Nenhuma ação disponível
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <PurchaseRequestApprovalDialog
            purchaseRequest={request}
            action={approvalAction}
            open={approvalDialogOpen}
            onOpenChange={setApprovalDialogOpen}
            onSuccess={() => {
              setApprovalDialogOpen(false);
              router.refresh();
            }}
          />
        </>
      );
    },
  },
];
