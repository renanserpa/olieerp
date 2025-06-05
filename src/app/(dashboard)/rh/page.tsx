"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, addDays, differenceInDays, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Users,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  GraduationCap
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNotifications } from "@/components/notification-system";

// Tipos
interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  profile_image?: string;
  division_id?: string;
  division_name?: string;
}

interface TimeOffRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  type: 'vacation' | 'sick_leave' | 'personal_leave' | 'maternity' | 'paternity' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

interface Department {
  id: string;
  name: string;
  manager_id?: string;
  division_id?: string;
}

interface Position {
  id: string;
  title: string;
  department_id: string;
  level: number;
  is_management: boolean;
}

interface TrainingRequirement {
  id: string;
  position_id: string;
  course_id: string;
  is_mandatory: boolean;
  deadline_days: number;
  course_title?: string;
}

// Componente principal
export default function HRPage() {
  const supabase = createClient();
  const { user, hasPermission } = useAuth();
  const { sendNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<string>("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trainingRequirements, setTrainingRequirements] = useState<TrainingRequirement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isTimeOffDialogOpen, setIsTimeOffDialogOpen] = useState<boolean>(false);
  const [currentTimeOff, setCurrentTimeOff] = useState<TimeOffRequest | null>(null);
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [availableCourses, setAvailableCourses] = useState<{id: string, title: string}[]>([]);
  
  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, activeTab]);
  
  // Buscar dados
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      switch (activeTab) {
        case "employees":
          await fetchEmployees();
          await fetchDepartments();
          break;
        case "time-off":
          await fetchTimeOffRequests();
          await fetchEmployees();
          break;
        case "departments":
          await fetchDepartments();
          await fetchEmployees();
          break;
        case "positions":
          await fetchPositions();
          await fetchDepartments();
          break;
        case "training":
          await fetchTrainingRequirements();
          await fetchPositions();
          await fetchAvailableCourses();
          break;
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error);
      toast.error(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar funcionários
  const fetchEmployees = async () => {
    let query = supabase
      .from("employees")
      .select(`
        *,
        divisions(name)
      `);
      
    // Aplicar filtros
    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }
    
    if (departmentFilter) {
      query = query.eq("department", departmentFilter);
    }
    
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Formatar dados
    const formattedEmployees = data?.map(employee => ({
      ...employee,
      division_name: employee.divisions?.name
    })) || [];
    
    setEmployees(formattedEmployees);
  };
  
  // Buscar solicitações de folga
  const fetchTimeOffRequests = async () => {
    const { data, error } = await supabase
      .from("time_off_requests")
      .select(`
        *,
        employee:employee_id(*)
      `)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    
    setTimeOffRequests(data || []);
  };
  
  // Buscar departamentos
  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name");
      
    if (error) throw error;
    
    setDepartments(data || []);
  };
  
  // Buscar cargos
  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from("positions")
      .select(`
        *,
        department:department_id(name)
      `)
      .order("title");
      
    if (error) throw error;
    
    setPositions(data || []);
  };
  
  // Buscar requisitos de treinamento
  const fetchTrainingRequirements = async () => {
    const { data, error } = await supabase
      .from("training_requirements")
      .select(`
        *,
        position:position_id(title),
        course:course_id(title)
      `)
      .order("position_id");
      
    if (error) throw error;
    
    // Formatar dados
    const formattedRequirements = data?.map(req => ({
      ...req,
      course_title: req.course?.title
    })) || [];
    
    setTrainingRequirements(formattedRequirements);
  };
  
  // Buscar cursos disponíveis
  const fetchAvailableCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title")
      .eq("status", "published")
      .order("title");
      
    if (error) throw error;
    
    setAvailableCourses(data || []);
  };
  
  // Aprovar solicitação de folga
  const handleApproveTimeOff = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("time_off_requests")
        .update({
          status: "approved",
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId)
        .select(`
          *,
          employee:employee_id(*)
        `)
        .single();
        
      if (error) throw error;
      
      // Atualizar lista
      setTimeOffRequests(prev => 
        prev.map(req => req.id === requestId ? data : req)
      );
      
      // Enviar notificação
      if (data.employee?.user_id) {
        await sendNotification(
          "Solicitação de folga aprovada",
          `Sua solicitação de folga de ${format(new Date(data.start_date), "dd/MM/yyyy")} a ${format(new Date(data.end_date), "dd/MM/yyyy")} foi aprovada.`,
          "success",
          "hr"
        );
      }
      
      toast.success("Solicitação aprovada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao aprovar solicitação:", error);
      toast.error(`Erro ao aprovar solicitação: ${error.message}`);
    }
  };
  
  // Rejeitar solicitação de folga
  const handleRejectTimeOff = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("time_off_requests")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId)
        .select(`
          *,
          employee:employee_id(*)
        `)
        .single();
        
      if (error) throw error;
      
      // Atualizar lista
      setTimeOffRequests(prev => 
        prev.map(req => req.id === requestId ? data : req)
      );
      
      // Enviar notificação
      if (data.employee?.user_id) {
        await sendNotification(
          "Solicitação de folga rejeitada",
          `Sua solicitação de folga de ${format(new Date(data.start_date), "dd/MM/yyyy")} a ${format(new Date(data.end_date), "dd/MM/yyyy")} foi rejeitada.`,
          "error",
          "hr"
        );
      }
      
      toast.success("Solicitação rejeitada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao rejeitar solicitação:", error);
      toast.error(`Erro ao rejeitar solicitação: ${error.message}`);
    }
  };
  
  // Adicionar requisito de treinamento
  const handleAddTrainingRequirement = async (positionId: string, courseId: string, isMandatory: boolean, deadlineDays: number) => {
    try {
      const { data, error } = await supabase
        .from("training_requirements")
        .insert({
          position_id: positionId,
          course_id: courseId,
          is_mandatory: isMandatory,
          deadline_days: deadlineDays
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Atualizar lista
      await fetchTrainingRequirements();
      
      toast.success("Requisito de treinamento adicionado com sucesso!");
      setIsTrainingDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao adicionar requisito:", error);
      toast.error(`Erro ao adicionar requisito: ${error.message}`);
    }
  };
  
  // Remover requisito de treinamento
  const handleRemoveTrainingRequirement = async (requirementId: string) => {
    try {
      const { error } = await supabase
        .from("training_requirements")
        .delete()
        .eq("id", requirementId);
        
      if (error) throw error;
      
      // Atualizar lista
      setTrainingRequirements(prev => 
        prev.filter(req => req.id !== requirementId)
      );
      
      toast.success("Requisito de treinamento removido com sucesso!");
    } catch (error: any) {
      console.error("Erro ao remover requisito:", error);
      toast.error(`Erro ao remover requisito: ${error.message}`);
    }
  };
  
  // Aplicar filtros
  const handleApplyFilters = () => {
    fetchEmployees();
  };
  
  // Limpar filtros
  const handleClearFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("");
    setStatusFilter("");
    fetchEmployees();
  };
  
  // Traduzir status
  const translateStatus = (status: string) => {
    switch (status) {
      case "active": return "Ativo";
      case "inactive": return "Inativo";
      case "on_leave": return "Em licença";
      case "pending": return "Pendente";
      case "approved": return "Aprovado";
      case "rejected": return "Rejeitado";
      default: return status;
    }
  };
  
  // Traduzir tipo de folga
  const translateTimeOffType = (type: string) => {
    switch (type) {
      case "vacation": return "Férias";
      case "sick_leave": return "Licença médica";
      case "personal_leave": return "Licença pessoal";
      case "maternity": return "Licença maternidade";
      case "paternity": return "Licença paternidade";
      case "other": return "Outro";
      default: return type;
    }
  };
  
  // Verificar permissão de RH
  if (!hasPermission("hr.access")) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // Renderizar componente
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recursos Humanos</h1>
          <p className="text-muted-foreground">
            Gerencie funcionários, departamentos e solicitações.
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="time-off" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Folgas e Licenças
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Departamentos
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Cargos
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Treinamentos
          </TabsTrigger>
        </TabsList>
        
        {/* Funcionários */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="flex">
                    <Input
                      placeholder="Nome ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departamento</label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os departamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os departamentos</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="on_leave">Em licença</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end space-x-2">
                  <Button onClick={handleApplyFilters} className="flex-1">
                    <Search className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : employees.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum funcionário encontrado</h3>
                <p className="text-muted-foreground">
                  Não encontramos funcionários com os filtros selecionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <Card key={employee.id} className="overflow-hidden">
                  <div className="flex items-center p-6 bg-muted/50">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mr-4">
                      {employee.profile_image ? (
                        <img 
                          src={employee.profile_image} 
                          alt={employee.full_name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{employee.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                      <Badge variant={
                        employee.status === "active" ? "outline" : 
                        employee.status === "inactive" ? "destructive" : 
                        "secondary"
                      }>
                        {translateStatus(employee.status)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{employee.department}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Contratado em {format(new Date(employee.hire_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                      {employee.division_name && (
                        <div className="flex items-center text-sm">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Divisão: {employee.division_name}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCurrentEmployee(employee);
                        setIsDialogOpen(true);
                      }}
                    >
                      Ver detalhes
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCurrentTimeOff({
                          id: "",
                          employee_id: employee.id,
                          start_date: new Date().toISOString(),
                          end_date: addDays(new Date(), 1).toISOString(),
                          type: "vacation",
                          status: "pending",
                          reason: "",
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          employee
                        });
                        setIsTimeOffDialogOpen(true);
                      }}
                    >
                      Registrar folga
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Folgas e Licenças */}
        <TabsContent value="time-off" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Solicitações de Folga e Licença</CardTitle>
                <CardDescription>
                  Gerencie as solicitações de folga e licença dos funcionários
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setCurrentTimeOff({
                    id: "",
                    employee_id: "",
                    start_date: new Date().toISOString(),
                    end_date: addDays(new Date(), 1).toISOString(),
                    type: "vacation",
                    status: "pending",
                    reason: "",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });
                  setIsTimeOffDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : timeOffRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
                  <p className="text-muted-foreground">
                    Não há solicitações de folga ou licença registradas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeOffRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center">
                          <div className="mr-4">
                            {request.status === "pending" ? (
                              <AlertCircle className="h-8 w-8 text-amber-500" />
                            ) : request.status === "approved" ? (
                              <CheckCircle className="h-8 w-8 text-green-500" />
                            ) : (
                              <XCircle className="h-8 w-8 text-red-500" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {request.employee?.full_name || "Funcionário"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {translateTimeOffType(request.type)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          request.status === "pending" ? "outline" : 
                          request.status === "approved" ? "default" : 
                          "destructive"
                        }>
                          {translateStatus(request.status)}
                        </Badge>
                      </div>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>De {format(new Date(request.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Até {format(new Date(request.end_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1} dias</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium">Motivo:</p>
                            <p className="text-sm">{request.reason}</p>
                          </div>
                          {request.notes && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Observações:</p>
                              <p className="text-sm">{request.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      {request.status === "pending" && hasPermission("hr.manage") && (
                        <CardFooter className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRejectTimeOff(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApproveTimeOff(request.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Departamentos */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Departamentos</CardTitle>
                <CardDescription>
                  Gerencie os departamentos da empresa
                </CardDescription>
              </div>
              {hasPermission("hr.manage") && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Departamento
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : departments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum departamento encontrado</h3>
                  <p className="text-muted-foreground">
                    Não há departamentos registrados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((department) => {
                    const manager = employees.find(e => e.id === department.manager_id);
                    const departmentEmployees = employees.filter(e => e.department === department.name);
                    
                    return (
                      <Card key={department.id}>
                        <CardHeader>
                          <CardTitle>{department.name}</CardTitle>
                          {manager && (
                            <CardDescription>
                              Gerente: {manager.full_name}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{departmentEmployees.length} funcionários</span>
                            </div>
                          </div>
                        </CardContent>
                        {hasPermission("hr.manage") && (
                          <CardFooter className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Cargos */}
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cargos</CardTitle>
                <CardDescription>
                  Gerencie os cargos da empresa
                </CardDescription>
              </div>
              {hasPermission("hr.manage") && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cargo
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : positions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum cargo encontrado</h3>
                  <p className="text-muted-foreground">
                    Não há cargos registrados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positions.map((position) => {
                    const positionEmployees = employees.filter(e => e.position === position.title);
                    
                    return (
                      <Card key={position.id}>
                        <CardHeader>
                          <CardTitle>{position.title}</CardTitle>
                          <CardDescription>
                            Departamento: {position.department_name || "Não especificado"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{positionEmployees.length} funcionários</span>
                            </div>
                            <div className="flex items-center text-sm">
                              {position.is_management ? (
                                <Badge variant="outline">Cargo de gestão</Badge>
                              ) : (
                                <Badge variant="outline">Nível {position.level}</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          {hasPermission("hr.manage") && (
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setCurrentPosition(position);
                              setIsTrainingDialogOpen(true);
                            }}
                          >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Treinamentos
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Treinamentos */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Requisitos de Treinamento</CardTitle>
                <CardDescription>
                  Gerencie os treinamentos obrigatórios por cargo
                </CardDescription>
              </div>
              <Button onClick={() => window.location.href = "/treinamento"}>
                <GraduationCap className="h-4 w-4 mr-2" />
                Ir para Universidade Corporativa
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : trainingRequirements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum requisito de treinamento encontrado</h3>
                  <p className="text-muted-foreground">
                    Não há requisitos de treinamento registrados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Agrupar por cargo */}
                  {positions.map((position) => {
                    const positionRequirements = trainingRequirements.filter(
                      req => req.position_id === position.id
                    );
                    
                    if (positionRequirements.length === 0) return null;
                    
                    return (
                      <Card key={position.id}>
                        <CardHeader>
                          <CardTitle>{position.title}</CardTitle>
                          <CardDescription>
                            {positionRequirements.length} treinamentos requeridos
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {positionRequirements.map((req) => (
                              <div key={req.id} className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{req.course_title}</h4>
                                  <div className="flex items-center mt-1">
                                    {req.is_mandatory ? (
                                      <Badge variant="default">Obrigatório</Badge>
                                    ) : (
                                      <Badge variant="outline">Recomendado</Badge>
                                    )}
                                    <span className="text-sm text-muted-foreground ml-2">
                                      Prazo: {req.deadline_days} dias após contratação
                                    </span>
                                  </div>
                                </div>
                                {hasPermission("hr.manage") && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRemoveTrainingRequirement(req.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        {hasPermission("hr.manage") && (
                          <CardFooter>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                setCurrentPosition(position);
                                setIsTrainingDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Treinamento
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Diálogo de Detalhes do Funcionário */}
      {currentEmployee && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Funcionário</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre {currentEmployee.full_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo</label>
                <p>{currentEmployee.full_name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <p>{currentEmployee.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cargo</label>
                <p>{currentEmployee.position}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento</label>
                <p>{currentEmployee.department}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Contratação</label>
                <p>{format(new Date(currentEmployee.hire_date), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Badge variant={
                  currentEmployee.status === "active" ? "outline" : 
                  currentEmployee.status === "inactive" ? "destructive" : 
                  "secondary"
                }>
                  {translateStatus(currentEmployee.status)}
                </Badge>
              </div>
              {currentEmployee.division_name && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Divisão</label>
                  <p>{currentEmployee.division_name}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Diálogo de Solicitação de Folga */}
      {currentTimeOff && (
        <Dialog open={isTimeOffDialogOpen} onOpenChange={setIsTimeOffDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {currentTimeOff.id ? "Detalhes da Solicitação" : "Nova Solicitação de Folga"}
              </DialogTitle>
              <DialogDescription>
                {currentTimeOff.id 
                  ? "Detalhes da solicitação de folga ou licença" 
                  : "Preencha os dados para solicitar folga ou licença"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {!currentTimeOff.employee_id && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Funcionário</label>
                  <Select 
                    value={currentTimeOff.employee_id} 
                    onValueChange={(value) => setCurrentTimeOff({
                      ...currentTimeOff,
                      employee_id: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Folga</label>
                <Select 
                  value={currentTimeOff.type} 
                  onValueChange={(value: any) => setCurrentTimeOff({
                    ...currentTimeOff,
                    type: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Férias</SelectItem>
                    <SelectItem value="sick_leave">Licença médica</SelectItem>
                    <SelectItem value="personal_leave">Licença pessoal</SelectItem>
                    <SelectItem value="maternity">Licença maternidade</SelectItem>
                    <SelectItem value="paternity">Licença paternidade</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Início</label>
                  <DatePicker 
                    date={new Date(currentTimeOff.start_date)} 
                    setDate={(date) => setCurrentTimeOff({
                      ...currentTimeOff,
                      start_date: date?.toISOString() || new Date().toISOString()
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Término</label>
                  <DatePicker 
                    date={new Date(currentTimeOff.end_date)} 
                    setDate={(date) => setCurrentTimeOff({
                      ...currentTimeOff,
                      end_date: date?.toISOString() || new Date().toISOString()
                    })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo</label>
                <Textarea 
                  placeholder="Descreva o motivo da solicitação"
                  value={currentTimeOff.reason}
                  onChange={(e) => setCurrentTimeOff({
                    ...currentTimeOff,
                    reason: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Textarea 
                  placeholder="Informações adicionais"
                  value={currentTimeOff.notes || ""}
                  onChange={(e) => setCurrentTimeOff({
                    ...currentTimeOff,
                    notes: e.target.value
                  })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTimeOffDialogOpen(false)}>
                Cancelar
              </Button>
              <Button>
                {currentTimeOff.id ? "Atualizar" : "Solicitar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Diálogo de Requisito de Treinamento */}
      {currentPosition && (
        <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Requisito de Treinamento</DialogTitle>
              <DialogDescription>
                Adicione um treinamento obrigatório para o cargo {currentPosition.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Curso</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Obrigatório</label>
                  <Switch />
                </div>
                <p className="text-xs text-muted-foreground">
                  Se marcado, o curso será obrigatório para todos os funcionários neste cargo.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Prazo para Conclusão (dias)</label>
                <Input type="number" min="1" defaultValue="30" />
                <p className="text-xs text-muted-foreground">
                  Número de dias após a contratação para concluir o treinamento.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTrainingDialogOpen(false)}>
                Cancelar
              </Button>
              <Button>
                Adicionar Requisito
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
