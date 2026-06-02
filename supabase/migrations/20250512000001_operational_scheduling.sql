-- MedFlow-IA: domínio operacional — unidades, setores, escalas, plantões, trocas, disponibilidade
-- Multi-tenant + RLS via public.current_tenant_ids()

-- ---------------------------------------------------------------------------
-- Enums operacionais
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_type') THEN
    CREATE TYPE public.unit_type AS ENUM (
      'hospital',
      'clinic',
      'upa',
      'operational'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_status') THEN
    CREATE TYPE public.schedule_status AS ENUM (
      'draft',
      'active',
      'archived'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_status') THEN
    CREATE TYPE public.shift_status AS ENUM (
      'open',
      'assigned',
      'completed',
      'cancelled'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
    CREATE TYPE public.assignment_status AS ENUM (
      'pending',
      'confirmed',
      'rejected'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'swap_request_status') THEN
    CREATE TYPE public.swap_request_status AS ENUM (
      'pending',
      'approved',
      'denied',
      'cancelled'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Chaves compostas (tenant_id, id) para integridade cross-tenant
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS hospitals_tenant_id_id_uidx
  ON public.hospitals (tenant_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS professionals_tenant_id_id_uidx
  ON public.professionals (tenant_id, id);

-- ---------------------------------------------------------------------------
-- 1. units — unidades operacionais (hospital, clínica, UPA, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  hospital_id uuid NOT NULL,
  name text NOT NULL,
  type public.unit_type NOT NULL DEFAULT 'operational',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT units_tenant_hospital_fk
    FOREIGN KEY (tenant_id, hospital_id)
    REFERENCES public.hospitals (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS units_tenant_id_id_uidx ON public.units (tenant_id, id);
CREATE INDEX IF NOT EXISTS units_tenant_id_idx ON public.units (tenant_id);
CREATE INDEX IF NOT EXISTS units_hospital_id_idx ON public.units (hospital_id);

-- ---------------------------------------------------------------------------
-- 2. departments — setores clínicos / operacionais
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  unit_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT departments_tenant_unit_fk
    FOREIGN KEY (tenant_id, unit_id)
    REFERENCES public.units (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS departments_tenant_id_id_uidx ON public.departments (tenant_id, id);
CREATE INDEX IF NOT EXISTS departments_tenant_id_idx ON public.departments (tenant_id);
CREATE INDEX IF NOT EXISTS departments_unit_id_idx ON public.departments (unit_id);

-- ---------------------------------------------------------------------------
-- 3. schedules — escalas / períodos operacionais
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  department_id uuid NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.schedule_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedules_date_range_chk CHECK (end_date >= start_date),
  CONSTRAINT schedules_tenant_department_fk
    FOREIGN KEY (tenant_id, department_id)
    REFERENCES public.departments (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS schedules_tenant_id_id_uidx ON public.schedules (tenant_id, id);
CREATE INDEX IF NOT EXISTS schedules_tenant_id_idx ON public.schedules (tenant_id);
CREATE INDEX IF NOT EXISTS schedules_department_id_idx ON public.schedules (department_id);
CREATE INDEX IF NOT EXISTS schedules_dates_idx ON public.schedules (tenant_id, start_date, end_date);

-- ---------------------------------------------------------------------------
-- 4. shifts — plantões individuais
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  schedule_id uuid NOT NULL,
  department_id uuid NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  role_required text NOT NULL DEFAULT '',
  status public.shift_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shifts_time_range_chk CHECK (ends_at > starts_at),
  CONSTRAINT shifts_tenant_schedule_fk
    FOREIGN KEY (tenant_id, schedule_id)
    REFERENCES public.schedules (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT shifts_tenant_department_fk
    FOREIGN KEY (tenant_id, department_id)
    REFERENCES public.departments (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS shifts_tenant_id_id_uidx ON public.shifts (tenant_id, id);
CREATE INDEX IF NOT EXISTS shifts_tenant_id_idx ON public.shifts (tenant_id);
CREATE INDEX IF NOT EXISTS shifts_schedule_id_idx ON public.shifts (schedule_id);
CREATE INDEX IF NOT EXISTS shifts_department_time_idx ON public.shifts (tenant_id, department_id, starts_at, ends_at);

CREATE OR REPLACE FUNCTION public.enforce_shift_department_matches_schedule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = NEW.schedule_id
      AND s.tenant_id = NEW.tenant_id
      AND s.department_id = NEW.department_id
  ) THEN
    RAISE EXCEPTION 'shifts.department_id must match schedules.department_id for the given schedule_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shifts_department_schedule_consistency ON public.shifts;
CREATE TRIGGER shifts_department_schedule_consistency
  BEFORE INSERT OR UPDATE OF schedule_id, department_id, tenant_id
  ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shift_department_matches_schedule();

-- ---------------------------------------------------------------------------
-- 5. shift_assignments — alocação de profissional ao plantão
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  shift_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  assignment_status public.assignment_status NOT NULL DEFAULT 'pending',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shift_assignments_tenant_shift_fk
    FOREIGN KEY (tenant_id, shift_id)
    REFERENCES public.shifts (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT shift_assignments_tenant_professional_fk
    FOREIGN KEY (tenant_id, professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS shift_assignments_one_confirmed_per_shift_uidx
  ON public.shift_assignments (shift_id)
  WHERE assignment_status = 'confirmed';

CREATE INDEX IF NOT EXISTS shift_assignments_tenant_id_idx ON public.shift_assignments (tenant_id);
CREATE INDEX IF NOT EXISTS shift_assignments_shift_id_idx ON public.shift_assignments (shift_id);
CREATE INDEX IF NOT EXISTS shift_assignments_professional_id_idx ON public.shift_assignments (professional_id);

-- ---------------------------------------------------------------------------
-- 6. shift_swap_requests — solicitações de troca
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  shift_id uuid NOT NULL,
  requester_professional_id uuid NOT NULL,
  target_professional_id uuid NOT NULL,
  status public.swap_request_status NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shift_swap_requests_tenant_shift_fk
    FOREIGN KEY (tenant_id, shift_id)
    REFERENCES public.shifts (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT shift_swap_requests_tenant_requester_fk
    FOREIGN KEY (tenant_id, requester_professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT shift_swap_requests_tenant_target_fk
    FOREIGN KEY (tenant_id, target_professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT shift_swap_requests_distinct_professionals_chk
    CHECK (requester_professional_id <> target_professional_id)
);

CREATE INDEX IF NOT EXISTS shift_swap_requests_tenant_id_idx ON public.shift_swap_requests (tenant_id);
CREATE INDEX IF NOT EXISTS shift_swap_requests_shift_id_idx ON public.shift_swap_requests (shift_id);

-- ---------------------------------------------------------------------------
-- 7. availability — disponibilidade recorrente do profissional
-- weekday: 0 = domingo .. 6 = sábado (convenção date_part(dow))
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  weekday smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  available boolean NOT NULL DEFAULT true,
  CONSTRAINT availability_tenant_professional_fk
    FOREIGN KEY (tenant_id, professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT availability_weekday_chk CHECK (weekday >= 0 AND weekday <= 6),
  CONSTRAINT availability_time_range_chk CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS availability_tenant_id_idx ON public.availability (tenant_id);
CREATE INDEX IF NOT EXISTS availability_professional_weekday_idx ON public.availability (tenant_id, professional_id, weekday);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY units_tenant_isolation
  ON public.units
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY departments_tenant_isolation
  ON public.departments
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY schedules_tenant_isolation
  ON public.schedules
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY shifts_tenant_isolation
  ON public.shifts
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY shift_assignments_tenant_isolation
  ON public.shift_assignments
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY shift_swap_requests_tenant_isolation
  ON public.shift_swap_requests
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY availability_tenant_isolation
  ON public.availability
  FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

-- ---------------------------------------------------------------------------
-- Realtime (Supabase hosted): prepara publicação quando existir
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.units;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_assignments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_swap_requests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.availability;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;

COMMENT ON TABLE public.units IS 'Unidades operacionais (hospital, clínica, UPA) vinculadas a um hospital lógico do tenant.';
COMMENT ON TABLE public.departments IS 'Setores (UTI, emergência, CC, enfermaria) dentro de uma unidade.';
COMMENT ON TABLE public.schedules IS 'Escalas / períodos operacionais por setor.';
COMMENT ON TABLE public.shifts IS 'Plantões atômicos; role_required prepara futura matriz de competências / IA.';
COMMENT ON TABLE public.shift_assignments IS 'Alocação profissional ao plantão; um confirmed por shift (índice parcial).';
COMMENT ON TABLE public.shift_swap_requests IS 'Fluxo de troca entre profissionais; status operacional sem automação.';
COMMENT ON TABLE public.availability IS 'Janelas recorrentes de disponibilidade (weekday + intervalo).';
