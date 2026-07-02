# MEDICFLOW-REBUILD-PREP-01 — Inventário de Configurações Externas

**Sprint ID:** MEDICFLOW-REBUILD-PREP-01  
**Data:** 01/07/2026  
**Escopo:** Nomes de variáveis, descrição, obrigatoriedade e local de uso — **sem valores**.

**Relacionado:** [`MEDICFLOW_REBUILD_PREP.md`](./MEDICFLOW_REBUILD_PREP.md) · [`AUDITORIA_SECRETS_OWNERSHIP.md`](./AUDITORIA_SECRETS_OWNERSHIP.md)

---

## Legenda

| Obrigatória | Significado |
|-------------|-------------|
| **Sim** | Build ou runtime falham / funcionalidade crítica indisponível sem a variável |
| **Staging** | Obrigatória apenas em ambiente staging |
| **Produção** | Obrigatória apenas em ambiente produção |
| **Opcional** | Feature degradada ou desabilitada se ausente |
| **Proibida** | Nunca definir — validador emite erro |

---

## 1. Supabase — Cliente (públicas, prefixo `VITE_`)

| Variável | Descrição | Obrigatória? | Onde será utilizada |
|----------|-----------|--------------|---------------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (`https://<ref>.supabase.co`) | **Sim** | `src/lib/supabase/config.ts`, bundle Vite, scripts de validação (`auth-validate.mjs`, `migration-validate.mjs`, `seed-validate.mjs`), indexador RAG |
| `VITE_SUPABASE_ANON_KEY` | Chave anon/public do Supabase (JWT público) | **Sim** | Client Supabase browser/SSR, scripts de validação, login de usuários |

---

## 2. Supabase — Servidor

| Variável | Descrição | Obrigatória? | Onde será utilizada |
|----------|-----------|--------------|---------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (bypass RLS) | **Sim** (servidor) | `src/lib/server/supabase-admin.ts`, `nitro.config.ts`, indexador RAG (`knowledge-indexer.ts`), audit hash fallback, scripts `rag:index` |
| `SUPABASE_URL` | Alias não usado diretamente | N/A | Projeto usa `VITE_SUPABASE_URL` — provisionar a mesma URL |
| `SUPABASE_ANON_KEY` | Alias não usado diretamente | N/A | Projeto usa `VITE_SUPABASE_ANON_KEY` |
| `DATABASE_URL` | Connection string PostgreSQL direta | Opcional | `migration-validate.mjs` (schema_migrations remoto), `supabase db` CLI, SQL Editor |
| `SUPABASE_ACCESS_TOKEN` | Token pessoal Management API | Opcional | CLI `supabase`, automação de projeto, auditorias de ownership |
| `SUPABASE_PROJECT_REF` | Referência do projeto (subdomínio) | Derivado | `scripts/lib/staging-supabase.mjs` (hardcoded hoje — atualizar pós-rebuild) |
| `SUPABASE_JWT_SECRET` | Secret JWT do projeto | Dashboard | Gerado automaticamente no novo projeto Supabase; rotação via Dashboard |
| `SUPABASE_DB_PASSWORD` | Senha do role `postgres` | Dashboard | Conexão direta psql / pooler; gerada na criação do projeto |

---

## 3. OpenAI / Embeddings / IA

| Variável | Descrição | Obrigatória? | Onde será utilizada |
|----------|-----------|--------------|---------------------|
| `MEDFLOW_OPENAI_API_KEY` | Chave API OpenAI (preferencial) | **Sim** (IA/RAG) | `src/lib/server/operational-gpt-openai.ts`, `src/lib/rag/embedding/openai-provider.ts`, `nitro.config.ts`, `scripts/rag/cli/index-knowledge.ts` |
| `OPENAI_API_KEY` | Chave API OpenAI (fallback) | Opcional | Fallback em `operational-gpt-openai.ts` e `openai-provider.ts` se `MEDFLOW_OPENAI_API_KEY` ausente |
| `MEDFLOW_OPENAI_MODEL` | Modelo GPT para Copilot operacional | Opcional | `operational-gpt-openai.ts` — default `gpt-4o-mini` |
| `MEDFLOW_EMBEDDING_PROVIDER` | Provider de embeddings (`openai`) | Opcional | `src/lib/rag/embedding/index.ts` — default `openai` |
| `MEDFLOW_EMBEDDING_MODEL` | Modelo de embedding | Opcional | `openai-provider.ts` — default `text-embedding-3-small` |

---

## 4. MedicFlow — Aplicação

| Variável | Descrição | Obrigatória? | Onde será utilizada |
|----------|-----------|--------------|---------------------|
| `VITE_MEDFLOW_APP_URL` | URL pública canônica do app (HTTPS) | **Staging:** Sim · **Produção:** Recomendado | OG tags (`__root.tsx`), redirects Auth, `validate-env.mjs`, `public-env-validation.ts` |
| `VITE_MEDFLOW_CONTACT_EMAIL` | E-mail de contato institucional | Opcional | `startup-checks.ts`, `public-env-validation.ts`, branding |
| `VITE_MEDFLOW_DEBUG` | Flag de diagnóstico | Opcional (proibido prod) | `security-validation-service.ts`, `validate-env.mjs` |
| `MEDFLOW_AUDIT_HASH_SALT` | Pepper para hash de e-mail/IP em audit logs | Recomendado (servidor) | `src/lib/security/security-audit-hash.ts`, `nitro.config.ts` |
| `MEDFLOW_DEPLOY_TARGET` | Alvo de deploy (`vercel`) | Opcional | `vite.config.ts`, `scripts/build-vercel.mjs` |
| `MEDFLOW_ERROR_TRACKING_DSN` | DSN error tracking (servidor) | Opcional | `src/lib/monitoring/sinks/error-tracker.ts` |
| `VITE_MEDFLOW_ERROR_TRACKING_DSN` | DSN error tracking (client) | Opcional | `error-tracker.ts` |

---

## 5. Auth / E-mail (Supabase Dashboard — não versionado)

| Variável / Config | Descrição | Obrigatória? | Onde será utilizada |
|-------------------|-----------|--------------|---------------------|
| `SMTP_HOST` | Host do servidor SMTP | **Sim** (e-mail Auth prod) | Supabase Dashboard → Auth → SMTP |
| `SMTP_PORT` | Porta SMTP (ex.: 587) | **Sim** (e-mail Auth prod) | Supabase Dashboard → Auth → SMTP |
| `SMTP_USER` | Usuário SMTP | **Sim** (e-mail Auth prod) | Supabase Dashboard → Auth → SMTP |
| `SMTP_PASSWORD` / `SENDGRID_API_KEY` | Senha ou API key do provedor | **Sim** (e-mail Auth prod) | Supabase Dashboard; template comentado em `config.toml` referencia `env(SENDGRID_API_KEY)` |
| `SMTP_ADMIN_EMAIL` | Remetente admin | **Sim** (e-mail Auth prod) | Supabase Dashboard → Auth → SMTP |
| `SMTP_SENDER_NAME` | Nome do remetente | Opcional | Supabase Dashboard → Auth → SMTP |
| Redirect URLs Auth | URLs permitidas pós-login | **Sim** | Supabase Dashboard → Auth → URL Configuration |
| Site URL | URL base do site | **Sim** | Supabase Dashboard → Auth |

**Nota:** O app **não** implementa SMTP próprio — e-mail transacional é responsabilidade do Supabase Auth.

---

## 6. OAuth / MFA (desabilitados — referência futura)

| Variável | Descrição | Obrigatória? | Onde será utilizada |
|----------|-----------|--------------|---------------------|
| `GOOGLE_CLIENT_ID` | Client ID Google OAuth | N/A (desabilitado) | `config.toml` `[auth.external.google]` — não habilitado |
| `GOOGLE_CLIENT_SECRET` | Secret Google OAuth | N/A (desabilitado) | Supabase Dashboard se OAuth Google for habilitado |
| `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET` | Secret Apple OAuth | N/A (desabilitado) | `config.toml` `[auth.external.apple]` |
| `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN` | Token Twilio SMS | N/A (desabilitado) | `config.toml` `[auth.sms.twilio]` |
| `SUPABASE_AUTH_HOOK_SECRET` | Secret para auth hooks | N/A | Supabase Dashboard se hooks habilitados |

---

## 7. Cloudflare Workers

| Variável / Secret | Descrição | Obrigatória? | Onde será utilizada |
|-------------------|-----------|--------------|---------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (Worker secret) | **Sim** (SSR/admin) | Cloudflare Dashboard → Workers → `medflow-ia` → Secrets |
| `MEDFLOW_OPENAI_API_KEY` | OpenAI (Worker secret) | **Sim** (Copilot) | Cloudflare Worker secrets |
| `MEDFLOW_AUDIT_HASH_SALT` | Salt auditoria (Worker secret) | Recomendado | Cloudflare Worker secrets |
| `VITE_SUPABASE_URL` | URL Supabase (plain var) | **Sim** | Embutida no build Worker via Vite |
| `VITE_SUPABASE_ANON_KEY` | Anon key (plain var) | **Sim** | Embutida no build Worker via Vite |
| `VITE_MEDFLOW_APP_URL` | URL staging/prod | **Sim** (staging) | Build staging — `wrangler.jsonc` rota `staging.medicflow.app.br` |
| Account ID | ID conta Cloudflare | Versionado | `wrangler.jsonc` (`account_id`) — não é secret |

**Configuração versionada:** `wrangler.jsonc` — worker `medflow-ia`, rota staging.

---

## 8. Vercel (alternativa de deploy — não em uso ativo)

| Variável | Descrição | Obrigatória? | Onde será utilizada |
|----------|-----------|--------------|---------------------|
| `VITE_SUPABASE_URL` | URL Supabase | Sim (se Vercel) | Painel Vercel → Environment Variables |
| `VITE_SUPABASE_ANON_KEY` | Anon key | Sim (se Vercel) | Painel Vercel |
| `VITE_MEDFLOW_APP_URL` | URL do app | Sim (se Vercel) | Painel Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role | Sim (SSR Vercel) | Painel Vercel (Sensitive) |
| `MEDFLOW_OPENAI_API_KEY` | OpenAI | Sim (IA) | Painel Vercel (Sensitive) |
| `MEDFLOW_AUDIT_HASH_SALT` | Audit salt | Recomendado | Painel Vercel (Sensitive) |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Bypass proteção preview | Opcional | `nitro.config.ts` |
| `VERCEL` | Flag CI Vercel | Auto | Detectado em `vite.config.ts` |

Template: `.env.vercel.example`

---

## 9. CI / Homologação / Testes

| Variável | Descrição | Obrigatória? | Onde será utilizada |
|----------|-----------|--------------|---------------------|
| `VITE_SUPABASE_URL` | Placeholder CI | CI only | `.github/workflows/ci.yml` |
| `VITE_SUPABASE_ANON_KEY` | Placeholder CI | CI only | `.github/workflows/ci.yml` |
| `VITE_MEDFLOW_APP_URL` | Placeholder CI | CI only | `.github/workflows/ci.yml` |
| `TEST_ADMIN_PASSWORD` | Senha admin de teste | Opcional | `homologacao-completa-staging.mjs`, scripts `capture-*` |
| `SMOKE_BASE_URL` | URL base smoke test | Opcional | `scripts/smoke-check.mjs` |

---

## 10. Variáveis proibidas (anti-padrões)

| Variável | Motivo |
|----------|--------|
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Service role nunca no bundle client — erro em `validate-env.mjs` |
| `VITE_MEDFLOW_OPENAI_API_KEY` | Chave OpenAI nunca no bundle — usar `MEDFLOW_OPENAI_API_KEY` |

---

## 11. Integrações não utilizadas no código

Confirmado por auditoria — **não provisionar** unless roadmap muda:

| Variável | Status |
|----------|--------|
| `GEMINI_API_KEY` | Não referenciada |
| `RESEND_API_KEY` | Não referenciada (SMTP via Supabase Dashboard) |
| `STRIPE_*` | Não referenciada |
| Webhook secrets | Não implementados |

---

## 12. Arquivos de template por ambiente

| Arquivo | Ambiente | Copiar para |
|---------|----------|-------------|
| `.env.example` | Desenvolvimento | `.env.local` |
| `.env.staging.example` | Staging | `.env.staging` |
| `.env.production.example` | Produção | `.env.production` |
| `.env.vercel.example` | Vercel | Painel Vercel |

**Regra:** Nunca commitar arquivos `.env*` com valores reais.

---

## 13. Matriz resumida — provisionamento MEDICFLOW-REBUILD-01

| Prioridade | Variáveis / Configs |
|------------|---------------------|
| **P0 — imediato** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_MEDFLOW_APP_URL` |
| **P1 — IA/RAG** | `MEDFLOW_OPENAI_API_KEY`, `MEDFLOW_EMBEDDING_MODEL` (opcional) |
| **P1 — segurança** | `MEDFLOW_AUDIT_HASH_SALT` |
| **P1 — Auth e-mail** | SMTP (Dashboard Supabase) |
| **P2 — observabilidade** | `MEDFLOW_ERROR_TRACKING_DSN` |
| **P2 — Vercel** | Apenas se migrar deploy de Cloudflare |

---

## 14. Custódia esperada pós-rebuild

| Local | O que armazenar |
|-------|-----------------|
| `.env.staging` (local, gitignored) | Todas as vars de dev/staging para build local |
| Cloudflare Worker Secrets | `SUPABASE_SERVICE_ROLE_KEY`, `MEDFLOW_OPENAI_API_KEY`, `MEDFLOW_AUDIT_HASH_SALT` |
| Supabase Dashboard | JWT secret (auto), SMTP, redirect URLs, API keys |
| GitHub Actions | Placeholders apenas (sem secrets reais hoje) |

---

*Inventário MEDICFLOW-REBUILD-PREP-01 — somente nomes e metadados. Nenhum valor de secret incluído.*
