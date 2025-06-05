import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientesTable } from '@/app/(dashboard)/clientes/_components/ClientesTable';

// Mock dos hooks e funções necessárias
jest.mock('@/lib/utils/data-hooks', () => ({
  useClients: () => ({
    clients: [
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

describe('ClientesTable Component', () => {
  test('renderiza a tabela de clientes corretamente', () => {
    render(<ClientesTable />);
    
    // Verifica se o título está presente
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    
    // Verifica se o botão de adicionar está presente
    expect(screen.getByText('Adicionar Cliente')).toBeInTheDocument();
    
    // Verifica se os dados do cliente estão presentes
    expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    expect(screen.getByText('cliente@teste.com')).toBeInTheDocument();
    expect(screen.getByText('(11) 99999-9999')).toBeInTheDocument();
  });

  test('exibe mensagem quando não há clientes', () => {
    // Sobrescreve o mock para retornar uma lista vazia
    jest.spyOn(require('@/lib/utils/data-hooks'), 'useClients').mockImplementation(() => ({
      clients: [],
      loading: false,
      error: null,
      refresh: jest.fn()
    }));
    
    render(<ClientesTable />);
    
    expect(screen.getByText('Nenhum cliente encontrado')).toBeInTheDocument();
  });

  test('exibe indicador de carregamento', () => {
    // Sobrescreve o mock para simular carregamento
    jest.spyOn(require('@/lib/utils/data-hooks'), 'useClients').mockImplementation(() => ({
      clients: [],
      loading: true,
      error: null,
      refresh: jest.fn()
    }));
    
    render(<ClientesTable />);
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });
});
