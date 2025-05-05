// /src/app/pedidos/__tests__/page.test.tsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PedidosPage from "../page"; // Adjust the import path as needed
import wixClient from "@/lib/wixClient";
import { useToast } from "@/components/ui/use-toast";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock("@/lib/wixClient", () => ({
  functions: {
    execute: jest.fn(),
  },
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
  const mockWixExecute = wixClient.functions.execute as jest.Mock;
  const mockRouterPush = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (require("next/navigation").useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush, back: jest.fn() });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it("renders loading state initially", () => {
    mockWixExecute.mockReturnValue(new Promise(() => {})); // Keep promise pending
    render(<PedidosPage />);
    // Check for skeleton loaders (assuming they exist in the component)
    // Using a simple text check as a placeholder for actual skeleton components
    expect(screen.getByText(/Carregando pedidos.../i)).toBeInTheDocument();
  });

  it("renders the list of orders when data is fetched successfully", async () => {
    const mockPedidos = [
      { _id: "ped1", numeroPedido: "P001", clienteNome: "Cliente A", status: "Confirmado", dataCriacao: new Date().toISOString(), valorTotal: 100 },
      { _id: "ped2", numeroPedido: "P002", clienteNome: "Cliente B", status: "Pendente", dataCriacao: new Date().toISOString(), valorTotal: 250 },
    ];
    mockWixExecute.mockResolvedValue(mockPedidos);

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
    expect(mockWixExecute).toHaveBeenCalledWith("pedidos/pedidos", "listarPedidos", undefined); // Assuming no args for list all
  });

  it("renders an empty state message when no orders are found", async () => {
    mockWixExecute.mockResolvedValue([]); // Return empty array

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
    mockWixExecute.mockRejectedValue(new Error(errorMessage));

    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando pedidos.../i)).not.toBeInTheDocument();
    });

    // Check for error message
    expect(screen.getByText(new RegExp(errorMessage, "i"))).toBeInTheDocument();
    expect(screen.queryByTestId("table")).not.toBeInTheDocument();
  });

  it("navigates to the new order page when 'Novo Pedido' button is clicked", async () => {
    mockWixExecute.mockResolvedValue([]); // Mock successful empty fetch
    render(<PedidosPage />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando pedidos.../i)).not.toBeInTheDocument();
    });

    const novoPedidoButton = screen.getByRole("button", { name: /Novo Pedido/i });
    fireEvent.click(novoPedidoButton);

    expect(mockRouterPush).toHaveBeenCalledWith("/pedidos/novo");
  });
});

