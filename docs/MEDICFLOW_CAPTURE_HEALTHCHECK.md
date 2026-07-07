# MEDICFLOW-INTELLIGENT-CAPTURE-02A — Capture Health Check

**Sprint ID:** MEDICFLOW-INTELLIGENT-CAPTURE-02A  
**Data:** 03/07/2026  
**Project Ref alvo:** `vbfulflzekrnejwetcyr`  
**Migration alvo:** `20260703120000_intelligent_capture_foundation.sql`

**Script SQL:** [`supabase/scripts/capture_healthcheck.sql`](../supabase/scripts/capture_healthcheck.sql)  
**Certificação:** [`MEDICFLOW_CAPTURE_CERTIFICATION.md`](./MEDICFLOW_CAPTURE_CERTIFICATION.md)

---

## STATUS GERAL

# CAPTURE HEALTH CHECK = NÃO EXECUTADO (SQL REMOTO)

A Fase 1 (`supabase db push`) **não concluiu** — migration de captura **não aplicada** no Postgres remoto. O health check SQL remoto permanece bloqueado (sem `SUPABASE_DB_PASSWORD` / privilégios CLI Management API).

Probes REST PostgREST executados como evidência parcial.

---

## FASE 1 — `supabase db push`

```bash
npx supabase link --project-ref vbfulflzekrnejwetcyr
# → HTTP 403 — conta CLI sem privilégios no projeto

npx supabase db push --linked --yes
# → HTTP 403 login role + "Connect to your database by setting SUPABASE_DB_PASSWORD"
```

| Item | Resultado |
|------|-----------|
| Link CLI | ❌ HTTP 403 |
| `db push` | ❌ Bloqueado |
| Migration `20260703120000` aplicada | ❌ Não confirmada |

**Evidência indireta (PostgREST anon):**

| Tabela | HTTP | Interpretação |
|--------|------|---------------|
| `knowledge_embeddings` | 200 | Migration #29 **aplicada** |
| `capture_sessions` | 404 `PGRST205` | Migration #30 **NÃO aplicada** |
| `capture_documents` | 404 `PGRST205` | Migration #30 **NÃO aplicada** |

---

## FASE 2 — Checklist obrigatório

| Item | Esperado (migration) | Obtido (remoto) | Status |
|------|----------------------|-----------------|--------|
| Bucket `clinical-documents` | ✓ privado, 25 MB | ❌ Ausente (storage anon `[]`; migration não aplicada) | ❌ |
| Tabelas `capture_*` (7) | ✓ | ❌ 0/7 (404 PostgREST) | ❌ |
| Índices `capture_*` (≥12) | ✓ | ⏳ Requer SQL remoto | ⏳ |
| Foreign keys compostas | ✓ | ⏳ Requer SQL remoto | ⏳ |
| RLS em 7 tabelas | ✓ | ⏳ Requer SQL remoto | ⏳ |
| Policies `capture_*` (20) | ✓ | ⏳ Requer SQL remoto | ⏳ |
| Policies storage `clinical_documents_*` (4) | ✓ | ⏳ Requer SQL remoto | ⏳ |
| Triggers `capture_*_updated_at` (6) | ✓ | ⏳ Requer SQL remoto | ⏳ |
| Enums capture (4) | ✓ | ⏳ Requer SQL remoto | ⏳ |
| Função `capture_set_updated_at` | ✓ | ⏳ Requer SQL remoto | ⏳ |

---

## BASELINE ESPERADO (REPOSITÓRIO — migration #30)

Contagens extraídas de `supabase/migrations/20260703120000_intelligent_capture_foundation.sql`:

| Métrica | Valor esperado |
|---------|----------------|
| Tabelas `capture_*` | 7 |
| Enums | 4 (`capture_session_status`, `capture_channel`, `capture_finding_severity`, `capture_finding_status`) |
| Policies tabela | 20 |
| Policies storage | 4 |
| Triggers `updated_at` | 6 |
| Índices | 12 |
| Foreign keys | 12+ |
| Bucket | `clinical-documents` (privado) |
| MIME permitidos | pdf, jpeg, png, webp, tiff |

**Validação estática local:**

```bash
npm run migration-validate   # exit 0 — 30 migrations, ordem OK
npm run capture:test         # 7 unit OK, 2 integration SKIP (sem SERVICE_ROLE)
```

---

## VALIDAÇÃO LOCAL EXECUTADA (03/07/2026)

| Check | Resultado |
|-------|-----------|
| `migration-validate` | ✅ exit 0 — 30 migrations, `order_ok: true` |
| `capture:test` unitários | ✅ 7/7 pass |
| `capture:test` integração | ⏭️ SKIP — `SUPABASE_SERVICE_ROLE_KEY` ausente em `.env.local` |
| Análise SQL migration #30 | ✅ bucket + 7 tabelas + policies + triggers presentes no DDL |
| Docker local (`supabase start`) | ❌ Docker daemon indisponível |

---

## PROBES DE CONECTIVIDADE

| Probe | Host / endpoint | Resultado |
|-------|-----------------|-----------|
| DNS | `vbfulflzekrnejwetcyr.supabase.co` | ✅ Resolve |
| REST root | `GET /rest/v1/` | ✅ HTTP 401 (ativo) |
| Staging health | `GET https://staging.medicflow.app.br/health` | ✅ `status: ok` |
| Staging DB health | `GET /health/db` | ✅ Postgres responde (tenant_settings) |
| CLI link / db push | Management API | ❌ HTTP 403 |
| CLI projects list | Conta autenticada | Projeto `vbfulfl...` **ausente** |

---

## COMO EXECUTAR HEALTH CHECK REMOTO (PÓS-DESBLOQUEIO)

```bash
cd MedFlow-IA

# 1. Credenciais (não commitar)
export SUPABASE_DB_PASSWORD='...'
export SUPABASE_SERVICE_ROLE_KEY='...'

# 2. Vincular e aplicar somente migrations pendentes (inclui capture #30)
npx supabase link --project-ref vbfulflzekrnejwetcyr
npx supabase db push --linked --yes

# 3. Health check Captura
npx supabase db query --linked -f supabase/scripts/capture_healthcheck.sql

# 4. Testes
npm run capture:test
```

**Critério GO:** todas as colunas `*_ok` em `CAPTURE_HEALTHCHECK_SUMMARY` = `true`.

---

## INTERPRETAÇÃO

O projeto Supabase **responde** e migrations anteriores (#29 pgvector) estão aplicadas, mas a migration **#30 Captura Inteligente não foi publicada**. Sem `db push` bem-sucedido, bucket `clinical-documents` e tabelas `capture_*` **não existem** no ambiente remoto.

---

*Health check MEDICFLOW-INTELLIGENT-CAPTURE-02A — 03/07/2026.*
