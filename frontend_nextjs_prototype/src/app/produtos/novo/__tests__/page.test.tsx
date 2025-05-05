// /src/app/produtos/novo/__tests__/page.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NovoMaterialPage from "../page"; // Adjust the import path as needed
import { useToast } from "@/components/ui/use-toast";
import wixClient from "@/lib/wixClient";

// Mock dependencies
// Mock the router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock the toast
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the wixClient
jest.mock("@/lib/wixClient", () => ({
  functions: {
    execute: jest.fn(),
  },
}));

// Mock Shadcn components that might cause issues in Jest (like Select)
// You might need to add more mocks depending on your setup
jest.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, defaultValue }: any) => (
    <select data-testid="select" defaultValue={defaultValue} onChange={(e) => onValueChange(e.target.value)}>{children}</select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

describe("NovoMaterialPage", () => {
  const mockToast = jest.fn();
  const mockRouterPush = jest.fn();
  const mockWixExecute = wixClient.functions.execute as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (require("next/navigation").useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush, back: jest.fn() });
  });

  it("renders the form correctly", () => {
    render(<NovoMaterialPage />);

    // Check for key elements
    expect(screen.getByRole("heading", { name: /Novo Material Básico/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do Material/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Código \(SKU\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unidade de Medida/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preço Unitário/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Salvar Material/i })).toBeInTheDocument();
  });

  it("shows validation errors for required fields", async () => {
    render(<NovoMaterialPage />);

    const submitButton = screen.getByRole("button", { name: /Salvar Material/i });
    fireEvent.click(submitButton);

    // Wait for validation messages to appear
    expect(await screen.findByText(/Nome deve ter pelo menos 3 caracteres./i)).toBeInTheDocument();
    expect(await screen.findByText(/Unidade de medida é obrigatória./i)).toBeInTheDocument();
    // Price might not show error if default is 0 and it's optional or allows 0

    // Check that API was not called
    expect(mockWixExecute).not.toHaveBeenCalled();
  });

  it("submits the form successfully with valid data", async () => {
    // Mock successful API response
    const mockApiResponse = { _id: "mat123", nome: "Tecido Teste" };
    mockWixExecute.mockResolvedValue(mockApiResponse);

    render(<NovoMaterialPage />);

    // Fill the form
    fireEvent.change(screen.getByLabelText(/Nome do Material/i), { target: { value: "Tecido Teste" } });
    fireEvent.change(screen.getByLabelText(/Código \(SKU\)/i), { target: { value: "TEC-TESTE" } });
    // Simulate selecting an option (using data-testid from mock)
    fireEvent.change(screen.getByTestId("select"), { target: { value: "metro" } });
    fireEvent.change(screen.getByLabelText(/Preço Unitário/i), { target: { value: "15.50" } });

    const submitButton = screen.getByRole("button", { name: /Salvar Material/i });
    fireEvent.click(submitButton);

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockWixExecute).toHaveBeenCalledTimes(1);
    });

    // Check if API was called with correct data
    expect(mockWixExecute).toHaveBeenCalledWith(
      "estoque/materiaisBasicos",
      "criarMaterialBasico",
      {
        nome: "Tecido Teste",
        codigo: "TEC-TESTE",
        unidadeMedida: "metro",
        precoUnitario: 15.50,
      }
    );

    // Check for success toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Sucesso!",
      description: expect.stringContaining("Material \"Tecido Teste\" criado com ID: mat123."),
    }));

    // Check for navigation
    expect(mockRouterPush).toHaveBeenCalledWith("/estoque/materiais");
  });

  it("shows an error message if API call fails", async () => {
    // Mock failed API response
    const errorMessage = "Erro simulado ao criar material";
    mockWixExecute.mockRejectedValue(new Error(errorMessage));

    render(<NovoMaterialPage />);

    // Fill the form with valid data
    fireEvent.change(screen.getByLabelText(/Nome do Material/i), { target: { value: "Tecido Falha" } });
    fireEvent.change(screen.getByTestId("select"), { target: { value: "unidade" } });
    fireEvent.change(screen.getByLabelText(/Preço Unitário/i), { target: { value: "10" } });

    const submitButton = screen.getByRole("button", { name: /Salvar Material/i });
    fireEvent.click(submitButton);

    // Wait for submission to complete and error to show
    await waitFor(() => {
      expect(mockWixExecute).toHaveBeenCalledTimes(1);
    });

    // Check for error toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Erro ao Criar Material",
      description: errorMessage,
      variant: "destructive",
    }));

    // Check that navigation did not happen
    expect(mockRouterPush).not.toHaveBeenCalled();
    // Check if error message is displayed on the page (optional, depends on implementation)
    // expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});

