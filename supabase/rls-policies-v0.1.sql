-- ============================================
-- CJHIRASHI APP v0.1 - RLS POLICIES
-- Row Level Security Policies para tablas nuevas
-- ============================================
-- Fecha: 2025-11-21
-- Responsable: database-designer (Fase 3)
-- Stack: Supabase PostgreSQL + RLS
-- ============================================

-- ============================================
-- TABLA: agents
-- ============================================

-- Habilitar RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin full access
CREATE POLICY "Admin full access on agents" ON agents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Policy 2: Users read active agents
CREATE POLICY "Users read active agents" ON agents
  FOR SELECT
  USING (is_active = true);

-- ============================================
-- TABLA: agent_models
-- ============================================

-- Habilitar RLS
ALTER TABLE agent_models ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin full access
CREATE POLICY "Admin full access on agent_models" ON agent_models
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Policy 2: Users read models of active agents
CREATE POLICY "Users read active agent models" ON agent_models
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_models.agent_id
      AND agents.is_active = true
    )
  );

-- ============================================
-- TABLA: projects
-- ============================================

-- Habilitar RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users manage own projects
CREATE POLICY "Users manage own projects" ON projects
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 2: Admin read all projects
CREATE POLICY "Admin read all projects" ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- TABLA: conversations
-- ============================================

-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users manage own conversations
CREATE POLICY "Users manage own conversations" ON conversations
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 2: Admin read all conversations
CREATE POLICY "Admin read all conversations" ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- TABLA: corpora
-- ============================================

-- Habilitar RLS
ALTER TABLE corpora ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin full access
CREATE POLICY "Admin full access on corpora" ON corpora
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Policy 2: Users read global corpora
CREATE POLICY "Users read global corpora" ON corpora
  FOR SELECT
  USING (corpus_type = 'global' AND is_active = true);

-- Policy 3: Users manage own personal corpora
CREATE POLICY "Users manage own personal corpora" ON corpora
  FOR ALL
  USING (
    corpus_type = 'personal' AND owner_user_id = auth.uid()
  )
  WITH CHECK (
    corpus_type = 'personal' AND owner_user_id = auth.uid()
  );

-- ============================================
-- TABLA: agent_corpus_assignments
-- ============================================

-- Habilitar RLS
ALTER TABLE agent_corpus_assignments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin full access
CREATE POLICY "Admin full access on assignments" ON agent_corpus_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Policy 2: Users read assignments of accessible corpora
CREATE POLICY "Users read accessible assignments" ON agent_corpus_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = agent_corpus_assignments.corpus_id
      AND (
        corpora.corpus_type = 'global'
        OR corpora.owner_user_id = auth.uid()
      )
    )
  );

-- Policy 3: Users create assignments for own personal corpora
CREATE POLICY "Users create own personal assignments" ON agent_corpus_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = agent_corpus_assignments.corpus_id
      AND corpora.corpus_type = 'personal'
      AND corpora.owner_user_id = auth.uid()
    )
    AND assigned_by = auth.uid()
  );

-- Policy 4: Users delete assignments for own personal corpora
CREATE POLICY "Users delete own personal assignments" ON agent_corpus_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = agent_corpus_assignments.corpus_id
      AND corpora.corpus_type = 'personal'
      AND corpora.owner_user_id = auth.uid()
    )
  );

-- ============================================
-- TABLA: corpus_documents
-- ============================================

-- Habilitar RLS
ALTER TABLE corpus_documents ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin full access
CREATE POLICY "Admin full access on documents" ON corpus_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Policy 2: Users read documents of accessible corpora
CREATE POLICY "Users read accessible documents" ON corpus_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = corpus_documents.corpus_id
      AND (
        corpora.corpus_type = 'global'
        OR corpora.owner_user_id = auth.uid()
      )
    )
  );

-- Policy 3: Users manage documents of own corpora
CREATE POLICY "Users manage own corpus documents" ON corpus_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = corpus_documents.corpus_id
      AND corpora.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = corpus_documents.corpus_id
      AND corpora.owner_user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- ============================================
-- TABLA: embeddings
-- ============================================

-- Habilitar RLS
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin full access
CREATE POLICY "Admin full access on embeddings" ON embeddings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Policy 2: Users read embeddings of accessible corpora
CREATE POLICY "Users read accessible embeddings" ON embeddings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM corpora
      WHERE corpora.id = embeddings.corpus_id
      AND (
        corpora.corpus_type = 'global'
        OR corpora.owner_user_id = auth.uid()
      )
    )
  );

-- ============================================
-- TRIGGERS Y FUNCIONES
-- ============================================

-- Trigger 1: Validar asignación personal a agente permitido
CREATE OR REPLACE FUNCTION validate_personal_corpus_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es asignación personal, validar que agente permite corpus personal
  IF NEW.assignment_type = 'personal' THEN
    IF NOT EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = NEW.agent_id
      AND agents.allows_personal_corpus = true
    ) THEN
      RAISE EXCEPTION 'Agent does not allow personal corpus assignments';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_personal_assignment
  BEFORE INSERT OR UPDATE ON agent_corpus_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_personal_corpus_assignment();

-- Trigger 2: Auto-update timestamps (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas con updated_at
CREATE TRIGGER trigger_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_corpora_updated_at
  BEFORE UPDATE ON corpora
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_corpus_documents_updated_at
  BEFORE UPDATE ON corpus_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CONSTRAINT DE NEGOCIO - Corpus Personal
-- ============================================

-- Constraint: Personal corpus DEBE tener owner_user_id
ALTER TABLE corpora
  ADD CONSTRAINT check_personal_has_owner
  CHECK (
    (corpus_type = 'global' AND owner_user_id IS NULL) OR
    (corpus_type = 'personal' AND owner_user_id IS NOT NULL)
  );

-- ============================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE agents IS 'Agentes inteligentes configurables por admin. RLS: Admin full access, users read active agents.';
COMMENT ON TABLE agent_models IS 'Modelos de LLM por agente (3 tiers: economy, balanced, premium). RLS: Admin full access, users read models of active agents.';
COMMENT ON TABLE projects IS 'Proyectos personales por usuario. RLS: Users manage own projects, admin read all.';
COMMENT ON TABLE conversations IS 'Historial de conversaciones con agentes. RLS: Users manage own conversations, admin read all.';
COMMENT ON TABLE corpora IS 'Corpus de conocimiento (Global + Personal). RLS: Complex policies for global vs personal corpus.';
COMMENT ON TABLE agent_corpus_assignments IS 'Asignación de corpus a agentes. RLS: Admin full access, users read accessible assignments.';
COMMENT ON TABLE corpus_documents IS 'Documentos dentro de un corpus. RLS: Users manage documents of own corpora, admin full access.';
COMMENT ON TABLE embeddings IS 'Embeddings de chunks (referencia a Qdrant). RLS: Users read embeddings of accessible corpora, admin full access.';

-- ============================================
-- FIN DE MIGRATIONS RLS
-- ============================================
