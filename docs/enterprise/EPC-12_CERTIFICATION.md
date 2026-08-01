# EPC-12 — Document Intake Foundation Certification Report

**Sprint:** EPC-12 — Document Intake Foundation  
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
| 6 | Quantos adapters foram criados? | **2** (`DefaultDocumentIntakeAdapter`, `MockDocumentIntakeAdapter`) |
| 7 | Quantos ports foram criados? | **1** (`DocumentIntakePort`) |
| 8 | Quantos modelos canônicos foram definidos? | **1** (`DocumentIntake`) — enums/refs auxiliares: `SourceType`, `IntakeStatus`, refs opacas |
| 9 | Existe qualquer conhecimento clínico? | **Não** |
| 10 | Existe qualquer conhecimento TISS? | **Não** |
| 11 | Existe OCR implementado? | **Não** |
| 12 | Todos os testes passaram? | **Sim** nos gates executados para esta sprint (ver §4) |
| 13 | O comportamento permanece 100% compatível? | **Sim** — nenhum fluxo de usuário foi redirecionado ao Port |
| 14 | O modelo suporta múltiplas origens? | **Sim** — enum `SourceType` (UPLOAD, WATCH_FOLDER, API, EMAIL, SCANNER, TWAIN, WIA, FILE_SYSTEM, XML, JSON, WEBSERVICE, OUTRO) |
| 15 | O modelo suporta versionamento? | **Sim** (prep) — via `documentIdentityReference.version` e demais refs versionadas; Intake não versiona conteúdo |
| 16 | O modelo está preparado para OCR Providers? | **Sim** (prep) — refs opacas / `customAttributes`; OCR **não** acoplado |
| 17 | O modelo está preparado para AI Providers? | **Sim** (prep) — refs opacas / `customAttributes`; IA **não** acoplada |
| 18 | O modelo está preparado para Workflow? | **Sim** — `workflowReference` (opaca) |
| 19 | O modelo está preparado para Contract Foundation? | **Sim** (prep) — `IntakeOpaqueReference` / `customAttributes`; Contract **não** acoplado |
| 20 | O modelo está preparado para Document Identity? | **Sim** — `documentIdentityReference` (opaca) |

---

## 2. Critérios de aprovação

| Critério | Status |
|----------|--------|
| Nenhuma funcionalidade do MedicFlow mudou | ✅ |
| Nenhuma tela mudou | ✅ |
| Nenhuma API mudou | ✅ |
| Nenhuma migration criada | ✅ |
| Nenhum OCR implementado | ✅ |
| Nenhuma IA implementada | ✅ |
| Nenhum parser implementado | ✅ |
| Document Intake totalmente genérico | ✅ |
| Suporta múltiplas origens documentais | ✅ |
| Apenas referências opacas aos demais componentes | ✅ |
| Arquitetura segue ECS-01 | ✅ |

---

## 3. Inventário de arquivos EPC-12

### Código (20)

- `src/lib/enterprise/document-intake/ports/types.ts`
- `src/lib/enterprise/document-intake/ports/document-intake-port.ts`
- `src/lib/enterprise/document-intake/ports/identity.ts`
- `src/lib/enterprise/document-intake/ports/lifecycle.ts`
- `src/lib/enterprise/document-intake/ports/source-type.ts`
- `src/lib/enterprise/document-intake/ports/references.ts`
- `src/lib/enterprise/document-intake/ports/index.ts`
- `src/lib/enterprise/document-intake/store/document-intake-store.ts`
- `src/lib/enterprise/document-intake/store/default-document-intake-store.ts`
- `src/lib/enterprise/document-intake/store/index.ts`
- `src/lib/enterprise/document-intake/adapters/default-document-intake-adapter.ts`
- `src/lib/enterprise/document-intake/adapters/mock-document-intake-adapter.ts`
- `src/lib/enterprise/document-intake/adapters/index.ts`
- `src/lib/enterprise/document-intake/factory/document-intake-factory.ts`
- `src/lib/enterprise/document-intake/factory/index.ts`
- `src/lib/enterprise/document-intake/providers/create-document-intake-port.ts`
- `src/lib/enterprise/document-intake/providers/index.ts`
- `src/lib/enterprise/document-intake/demo/document-intake-health-query.ts`
- `src/lib/enterprise/document-intake/demo/index.ts`
- `src/lib/enterprise/document-intake/index.ts`

### Testes / tooling (2)

- `scripts/enterprise/tests/document-intake-engine.test.ts`
- `package.json` (script `enterprise:document-intake:test`)

### Documentação (4)

- `docs/enterprise/EPC-12_DOCUMENT_INTAKE_FOUNDATION.md`
- `docs/enterprise/EPC-12_DOCUMENT_INTAKE_MODEL.md`
- `docs/enterprise/EPC-12_ARCHITECTURE.md`
- `docs/enterprise/EPC-12_CERTIFICATION.md`

**Total: 26 arquivos no escopo EPC-12** (contando `index.ts` raiz do módulo).

Nenhum arquivo de rotas, Server Functions, Settings, Auth, OCR, IA, Captura, Workflow, Rule Engine de produto, TISS, Financeiro, RLS ou migrations foi modificado por esta sprint (exceto `package.json` apenas para o script de teste).

---

## 4. Evidência de testes (31/07/2026)

### RESULTADO DA SPRINT (escopo EPC-12)

| Gate | Comando | Resultado |
|------|---------|-----------|
| Document Intake Engine | `npm run enterprise:document-intake:test` | **PASS** — 14/14 |
| Persistence Ports (regressão) | `npm run enterprise:persistence:test` | **PASS** — 8/8 |
| Storage Ports (regressão) | `npm run enterprise:storage:test` | **PASS** — 12/12 |
| Configuration Engine (regressão) | `npm run enterprise:configuration:test` | **PASS** — 14/14 |
| Metadata Engine (regressão) | `npm run enterprise:metadata:test` | **PASS** — 14/14 |
| Workflow Engine (regressão) | `npm run enterprise:workflow:test` | **PASS** — 13/13 |
| Rule Engine (regressão) | `npm run enterprise:rule:test` | **PASS** — 14/14 |
| Expression Engine (regressão) | `npm run enterprise:expression:test` | **PASS** |
| AI Provider Engine (regressão) | `npm run enterprise:ai-provider:test` | **PASS** |
| Document Identity (regressão) | `npm run enterprise:document-identity:test` | **PASS** — 14/14 |
| Rule Pack (regressão) | `npm run enterprise:rule-pack:test` | **PASS** — 14/14 |
| Tenant (regressão) | `npm run enterprise:tenant:test` | **PASS** — 14/14 |
| Tenant Assignment (regressão) | `npm run enterprise:tenant-assignment:test` | **PASS** — 16/16 |
| Contract (regressão) | `npm run enterprise:contract:test` | **PASS** — 13/13 |
| Smoke | `npm run smoke-check` | **PASS** |
| ESLint (escopo EPC-12) | `npx eslint src/lib/enterprise/document-intake/** scripts/enterprise/tests/document-intake-engine.test.ts` | **PASS** |
| TypeScript (arquivos EPC-12) | `npx tsc --noEmit` | **0 erros** sob `src/lib/enterprise/document-intake/` |

### ESTADO GLOBAL DO PROJETO (pré-existente — fora do escopo EPC-12)

| Gate | Resultado | Nota |
|------|-----------|------|
| Build | **FAIL pré-existente** | `useTenantBranding` não exportado em `tenant-branding-provider.tsx` / rota `executivo.tsx` — **igual às EPC anteriores**; não introduzido pelo Document Intake |
| TypeScript (repo) | **FAIL pré-existente** | Diagnósticos em Capture/TISS/Operational/UI — **nenhum** sob `src/lib/enterprise/document-intake/` |

A certificação desta sprint valida que:

1. Nenhum erro novo foi introduzido sob `src/lib/enterprise/document-intake/`
2. Suites Enterprise automatizadas continuam PASS
3. Nenhuma superfície de produto (UI/API/OCR/IA/Captura/Upload/Watcher/Scanner/E-mail/DB) foi ligada ao Port

---

## 5. Arquitetura certificada

```
Application (PoC getDocumentIntakeHealthSummary)
    ↓
DocumentIntakePort
    ↓
DefaultDocumentIntakeAdapter | MockDocumentIntakeAdapter
    ↓
DocumentIntakeStore (in-process)
    ↓
DocumentIntakeFactory
    ↓
createDocumentIntakePort (Provider)
```

- Default de produção: `DefaultDocumentIntakeAdapter`
- Testes / offline: `MockDocumentIntakeAdapter` (`mock` | `test`)
- Providers futuros (`database` / `remote` / `registry`): erro explícito

---

## 6. Declaração final

A sprint **EPC-12 — Document Intake Foundation** está **APROVADA**.

O Document Intake é uma infraestrutura canônica genérica de entrada documental, desacoplada de OCR, IA, captura, TISS e contratos, preparada para referenciar componentes Enterprise via ids opacos, mantendo 100% de compatibilidade com o comportamento atual do MedicFlow.
