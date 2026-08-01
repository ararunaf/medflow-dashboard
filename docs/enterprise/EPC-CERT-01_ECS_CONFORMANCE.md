# EPC-CERT-01 — ECS-01 Conformance Report

**Sprint:** EPC-CERT-01 — Enterprise Platform Core Certification  
**Data:** 31/07/2026  
**Especificação:** [`ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md`](./ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md)  
**Satélites:** Naming · Test · Documentation · Certification Standards

---

## 1. Escopo

Verificar estrutura, nomenclatura, organização, testes, documentação e certificação dos Engines EPC-01…EPC-06B contra ECS-01.

**Modo:** auditoria apenas — **sem correções**.

---

## 2. Checklist estrutural por Engine

| Critério | P01 | P02 | P03 | P04 | P05 | P06A | P06B |
|----------|-----|-----|-----|-----|-----|------|------|
| Pasta `enterprise/{component}/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (sub) |
| `ports/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | parcial (AST) |
| `adapters/` + Mock | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `providers/` + `createXxxPort` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `demo/` health PoC | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| Root `index.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `store/` se in-process | N/A | N/A | ✅ | ✅ | ✅ | ✅ | N/A |
| `runtime/` se execução pura | N/A | N/A | N/A | N/A | ✅ | via expr | ✅ |
| Sem pasta `factory/` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Sem pasta `types/` raiz | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `health` + `capabilities` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |

---

## 3. Nomenclatura

| Critério | Status | Nota |
|----------|--------|------|
| `{Xxx}Port` / `{Xxx}Health` / `{Xxx}Capabilities` | ✅ | Persistência usa `mechanism` em Health/Capabilities |
| `providerId` canônico | ⚠️ | Persistence: `mechanismId` (exceção legada ECS-01 § naming) |
| `Mock{Xxx}Adapter` | ✅ | Todos os Ports |
| `Default{Xxx}Adapter` | ✅ | Config/Metadata/Workflow/Rule |
| `{Vendor}{Xxx}Adapter` | ✅ | Persistence/Storage Supabase |
| `create{Xxx}Port` | ✅ | Todos os Ports |
| `get{Xxx}HealthSummary` | ✅ | Todos os demos |
| Arquivos kebab-case | ✅ | Conforme |

---

## 4. Testes (ECS-01 Test Standard)

| Engine | Arquivo | Script npm | Nome canônico `{component}-engine.test.ts` |
|--------|---------|------------|--------------------------------------------|
| Persistence | `persistence-ports.test.ts` | `enterprise:persistence:test` | ⚠️ exceção legada |
| Storage | `storage-ports.test.ts` | `enterprise:storage:test` | ⚠️ exceção legada |
| Configuration | `configuration-engine.test.ts` | `enterprise:configuration:test` | ✅ |
| Metadata | `metadata-engine.test.ts` | `enterprise:metadata:test` | ✅ |
| Workflow | `workflow-engine.test.ts` | `enterprise:workflow:test` | ✅ |
| Rule | `rule-engine.test.ts` | `enterprise:rule:test` | ✅ |
| Expression | `expression-engine.test.ts` | `enterprise:expression:test` | ✅ |

Cobertura observada nas suites: contract, mock, health, capabilities, factory/provider, smoke de superfície (sem vazamento vendor/domínio).

**Resultado execução EPC-CERT-01:** 88 testes · 0 falhas (ver certificação principal).

---

## 5. Documentação (ECS-01 Documentation Standard — Gen B)

| Engine | `*_ENGINE` / Ports | `*_ARCHITECTURE` | `*_MIGRATION_PLAN` | `*_CERTIFICATION` |
|--------|--------------------|------------------|--------------------|-------------------|
| Persistence | ✅ `*_PORTS` (Gen A) | ✅ `*_ARCHITECTURE_DECISIONS` (Gen A) | ✅ | ✅ |
| Storage | ✅ `*_PORTS` (Gen A) | ✅ `*_ARCHITECTURE_DECISIONS` (Gen A) | ✅ | ✅ |
| Configuration | ✅ | ✅ | ✅ | ✅ |
| Metadata | ✅ | ✅ | ✅ | ✅ |
| Workflow | ✅ | ✅ | ✅ | ✅ |
| Rule (06A) | ✅ | ✅ | ✅ | ✅ |
| Expression (06B) | ✅ `*_RULE_EXPRESSION_ENGINE` | ⚠️ AST + EVALUATOR (não `*_ARCHITECTURE`) | ❌ ausente | ✅ |

ECS-01 documenta Gen A de EPC-01/02 como **exceção legada não bloqueante**.

---

## 6. Conceitos duplicados / inconsistências de interface

| Conceito | Achado | Severidade | Impede EPC-07? |
|----------|--------|------------|----------------|
| Health / Capabilities | Padrão repetido por Engine (esperado); Persistence usa `mechanism` | BAIXO | Não |
| `MetadataReference` | Shape Metadata (`id/name/namespace…`) ≠ Rule/Workflow (`metadataId/…`) | MÉDIO | Não |
| Status | Uniões distintas por domínio (esperado); tokens sobrepostos | BAIXO | Não |
| Result / Outcome | `WorkflowResult` ≈ `RuleResult`; Outcomes só no Rule | BAIXO | Não |
| Context | Vários Contexts com propósitos diferentes | BAIXO | Não |
| Version | Labels string por Engine | BAIXO | Não |
| Priority | Só Rule | — | — |

**Interfaces inconsistentes relevantes:** Persistence identity + MetadataReference shapes.

---

## 7. Inventário de desvios ECS-01

| ID | Severidade | Tipo | Impede EPC-07? | Desvio |
|----|------------|------|----------------|--------|
| DEV-01 | MÉDIO | Estrutura | Não | Pasta `rule/factory/` proibida pela ECS-01 |
| DEV-02 | BAIXO | Naming | Não | Persistence `mechanismId` (exceção legada oficial) |
| DEV-03 | MÉDIO | Tipos | Não | `MetadataReference` incompatível entre Engines |
| DEV-04 | BAIXO | Testes | Não | Suites `*-ports` em EPC-01/02 |
| DEV-05 | BAIXO | Docs | Não | Docs Gen A em EPC-01/02 |
| DEV-06 | MÉDIO | Docs | Não | EPC-06B sem ARCHITECTURE/MIGRATION Gen B |
| DEV-07 | BAIXO | Catálogo | Não | Action kinds com flavor semântico sem executor |

### Totais

| Classe | Quantidade |
|--------|------------|
| CRÍTICO | **0** |
| ALTO | **0** |
| MÉDIO | **3** (DEV-01, DEV-03, DEV-06) |
| BAIXO | **4** (DEV-02, DEV-04, DEV-05, DEV-07) |
| **Total de desvios** | **7** |

### Críticos vs recomendações

- **Críticos:** nenhum.
- **Recomendações (não bloqueantes):** realocar `rule/factory/`; unificar ou mapear `MetadataReference`; completar docs Gen B de EPC-06B; opcionalmente alinhar Persistence `providerId` e renomear testes/docs Gen A.

---

## 8. Auditorias de genéricos (Fases 6–8)

### 8.1 Rule Engine

| Proibição | Status |
|-----------|--------|
| Não conhece TISS | ✅ |
| Não conhece Operadoras | ✅ |
| Não conhece Contratos | ✅ |
| Não conhece Guias | ✅ |
| Não conhece OCR | ✅ |
| Não conhece IA | ✅ |
| Não conhece Banco | ✅ |
| Não conhece APIs | ✅ |

**Veredito:** Rule Engine permanece **totalmente genérico**.

### 8.2 Workflow

| Proibição / papel | Status |
|-------------------|--------|
| Não executa regras | ✅ |
| Não conhece entidades de negócio | ✅ |
| Não toma decisões de negócio | ✅ |
| Somente estados / transições / eventos | ✅ |
| Conditions estruturais apenas | ✅ |

**Veredito:** Workflow permanece **totalmente genérico**.

### 8.3 Expression Engine

| Componente | Presente |
|------------|----------|
| Parser | ✅ |
| AST | ✅ |
| Runtime | ✅ |
| Evaluator | ✅ |
| Registry | ✅ |
| Regras clínicas | ❌ ausentes |
| Regras contratuais | ❌ ausentes |
| Linguagem específica MedicFlow | ❌ ausente |

**Veredito:** Expression Engine permanece **totalmente genérico**.

---

## 9. Conclusão de conformidade ECS-01

Os Engines **seguem o DNA ECS-01** (Ports & Adapters, health/capabilities, factory em providers, mock, isolamento, docs/testes por sprint).

**Não há conformidade cosmética 100%** — existem 7 desvios, nenhum crítico/alto.

Adequações futuras são **opcionais e não bloqueiam** o roadmap para EPC-07 (AI Provider Ports), em linha com a própria ECS-01 §7.
