// /src/app/pedidos/__tests__/page.test.tsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PedidosPage from "../page"; // Adjust the import path as needed
// import wixClient from "@/lib/wixClient"; // No longer mocking wixClient directly
import * as api from "@/lib/api"; // Import the api module to mock its functions
import { useToast } from "@/hooks/use-toast"; // Corrected import path

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock("@/hooks/use-toast", () => ({ // Corrected mock path
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the specific API functions used by the component
jest.mock("@/lib/api", () => ({
  __esModule: true, // Needed for ES Module mocking
  ...jest.requireActual("@/lib/api"), // Keep other exports if any
  listarPedidos: jest.fn(), // Mock the specific function
}));

// Mock Shadcn Table components (basic structure)
jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableCaption: ({ children }: any) => <caption>{children}</caption>,
}));

// Mock Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe("PedidosPage", () => {
  // Get the mocked function
  const mockListarPedidos = api.listarPedidos as jest.Mock;
  const mockRouterPush = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require("next/navigation").useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush, back: jest.fn() });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it("renders loading state initially", () => {
    mockListarPedidos.mockReturnValue(new Promise(() => {})); // Keep promise pending
    render(<PedidosPage />);
    // Check for skeleton loaders (assuming they exist in the component)
    // Using a simple text check as a placeholder for actual skeleton components
    expect(screen.getByText(/Carregando pedidos.../i)).toBeInTheDocument();
  });

  it("renders the list of orders when data is fetched successfully", async () => {
    const mockPedidosData = [
      { _id: "ped1", numeroPedido: "P001", clienteNome: "Cliente A", status: "Confirmado", dataCriacao: new Date().toISOString(), valorTotal: 100 },
      { _id: "ped2", numeroPedido: "P002", clienteNome: "Cliente B", status: "Pendente", dataCriacao: new Date().toISOString(), valorTotal: 250 },
    ];
    mockListarPedidos.mockResolvedValue(mockPedidosData);

    render(<PedidosPage />);

    // Wait for loading to finish and data to appear
    await waitFor(() => {
      expect(screen.queryByText(/Carregando pedidos.../i)).not.toBeInTheDocument();
    });

    // Check if table and data are rendered
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByText("P001")).toBeInTheDocument();
    expect(screen.getByText("Cliente A")).toBeInTheDocument();
    expect(screen.getByText("Confirmado")).toBeInTheDocument();
    expect(screen.getByText("P002")).toBeInTheDocument();
    expect(screen.getByText("Cliente B")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();

    // Check if the API was called correctly
    expect(mockListarPedidos).toHaveBeenCalledTimes(1);
    expect(mockListarPedidos).toHaveBeenCalledWith(); // Assuming no args for list all
  });

  it("renders an empty state message when no orders are found", async () => {
    mockListarPedidos.mockResolvedValue([]); // Return empty array

    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando pedidos.../i)).not.toBeInTheDocument();
    });

    // Check for empty state message
    expect(screen.getByText(/Nenhum pedido encontrado./i)).toBeInTheDocument();
    expect(screen.queryByTestId("table")).not.toBeInTheDocument();
  });

  it("renders an error message if data fetching fails", async () => {
    const errorMessage = "Falha ao buscar pedidos";
    mockListarPedidos.mockRejectedValue(new Error(errorMessage));

    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando pedidos.../i)).not.toBeInTheDocument();
    });

    // Check for error message
    expect(screen.getByText(new RegExp(errorMessage, "i"))).toBeInTheDocument();
    expect(screen.queryByTestId("table")).not.toBeInTheDocument();
  });

  it("navigates to the new order page when 'Novo Pedido' button is clicked", async () => {
    mockListarPedidos.mockResolvedValue([]); // Mock successful empty fetch
    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando pedidos.../i)).not.toBeInTheDocument();
    });

    const novoPedidoButton = screen.getByRole("button", { name: /Novo Pedido/i });
    fireEvent.click(novoPedidoButton);

    expect(mockRouterPush).toHaveBeenCalledWith("/pedidos/novo");
  });
});

