# MEDICFLOW-REBUILD-PREP-01 — Preparação Final para Reconstrução

**Sprint ID:** MEDICFLOW-REBUILD-PREP-01  
**Data:** 01/07/2026  
**Escopo:** Eliminar bloqueadores editoriais P0 — **sem** criar projeto Supabase, executar migrations, deploy ou alterar infraestrutura cloud.

**Relacionado:** [`MEDICFLOW_REBUILD_CERTIFICATION.md`](./MEDICFLOW_REBUILD_CERTIFICATION.md) (NO-GO anterior) · [`MEDICFLOW_SECRETS_INVENTORY.md`](./MEDICFLOW_SECRETS_INVENTORY.md) · [`MEDICFLOW_REBUILD_FINAL_CHECKLIST.md`](./MEDICFLOW_REBUILD_FINAL_CHECKLIST.md)

---

## Veredito da sprint

# REBUILD PREPARATION = GO

A próxima sprint deverá ser **MEDICFLOW-REBUILD-01** (criação do novo projeto Supabase e reconstrução completa do ambiente).

---

## Respostas obrigatórias

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | A migration #29 foi versionada e publicada? | **Sim** — commit em `origin/main` (ver evidência abaixo) |
| 2 | O problema do seed foi resolvido? | **Sim** — `config.toml` corrigido (Opção B; ver Fase 2) |
| 3 | O inventário de secrets está completo? | **Sim** — [`MEDICFLOW_SECRETS_INVENTORY.md`](./MEDICFLOW_SECRETS_INVENTORY.md) |
| 4 | O repositório está pronto para reconstrução? | **Sim** — cadeia DDL completa, seed CLI resolvido, docs de rebuild |
| 5 | Existe algum bloqueador restante? | **Não para preparação editorial.** Itens operacionais (projeto cloud, secrets reais, redeploy) ficam para MEDICFLOW-REBUILD-01 |

---

## FASE 1 — Migration #29

### Arquivo auditado

`supabase/migrations/20260701120000_knowledge_embeddings_pgvector.sql`

### Checklist de auditoria

| Critério | Resultado | Evidência |
|----------|-----------|-----------|
| Completa (DDL + índices + RPC + RLS + trigger) | ✅ | Extensão `vector`, tabelas `knowledge_embeddings` e `knowledge_index_runs`, HNSW, `match_knowledge_embeddings`, policies SELECT, trigger `updated_at` |
| Consistente com migrations anteriores | ✅ | FK `tenant_id → tenants`; RLS via `current_tenant_ids()`; padrão `extensions.vector(1536)` alinhado ao código RAG |
| Dependências ausentes | ✅ Nenhuma | `tenants` (#1), `current_tenant_ids()` (#2), `pgcrypto` (#1) |
| Pronta para banco vazio | ✅ | `CREATE EXTENSION IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION` — idempotente após migrations 1–28 |
| Ordem na cadeia | ✅ | Timestamp `20260701120000` > última migration `20250525180000` |
| Validação automatizada | ✅ | `migration-validate.mjs`: `migration_count=29`, `order_ok=true`, `tables_defined=65`, `duplicate_versions=[]` |

### Observações técnicas

- Dimensão de embedding **1536** compatível com `text-embedding-3-small` (código em `src/lib/rag/`).
- Escrita na indexação via **service role** (sem policy INSERT para `authenticated`) — intencional.
- `major_version = 17` em `config.toml` suporta `EXECUTE FUNCTION` no trigger.

### Ação executada

Migration adicionada ao Git e publicada em `origin/main`.

### Evidência do commit

Registrada na seção **Evidências** ao final deste documento após `git push`.

---

## FASE 2 — Seed

### Diagnóstico

| Item | Estado anterior |
|------|-----------------|
| `supabase/config.toml` `[db.seed]` | `enabled = true`, `sql_paths = ["./seed.sql"]` |
| `supabase/seed.sql` | **Ausente** — quebrava `supabase db reset` |
| Seeds operacionais | Já nas migrations #21 (demo tenant), #24 (bootstrap admin), #28 (rebrand) |

### Decisão: Opção B — corrigir `config.toml`

**Justificativa:**

1. **Estratégia do projeto:** dados iniciais são **migration-based**, não CLI seed — documentado em `MEDICFLOW_REBUILD_INVENTORY.md` §1.8.
2. **Evita duplicação:** um `seed.sql` mínimo seria vazio ou redundante com migrations existentes.
3. **Correção cirúrgica:** `enabled = false` + `sql_paths = []` elimina o erro sem inventar artefato desnecessário.
4. **Extensibilidade:** comentário no `config.toml` indica como reabilitar se `supabase/seed.sql` for criado futuramente.
5. **Seed sintético separado:** `scripts/synthetic/datasets/sql/synthetic_seed_20260701.sql` permanece para aplicação manual pós-rebuild (fora do `db reset` padrão).

### Ação executada

```toml
[db.seed]
enabled = false
sql_paths = []
```

---

## FASE 3 — Inventário de configurações externas

Documento dedicado: [`MEDICFLOW_SECRETS_INVENTORY.md`](./MEDICFLOW_SECRETS_INVENTORY.md)

Nenhum valor de secret exposto — somente nomes, descrição, obrigatoriedade e local de uso.

---

## FASE 4 — Checklist de reconstrução

Documento definitivo: [`MEDICFLOW_REBUILD_FINAL_CHECKLIST.md`](./MEDICFLOW_REBUILD_FINAL_CHECKLIST.md)

Separado por etapas: Projeto Supabase, Banco, Storage, Auth, Secrets, Cloudflare, Deploy, RAG, Knowledge, IA, Validação.

---

## FASE 5 — Validação final

| Verificação | Status |
|-------------|--------|
| Migration 29 disponível no GitHub | ✅ Após push desta sprint |
| Cadeia completa de migrations (29 arquivos) | ✅ 28 versionadas + #29 commitada |
| Seed resolvido | ✅ `config.toml` sem referência a arquivo ausente |
| Nenhuma migration ausente na sequência | ✅ `order_ok=true` |
| Nenhum conflito de versões | ✅ `duplicate_versions=[]`, `enum_conflicts=[]` |
| Inventário de secrets concluído | ✅ Documento dedicado |

---

## Bloqueadores P0 — status pós-sprint

| Bloqueador (certificação anterior) | Status |
|------------------------------------|--------|
| Migration pgvector #29 não em `origin/main` | ✅ **Resolvido** |
| `seed.sql` ausente referenciado em `config.toml` | ✅ **Resolvido** |
| Projeto cloud `utodix` removido | ⏳ **MEDICFLOW-REBUILD-01** — recriação intencional |
| Secrets/SMTP não versionados | ⏳ **MEDICFLOW-REBUILD-01** — inventário pronto; provisionamento manual |

---

## Evidências

### E1 — Validação local de migrations

```json
{
  "migration_count": 29,
  "order_ok": true,
  "duplicate_versions": [],
  "tables_defined": 65,
  "enums_in_files": 37,
  "critical.initArtifacts.current_tenant_ids": true
}
```

Fonte: `node scripts/migration-validate.mjs` — 01/07/2026.

### E2 — Commit e publicação

```
Commit: 2bab23d6c9a4c2817d143f859ab162dfb4512aca
Mensagem: chore(rebuild-prep): versionar migration RAG #29 e resolver seed CLI
Branch: main
Remote: origin → https://github.com/ararunaf/medflow-dashboard.git
Push: 422c773..2bab23d  main → main (01/07/2026)
Arquivos:
  - supabase/migrations/20260701120000_knowledge_embeddings_pgvector.sql
  - supabase/config.toml
  - docs/MEDICFLOW_REBUILD_PREP.md
  - docs/MEDICFLOW_SECRETS_INVENTORY.md
  - docs/MEDICFLOW_REBUILD_FINAL_CHECKLIST.md
```

---

## Próxima sprint

**MEDICFLOW-REBUILD-01**

1. Criar projeto Supabase (`medicflow-staging`, região `sa-east-1`)
2. `supabase link` + `supabase db push` (migrations 1–29)
3. Provisionar secrets (ver inventário)
4. Configurar SMTP no Dashboard Auth
5. Atualizar `staging-supabase.mjs` e `.env.staging`
6. Redeploy Cloudflare Worker staging
7. `npm run rag:index:full`
8. Homologação E2E

---

*Sprint MEDICFLOW-REBUILD-PREP-01 — preparação editorial concluída. Nenhuma infraestrutura foi criada ou modificada.*
