# MEDICFLOW-INTELLIGENT-CAPTURE-02B — Certificação da Infraestrutura de Captura

**Sprint ID:** MEDICFLOW-INTELLIGENT-CAPTURE-02B  
**Data:** 03/07/2026  
**Project Ref alvo:** `vbfulflzekrnejwetcyr` (MedicFlow-AI-Staging, sa-east-1)  
**Domínio staging:** `https://staging.medicflow.app.br`  
**Worker Cloudflare:** `medflow-ia` — versão `edd5dea7-0e35-450f-9b40-4e120a2f415e`

**Escopo respeitado:** sem alteração de arquitetura, banco, contratos, frontend, API ou testes unitários. Apenas desbloqueios operacionais.

**Relacionado:** [`MEDICFLOW_CAPTURE_CERTIFICATION.md`](./MEDICFLOW_CAPTURE_CERTIFICATION.md) (02A) · [`MEDICFLOW_INTELLIGENT_CAPTURE_02.md`](./MEDICFLOW_INTELLIGENT_CAPTURE_02.md)

---

## VEREDITO

# CAPTURE FOUNDATION = NO-GO

A **aplicação staging** foi reconstruída e publicada com a rota `/captura` e a API `/capture`. Porém a **infraestrutura Supabase remota** (migration #30, bucket `clinical-documents`, tabelas `capture_*`) **não foi aplicada** — bloqueio operacional persistente em `supabase db push`.

---

## RESPOSTAS OBRIGATÓRIAS

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | **Migration aplicada?** | **NÃO** — `20260703120000_intelligent_capture_foundation.sql` não publicada no Postgres remoto. `capture_sessions` retorna `PGRST205`. |
| 2 | **Bucket criado?** | **NÃO (remoto)** — `clinical-documents` ausente. Probe autenticado: `listBuckets()` → `count: 0`, `hasClinical: false`. DDL pronta no repositório. |
| 3 | **Storage funcionando?** | **NÃO (remoto)** — sem bucket; upload e persistência bloqueados até `db push`. |
| 4 | **Página publicada?** | **SIM** — `GET /captura` com sessão SSR → HTTP **200**; título `Captura Inteligente — MedicFlow-AI`; UI de upload presente. Bundle inclui `captura-*.js` e `capture-server-*.js`. |
| 5 | **Smoke aprovado?** | **NÃO** — abertura da página OK; criação de sessão, upload, persistência e mudança de estado **falharam** (tabela/bucket inexistentes; `POST /capture` → 401 com cookie SSR no Worker). |
| 6 | **CAPTURE FOUNDATION** | **NO-GO** |

---

## FASE 1 — `supabase db push`

### Credenciais validadas

| Variável | Estado |
|----------|--------|
| `VITE_SUPABASE_URL` | ✅ Presente em `.env.local` / `.env.staging` → `vbfulflzekrnejwetcyr` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Presente (publishable) |
| `SUPABASE_DB_PASSWORD` | ❌ **Ausente** em `.env.local`, `.env.staging` e variáveis de ambiente do shell |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **Ausente** (comentada em `.env.local`) |

### Conexão remota

| Probe | Resultado |
|-------|-----------|
| DNS `vbfulflzekrnejwetcyr.supabase.co` | ✅ Resolve |
| `GET /rest/v1/` | ✅ HTTP 401 (PostgREST ativo) |
| `GET /rest/v1/knowledge_embeddings` | ✅ HTTP 200 (migration #29 aplicada) |
| `GET /rest/v1/capture_sessions` | ❌ HTTP 404 `PGRST205` (migration #30 **não** aplicada) |
| Auth `signInWithPassword` (`admin@iaeasy.com.br`) | ✅ OK |

### Comandos executados

```bash
npx supabase link --project-ref vbfulflzekrnejwetcyr
# → HTTP 403 — conta CLI sem privilégios na org wyltrrozzeuqofzomyew

npx supabase db push --linked --yes
# → HTTP 403 login role + "Connect to your database by setting SUPABASE_DB_PASSWORD"

npx supabase db push --linked --dry-run
# → Mesmo bloqueio (403 + SUPABASE_DB_PASSWORD ausente)
```

**Conta CLI autenticada** (`npx supabase projects list`) lista apenas projetos da org `zkqktvswreqdqiesiwdw` — **não inclui** `vbfulflzekrnejwetcyr` (org `wyltrrozzeuqofzomyew`).

**Migration alvo:** `supabase/migrations/20260703120000_intelligent_capture_foundation.sql`

**Resultado Fase 1:** ❌ **Não concluída**

---

## FASE 2 — Health check (`capture_healthcheck.sql`)

Execução remota **bloqueada** (depende de Fase 1). Evidência parcial via probes REST e script SQL preparado.

| Artefato | Esperado (migration #30) | Remoto (03/07/2026) | Status |
|----------|--------------------------|---------------------|--------|
| Bucket `clinical-documents` | ✓ privado, 25 MB | ❌ Ausente | ❌ |
| `capture_sessions` | ✓ | ❌ `PGRST205` | ❌ |
| `capture_documents` | ✓ | ❌ (inferido) | ❌ |
| `capture_pages` | ✓ | ⏳ SQL remoto pendente | ⏳ |
| `capture_fields` | ✓ | ⏳ SQL remoto pendente | ⏳ |
| `capture_findings` | ✓ | ⏳ SQL remoto pendente | ⏳ |
| `capture_corrections` | ✓ | ⏳ SQL remoto pendente | ⏳ |
| `capture_templates` | ✓ | ⏳ SQL remoto pendente | ⏳ |
| Índices (≥12) | ✓ | ⏳ SQL remoto pendente | ⏳ |
| Foreign keys (≥12) | ✓ | ⏳ SQL remoto pendente | ⏳ |
| Policies `capture_*` (20) | ✓ | ⏳ SQL remoto pendente | ⏳ |
| Policies storage (4) | ✓ | ⏳ SQL remoto pendente | ⏳ |
| Triggers `updated_at` (6) | ✓ | ⏳ SQL remoto pendente | ⏳ |
| Enums (4) | ✓ | ⏳ SQL remoto pendente | ⏳ |

**Baseline local (repositório):**

```bash
npm run migration-validate   # exit 0 — 30 migrations, ordem OK
npm run capture:test         # 7 pass, 2 skip (sem SUPABASE_SERVICE_ROLE_KEY)
```

**Resultado Fase 2:** ❌ **Não executado remotamente** — checklist remoto reprovado por ausência de artefatos.

---

## FASE 3 — Build e deploy staging

### Build

```bash
npm run env-check:staging      # exit 0
npm run build:staging          # exit 0 — inclui captura-SXbVifnS.js, capture-server-BVwTUzXz.js
npm run validate-staging-build # exit 0
```

**Observação:** o bundle staging anterior (pré-rebuild) **não continha** chunks `captura-*` / `capture-server-*`. Rebuild obrigatório para publicar a feature.

### Deploy

```bash
node scripts/deploy-staging.mjs --skip-build   # exit 0
```

| Item | Evidência |
|------|-----------|
| Version ID | `edd5dea7-0e35-450f-9b40-4e120a2f415e` |
| Rota custom | `staging.medicflow.app.br/*` |
| Assets novos | `captura-SXbVifnS.js` (+ 31 assets atualizados) |
| `/captura` sem auth | HTTP 307 → `/login` (rota protegida) |
| `/captura` com cookie SSR | HTTP **200**, título `Captura Inteligente — MedicFlow-AI` |
| `POST /capture` (sem cookie) | HTTP 401 JSON `unauthenticated` (router ativo) |

**Resultado Fase 3:** ✅ **Concluída** — `/captura` publicada no staging.

---

## FASE 4 — Smoke test (sem OCR)

**Credencial:** `admin@iaeasy.com.br` (super_admin, tenant `medflow-admin`)  
**Evidência:** `docs/evidence/capture-smoke-02b-results.json`

| Cenário | Resultado | Detalhe |
|---------|-----------|---------|
| Abertura da página `/captura` | ✅ | HTTP 200 autenticado; título e UI de upload presentes |
| Criação de sessão | ❌ | `POST /capture` com cookie SSR → 401; tabela `capture_sessions` inexistente |
| Upload | ❌ | Bloqueado — sem sessão e sem bucket `clinical-documents` |
| Persistência | ❌ | Tabelas `capture_*` ausentes no remoto |
| Mudança de estado (→ `OCR_PENDING`) | ❌ | Pipeline não iniciado |

**Probes adicionais:**

```
GET  /rest/v1/capture_sessions  → PGRST205 (table not in schema cache)
POST /capture (Cookie SSR)       → 401 unauthenticated (contexto cookie no Worker)
GET  /captura (Cookie SSR)       → 200 OK (SSR autenticado)
```

**Resultado Fase 4:** ❌ **Reprovado** — apenas abertura de página aprovada.

---

## FASE 5 — Certificação

Ver tabela **Respostas Obrigatórias** no topo.

### Bloqueadores P0 remanescentes

| # | Bloqueio | Ação necessária | Responsável |
|---|----------|-----------------|-------------|
| 1 | Conta Supabase CLI sem acesso ao projeto `vbfulflzekrnejwetcyr` (HTTP 403) | Convidar conta operacional à org `wyltrrozzeuqofzomyew` ou usar token owner | DevOps / Owner Supabase |
| 2 | `SUPABASE_DB_PASSWORD` ausente localmente | Copiar do Dashboard → Settings → Database (não commitar) | DevOps |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` ausente | Configurar em `.env.local` para testes de integração | DevOps |
| 4 | Migration #30 não aplicada | `npx supabase db push --linked --yes` após desbloqueio | DevOps |
| 5 | Health check remoto pendente | `npx supabase db query --linked -f supabase/scripts/capture_healthcheck.sql` | Automático pós-push |

### Condições para GO

1. `supabase db push` aplicar `20260703120000` com sucesso.
2. `capture_healthcheck.sql` → todas as colunas `*_ok = true`.
3. `npm run capture:test` → integração pass (sem skip).
4. Smoke E2E: criar sessão → upload PDF → status `OCR_PENDING` (sem OCR).
5. Reemitir certificação 02B com veredito **GO**.

### Progresso vs 02A

| Item | 02A | 02B |
|------|-----|-----|
| `/captura` no bundle staging | ❌ 404 / bundle antigo | ✅ HTTP 200 publicado |
| API `/capture` no Worker | ❌ 404 HTML | ✅ 401 JSON (router ativo) |
| Migration #30 remota | ❌ | ❌ (bloqueio credenciais) |
| Bucket `clinical-documents` | ❌ | ❌ |
| Deploy staging atualizado | Parcial | ✅ versão `edd5dea7` |

---

## COMANDOS DE REEXECUÇÃO (PÓS-DESBLOQUEIO)

```bash
cd MedFlow-IA

# 1. Credenciais (não commitar)
export SUPABASE_DB_PASSWORD='...'
export SUPABASE_SERVICE_ROLE_KEY='...'

# 2. Vincular e aplicar migration capture (#30)
npx supabase link --project-ref vbfulflzekrnejwetcyr
npx supabase db push --linked --yes

# 3. Health check
npx supabase db query --linked -f supabase/scripts/capture_healthcheck.sql

# 4. Testes e smoke
npm run capture:test
# Smoke manual: login → /captura → upload PDF → verificar OCR_PENDING
```

---

*Certificação MEDICFLOW-INTELLIGENT-CAPTURE-02B — 03/07/2026. Aplicação staging publicada; fundação Supabase (DB + Storage) pendente de credenciais owner.*
