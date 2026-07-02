# MEDICFLOW-REBUILD-PREP-01 — Checklist Definitivo de Reconstrução

**Sprint ID:** MEDICFLOW-REBUILD-PREP-01  
**Data:** 01/07/2026  
**Uso:** Executar na ordem durante **MEDICFLOW-REBUILD-01**  
**Legenda:** ☐ pendente · ☑ pronto

**Relacionado:** [`MEDICFLOW_REBUILD_PREP.md`](./MEDICFLOW_REBUILD_PREP.md) · [`MEDICFLOW_SECRETS_INVENTORY.md`](./MEDICFLOW_SECRETS_INVENTORY.md)

---

## Status da preparação (MEDICFLOW-REBUILD-PREP-01)

| Item preparatório | Status |
|-------------------|--------|
| Migration #29 versionada | ☑ pronto |
| Seed CLI resolvido (`config.toml`) | ☑ pronto |
| Cadeia migrations 1–29 validada | ☑ pronto |
| Inventário de secrets | ☑ pronto |
| Documentação de rebuild | ☑ pronto |

**Veredito preparação:** REBUILD PREPARATION = **GO** → iniciar **MEDICFLOW-REBUILD-01**

---

## 1. Projeto Supabase

| Status | Item | Notas |
|--------|------|-------|
| ☐ | Criar projeto Supabase novo | Nome sugerido: `medicflow-staging`; região `sa-east-1` |
| ☐ | Anotar `project_ref` | Subdomínio `<ref>.supabase.co` |
| ☐ | `supabase link --project-ref <ref>` | Regenerar `linked-project.json` |
| ☐ | Atualizar `scripts/lib/staging-supabase.mjs` | Substituir ref morto `utodixhxrvegzafcldpu` |
| ☐ | Confirmar PostgreSQL 17 | Alinhado a `config.toml` `major_version = 17` |
| ☑ | Documentação de migrations completa | 29 arquivos em `supabase/migrations/` |

---

## 2. Banco

| Status | Item | Notas |
|--------|------|-------|
| ☐ | `supabase db push` (migrations 1–29) | Aplicar cadeia completa em banco vazio |
| ☑ | Migration #1–28 versionadas | `origin/main` |
| ☑ | Migration #29 pgvector | `20260701120000_knowledge_embeddings_pgvector.sql` |
| ☐ | Extensão `pgcrypto` | Migration #1 |
| ☐ | Extensão `vector` (pgvector) | Migration #29 |
| ☐ | Validar 65 tabelas | `npm run migration-validate` → exit 0 |
| ☐ | Validar 37 enums | Sem conflitos |
| ☐ | Validar 33 RPCs | Inclui `match_knowledge_embeddings` |
| ☐ | Validar 166 policies RLS | `enterprise_schema_audit.sql` no SQL Editor |
| ☐ | Validar 21 triggers | — |
| ☑ | Ordem migrations (`order_ok`) | Validado localmente |
| ☑ | Seed CLI (`db reset`) | `config.toml`: seed desabilitado; dados nas migrations |

---

## 3. Storage

| Status | Item | Notas |
|--------|------|-------|
| ☐ | Bucket `tenant-branding` criado | Migration #21 |
| ☐ | 4 storage policies aplicadas | SELECT public; INSERT/UPDATE/DELETE admin |
| ☐ | Teste upload logo demo tenant | Homologação P4 |
| ☑ | DDL bucket versionado | Migration #21 |

---

## 4. Auth

| Status | Item | Notas |
|--------|------|-------|
| ☐ | Email provider habilitado | Dashboard Supabase |
| ☐ | SMTP configurado | Host, port, user, password — Dashboard (não versionado) |
| ☐ | Site URL configurada | `https://staging.medicflow.app.br` |
| ☐ | Redirect URLs configuradas | Staging + localhost dev |
| ☐ | Bootstrap admin funcional | Migration #24 — trocar senha pós-primeiro login |
| ☐ | Demo tenant acessível | Migration #21 |
| ☑ | JWT expiry documentado | `config.toml`: 3600s |
| ☑ | OAuth/MFA desabilitados | Defaults seguros em `config.toml` |

---

## 5. Secrets

| Status | Item | Notas |
|--------|------|-------|
| ☐ | `VITE_SUPABASE_URL` | `.env.staging` + build |
| ☐ | `VITE_SUPABASE_ANON_KEY` | `.env.staging` + build |
| ☐ | `SUPABASE_SERVICE_ROLE_KEY` | Worker secret + local |
| ☐ | `VITE_MEDFLOW_APP_URL` | `https://staging.medicflow.app.br` |
| ☐ | `MEDFLOW_OPENAI_API_KEY` | Worker secret + local |
| ☐ | `MEDFLOW_AUDIT_HASH_SALT` | Worker secret (recomendado) |
| ☐ | SMTP credentials | Supabase Dashboard Auth |
| ☑ | Inventário completo | [`MEDICFLOW_SECRETS_INVENTORY.md`](./MEDICFLOW_SECRETS_INVENTORY.md) |
| ☑ | Templates `.env.*.example` | Versionados |

---

## 6. Cloudflare

| Status | Item | Notas |
|--------|------|-------|
| ☑ | `wrangler.jsonc` versionado | Worker `medflow-ia` |
| ☑ | Rota staging configurada | `staging.medicflow.app.br/*` |
| ☐ | Worker secrets provisionados | `SUPABASE_SERVICE_ROLE_KEY`, OpenAI, audit salt |
| ☐ | Redeploy staging | `npm run deploy:staging` |
| ☐ | Validar bundle sem placeholders | `validate-staging-build.mjs` |
| ☐ | DNS staging operacional | Zona `medicflow.app.br` — sem alteração nesta sprint |

---

## 7. Deploy

| Status | Item | Notas |
|--------|------|-------|
| ☐ | `.env.staging` preenchido | Gitignored — novo URL + keys |
| ☐ | Build staging | `npm run build:staging` |
| ☐ | Deploy staging | `npm run deploy:staging` |
| ☐ | Smoke check | `npm run smoke-check` |
| ☐ | Homologação completa | `npm run homologacao` ou script equivalente |
| ☑ | Pipeline deploy versionado | `deploy-staging.mjs`, `staging-validate.mjs` |
| ☐ | Vercel produção | Não provisionado — fora do escopo staging V1 |

---

## 8. RAG

| Status | Item | Notas |
|--------|------|-------|
| ☑ | Migration pgvector | #29 commitada |
| ☑ | Código indexador | `src/lib/rag/`, `scripts/rag/cli/index-knowledge.ts` |
| ☑ | Corpus compilado | 569 chunks / 59 documentos (`knowledge/compiled/`) |
| ☐ | `npm run rag:index:full` | Requer service role + OpenAI key |
| ☐ | Validar `match_knowledge_embeddings` | Teste RPC com embedding real |
| ☐ | RAG E2E certificado | Re-certificar `AI_RAG_CERTIFICATION` |
| ☑ | Testes unitários RAG | `npm run rag:test` (local, sem cloud) |

---

## 9. Knowledge

| Status | Item | Notas |
|--------|------|-------|
| ☑ | Knowledge Compiler | `scripts/knowledge/cli/run-compiler.ts` |
| ☑ | Chunks JSONL | `knowledge/chunks/chunks.jsonl` |
| ☑ | Metadata engine | `scripts/knowledge/metadata/` |
| ☑ | Registry | `knowledge/registry/_registry.json` |
| ☐ | Recompilar pós-rebuild | `npm run knowledge:compile` (se necessário) |
| ☐ | Validar chunks no banco | Contagem pós-indexação |

---

## 10. IA

| Status | Item | Notas |
|--------|------|-------|
| ☑ | Synthetic Factory | `scripts/synthetic/cli/run-factory.ts` |
| ☑ | Copilot GPT (código) | `operational-gpt-openai.ts` |
| ☐ | Copilot E2E operacional | Requer OpenAI key + dados no DB |
| ☑ | Agent Catalog (blueprint) | `docs/AI_AGENT_CATALOG.md` |
| ☑ | Digital Twin (blueprint) | `docs/DIGITAL_TWIN_BLUEPRINT.md` |
| ☐ | Evaluation Harness runtime | Blueprint only — pós-V1 |

---

## 11. Validação

| Status | Item | Comando / evidência |
|--------|------|---------------------|
| ☐ | Migration validate local | `npm run migration-validate` → exit 0 |
| ☐ | Migration validate remoto | Probes REST 200 em tabelas core |
| ☐ | Auth validate | `npm run auth-validate` |
| ☐ | Multi-tenant validate | `npm run multi-tenant-auth-validate` |
| ☐ | Security logs validate | `npm run security-logs-validate` |
| ☐ | Seed validate | `npm run seed-validate` |
| ☐ | Staging validate | `npm run staging-validate` |
| ☐ | RAG unit tests | `npm run rag:test` |
| ☐ | Homologação completa | `homologacao-completa-staging.mjs` |
| ☐ | Certificação GO final | Atualizar checklist → todos ☑ |

---

## 12. Domínios futuros (fora escopo V1)

Blueprint MF-FOUNDATION-02 — **sem migrations**:

| Status | Domínio |
|--------|---------|
| ☐ | Beneficiários |
| ☐ | Autorização |
| ☐ | CID |
| ☐ | Elegibilidade |
| ☐ | Documentos clínicos |
| ☐ | Auditor médico |
| ☐ | Rule engine Phase 2 |

---

## Referência rápida — ordem de execução MEDICFLOW-REBUILD-01

```
1.  Criar projeto Supabase (sa-east-1)
2.  supabase link + db push (migrations 1–29)
3.  Configurar Auth SMTP + redirect URLs
4.  Provisionar secrets (.env.staging + Worker)
5.  Atualizar staging-supabase.mjs
6.  npm run build:staging && deploy:staging
7.  npm run migration-validate (remoto)
8.  npm run auth-validate
9.  npm run rag:index:full
10. npm run homologacao / staging-validate
11. Certificação GO final
```

---

## Histórico de vereditos

| Sprint | Veredito |
|--------|----------|
| MEDICFLOW-REBUILD-CERTIFICATION-01 | REBUILD = NO-GO (4 bloqueadores P0) |
| MEDICFLOW-REBUILD-PREP-01 | REBUILD PREPARATION = **GO** |
| MEDICFLOW-REBUILD-01 | ☐ Pendente |

---

*Checklist definitivo MEDICFLOW-REBUILD-PREP-01 — itens ☑ prontos no repositório; itens ☐ pendente para sprint de reconstrução.*
