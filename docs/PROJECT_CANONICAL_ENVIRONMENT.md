# PROJECT CANONICAL ENVIRONMENT — MedicFlow-AI

**Sprint ID:** MEDICFLOW-CANONICAL-ENVIRONMENT-01  
**Data:** 06/07/2026  
**Tipo:** Fonte única de verdade do ambiente oficial de desenvolvimento  
**Escopo:** Apenas informações comprovadas em auditorias e certificações anteriores — sem novas investigações

**Fontes primárias:** `PROJECT_GOVERNANCE.md`, `ENVIRONMENT_ARCHITECTURE.md`, `MEDICFLOW_STAGING_GO_01.md`, `MEDICFLOW_ENV_RECOVERY_01.md`, `MEDICFLOW_DATABASE_CERTIFICATION_FINAL.md`, `AUDITORIA_OWNERSHIP_INVENTARIO.md`

---

## Identidade do Projeto

| Campo | Valor | Evidência |
|-------|-------|-----------|
| **Projeto** | MedicFlow-AI | `package.json`, documentação interna |
| **Repositório Oficial** | `ararunaf/medflow-dashboard` | `git remote -v`; `AUDITORIA_OWNERSHIP_INVENTARIO` |
| **URL do repositório** | `https://github.com/ararunaf/medflow-dashboard.git` | `git remote -v` |
| **Branch principal** | `main` | `AUDITORIA_OWNERSHIP_INVENTARIO` |

---

## Supabase — Projeto Oficial

| Campo | Valor | Evidência |
|-------|-------|-----------|
| **Projeto Supabase Oficial** | MedicFlow-AI-Staging | `MEDICFLOW_ENV_RECOVERY_01`; cache `linked-project.json` (03/07/2026) |
| **Project Ref** | `vbfulflzekrnejwetcyr` | `MEDICFLOW_ENV_RECOVERY_01`, `MEDICFLOW_DATABASE_CERTIFICATION_FINAL`, `scripts/lib/staging-supabase.mjs` |
| **URL API** | `https://vbfulflzekrnejwetcyr.supabase.co` | Probes REST e build staging (03/07/2026) |
| **Região** | `sa-east-1` | `MEDICFLOW_ENV_RECOVERY_01`, `MEDICFLOW_REBUILD_02` |
| **Schema certificado** | 29 migrations, 65 tabelas, 159 policies RLS | `MEDICFLOW_DATABASE_CERTIFICATION_FINAL` |

---

## Ambiente Oficial

| Campo | Valor | Evidência |
|-------|-------|-----------|
| **Ambiente Oficial de Desenvolvimento** | `staging.medicflow.app.br` | `wrangler.jsonc`, `MEDICFLOW_STAGING_GO_01` |
| **URL pública** | `https://staging.medicflow.app.br` | Smoke tests staging (03/07/2026) |
| **Veredito operacional** | STAGING = GO (03/07/2026) | `MEDICFLOW_STAGING_GO_01` |

---

## Cloudflare

| Campo | Valor | Evidência |
|-------|-------|-----------|
| **Worker de staging** | `medflow-ia` | `wrangler.jsonc`; deploy 03/07/2026 |
| **Rota Worker** | `staging.medicflow.app.br/*` | `wrangler.jsonc` |
| **Zone** | `medicflow.app.br` | `wrangler.jsonc` → `zone_name` |

---

## Domínio

| Campo | Valor | Evidência |
|-------|-------|-----------|
| **Domínio raiz** | `medicflow.app.br` | RDAP; `wrangler.jsonc` |
| **Subdomínio staging** | `staging.medicflow.app.br` | HTTP 200; Cloudflare proxy — `MEDICFLOW_STAGING_GO_01` |

---

## Ambiente Oficial de Desenvolvimento

Todas as futuras implementações deverão utilizar **EXCLUSIVAMENTE**:

- **Repositório GitHub:** `ararunaf/medflow-dashboard`
- **Projeto Supabase:** `vbfulflzekrnejwetcyr` (MedicFlow-AI-Staging)
- **Ambiente:** `staging.medicflow.app.br`

Nenhuma nova sprint poderá criar outro projeto Supabase, trocar Project Ref ou alterar o ambiente oficial sem autorização explícita documentada.

Implementações futuras — incluindo OCR, Parser TISS, Auditoria Preventiva, Learning Loop, Copilot e RAG — devem utilizar exclusivamente o ambiente definido neste documento.

---

## Regras Permanentes

Regras obrigatórias para agentes de IA (Cursor) e para qualquer contribuidor:

1. Sempre utilizar o Project Ref oficial (`vbfulflzekrnejwetcyr`).
2. Nunca criar automaticamente novo projeto Supabase.
3. Nunca alterar o Project Ref.
4. Nunca alterar o ambiente oficial.
5. Nunca inferir ownership.
6. Nunca substituir documentação oficial por hipóteses.
7. Sempre consultar `PROJECT_CANONICAL_ENVIRONMENT.md` antes de qualquer alteração de infraestrutura.

---

## Governança

- O repositório GitHub (`ararunaf/medflow-dashboard`) é a origem oficial do código.
- O Project Ref `vbfulflzekrnejwetcyr` é o ambiente oficial de staging.
- Questões administrativas de ownership (Cloudflare, organização Supabase, membros ou billing) pertencem à governança e **NÃO** alteram o ambiente oficial de desenvolvimento.
- Enquanto não houver decisão formal documentada, o ambiente oficial permanece inalterado.
- Nenhuma futura auditoria deverá alterar este documento sem uma decisão formal documentada.

---

## Status da Sprint

| Veredito | Data |
|--------|------|
| **CANONICAL ENVIRONMENT = GO** | 06/07/2026 |

Após esta sprint, considera-se encerrada qualquer discussão sobre qual projeto utilizar para desenvolvimento.
