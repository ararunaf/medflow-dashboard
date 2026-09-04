-- F5-S2: criptografia real em repouso de tiss_guides.patient_name — o
-- único campo de PII genuinamente em texto plano e em uso real hoje
-- (capture_fields.field_value, cotado inicialmente como segundo alvo,
-- acabou confirmado como coluna morta: nenhum código em src/ jamais lê ou
-- escreve nela — a exposição real de CPF vive em structured_guide.json no
-- Storage + StructuredField em memória durante o pipeline de captura, um
-- problema arquiteturalmente diferente e maior, fora do escopo desta
-- sprint, registrado no roadmap para uma sprint dedicada).
--
-- Estratégia: chave via Supabase Vault (nunca aparece em migration/código/
-- git — gerada e armazenada dentro do próprio Postgres). Acesso de
-- leitura/escrita ao texto plano só através de funções SECURITY DEFINER
-- estreitas — a policy RLS de SELECT em tiss_guides continua igual
-- (qualquer membro do tenant), porque o valor bruto da coluna agora é
-- ciphertext ilegível sem a função; o modelo de acesso da aplicação (quem
-- pode VER o nome do paciente) continua exatamente o mesmo de antes
-- (`tiss:read`), só que agora a coluna em repouso — dump de banco,
-- backup, réplica, acesso direto ao Postgres — não expõe mais o nome em
-- texto plano.
-- pgcrypto (gen_random_bytes, pgp_sym_encrypt/decrypt) foi instalado sem
-- schema explícito em 20250512000000_init_enterprise.sql — no provisionamento
-- padrão do Supabase isso cai no schema `extensions`, não `public`.
SET search_path = public, extensions, vault;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets WHERE name = 'tiss_patient_name_key'
  ) THEN
    PERFORM vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'tiss_patient_name_key');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._tiss_patient_name_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'tiss_patient_name_key' LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public._tiss_patient_name_key() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.encrypt_patient_name(plain text)
RETURNS bytea
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT pgp_sym_encrypt(plain, public._tiss_patient_name_key());
$$;
REVOKE ALL ON FUNCTION public.encrypt_patient_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.encrypt_patient_name(text) TO authenticated;

-- Coluna existente vira bytea, criptografando o dado já existente no
-- mesmo ALTER (atômico — USING referencia o valor antigo da própria
-- coluna sendo convertida).
ALTER TABLE public.tiss_guides
  ALTER COLUMN patient_name TYPE bytea
  USING public.encrypt_patient_name(patient_name);

-- Campo computado (padrão PostgREST: função que recebe o row-type da
-- tabela vira coluna virtual selecionável) — só assim o app volta a ler
-- o nome em texto plano, sob RLS normal da tabela.
CREATE OR REPLACE FUNCTION public.patient_name_decrypted(guide public.tiss_guides)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT pgp_sym_decrypt(guide.patient_name, public._tiss_patient_name_key());
$$;
REVOKE ALL ON FUNCTION public.patient_name_decrypted(public.tiss_guides) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.patient_name_decrypted(public.tiss_guides) TO authenticated;
