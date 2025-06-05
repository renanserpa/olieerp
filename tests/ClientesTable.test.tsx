import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import ClientesTable from '@/app/(dashboard)/clientes/_components/ClientesTable';
import { useSupabaseData } from '@/lib/data-hooks';

// Mock dos hooks e funções necessárias
vi.mock('@/lib/data-hooks', () => ({
  useSupabaseData: vi.fn(() => ({
    data: [
      {
        id: '1',
        name: 'Cliente Teste',
        email: 'cliente@teste.com',
        phone: '(11) 99999-9999',
        document: '123.456.789-00'
      }
    ],
    loading: false,
    error: null,
    refresh: vi.fn()
  })),
  deleteRecord: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

describe('ClientesTable Component', () => {
  test('renderiza a tabela de clientes corretamente', () => {
    render(<ClientesTable />);
    
    // Verifica se o botão de adicionar está presente
    expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
    
    // Verifica se os dados do cliente estão presentes
    expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    expect(screen.getByText('cliente@teste.com')).toBeInTheDocument();
    expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
  });

  test('exibe mensagem quando não há clientes', () => {
    // Sobrescreve o mock para retornar uma lista vazia
    (useSupabaseData as unknown as vi.Mock).mockImplementation(() => ({
      data: [],
      loading: false,
      error: null,
      refresh: vi.fn()
    }));
    
    render(<ClientesTable />);
    
    expect(screen.getByText('Nenhum cliente encontrado')).toBeInTheDocument();
  });

});
