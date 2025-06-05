-- Schema para o Módulo de Treinamento/Universidade Corporativa

-- Tabela de Cursos
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  hours_duration INTEGER NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('basic', 'intermediate', 'advanced')),
  category VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  cover_image VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  division_id UUID REFERENCES divisions(id)
);

-- Tabela de Módulos
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Aulas
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'text', 'quiz', 'file')),
  content TEXT,
  file_url VARCHAR(255),
  video_url VARCHAR(255),
  estimated_minutes INTEGER,
  order_index INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Matrículas
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  progress_percentage INTEGER DEFAULT 0,
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- Tabela de Progresso de Aulas
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  time_spent_minutes INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Tabela de Avaliações
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  minimum_passing_grade NUMERIC(5,2) NOT NULL,
  time_limit_minutes INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Questões
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'essay')),
  options JSONB,
  correct_answer TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Resultados de Avaliações
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  time_spent_minutes INTEGER,
  status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed')),
  answers JSONB,
  completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Certificados
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validation_code VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_division ON courses(division_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_validation_code ON certificates(validation_code);

-- Funções e Triggers

-- Função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_assessment_results_updated_at BEFORE UPDATE ON assessment_results FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Função para calcular o progresso do curso
CREATE OR REPLACE FUNCTION calculate_course_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress INTEGER;
BEGIN
    -- Contar total de aulas do curso
    SELECT COUNT(l.id) INTO total_lessons
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.course_id = (
        SELECT m2.course_id 
        FROM modules m2 
        JOIN lessons l2 ON l2.module_id = m2.id 
        WHERE l2.id = NEW.lesson_id
    );
    
    -- Contar aulas completadas
    SELECT COUNT(lp.id) INTO completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    WHERE lp.enrollment_id = NEW.enrollment_id
    AND lp.status = 'completed'
    AND m.course_id = (
        SELECT m2.course_id 
        FROM modules m2 
        JOIN lessons l2 ON l2.module_id = m2.id 
        WHERE l2.id = NEW.lesson_id
    );
    
    -- Calcular progresso
    IF total_lessons > 0 THEN
        progress := (completed_lessons * 100) / total_lessons;
    ELSE
        progress := 0;
    END IF;
    
    -- Atualizar progresso na matrícula
    UPDATE enrollments
    SET progress_percentage = progress,
        status = CASE 
                    WHEN progress = 100 THEN 'completed'
                    ELSE 'in_progress'
                 END,
        completion_date = CASE 
                            WHEN progress = 100 THEN NOW()
                            ELSE completion_date
                          END
    WHERE id = NEW.enrollment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso do curso quando uma aula é concluída
CREATE TRIGGER update_course_progress
AFTER INSERT OR UPDATE OF status ON lesson_progress
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE PROCEDURE calculate_course_progress();

-- Função para gerar código de validação para certificados
CREATE OR REPLACE FUNCTION generate_validation_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.validation_code = UPPER(
        SUBSTRING(MD5(NEW.user_id::text || NEW.course_id::text || NOW()::text) FOR 8) || '-' ||
        SUBSTRING(MD5(NEW.course_id::text || NOW()::text) FOR 4) || '-' ||
        SUBSTRING(MD5(NEW.user_id::text || NOW()::text) FOR 4)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código de validação para certificados
CREATE TRIGGER generate_certificate_validation_code
BEFORE INSERT ON certificates
FOR EACH ROW
EXECUTE PROCEDURE generate_validation_code();

-- Políticas de segurança RLS (Row Level Security)

-- Habilitar RLS para todas as tabelas
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Políticas para cursos
CREATE POLICY courses_view_policy ON courses
    FOR SELECT
    USING (
        status = 'published' OR 
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );

CREATE POLICY courses_insert_policy ON courses
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );

CREATE POLICY courses_update_policy ON courses
    FOR UPDATE
    USING (
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );

CREATE POLICY courses_delete_policy ON courses
    FOR DELETE
    USING (
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );

-- Políticas para matrículas
CREATE POLICY enrollments_view_policy ON enrollments
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );

CREATE POLICY enrollments_insert_policy ON enrollments
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );

-- Políticas para progresso de aulas
CREATE POLICY lesson_progress_view_policy ON lesson_progress
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.id = lesson_progress.enrollment_id 
            AND enrollments.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );

CREATE POLICY lesson_progress_insert_policy ON lesson_progress
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.id = lesson_progress.enrollment_id 
            AND enrollments.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );

-- Políticas para certificados
CREATE POLICY certificates_view_policy ON certificates
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        status = 'valid' OR
        EXISTS (SELECT 1 FROM user_permissions WHERE user_id = auth.uid() AND permission = 'training.manage')
    );
