-- F6-O1: rastreamento real de status de homologação por operadora — não
-- existia nenhuma coluna nem tabela para isso. A homologação em si
-- (submeter e ser aprovado pela operadora) é ação institucional externa;
-- o que fica aqui é o rastreamento do processo e a leitura de prontidão
-- técnica antes de submeter.
ALTER TABLE public.insurance_providers
  ADD COLUMN IF NOT EXISTS homologation_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS homologation_notes text,
  ADD COLUMN IF NOT EXISTS homologated_at timestamptz;

ALTER TABLE public.insurance_providers
  DROP CONSTRAINT IF EXISTS insurance_providers_homologation_status_chk;
ALTER TABLE public.insurance_providers
  ADD CONSTRAINT insurance_providers_homologation_status_chk
  CHECK (homologation_status IN ('not_started', 'in_progress', 'homologated'));

-- RLS de insurance_providers já é select_tenant + write_billing
-- (20250513201000_tiss_operational_foundation.sql) — cobre as colunas
-- novas automaticamente, nenhuma policy nova necessária.
