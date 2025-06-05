import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PedidosTable } from '@/app/(dashboard)/pedidos/_components/PedidosTable';

// Mock dos hooks e funções necessárias
jest.mock('@/lib/utils/data-hooks', () => ({
  useSupabaseData: () => ({
    data: [
      { 
        id: '1', 
        order_number: 'PED-001', 
        client: { name: 'Cliente Teste' },
        order_date: '2025-06-01',
        status: { name: 'Em Processamento' },
        total: 1500.00
      }
    ],
    loading: false,
    error: null,
    refresh: jest.fn()
  }),
  deleteRecord: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}));

describe('PedidosTable Component', () => {
  test('renderiza a tabela de pedidos corretamente', () => {
    render(<PedidosTable />);
    
    // Verifica se o título está presente
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    
    // Verifica se o botão de adicionar está presente
    expect(screen.getByText('Novo Pedido')).toBeInTheDocument();
    
    // Verifica se os dados do pedido estão presentes
    expect(screen.getByText('PED-001')).toBeInTheDocument();
    expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    expect(screen.getByText('Em Processamento')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
  });

  test('exibe mensagem quando não há pedidos', () => {
    // Sobrescreve o mock para retornar uma lista vazia
    jest.spyOn(require('@/lib/utils/data-hooks'), 'useSupabaseData').mockImplementation(() => ({
      data: [],
      loading: false,
      error: null,
      refresh: jest.fn()
    }));
    
    render(<PedidosTable />);
    
    expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument();
  });

  test('exibe indicador de carregamento', () => {
    // Sobrescreve o mock para simular carregamento
    jest.spyOn(require('@/lib/utils/data-hooks'), 'useSupabaseData').mockImplementation(() => ({
      data: [],
      loading: true,
      error: null,
      refresh: jest.fn()
    }));
    
    render(<PedidosTable />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });
});
