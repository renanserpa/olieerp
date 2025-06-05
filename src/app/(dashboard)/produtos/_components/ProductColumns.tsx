"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash2, Image as ImageIcon } from "lucide-react"; // Add ImageIcon
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
// TODO: Import ProductForm and AlertDialog for deletion

// Define the data structure for a Product based on Mapeamento de Dados
export type Product = {
  id: string; // UUID
  name: string;
  sku?: string;
  description?: string;
  category_id?: string; // Needs join for category name
  category_name?: string; // Added for display
  price?: number;
  cost?: number;
  stock_quantity?: number; // Could be calculated or stored
  image_url?: string; // URL from Supabase Storage
  status?: string; // e.g., Ativo, Inativo, Rascunho
  created_at: string;
  // Add other relevant fields like variations, components, etc.
};

// Placeholder delete function (similar to Client/Supplier)
const handleDeleteProduct = async (productId: string, productName: string, onSuccess?: (id: string) => void) => {
  console.log(`Attempting to delete product: ${productId} (${productName})`);
  if (window.confirm(`Tem certeza que deseja excluir o produto "${productName}"? Esta ação não pode ser desfeita.`)) {
    try {
      // TODO: Replace with actual API call (consider soft delete)
      // await deleteProduct(productId);
      console.log(`Placeholder: Product ${productId} deleted successfully.`);
      alert(`Produto "${productName}" excluído com sucesso (placeholder).`);
      onSuccess?.(productId); // Trigger callback to update UI
    } catch (error) {
      console.error("Error deleting product (placeholder):", error);
      alert(`Erro ao excluir produto "${productName}".`);
    }
  }
};

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

export const productColumns: ColumnDef<Product>[] = [
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
    accessorKey: "image_url",
    header: "Imagem",
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;
      // TODO: Use Next/Image for optimization if possible
      return imageUrl ? (
        <img src={imageUrl} alt={row.original.name} className="h-10 w-10 object-cover rounded" />
      ) : (
        <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome do Produto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <div>{row.original.sku || "-"}</div>,
  },
  {
    accessorKey: "category_name",
    header: "Categoria",
    cell: ({ row }) => <div>{row.original.category_name || "-"}</div>,
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Preço Venda</div>,
    cell: ({ row }) => <div className="text-right">{formatCurrency(row.original.price)}</div>,
  },
  {
    accessorKey: "stock_quantity",
    header: () => <div className="text-right">Estoque</div>,
    cell: ({ row }) => <div className="text-right">{row.original.stock_quantity ?? "-"}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "-";
      return <Badge variant={status === "Ativo" ? "default" : "secondary"}>{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row /*, onDeleteSuccess */ }) => {
      const product = row.original;

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
              onClick={() => navigator.clipboard.writeText(product.id)}
            >
              Copiar ID Produto
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* TODO: Add Edit action (triggering ProductForm in a dialog) */}
            <DropdownMenuItem disabled>Editar Produto</DropdownMenuItem>
            {/* TODO: Add View Details action */}
            <DropdownMenuItem disabled>Ver Detalhes</DropdownMenuItem>
            {/* TODO: Add action like "View Stock Movements" */}
            <DropdownMenuItem disabled>Ver Mov. Estoque</DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Enable Delete action and add confirmation */}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700 focus:bg-red-100/50"
              onClick={() => handleDeleteProduct(product.id, product.name /*, onDeleteSuccess */)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Produto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

