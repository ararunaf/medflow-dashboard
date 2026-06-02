-- MedFlow-IA: schema inicial multi-tenant + RLS
-- Aplicar no Supabase: SQL Editor ou `supabase db push`

-- ---------------------------------------------------------------------------
-- Extensões
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles de aplicação
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'super_admin',
      'tenant_admin',
      'coordinator',
      'professional',
      'financial'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE RESTRICT,
  full_name text NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'professional',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_tenant_id_idx ON public.profiles (tenant_id);

-- ---------------------------------------------------------------------------
-- Hospitais (escopo tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hospitals_tenant_id_idx ON public.hospitals (tenant_id);

-- ---------------------------------------------------------------------------
-- Profissionais
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  specialty text NOT NULL DEFAULT '',
  crm text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, profile_id)
);

CREATE INDEX IF NOT EXISTS professionals_tenant_id_idx ON public.professionals (tenant_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Tenant(s) do usuário autenticado (1 perfil = 1 tenant nesta fase)
CREATE OR REPLACE FUNCTION public.current_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p.tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_tenant_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_ids() TO authenticated;

-- Diretório de tenants para tela de login (anon)
CREATE POLICY tenants_anon_directory_select
  ON public.tenants
  FOR SELECT
  TO anon
  USING (true);

-- Membros autenticados veem o próprio tenant
CREATE POLICY tenants_authenticated_select
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.current_tenant_ids()));

-- Profiles: cada usuário lê/atualiza apenas o próprio registro
CREATE POLICY profiles_self_select
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_self_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_self_insert
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Hospitals / professionals: isolamento por tenant_id do perfil
CREATE POLICY hospitals_tenant_isolation
  ON public.hospitals
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY professionals_tenant_isolation
  ON public.professionals
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

-- ---------------------------------------------------------------------------
-- Seed mínimo (slugs alinhados ao protótipo de login)
-- ---------------------------------------------------------------------------
INSERT INTO public.tenants (name, slug)
VALUES
  ('Hospital São José', 'hospital-saojose'),
  ('Cooperativa Med Brasil', 'cooperativa-med'),
  ('Grupo Vida Saúde', 'grupo-vida')
ON CONFLICT (slug) DO NOTHING;
