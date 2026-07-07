-- MedFlow-IA: infraestrutura Captura Inteligente (MEDICFLOW-INTELLIGENT-CAPTURE-02)
-- Storage bucket clinical-documents + tabelas capture_* + RLS multi-tenant
-- Sem OCR, Azure, GPT Vision ou Tesseract — apenas fundação.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'capture_session_status') THEN
    CREATE TYPE public.capture_session_status AS ENUM (
      'CREATED',
      'UPLOADED',
      'PREPROCESSING',
      'OCR_PENDING',
      'OCR_COMPLETED',
      'PARSING',
      'AUDITING',
      'REVIEW',
      'APPROVED',
      'ARCHIVED'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'capture_channel') THEN
    CREATE TYPE public.capture_channel AS ENUM (
      'mobile_camera',
      'file_upload',
      'scanner_folder',
      'api_ingest'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'capture_finding_severity') THEN
    CREATE TYPE public.capture_finding_severity AS ENUM (
      'info',
      'low',
      'medium',
      'high',
      'critical'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'capture_finding_status') THEN
    CREATE TYPE public.capture_finding_status AS ENUM (
      'open',
      'resolved',
      'dismissed'
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- capture_sessions — orquestração do pipeline
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capture_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  status public.capture_session_status NOT NULL DEFAULT 'CREATED',
  channel public.capture_channel NOT NULL DEFAULT 'file_upload',
  correlation_id text,
  target_entity_type text,
  target_entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  status_history jsonb NOT NULL DEFAULT '[]',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capture_sessions_target_chk CHECK (
    target_entity_type IS NULL
    OR target_entity_type IN ('tiss_guide', 'authorization', 'beneficiary')
  ),
  CONSTRAINT capture_sessions_correlation_len_chk CHECK (
    correlation_id IS NULL OR char_length(correlation_id) <= 128
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS capture_sessions_tenant_id_id_uidx
  ON public.capture_sessions (tenant_id, id);

CREATE INDEX IF NOT EXISTS capture_sessions_tenant_status_idx
  ON public.capture_sessions (tenant_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS capture_sessions_correlation_idx
  ON public.capture_sessions (tenant_id, correlation_id)
  WHERE correlation_id IS NOT NULL;

COMMENT ON TABLE public.capture_sessions IS
  'Sessões de captura inteligente — state machine CREATED → ARCHIVED.';

-- ---------------------------------------------------------------------------
-- capture_documents — metadados de arquivos no bucket clinical-documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capture_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  byte_length integer NOT NULL,
  checksum_sha256 text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'clinical-documents',
  storage_path_original text NOT NULL,
  storage_path_processed text,
  storage_path_thumbnail text,
  storage_path_audit text,
  page_count integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capture_documents_session_fk
    FOREIGN KEY (tenant_id, session_id)
    REFERENCES public.capture_sessions (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT capture_documents_byte_length_chk CHECK (byte_length > 0),
  CONSTRAINT capture_documents_checksum_chk CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT capture_documents_mime_chk CHECK (
    mime_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff'
    )
  ),
  CONSTRAINT capture_documents_storage_bucket_chk CHECK (storage_bucket = 'clinical-documents')
);

CREATE UNIQUE INDEX IF NOT EXISTS capture_documents_tenant_id_id_uidx
  ON public.capture_documents (tenant_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS capture_documents_storage_path_uidx
  ON public.capture_documents (storage_bucket, storage_path_original);

CREATE INDEX IF NOT EXISTS capture_documents_session_idx
  ON public.capture_documents (tenant_id, session_id)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- capture_pages — páginas individuais (multi-page PDF)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capture_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  document_id uuid NOT NULL,
  page_number integer NOT NULL,
  storage_path_original text,
  storage_path_processed text,
  storage_path_thumbnail text,
  width_px integer,
  height_px integer,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capture_pages_session_fk
    FOREIGN KEY (tenant_id, session_id)
    REFERENCES public.capture_sessions (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT capture_pages_document_fk
    FOREIGN KEY (tenant_id, document_id)
    REFERENCES public.capture_documents (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT capture_pages_page_number_chk CHECK (page_number > 0),
  CONSTRAINT capture_pages_unique_page_uidx UNIQUE (tenant_id, document_id, page_number)
);

CREATE INDEX IF NOT EXISTS capture_pages_session_idx
  ON public.capture_pages (tenant_id, session_id);

-- ---------------------------------------------------------------------------
-- capture_fields — campos extraídos (estrutura para OCR futuro)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capture_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  page_id uuid,
  field_key text NOT NULL,
  field_value text,
  confidence numeric(5, 4),
  bbox jsonb,
  source text NOT NULL DEFAULT 'manual',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capture_fields_session_fk
    FOREIGN KEY (tenant_id, session_id)
    REFERENCES public.capture_sessions (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT capture_fields_page_fk
    FOREIGN KEY (tenant_id, page_id)
    REFERENCES public.capture_pages (tenant_id, id)
    ON DELETE SET NULL,
  CONSTRAINT capture_fields_confidence_chk CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
  )
);

CREATE INDEX IF NOT EXISTS capture_fields_session_idx
  ON public.capture_fields (tenant_id, session_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS capture_fields_key_idx
  ON public.capture_fields (tenant_id, session_id, field_key)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- capture_findings — achados de auditoria preventiva
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capture_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  rule_code text NOT NULL,
  severity public.capture_finding_severity NOT NULL DEFAULT 'medium',
  status public.capture_finding_status NOT NULL DEFAULT 'open',
  message text NOT NULL,
  field_key text,
  suggested_correction text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  resolved_by uuid REFERENCES public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capture_findings_session_fk
    FOREIGN KEY (tenant_id, session_id)
    REFERENCES public.capture_sessions (tenant_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS capture_findings_session_idx
  ON public.capture_findings (tenant_id, session_id, status);

-- ---------------------------------------------------------------------------
-- capture_corrections — correções do usuário (learning loop futuro)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capture_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  field_id uuid,
  original_value text,
  corrected_value text NOT NULL,
  correction_reason text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capture_corrections_session_fk
    FOREIGN KEY (tenant_id, session_id)
    REFERENCES public.capture_sessions (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT capture_corrections_field_fk
    FOREIGN KEY (tenant_id, field_id)
    REFERENCES public.capture_fields (tenant_id, id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS capture_corrections_session_idx
  ON public.capture_corrections (tenant_id, session_id);

-- ---------------------------------------------------------------------------
-- capture_templates — templates de parser por operadora/tipo de guia
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.capture_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  template_key text NOT NULL,
  guide_type text,
  field_mappings jsonb NOT NULL DEFAULT '{}',
  version text NOT NULL DEFAULT 'v1',
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  updated_by uuid REFERENCES public.profiles (id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capture_templates_key_version_uidx UNIQUE (tenant_id, template_key, version)
);

CREATE INDEX IF NOT EXISTS capture_templates_active_idx
  ON public.capture_templates (tenant_id, active)
  WHERE deleted_at IS NULL AND active;

-- ---------------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_sessions_updated_at ON public.capture_sessions;
CREATE TRIGGER capture_sessions_updated_at
  BEFORE UPDATE ON public.capture_sessions
  FOR EACH ROW EXECUTE FUNCTION public.capture_set_updated_at();

DROP TRIGGER IF EXISTS capture_documents_updated_at ON public.capture_documents;
CREATE TRIGGER capture_documents_updated_at
  BEFORE UPDATE ON public.capture_documents
  FOR EACH ROW EXECUTE FUNCTION public.capture_set_updated_at();

DROP TRIGGER IF EXISTS capture_pages_updated_at ON public.capture_pages;
CREATE TRIGGER capture_pages_updated_at
  BEFORE UPDATE ON public.capture_pages
  FOR EACH ROW EXECUTE FUNCTION public.capture_set_updated_at();

DROP TRIGGER IF EXISTS capture_fields_updated_at ON public.capture_fields;
CREATE TRIGGER capture_fields_updated_at
  BEFORE UPDATE ON public.capture_fields
  FOR EACH ROW EXECUTE FUNCTION public.capture_set_updated_at();

DROP TRIGGER IF EXISTS capture_findings_updated_at ON public.capture_findings;
CREATE TRIGGER capture_findings_updated_at
  BEFORE UPDATE ON public.capture_findings
  FOR EACH ROW EXECUTE FUNCTION public.capture_set_updated_at();

DROP TRIGGER IF EXISTS capture_templates_updated_at ON public.capture_templates;
CREATE TRIGGER capture_templates_updated_at
  BEFORE UPDATE ON public.capture_templates
  FOR EACH ROW EXECUTE FUNCTION public.capture_set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket clinical-documents (privado)
-- Estrutura: {tenant_id}/{capture_id}/original|processed|thumbnail|audit/
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-documents',
  'clinical-documents',
  false,
  26214400,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS clinical_documents_select_tenant ON storage.objects;
DROP POLICY IF EXISTS clinical_documents_insert_billing ON storage.objects;
DROP POLICY IF EXISTS clinical_documents_update_billing ON storage.objects;
DROP POLICY IF EXISTS clinical_documents_delete_restricted ON storage.objects;

CREATE POLICY clinical_documents_select_tenant
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'clinical-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM public.tenants t
      WHERE t.id IN (SELECT public.current_tenant_ids())
    )
  );

CREATE POLICY clinical_documents_insert_billing
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clinical-documents'
    AND public.can_manage_billing()
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM public.tenants t
      WHERE t.id IN (SELECT public.current_tenant_ids())
    )
  );

CREATE POLICY clinical_documents_update_billing
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'clinical-documents'
    AND public.can_manage_billing()
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM public.tenants t
      WHERE t.id IN (SELECT public.current_tenant_ids())
    )
  )
  WITH CHECK (
    bucket_id = 'clinical-documents'
    AND public.can_manage_billing()
    AND (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM public.tenants t
      WHERE t.id IN (SELECT public.current_tenant_ids())
    )
  );

-- Purge via service role apenas — client DELETE negado
CREATE POLICY clinical_documents_delete_restricted
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- RLS — tabelas capture_*
-- ---------------------------------------------------------------------------
ALTER TABLE public.capture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_templates ENABLE ROW LEVEL SECURITY;

-- capture_sessions
CREATE POLICY capture_sessions_select_tenant
  ON public.capture_sessions FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY capture_sessions_insert_billing
  ON public.capture_sessions FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

CREATE POLICY capture_sessions_update_billing
  ON public.capture_sessions FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );

-- capture_documents
CREATE POLICY capture_documents_select_tenant
  ON public.capture_documents FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY capture_documents_insert_billing
  ON public.capture_documents FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

CREATE POLICY capture_documents_update_billing
  ON public.capture_documents FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );

-- capture_pages
CREATE POLICY capture_pages_select_tenant
  ON public.capture_pages FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY capture_pages_insert_billing
  ON public.capture_pages FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

CREATE POLICY capture_pages_update_billing
  ON public.capture_pages FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );

-- capture_fields
CREATE POLICY capture_fields_select_tenant
  ON public.capture_fields FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY capture_fields_insert_billing
  ON public.capture_fields FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

CREATE POLICY capture_fields_update_billing
  ON public.capture_fields FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );

-- capture_findings
CREATE POLICY capture_findings_select_tenant
  ON public.capture_findings FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY capture_findings_insert_billing
  ON public.capture_findings FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

CREATE POLICY capture_findings_update_billing
  ON public.capture_findings FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );

-- capture_corrections
CREATE POLICY capture_corrections_select_tenant
  ON public.capture_corrections FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY capture_corrections_insert_billing
  ON public.capture_corrections FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

-- capture_templates
CREATE POLICY capture_templates_select_tenant
  ON public.capture_templates FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND deleted_at IS NULL
  );

CREATE POLICY capture_templates_insert_billing
  ON public.capture_templates FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

CREATE POLICY capture_templates_update_billing
  ON public.capture_templates FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );
