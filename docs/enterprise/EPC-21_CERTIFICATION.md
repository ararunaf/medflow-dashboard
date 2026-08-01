# EPC-21 — TISS Mapping Foundation Certification Report

**Sprint:** EPC-21 — TISS Mapping Foundation  
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
| 6 | Quantos adapters foram criados? | **2** (`DefaultTISSMappingAdapter`, `MockTISSMappingAdapter`) |
| 7 | Quantos ports foram criados? | **1** (`TISSMappingPort`) |
| 8 | Quantos modelos canônicos foram definidos? | **6** (`FieldMapping`, `ConceptMapping`, `CanonicalMapping`, `MappingDefinition`, `MappingVersion`, `MappingRelationship`) |
| 9 | Existe parser XML implementado? | **NÃO** |
| 10 | Existe qualquer validação implementada? | **NÃO** |
| 11 | Existe qualquer regra implementada? | **NÃO** |
| 12 | Todos os testes passaram? | **Sim** nos gates executados para esta sprint (ver §4) |
| 13 | O comportamento permanece 100% compatível? | **Sim** — nenhum fluxo de usuário foi redirecionado ao Port |
| 14 | O Field Mapping está desacoplado do Healthcare Model? | **Sim** (`fieldMappingDecoupledFromHealthcareModel: true`) |
| 15 | O Concept Mapping utiliza apenas o Vocabulário TISS? | **Sim** (`conceptMappingUsesVocabularyOnly: true`) |
| 16 | O Canonical Mapping produz exclusivamente objetos do Healthcare Model? | **Sim** (`canonicalMappingProducesHealthcareModelOnly: true`) |
| 17 | A arquitetura suporta múltiplas fontes de dados? | **Sim** (`supportsMultiSource: true`; integração futura documentada) |
| 18 | A arquitetura suporta múltiplas versões da TISS? | **Sim** (`supportsMultiVersionTiss: true` + `MappingVersion`) |
| 19 | A arquitetura está preparada para OCR, APIs, JSON, CSV, FHIR e DICOM? | **Sim** (flags `supportsFuture*` + documentação FASE 11; sem implementação) |
| 20 | Toda a arquitetura permanece aderente à ECS-01? | **Sim** |

---

## 2. Critérios de aprovação

| Critério | Status |
|----------|--------|
| Nenhuma funcionalidade do MedicFlow mudou | ✅ |
| Nenhuma tela mudou | ✅ |
| Nenhuma API mudou | ✅ |
| Nenhuma migration criada | ✅ |
| Nenhum parser XML implementado | ✅ |
| Nenhuma validação implementada | ✅ |
| Nenhuma regra de negócio implementada | ✅ |
| Mapping permanece totalmente declarativo | ✅ |
| Separação Field / Concept / Canonical | ✅ |
| Healthcare Model desacoplado da origem | ✅ |
| Arquitetura segue integralmente a ECS-01 | ✅ |

---

## 3. Inventário de arquivos EPC-21

### Código (19)

- `src/lib/enterprise/tiss-mapping/ports/types.ts`
- `src/lib/enterprise/tiss-mapping/ports/models.ts`
- `src/lib/enterprise/tiss-mapping/ports/relationships.ts`
- `src/lib/enterprise/tiss-mapping/ports/identity.ts`
- `src/lib/enterprise/tiss-mapping/ports/tiss-mapping-port.ts`
- `src/lib/enterprise/tiss-mapping/ports/index.ts`
- `src/lib/enterprise/tiss-mapping/adapters/default-tiss-mapping-adapter.ts`
- `src/lib/enterprise/tiss-mapping/adapters/mock-tiss-mapping-adapter.ts`
- `src/lib/enterprise/tiss-mapping/adapters/index.ts`
- `src/lib/enterprise/tiss-mapping/store/tiss-mapping-store.ts`
- `src/lib/enterprise/tiss-mapping/store/default-tiss-mapping-store.ts`
- `src/lib/enterprise/tiss-mapping/store/index.ts`
- `src/lib/enterprise/tiss-mapping/factory/tiss-mapping-factory.ts`
- `src/lib/enterprise/tiss-mapping/factory/index.ts`
- `src/lib/enterprise/tiss-mapping/providers/create-tiss-mapping-port.ts`
- `src/lib/enterprise/tiss-mapping/providers/index.ts`
- `src/lib/enterprise/tiss-mapping/demo/tiss-mapping-health-query.ts`
- `src/lib/enterprise/tiss-mapping/demo/index.ts`
- `src/lib/enterprise/tiss-mapping/index.ts`

### Testes / tooling (2)

- `scripts/enterprise/tests/tiss-mapping-engine.test.ts`
- `package.json` (script `enterprise:tiss-mapping:test`)

### Documentação (4)

- `docs/enterprise/EPC-21_TISS_MAPPING_FOUNDATION.md`
- `docs/enterprise/EPC-21_MAPPING_MODEL.md`
- `docs/enterprise/EPC-21_ARCHITECTURE.md`
- `docs/enterprise/EPC-21_CERTIFICATION.md`

**Total: 25 arquivos no escopo EPC-21** (19 código + 2 testes/tooling + 4 docs).

Nenhum arquivo de rotas, Server Functions, Settings, Auth, OCR, IA de produto, Document Processing, Metadata, Storage, Persistence, Configuration, Workflow de produto, Rule Packs, TISS de produto, Financeiro, Captura Inteligente, Healthcare Model, Vocabulary, RLS ou migrations foi modificado por esta sprint (exceto o script npm em `package.json`).

---

## 4. Evidência de testes (31/07/2026)

### RESULTADO DA SPRINT (escopo EPC-21)

| Gate | Comando | Resultado |
|------|---------|-----------|
| TISS Mapping Engine | `npm run enterprise:tiss-mapping:test` | **PASS** — 21/21 |
| ESLint (escopo EPC-21) | `npx eslint src/lib/enterprise/tiss-mapping/** scripts/enterprise/tests/tiss-mapping-engine.test.ts` | **PASS** |
| TypeScript | `npx tsc --noEmit` | **PASS** — 0 erros |
| Build | `npm run build` | **PASS** |
| Smoke | `npm run smoke-check` | **PASS** |

### ESTADO GLOBAL DO PROJETO

| Gate | Resultado | Nota |
|------|-----------|------|
| Build | **PASS** | Build completo ok nesta execução |
| TypeScript (repo) | **PASS** | `tsc --noEmit` exit 0 |
| ESLint | **PASS** | `npm run lint` exit 0 |
| Smoke | **PASS** | Estrutura / health público ok |
| Enterprise (todos) | **PASS** | 23 suites / 346 testes (inclui EPC-21 21/21) |

A certificação desta sprint valida que:

1. A fundação TISS Mapping está operacional em isolamento.
2. Nenhum comportamento de produto foi alterado.
3. Parser XML, validações e regras **não** foram implementados.
4. Field / Concept / Canonical permanecem separados e declarativos.
5. A arquitetura ECS-01 é respeitada integralmente.

---

## 5. Decisão

**EPC-21 — TISS Mapping Foundation: APROVADA.**

