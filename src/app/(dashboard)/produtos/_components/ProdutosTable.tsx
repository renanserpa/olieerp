"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Package
} from "lucide-react";

// Dados de exemplo para produtos
const produtosData = [
  { 
    id: "1", 
    name: "Bolsa Artesanal", 
    sku: "BOL-001", 
    category: "Bolsas", 
    price: 159.90, 
    stock_quantity: 25, 
    unit_of_measurement: "un", 
    is_active: true 
  },
  { 
    id: "2", 
    name: "Necessaire Floral", 
    sku: "NEC-002", 
    category: "Necessaires", 
    price: 89.90, 
    stock_quantity: 42, 
    unit_of_measurement: "un", 
    is_active: true 
  },
  { 
    id: "3", 
    name: "Kit Viagem", 
    sku: "KIT-003", 
    category: "Viagens", 
    price: 249.90, 
    stock_quantity: 8, 
    unit_of_measurement: "kit", 
    is_active: true 
  },
  { 
    id: "4", 
    name: "Porta Documentos", 
    sku: "DOC-004", 
    category: "Complementos", 
    price: 69.90, 
    stock_quantity: 0, 
    unit_of_measurement: "un", 
    is_active: false 
  },
  { 
    id: "5", 
    name: "Mochila Infantil", 
    sku: "INF-005", 
    category: "Pétit", 
    price: 119.90, 
    stock_quantity: 15, 
    unit_of_measurement: "un", 
    is_active: true 
  },
];

export default function ProdutosTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState(produtosData);

  // Filtrar produtos com base no termo de pesquisa
  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manipular a exclusão de produto
  const handleDeleteProduto = (id) => {
    setProdutos(produtos.filter((p) => p.id !== id));
  };

  // Formatar preço para exibição
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar produtos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProdutos.length > 0 ? (
              filteredProdutos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.name}</TableCell>
                  <TableCell>{produto.sku}</TableCell>
                  <TableCell>{produto.category}</TableCell>
                  <TableCell>{formatPrice(produto.price)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        produto.stock_quantity > 10
                          ? "bg-green-100 text-green-800"
                          : produto.stock_quantity > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {produto.stock_quantity} {produto.unit_of_measurement}
                    </span>
                  </TableCell>
                  <TableCell>{produto.unit_of_measurement}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        produto.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {produto.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center text-red-600"
                          onClick={() => handleDeleteProduto(produto.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
