# MEDICFLOW-INTELLIGENT-CAPTURE-02A — Certificação da Infraestrutura de Captura

**Sprint ID:** MEDICFLOW-INTELLIGENT-CAPTURE-02A  
**Data:** 03/07/2026  
**Project Ref alvo:** `vbfulflzekrnejwetcyr`  
**Escopo:** Publicar e certificar infraestrutura Captura Inteligente (sem OCR, sem alterações em frontend/contratos/RAG/Copilot)

**Relacionado:** [`MEDICFLOW_CAPTURE_HEALTHCHECK.md`](./MEDICFLOW_CAPTURE_HEALTHCHECK.md) · [`MEDICFLOW_INTELLIGENT_CAPTURE_02.md`](./MEDICFLOW_INTELLIGENT_CAPTURE_02.md)

---

## VEREDITO

# CAPTURE FOUNDATION = NO-GO

A implementação da sprint 02 está **completa no repositório**, mas a **publicação remota não foi concluída**. Migration #30 não aplicada; bucket e tabelas `capture_*` ausentes no Postgres/Storage remoto; deploy staging **não inclui** rotas `/captura` e `/capture`.

---

## RESPOSTAS OBRIGATÓRIAS

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | **Bucket criado?** | **NÃO (remoto)** — DDL pronta em migration #30; probe PostgREST indica migration não aplicada. Repositório: **SIM**. |
| 2 | **Storage funcionando?** | **NÃO (remoto)** — bucket `clinical-documents` inexistente até `db push`. Código de upload (`capture-session-store.ts`) implementado no repo. |
| 3 | **Banco íntegro?** | **NÃO (remoto)** — `capture_sessions` / `capture_documents` retornam 404 PostgREST. Baseline SQL local: **aprovada**. |
| 4 | **API funcionando?** | **PARCIAL** — roteamento `/capture` responde 401 sem auth (dev); **404 em staging** (build anterior à sprint 02). Contratos e router presentes no repo. |
| 5 | **Página funcionando?** | **PARCIAL** — rota `/captura` existe no código; staging retorna **404**; dev exige login (redirect). UI não validada E2E autenticada. |
| 6 | **CAPTURE FOUNDATION** | **NO-GO** |

---

## EXECUÇÃO POR FASE

### FASE 1 — `supabase db push`

| Comando | Resultado |
|---------|-----------|
| `npx supabase link --project-ref vbfulflzekrnejwetcyr` | ❌ HTTP 403 — privilégios insuficientes |
| `npx supabase db push --linked --yes` | ❌ HTTP 403 + `SUPABASE_DB_PASSWORD` ausente |
| Migration alvo | `20260703120000_intelligent_capture_foundation.sql` (**única migration capture**) |

**Bloqueadores P0:**

- Conta CLI sem acesso Management API ao projeto `vbfulflzekrnejwetcyr`
- `SUPABASE_DB_PASSWORD` não configurado
- `SUPABASE_SERVICE_ROLE_KEY` comentado em `.env.local` / `.env.staging`

---

### FASE 2 — Health check

| Artefato | Local (repo) | Remoto |
|----------|:------------:|:------:|
| Bucket `clinical-documents` | ✅ DDL | ❌ |
| 7 tabelas `capture_*` | ✅ DDL | ❌ |
| 12 índices | ✅ DDL | ⏳ |
| 12+ FKs compostas | ✅ DDL | ⏳ |
| RLS 7 tabelas | ✅ DDL | ⏳ |
| 20 policies tabela | ✅ DDL | ⏳ |
| 4 policies storage | ✅ DDL | ⏳ |
| 6 triggers `updated_at` | ✅ DDL | ⏳ |
| 4 enums capture | ✅ DDL | ⏳ |

Script preparado: `supabase/scripts/capture_healthcheck.sql` (execução remota pendente).

---

### FASE 3 — Testes completos

```bash
npm run capture:test
```

| Suite | Resultado | Detalhe |
|-------|-----------|---------|
| Unitários | ✅ 7/7 pass | state machine, storage paths, REST parser, base64, migration DDL |
| Integração Supabase | ⏭️ 2 SKIP | `SUPABASE_SERVICE_ROLE_KEY` ausente |
| Criação `capture_session` | ❌ | Tabela inexistente no remoto |
| Upload + estados | ❌ | Depende de migration + storage |
| Multi-tenant / RLS | ⏳ | Requer SQL remoto pós-push |
| Storage upload | ❌ | Bucket ausente |

**Evidência remota:**

```
GET .../rest/v1/capture_sessions → 404 PGRST205 (table not in schema cache)
GET .../rest/v1/knowledge_embeddings → 200 (confirma #29 aplicada, #30 pendente)
```

---

### FASE 4 — Smoke test `/captura` (sem OCR)

| Ambiente | Rota | Resultado |
|----------|------|-----------|
| Staging | `GET /captura` | ❌ HTTP 404 — feature não deployada |
| Staging | `POST /capture` (auth bootstrap) | ❌ HTTP 404 HTML SPA fallback |
| Dev local | `POST /capture` (sem auth) | ✅ HTTP 401 JSON `unauthenticated` |
| Dev local | `GET /captura` (sem auth) | ✅ Redirect login (rota protegida) |
| Dev local | E2E autenticado | ❌ Dev server crash em sessão autenticada (`No StartEvent found in AsyncLocalStorage`) |

Auth bootstrap validado via `npm run seed-validate`: login `admin@iaeasy.com.br` OK.

---

### FASE 5 — Certificação

Ver tabela **Respostas Obrigatórias** acima.

---

## BASELINE REPOSITÓRIO (APROVADA)

| Entregável sprint 02 | Status repo |
|----------------------|-------------|
| Migration #30 | ✅ |
| Bucket + policies storage | ✅ DDL |
| 7 tabelas + RLS | ✅ DDL |
| State machine CREATED → OCR_PENDING | ✅ |
| API REST + server functions | ✅ |
| Página `/captura` | ✅ |
| Testes `capture:test` | ✅ unitários |

```bash
npm run migration-validate  # exit 0
npm run capture:test        # 7 pass, 2 skip
```

---

## DIVERGÊNCIAS IDENTIFICADAS

| Item | Repositório | Ambiente operacional | Severidade |
|------|-------------|----------------------|------------|
| Migration #30 capture | Pronta | Não aplicada | **P0** |
| Bucket `clinical-documents` | DDL | Ausente | **P0** |
| CLI / db push | Documentado | HTTP 403 | **P0** |
| `SUPABASE_SERVICE_ROLE_KEY` | Obrigatório p/ integração | Ausente em `.env.*` | **P0** |
| Deploy staging `/captura` | Implementado | 404 (build desatualizado) | **P1** |

---

## CONDIÇÕES PARA GO

| # | Condição | Responsável |
|---|----------|-------------|
| 1 | Acesso owner/collaborator ao projeto `vbfulflzekrnejwetcyr` | DevOps / Owner Supabase |
| 2 | Configurar `SUPABASE_DB_PASSWORD` + `SUPABASE_SERVICE_ROLE_KEY` (local, não commitar) | DevOps |
| 3 | `supabase db push` — aplicar migration #30 | DevOps |
| 4 | `capture_healthcheck.sql` → todos `*_ok = true` | Automático |
| 5 | `npm run capture:test` — integração pass (sem skip) | Automático |
| 6 | Deploy staging com sprint 02 (`/captura`, `/capture`) | DevOps / CI |
| 7 | Smoke E2E autenticado: criar sessão → upload → status `OCR_PENDING` | QA |

---

## PRÓXIMOS PASSOS

1. Desbloquear acesso Supabase CLI ao projeto staging.
2. Executar `supabase db push` (migration capture apenas pendente após #29).
3. Reexecutar `capture_healthcheck.sql` e `npm run capture:test`.
4. Deploy staging (`npm run deploy:staging` ou pipeline equivalente).
5. Reemitir certificação com veredito **GO**.

---

*Certificação MEDICFLOW-INTELLIGENT-CAPTURE-02A — 03/07/2026. Repositório pronto; infraestrutura cloud não publicada.*
