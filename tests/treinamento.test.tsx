import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrainingPage from '../src/app/(dashboard)/treinamento/page';
import { useAuth } from '../src/contexts/auth-context';
import { createClient } from '../src/lib/supabase/client';
import { useNotifications } from '../src/components/notification-system';

// Mock dos hooks e funções
vi.mock('../src/contexts/auth-context', () => ({
  useAuth: vi.fn()
}));

vi.mock('../src/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

vi.mock('../src/components/notification-system', () => ({
  useNotifications: vi.fn()
}));

// Mock dos dados
const mockCourses = [
  {
    id: '1',
    title: 'Introdução ao ERP Olie',
    description: 'Curso básico sobre o funcionamento do sistema ERP Olie',
    hours_duration: 8,
    level: 'basic',
    category: 'Sistemas',
    status: 'published',
    cover_image: null,
    created_at: '2025-05-01T10:00:00Z',
    division_id: '1',
    division_name: 'Ateliê'
  },
  {
    id: '2',
    title: 'Gestão de Estoque Avançada',
    description: 'Técnicas avançadas para gestão de estoque no ERP Olie',
    hours_duration: 16,
    level: 'advanced',
    category: 'Logística',
    status: 'published',
    cover_image: null,
    created_at: '2025-05-05T10:00:00Z',
    division_id: '2',
    division_name: 'Casa'
  }
];

const mockEnrollments = [
  {
    id: '1',
    course_id: '1',
    user_id: 'user-1',
    enrollment_date: '2025-05-10T10:00:00Z',
    status: 'in_progress',
    progress_percentage: 50,
    completion_date: null,
    course: mockCourses[0]
  }
];

const mockCertificates = [
  {
    id: '1',
    course_id: '2',
    user_id: 'user-1',
    issue_date: '2025-05-15T10:00:00Z',
    validation_code: 'CERT-12345',
    status: 'valid',
    course: mockCourses[1]
  }
];

// Setup do mock do Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  then: vi.fn()
};

describe('TrainingPage Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mocks
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      hasPermission: vi.fn().mockReturnValue(true)
    });
    
    createClient.mockReturnValue(mockSupabase);
    
    useNotifications.mockReturnValue({
      sendNotification: vi.fn()
    });
    
    // Setup Supabase responses
    mockSupabase.then.mockImplementation((callback) => {
      callback({ data: mockCourses, error: null });
      return mockSupabase;
    });
  });
  
  it('renders the training page with tabs', () => {
    render(<TrainingPage />);
    
    expect(screen.getByText('Universidade Corporativa')).toBeInTheDocument();
    expect(screen.getByText('Cursos Disponíveis')).toBeInTheDocument();
    expect(screen.getByText('Meus Cursos')).toBeInTheDocument();
    expect(screen.getByText('Certificados')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
  
  it('fetches and displays available courses', async () => {
    // Setup mock for courses
    mockSupabase.then.mockImplementationOnce((callback) => {
      callback({ data: mockCourses, error: null });
      return mockSupabase;
    });
    
    render(<TrainingPage />);
    
    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Introdução ao ERP Olie')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Estoque Avançada')).toBeInTheDocument();
    });
    
    // Check course details
    expect(screen.getByText('8 horas')).toBeInTheDocument();
    expect(screen.getByText('Sistemas')).toBeInTheDocument();
    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(screen.getByText('Divisão: Ateliê')).toBeInTheDocument();
  });
  
  it('switches to my courses tab and displays enrollments', async () => {
    // Setup mock for courses and enrollments
    mockSupabase.then
      .mockImplementationOnce((callback) => {
        callback({ data: mockCourses, error: null });
        return mockSupabase;
      })
      .mockImplementationOnce((callback) => {
        callback({ data: mockEnrollments, error: null });
        return mockSupabase;
      });
    
    render(<TrainingPage />);
    
    // Click on My Courses tab
    fireEvent.click(screen.getByText('Meus Cursos'));
    
    // Wait for enrollments to load
    await waitFor(() => {
      expect(screen.getByText('Introdução ao ERP Olie')).toBeInTheDocument();
      expect(screen.getByText('Em andamento')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
    
    // Check for continue button
    expect(screen.getByText('Continuar curso')).toBeInTheDocument();
  });
  
  it('switches to certificates tab and displays certificates', async () => {
    // Setup mock for courses and certificates
    mockSupabase.then
      .mockImplementationOnce((callback) => {
        callback({ data: mockCourses, error: null });
        return mockSupabase;
      })
      .mockImplementationOnce((callback) => {
        callback({ data: mockCertificates, error: null });
        return mockSupabase;
      });
    
    render(<TrainingPage />);
    
    // Click on Certificates tab
    fireEvent.click(screen.getByText('Certificados'));
    
    // Wait for certificates to load
    await waitFor(() => {
      expect(screen.getByText('Gestão de Estoque Avançada')).toBeInTheDocument();
      expect(screen.getByText('Código de validação:')).toBeInTheDocument();
      expect(screen.getByText('CERT-12345')).toBeInTheDocument();
    });
    
    // Check for view certificate button
    expect(screen.getByText('Visualizar Certificado')).toBeInTheDocument();
  });
  
  it('applies filters to course list', async () => {
    // Setup mock for courses
    mockSupabase.then.mockImplementationOnce((callback) => {
      callback({ data: mockCourses, error: null });
      return mockSupabase;
    });
    
    render(<TrainingPage />);
    
    // Enter search query
    fireEvent.change(screen.getByPlaceholderText('Nome do curso...'), {
      target: { value: 'Estoque' }
    });
    
    // Click filter button
    fireEvent.click(screen.getByText('Filtrar'));
    
    // Verify that ilike was called with the search query
    expect(mockSupabase.ilike).toHaveBeenCalledWith('title', '%Estoque%');
  });
  
  it('handles enrollment in a course', async () => {
    // Setup mock for courses
    mockSupabase.then.mockImplementationOnce((callback) => {
      callback({ data: mockCourses, error: null });
      return mockSupabase;
    });
    
    // Setup mock for enrollment
    mockSupabase.insert = vi.fn().mockReturnThis();
    mockSupabase.single = vi.fn().mockReturnThis();
    
    render(<TrainingPage />);
    
    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Introdução ao ERP Olie')).toBeInTheDocument();
    });
    
    // Click enroll button for first course
    const enrollButtons = screen.getAllByText('Matricular-se');
    fireEvent.click(enrollButtons[0]);
    
    // Verify that insert was called with correct data
    expect(mockSupabase.insert).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('enrollments');
  });
  
  it('shows error message when API fails', async () => {
    // Setup mock for API error
    mockSupabase.then.mockImplementationOnce((callback) => {
      callback({ data: null, error: { message: 'API Error' } });
      return mockSupabase;
    });
    
    // Mock toast
    const mockToast = {
      error: vi.fn()
    };
    global.toast = mockToast;
    
    render(<TrainingPage />);
    
    // Wait for error handling
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Erro ao carregar dados: API Error');
    });
  });
});
