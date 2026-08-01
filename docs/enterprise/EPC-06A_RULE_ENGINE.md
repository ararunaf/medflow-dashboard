# EPC-06A — Rule Engine Core Foundation

**Sprint:** EPC-06A — Rule Engine Core Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + Ports EPC-01..EPC-05  
**Continuidade:** Espelha o padrão Persistence / Storage / Configuration / Metadata / Workflow Enterprise  
**Próxima sprint:** EPC-06B — linguagem / avaliação de regras

---

## 1. Objetivo

Implantar o núcleo do Rule Engine Enterprise como mecanismo **totalmente genérico**:

```
Application
    ↓
RulePort
    ↓
RuleAdapter
    ↓
RuleStore
    ↓
RuleFactory
    ↓
RuleProvider
```

O Rule Engine **jamais conhece**:

- Regras clínicas
- Regras TISS
- Contratos / Operadoras
- OCR / IA
- Auditoria / Authorization
- Workflow clínico
- Metadata clínico

Esta sprint **NÃO** implementa um motor de avaliação.  
Implementa apenas a **infraestrutura** (registro, consulta, enable/disable, catálogos).  
A linguagem de regras será construída exclusivamente na **EPC-06B**.

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `RulePort` | `src/lib/enterprise/rule/ports/rule-port.ts` |
| Tipos + conceitos nativos | `src/lib/enterprise/rule/ports/types.ts` |
| Catálogo Operators | `src/lib/enterprise/rule/ports/operators.ts` |
| Catálogo Actions | `src/lib/enterprise/rule/ports/actions.ts` |
| Catálogo Priorities | `src/lib/enterprise/rule/ports/priorities.ts` |
| `RuleFactory` | `src/lib/enterprise/rule/factory/rule-factory.ts` |
| `DefaultRuleStore` | `src/lib/enterprise/rule/store/default-rule-store.ts` |
| `DefaultRuleAdapter` | `src/lib/enterprise/rule/adapters/default-rule-adapter.ts` |
| `MockRuleAdapter` | `src/lib/enterprise/rule/adapters/mock-rule-adapter.ts` |
| Provider `createRulePort` | `src/lib/enterprise/rule/providers/create-rule-port.ts` |
| PoC Application (não ligado a UI/API) | `src/lib/enterprise/rule/demo/rule-health-query.ts` |
| Testes | `scripts/enterprise/tests/rule-engine.test.ts` |
| Script npm | `npm run enterprise:rule:test` |

---

## 3. Contrato `RulePort`

| Operação | Responsabilidade |
|----------|------------------|
| `registerRule` | Registrar / atualizar definição de Rule |
| `getRule` | Obter Rule por id / nome / namespace |
| `listRules` | Listar Rules (filtros estruturais) |
| `enableRule` | Status → `enabled` |
| `disableRule` | Status → `disabled` |
| `health` | Prontidão sem mutação |
| `capabilities` | Capacidades declaradas do adapter |

**Proibido no Port:** evaluate / parse / compile / execute / tipos clínicos / TISS / contratos / OCR / IA.

Nenhum módulo de produto foi migrado nesta sprint.

`capabilities().supportsEvaluation` é **sempre `false`** nesta sprint.

---

## 4. Conceitos nativos (únicos)

O Rule Engine conhece **apenas**:

| Conceito | Papel |
|----------|-------|
| Rule | Definição genérica |
| Condition | Descriptor estrutural (não avaliado) |
| Operator | Catálogo estrutural (sem lógica) |
| Action | Catálogo / descriptor (sem execução) |
| Evaluation | Tipo futuro (não produzido pelo Port) |
| Context | Bag opaco futuro |
| Priority | Catálogo estrutural |
| Result | Resultado de operação do Port |
| Outcome | Resultado abstrato futuro |
| Severity | Descriptor estrutural |
| Category | Rótulo genérico |
| Status | draft / enabled / disabled / archived |
| Version | Versão estrutural |
| MetadataReference | Ref opaca ao Metadata Engine |
| WorkflowReference | Ref opaca ao Workflow Engine |

---

## 5. Catálogos (sem implementação)

### Operators (FASE 7)

`equals` · `notEquals` · `greaterThan` · `lessThan` · `contains` · `startsWith` · `endsWith` · `exists` · `notExists` · `regex` · `expression` · `external`

Sem parser. Sem regex engine. Sem evaluator.

### Actions (FASE 8)

`approve` · `reject` · `warning` · `notify` · `continue` · `stop` · `escalate` · `manualReview` · `store` · `custom`

Sem side-effects. Sem execução.

### Priorities (FASE 9)

`Critical` · `High` · `Medium` · `Low` · `Informational`

Sem fila. Sem scheduler.

---

## 6. Integração futura (documentada, não implementada)

| Consumidor | Como consumirá |
|------------|----------------|
| Workflow | Conditions `expression` / `external` delegadas ao RulePort (EPC-06B+) |
| Metadata | Rules referenciam schemas via `MetadataReference` opaca |
| Configuration | Feature flags / thresholds via ConfigurationPort (fora do Core) |
| Document Identity | Rules genéricas sobre identidade documental (Business Module) |
| AI Providers | Outcomes / Actions externas observáveis pela Application |
| Business Modules | Registram e consomem Rules via `RulePort` apenas |

Nenhum desses consumidores foi ligado nesta sprint.

---

## 7. Persistência futura

Ainda **não** utiliza banco. Store default é in-process.  
Provider `persistence` reservado — adapter futuro fará bridge com `PersistencePort` (EPC-01), sem o Rule Engine conhecer tabelas ou entidades.

---

## 8. O que NÃO foi feito (proposital)

- Parser / DSL / linguagem de regras
- Avaliação de expressões
- Execução de actions
- Regras clínicas / TISS / contratos
- OCR / IA / Auditoria
- Alterações de UI / API / banco / migrations
- Alterações em Workflow / Metadata / Configuration / Storage / Persistence de produto
- Ligação de módulos de negócio ao `RulePort`
