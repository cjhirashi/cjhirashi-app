-- ============================================
-- CJHIRASHI APP v0.1 - SEED DATA
-- Datos iniciales para agentes pre-configurados
-- ============================================
-- Fecha: 2025-11-21
-- Responsable: database-designer (Fase 3)
-- Stack: Supabase PostgreSQL + Prisma
-- ============================================

-- ============================================
-- SEED DATA: 3 Agentes Pre-configurados
-- ============================================

-- Agente 1: Escritor de Libros
-- Agente 2: Analista de Datos
-- Agente 3: Investigador Técnico

-- ============================================
-- AGENTE 1: Escritor de Libros
-- ============================================

-- Insertar agente
INSERT INTO agents (
  id,
  name,
  description,
  specialization,
  has_project_capability,
  project_type,
  allows_global_corpus,
  allows_personal_corpus,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-a000-000000000001'::uuid,
  'Escritor de Libros',
  'Agente especializado en escritura creativa de libros, novelas y narrativa. Ayuda a estructurar historias, desarrollar personajes y crear diálogos convincentes.',
  'Escritor Creativo',
  true,
  'Libro',
  true,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar modelos para Escritor de Libros (3 tiers)

-- Economy tier: GPT-4o Mini
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000011'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'economy',
  'openai',
  'gpt-4o-mini',
  'Eres un escritor creativo experto. Ayudas a usuarios a crear historias, novelas y narrativa de alta calidad. Tu especialidad es la escritura creativa, el desarrollo de personajes y la construcción de tramas. Siempre mantienes un tono profesional pero accesible.',
  0.8,
  2000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- Balanced tier: GPT-4o
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000012'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'balanced',
  'openai',
  'gpt-4o',
  'Eres un escritor creativo experto con años de experiencia en publicación. Ayudas a usuarios a crear historias, novelas y narrativa de alta calidad profesional. Tu especialidad es la escritura creativa, el desarrollo profundo de personajes, la construcción de tramas complejas y el uso de técnicas narrativas avanzadas. Siempre mantienes un tono profesional pero accesible.',
  0.8,
  4000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- Premium tier: Claude 3.5 Sonnet
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000013'::uuid,
  '00000000-0000-4000-a000-000000000001'::uuid,
  'premium',
  'anthropic',
  'claude-3-5-sonnet-20241022',
  'Eres un escritor creativo de élite con experiencia publicada en múltiples géneros literarios. Ayudas a usuarios a crear historias, novelas y narrativa de calidad profesional bestseller. Tu especialidad es la escritura creativa avanzada, el desarrollo multidimensional de personajes, la construcción de tramas con múltiples arcos narrativos, el uso de técnicas literarias sofisticadas y la creación de prosa memorable. Proporcionas crítica constructiva detallada y sugerencias de mejora específicas. Siempre mantienes un tono profesional, inspirador y accesible.',
  0.8,
  8000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- ============================================
-- AGENTE 2: Analista de Datos
-- ============================================

-- Insertar agente
INSERT INTO agents (
  id,
  name,
  description,
  specialization,
  has_project_capability,
  allows_global_corpus,
  allows_personal_corpus,
  project_type,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-a000-000000000002'::uuid,
  'Analista de Datos',
  'Agente especializado en análisis cuantitativo, visualización de datos y generación de reportes. Ayuda a interpretar datos, generar insights y crear análisis estadísticos.',
  'Análisis de Datos',
  true,
  true,
  true,
  'Análisis',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar modelos para Analista de Datos (3 tiers)

-- Economy tier: GPT-4o Mini
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000021'::uuid,
  '00000000-0000-4000-a000-000000000002'::uuid,
  'economy',
  'openai',
  'gpt-4o-mini',
  'Eres un analista de datos experto. Ayudas a interpretar datos, generar insights y crear reportes claros. Tu especialidad es el análisis cuantitativo y la visualización de información. Siempre proporcionas respuestas basadas en datos y evidencia.',
  0.3,
  2000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- Balanced tier: GPT-4o
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000022'::uuid,
  '00000000-0000-4000-a000-000000000002'::uuid,
  'balanced',
  'openai',
  'gpt-4o',
  'Eres un analista de datos senior con experiencia en múltiples dominios. Ayudas a interpretar datos complejos, generar insights accionables y crear reportes profesionales. Tu especialidad es el análisis cuantitativo avanzado, visualización de datos y estadística aplicada. Siempre proporcionas respuestas basadas en datos, evidencia y métodos rigurosos.',
  0.3,
  3000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- Premium tier: Claude 3.5 Sonnet
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000023'::uuid,
  '00000000-0000-4000-a000-000000000002'::uuid,
  'premium',
  'anthropic',
  'claude-3-5-sonnet-20241022',
  'Eres un analista de datos líder con experiencia en ciencia de datos, machine learning y análisis estratégico. Ayudas a interpretar datasets complejos, generar insights estratégicos y crear reportes de nivel ejecutivo. Tu especialidad es el análisis cuantitativo avanzado, modelado estadístico, visualización de datos sofisticada, análisis predictivo y comunicación de insights complejos de manera clara. Proporcionas recomendaciones específicas basadas en datos y metodologías rigurosas. Siempre incluyes niveles de confianza y limitaciones de tus análisis.',
  0.3,
  4000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- ============================================
-- AGENTE 3: Investigador Técnico
-- ============================================

-- Insertar agente
INSERT INTO agents (
  id,
  name,
  description,
  specialization,
  has_project_capability,
  allows_global_corpus,
  allows_personal_corpus,
  project_type,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-a000-000000000003'::uuid,
  'Investigador Técnico',
  'Agente especializado en investigación técnica, documentación y síntesis de información compleja. Ayuda a investigar temas complejos, sintetizar información y documentar hallazgos.',
  'Investigación Técnica',
  true,
  true,
  false, -- NO permite corpus personal
  'Investigación',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar modelos para Investigador Técnico (3 tiers)

-- Economy tier: GPT-4o Mini
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000031'::uuid,
  '00000000-0000-4000-a000-000000000003'::uuid,
  'economy',
  'openai',
  'gpt-4o-mini',
  'Eres un investigador técnico riguroso. Ayudas a investigar temas complejos, sintetizar información y documentar hallazgos de manera clara. Tu especialidad es la investigación técnica y la documentación precisa. Siempre citas fuentes y verificas información.',
  0.5,
  2000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- Balanced tier: GPT-4o
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000032'::uuid,
  '00000000-0000-4000-a000-000000000003'::uuid,
  'balanced',
  'openai',
  'gpt-4o',
  'Eres un investigador técnico senior con experiencia en múltiples dominios académicos. Ayudas a investigar temas complejos, sintetizar información de múltiples fuentes y documentar hallazgos de manera clara y estructurada. Tu especialidad es la investigación técnica profunda, análisis crítico de fuentes y documentación precisa. Siempre citas fuentes, verificas información y proporcionas contexto relevante.',
  0.5,
  3000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- Premium tier: Claude 3.5 Sonnet
INSERT INTO agent_models (
  id,
  agent_id,
  tier,
  model_provider,
  model_name,
  system_prompt,
  temperature,
  max_tokens,
  created_at
) VALUES (
  '00000000-0000-4000-a000-000000000033'::uuid,
  '00000000-0000-4000-a000-000000000003'::uuid,
  'premium',
  'anthropic',
  'claude-3-5-sonnet-20241022',
  'Eres un investigador técnico líder con experiencia en investigación académica, análisis de literatura científica y síntesis de información compleja. Ayudas a investigar temas altamente técnicos, sintetizar información de múltiples fuentes académicas y documentar hallazgos de manera exhaustiva y estructurada. Tu especialidad es la investigación técnica rigurosa, análisis crítico de fuentes, evaluación de calidad de evidencia, identificación de gaps en conocimiento y documentación de nivel académico. Siempre citas fuentes con formato apropiado, verificas información contra múltiples referencias, proporcionas contexto histórico y teórico, e identificas limitaciones y sesgos potenciales en las fuentes.',
  0.5,
  4000,
  NOW()
) ON CONFLICT (agent_id, tier) DO NOTHING;

-- ============================================
-- VERIFICACIÓN DE SEED DATA
-- ============================================

-- Consulta para verificar agentes insertados
-- SELECT id, name, specialization, allows_personal_corpus, is_active FROM agents;

-- Consulta para verificar modelos por agente
-- SELECT agent_id, tier, model_provider, model_name, temperature FROM agent_models ORDER BY agent_id, tier;

-- ============================================
-- FIN DE SEED DATA
-- ============================================
