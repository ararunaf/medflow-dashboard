# EPC-04 — Metadata Engine Certification Report

**Sprint:** EPC-04 — Metadata Engine Foundation  
**Data:** 31/07/2026  
**Resultado:** **APROVADA** (fundação arquitetural; comportamento do produto inalterado)

---

## 1. Questionário obrigatório

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Alguma funcionalidade mudou? | **Não** |
| 2 | Alguma tela mudou? | **Não** |
| 3 | Alguma API mudou? | **Não** |
| 4 | Alguma migration foi criada? | **Não** |
| 5 | Algum comportamento mudou? | **Não** |
| 6 | Quantos arquivos foram alterados? | **23** (escopo EPC-04 — ver §3) |
| 7 | Quantos adapters foram criados? | **2** (`DefaultMetadataAdapter`, `MockMetadataAdapter`) |
| 8 | Quantos ports foram criados? | **1** (`MetadataPort`) |
| 9 | Quantos módulos passaram a utilizar MetadataPort? | **1** (PoC Application `getMetadataHealthSummary` — **não** ligado a UI/API/Settings) |
| 10 | Existe regressão conhecida? | **Não** atribuível a EPC-04 |
| 11 | Todos os testes passaram? | **Sim** nos gates executados para esta sprint (ver §4) |
| 12 | O comportamento permanece 100% compatível? | **Sim** — nenhum fluxo de usuário foi redirecionado ao Port |
| 13 | O Metadata Engine conhece alguma entidade clínica? | **Não** |
| 14 | O Metadata Engine está preparado para descrever qualquer domínio futuramente? | **Sim** — conceitos nativos abstratos + Schema/Entity/Template genéricos |
| 15 | O Metadata Engine suporta versionamento de esquemas? | **Sim** — `MetadataVersionInfo` (Version/Status/CreatedAt/UpdatedAt/Author/Compatibility); sem banco |
| 16 | O Metadata Engine suporta herança de esquemas? | **Sim (infraestrutura)** — campo `extends` + helpers; merge complexo **não** implementado |
| 17 | O Metadata Engine está preparado para ser utilizado por Workflow, Rule Engine, IA e OCR futuramente? | **Sim** — documentado em migration plan / engine doc; **nenhum** acoplado nesta sprint |

---

## 2. Critérios de aprovação

| Critério | Status |
|----------|--------|
| Nenhuma funcionalidade do usuário alterada | ✅ |
| Nenhuma tela alterada | ✅ |
| Nenhuma API modificada | ✅ |
| Nenhuma migration criada | ✅ |
| Nenhuma regressão identificada (EPC-04) | ✅ |
| Metadata Engine totalmente genérico | ✅ |
| Nenhuma entidade de negócio codificada no Engine | ✅ |
| Engine conhece apenas conceitos abstratos | ✅ |
| Arquitetura preparada para reutilização por qualquer domínio | ✅ |
| Reutilizável em qualquer plataforma IAeasy (sem dependência MedicFlow) | ✅ |

---

## 3. Inventário de arquivos EPC-04

### Código (17)

- `src/lib/enterprise/metadata/ports/types.ts`
- `src/lib/enterprise/metadata/ports/metadata-port.ts`
- `src/lib/enterprise/metadata/ports/inheritance.ts`
- `src/lib/enterprise/metadata/ports/versioning.ts`
- `src/lib/enterprise/metadata/ports/constraints.ts`
- `src/lib/enterprise/metadata/ports/index.ts`
- `src/lib/enterprise/metadata/store/metadata-store.ts`
- `src/lib/enterprise/metadata/store/default-metadata-store.ts`
- `src/lib/enterprise/metadata/store/index.ts`
- `src/lib/enterprise/metadata/adapters/default-metadata-adapter.ts`
- `src/lib/enterprise/metadata/adapters/mock-metadata-adapter.ts`
- `src/lib/enterprise/metadata/adapters/index.ts`
- `src/lib/enterprise/metadata/providers/create-metadata-port.ts`
- `src/lib/enterprise/metadata/providers/index.ts`
- `src/lib/enterprise/metadata/demo/metadata-health-query.ts`
- `src/lib/enterprise/metadata/demo/index.ts`
- `src/lib/enterprise/metadata/index.ts`

### Testes / tooling (2)

- `scripts/enterprise/tests/metadata-engine.test.ts`
- `package.json` (script `enterprise:metadata:test`)

### Documentação (4)

- `docs/enterprise/EPC-04_METADATA_ENGINE.md`
- `docs/enterprise/EPC-04_METADATA_ARCHITECTURE.md`
- `docs/enterprise/EPC-04_METADATA_MIGRATION_PLAN.md`
- `docs/enterprise/EPC-04_METADATA_CERTIFICATION.md`

**Total: 23 arquivos no escopo EPC-04.**

Nenhum arquivo de rotas, Server Functions, Settings, Auth, OCR, IA, Workflow, Storage, Persistence, TISS, Financeiro, Captura Inteligente, RLS ou migrations foi modificado por esta sprint.

---

## 4. Evidência de testes (31/07/2026)

### Resultado da Sprint (escopo EPC-04)

| Gate | Comando | Resultado |
|------|---------|-----------|
| Metadata Engine | `npm run enterprise:metadata:test` | **PASS** — 14/14 |
| Persistence Ports (regressão) | `npm run enterprise:persistence:test` | **PASS** — 8/8 |
| Storage Ports (regressão) | `npm run enterprise:storage:test` | **PASS** — 12/12 |
| Configuration Engine (regressão) | `npm run enterprise:configuration:test` | **PASS** — 14/14 |
| Capture suite | `npm run capture:test:all` | **PASS** — 198 pass, 1 skipped |
| Smoke | `npm run smoke-check` | **PASS** |
| ESLint (escopo EPC-04) | `npx eslint src/lib/enterprise/metadata/** scripts/enterprise/tests/metadata-engine.test.ts` | **PASS** |
| TypeScript (arquivos EPC-04) | `npx tsc --noEmit` | **0 erros** sob `src/lib/enterprise/metadata/` |

### Estado Global do Projeto (pré-existente — fora do escopo EPC-04)

| Gate | Resultado | Nota |
|------|-----------|------|
| Build | **FAIL pré-existente** | `useTenantBranding` não exportado em `tenant-branding-provider.tsx` / rota `executivo.tsx` — **igual às EPC-01/02/03**; não introduzido pelo Metadata Engine |
| TypeScript (repo) | **FAIL pré-existente** | Diagnósticos em Capture/TISS/Operational/UI — **nenhum** sob `src/lib/enterprise/metadata/` |

A certificação desta sprint valida que:

1. Nenhum erro novo foi introduzido sob `src/lib/enterprise/metadata/`
2. Suites automatizadas relevantes continuam PASS
3. Nenhuma superfície de produto (UI/API/Settings/OCR/IA/Workflow/Storage/Persistence) foi ligada ao Port

---

## 5. Arquitetura certificada

```
Application (demo PoC + futuros use-cases)
        ↓ depende de
MetadataPort
        ↓ implementado por
DefaultMetadataAdapter  (default)
MockMetadataAdapter     (test/mock/offline)
        ↓ usa
MetadataStore
        ↓
DefaultMetadataStore (in-process — sem banco novo)
```

Inversão de dependência: Domain/Application → Port; Adapter → Store/Infrastructure.

Conceitos nativos únicos: Entity · Attribute · Relationship · Constraint · Schema · Template · Property · Enumeration · Reference · Validation · Version · Namespace · Tag · Category.

---

## 6. Declaração final

EPC-04 está **aprovada** como fundação do Metadata Engine Enterprise.  
O Core permanece compatível; o Engine é genérico, sem entidades clínicas, e está preparado para descrever qualquer domínio futuramente **sem alterar a arquitetura do Port**.
