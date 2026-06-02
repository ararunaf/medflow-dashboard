-- Corrige tokens internos do Supabase Auth para o administrador criado por seed.
-- Sem esses campos como string vazia, o Auth pode retornar "Database error querying schema".

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE lower(email) = lower('admin@iaeasy.com.br');
