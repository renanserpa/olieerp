"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  BookOpen, 
  GraduationCap, 
  Clock, 
  BarChart, 
  Award, 
  ChevronRight,
  Filter,
  Loader2
} from "lucide-react";

// Tipos
interface Course {
  id: string;
  title: string;
  description: string;
  hours_duration: number;
  level: 'basic' | 'intermediate' | 'advanced';
  category: string;
  status: 'draft' | 'published' | 'archived';
  cover_image: string | null;
  created_at: string;
  division_id: string | null;
  division_name?: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrollment_date: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  progress_percentage: number;
  completion_date: string | null;
}

interface Certificate {
  id: string;
  course_id: string;
  user_id: string;
  issue_date: string;
  validation_code: string;
  status: 'valid' | 'revoked';
}

// Componente principal
export default function TrainingPage() {
  const supabase = createClient();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("available");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<(Enrollment & { course: Course })[]>([]);
  const [certificates, setCertificates] = useState<(Certificate & { course: Course })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  
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
        case "available":
          await fetchAvailableCourses();
          break;
        case "my-courses":
          await fetchMyEnrollments();
          break;
        case "certificates":
          await fetchMyCertificates();
          break;
        case "dashboard":
          await fetchMyEnrollments();
          break;
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error);
      toast.error(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar cursos disponíveis
  const fetchAvailableCourses = async () => {
    let query = supabase
      .from("courses")
      .select(`
        *,
        divisions(name)
      `)
      .eq("status", "published");
      
    // Aplicar filtros
    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }
    
    if (categoryFilter) {
      query = query.eq("category", categoryFilter);
    }
    
    if (levelFilter) {
      query = query.eq("level", levelFilter);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Formatar dados
    const formattedCourses = data?.map(course => ({
      ...course,
      division_name: course.divisions?.name
    })) || [];
    
    setCourses(formattedCourses);
    
    // Extrair categorias únicas para filtro
    const uniqueCategories = [...new Set(formattedCourses.map(c => c.category))];
    setCategories(uniqueCategories);
  };
  
  // Buscar minhas matrículas
  const fetchMyEnrollments = async () => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        course:courses(
          *,
          divisions(name)
        )
      `)
      .eq("user_id", user?.id)
      .order("enrollment_date", { ascending: false });
      
    if (error) throw error;
    
    // Formatar dados
    const formattedEnrollments = data?.map(enrollment => ({
      ...enrollment,
      course: {
        ...enrollment.course,
        division_name: enrollment.course.divisions?.name
      }
    })) || [];
    
    setEnrollments(formattedEnrollments);
  };
  
  // Buscar meus certificados
  const fetchMyCertificates = async () => {
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        course:courses(
          *,
          divisions(name)
        )
      `)
      .eq("user_id", user?.id)
      .eq("status", "valid")
      .order("issue_date", { ascending: false });
      
    if (error) throw error;
    
    // Formatar dados
    const formattedCertificates = data?.map(certificate => ({
      ...certificate,
      course: {
        ...certificate.course,
        division_name: certificate.course.divisions?.name
      }
    })) || [];
    
    setCertificates(formattedCertificates);
  };
  
  // Matricular em um curso
  const handleEnroll = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          course_id: courseId,
          user_id: user?.id,
          status: "in_progress",
          progress_percentage: 0
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success("Matrícula realizada com sucesso!");
      setActiveTab("my-courses");
    } catch (error: any) {
      console.error("Erro ao realizar matrícula:", error);
      toast.error(`Erro ao realizar matrícula: ${error.message}`);
    }
  };
  
  // Continuar curso
  const handleContinueCourse = (enrollmentId: string, courseId: string) => {
    window.location.href = `/treinamento/curso/${courseId}?enrollment=${enrollmentId}`;
  };
  
  // Visualizar certificado
  const handleViewCertificate = (certificateId: string) => {
    window.location.href = `/treinamento/certificado/${certificateId}`;
  };
  
  // Aplicar filtros
  const handleApplyFilters = () => {
    fetchAvailableCourses();
  };
  
  // Limpar filtros
  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setLevelFilter("");
    fetchAvailableCourses();
  };
  
  // Traduzir nível
  const translateLevel = (level: string) => {
    switch (level) {
      case "basic": return "Básico";
      case "intermediate": return "Intermediário";
      case "advanced": return "Avançado";
      default: return level;
    }
  };
  
  // Renderizar componente
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Universidade Corporativa</h1>
          <p className="text-muted-foreground">
            Aprimore suas habilidades e conhecimentos com nossos cursos.
          </p>
        </div>
        
        {hasPermission("training.manage") && (
          <Button onClick={() => window.location.href = "/treinamento/admin"}>
            Gerenciar Cursos
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Cursos Disponíveis
          </TabsTrigger>
          <TabsTrigger value="my-courses" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Meus Cursos
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificados
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>
        
        {/* Cursos Disponíveis */}
        <TabsContent value="available" className="space-y-4">
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
                      placeholder="Nome do curso..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nível</label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os níveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os níveis</SelectItem>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
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
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum curso encontrado</h3>
                <p className="text-muted-foreground">
                  Não encontramos cursos com os filtros selecionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  {course.cover_image && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={course.cover_image} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{course.title}</CardTitle>
                      <Badge variant={
                        course.level === "basic" ? "outline" : 
                        course.level === "intermediate" ? "secondary" : 
                        "default"
                      }>
                        {translateLevel(course.level)}
                      </Badge>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {course.hours_duration} horas
                        </span>
                        <span className="text-muted-foreground">
                          {course.category}
                        </span>
                      </div>
                      {course.division_name && (
                        <div className="text-sm text-muted-foreground">
                          Divisão: {course.division_name}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleEnroll(course.id)} 
                      className="w-full"
                    >
                      Matricular-se
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Meus Cursos */}
        <TabsContent value="my-courses" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : enrollments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum curso em andamento</h3>
                <p className="text-muted-foreground">
                  Você ainda não está matriculado em nenhum curso.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab("available")}
                >
                  Ver cursos disponíveis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{enrollment.course.title}</CardTitle>
                      <Badge variant={
                        enrollment.status === "completed" ? "success" : 
                        enrollment.status === "in_progress" ? "default" : 
                        "destructive"
                      }>
                        {enrollment.status === "completed" ? "Concluído" : 
                         enrollment.status === "in_progress" ? "Em andamento" : 
                         "Abandonado"}
                      </Badge>
                    </div>
                    <CardDescription>{enrollment.course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Matrícula: {format(new Date(enrollment.enrollment_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-muted-foreground">
                          {enrollment.course.category}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progresso</span>
                          <span>{enrollment.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleContinueCourse(enrollment.id, enrollment.course_id)} 
                      className="w-full"
                      variant={enrollment.status === "completed" ? "outline" : "default"}
                    >
                      {enrollment.status === "completed" ? "Revisar curso" : "Continuar curso"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Certificados */}
        <TabsContent value="certificates" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : certificates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum certificado encontrado</h3>
                <p className="text-muted-foreground">
                  Complete cursos para obter certificados.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab("my-courses")}
                >
                  Ver meus cursos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((certificate) => (
                <Card key={certificate.id} className="overflow-hidden">
                  <div className="bg-primary/10 p-6 flex justify-center">
                    <Award className="h-16 w-16 text-primary" />
                  </div>
                  <CardHeader>
                    <CardTitle>{certificate.course.title}</CardTitle>
                    <CardDescription>
                      Emitido em {format(new Date(certificate.issue_date), "dd/MM/yyyy", { locale: ptBR })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Código de validação:</span> {certificate.validation_code}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {certificate.course.category} • {translateLevel(certificate.course.level)}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handleViewCertificate(certificate.id)} 
                      className="w-full"
                    >
                      Visualizar Certificado
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enrollments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {enrollments.filter(e => e.status === "completed").length} concluídos
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {enrollments.length > 0 
                    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Em todos os cursos
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Certificados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{certificates.length}</div>
                <p className="text-xs text-muted-foreground">
                  Emitidos até o momento
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Progresso por Curso</CardTitle>
              <CardDescription>
                Acompanhe seu progresso em cada curso matriculado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Você ainda não está matriculado em nenhum curso.
                </p>
              ) : (
                <div className="space-y-6">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{enrollment.course.title}</h4>
                          <p className="text-sm text-muted-foreground">{enrollment.course.category}</p>
                        </div>
                        <Badge variant={
                          enrollment.status === "completed" ? "success" : 
                          enrollment.status === "in_progress" ? "default" : 
                          "destructive"
                        }>
                          {enrollment.progress_percentage}%
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            enrollment.status === "completed" ? "bg-green-500" : 
                            enrollment.status === "in_progress" ? "bg-primary" : 
                            "bg-red-500"
                          }`}
                          style={{ width: `${enrollment.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
