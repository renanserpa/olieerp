import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import PedidosTable from '@/app/(dashboard)/pedidos/_components/PedidosTable';

// Não é necessário mockar módulos externos para este componente

describe('PedidosTable Component', () => {
  test('renderiza a tabela de pedidos corretamente', () => {
    render(<PedidosTable />);

    // Campo de busca presente
    expect(screen.getByPlaceholderText('Buscar pedidos...')).toBeInTheDocument();

    // Verifica se os dados do pedido estão presentes
    expect(screen.getByText('PED-2025-001')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  test('exibe mensagem quando não há pedidos encontrados', () => {
    render(<PedidosTable />);

    const input = screen.getAllByPlaceholderText('Buscar pedidos...')[0];
    fireEvent.change(input, {
      target: { value: 'inexistente' }
    });

    expect(screen.getByText('Nenhum pedido encontrado.')).toBeInTheDocument();
  });
});
