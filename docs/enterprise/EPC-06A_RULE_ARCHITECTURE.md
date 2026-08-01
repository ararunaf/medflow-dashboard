# EPC-06A — Rule Architecture (ADR)

**Sprint:** EPC-06A — Rule Engine Core Foundation  
**Data:** 31/07/2026  
**Status:** Aceito

---

## ADR-EPC-06A-001 — Introduzir RulePort sem migrar módulos

### Contexto

A plataforma precisará avaliar regras em múltiplos contextos (workflow, metadata, configuração, documentos, IA, módulos de negócio). Codificar regras MedicFlow no Core acoplaria a IAeasy ao produto.

### Decisão

Criar `RulePort` + `DefaultRuleAdapter` + `MockRuleAdapter` + `RuleStore` + `RuleFactory` + provider, **sem** migrar módulos de negócio. Apenas PoC Application (demo) + testes provam o fluxo.

### Consequências

- Risco de regressão próximo de zero
- Arquitetura pronta para strangler fig
- Dívida consciente: regras de produto continuam fora do Port até sprints futuras

---

## ADR-EPC-06A-002 — Engine genérico sem conhecimento de domínio MedicFlow

### Contexto

O Rule Engine deve ser reutilizável em qualquer plataforma IAeasy. Se conhecer regras clínicas/TISS/contratos agora, deixa de ser Enterprise-core.

### Decisão

O Port/Adapters/Store/Factory usam **somente** conceitos nativos:

Rule · Condition · Operator · Action · Evaluation · Context · Priority · Result · Outcome · Severity · Category · Status · Version · MetadataReference · WorkflowReference

Proibido importar ou modelar Paciente, Guia, Operadora, Contrato, Financeiro, TISS, OCR, IA, Authorization, Auditoria.

### Consequências

- Core estável diante de evolução de domínio
- Domínio específico fica em Business Modules (acima do Engine)
- Testes e mock permanecem simples

---

## ADR-EPC-06A-003 — Default store in-process (sem banco novo)

### Contexto

Criar tabela/migration de rules nesta sprint violaria “NÃO alterar banco / NÃO criar migrations”.

### Decisão

`DefaultRuleStore` é um Map in-process. O adapter default o utiliza. Providers `database` / `remote` / `persistence` ficam reservados com erro explícito.

### Consequências

- Zero impacto em schema/RLS/migrations
- Store default adequado para fundação + testes
- Persistência via PersistencePort fica para sprint futura

---

## ADR-EPC-06A-004 — Infraestrutura sem avaliação (EPC-06A ≠ motor)

### Contexto

Implementar evaluator/parser/DSL agora anteciparia a linguagem de regras e violaria o escopo explícito da sprint.

### Decisão

1. Port expõe apenas register / get / list / enable / disable / health / capabilities
2. `supportsEvaluation = false` em todos os adapters
3. Catálogos de Operator / Action / Priority são somente registro
4. Tipos `Evaluation` / `Context` / `Outcome` existem como contratos futuros
5. Linguagem e evaluator ficam exclusivamente na **EPC-06B**

### Consequências

- Fundação testável sem acoplamento
- Hook claro para EPC-06B
- Zero regra de negócio no Core
- Zero expressão avaliada

---

## ADR-EPC-06A-005 — Actions registradas, não executadas

### Contexto

Actions como `approve` / `reject` / `notify` poderiam disparar side-effects de produto.

### Decisão

Actions são descriptors + catálogo. Adapters **nunca** executam actions nesta sprint. Side-effects reais ficam em Application/Business Modules em sprints futuras.

### Consequências

- Engine permanece puro quanto a registro/status
- Integração com Workflow / AI / Notification é externa e documentada

---

## ADR-EPC-06A-006 — Referências opacas a Metadata e Workflow

### Contexto

Rules precisarão alinhar a Metadata Engine e Workflow Engine, sem conhecer entidades ou processos clínicos.

### Decisão

Campos opcionais `MetadataReference` e `WorkflowReference` (ids/names/namespaces/kinds opacos). Nenhum import de `MetadataPort` / `WorkflowPort` nesta sprint — apenas preparação de contrato.

### Consequências

- Integração futura sem breaking change
- Zero vazamento de domínio no Rule Core

---

## ADR-EPC-06A-007 — RuleFactory como normalizador estrutural

### Contexto

A arquitetura oficial exige RuleFactory entre Store e Provider. Sem factory, defaults de status/version/timestamps se espalhariam pelos adapters.

### Decisão

`RuleFactory` (`createRuleDefinition` / `withRuleStatus`) normaliza defaults estruturais. Não valida domínio, não avalia, não faz parse.

### Consequências

- Adapters magros e consistentes
- Ponto único para evolução de defaults na EPC-06B

---

## Diagrama oficial

```
┌─────────────────────────────────────────────────────────────┐
│ Application (PoC demo / futuros Business Modules)           │
└───────────────────────────┬─────────────────────────────────┘
                            │ depende de
                            ▼
                   ┌─────────────────┐
                   │    RulePort     │
                   └────────┬────────┘
                            │ implementado por
              ┌─────────────┴─────────────┐
              ▼                           ▼
     DefaultRuleAdapter            MockRuleAdapter
              │                           │
              ▼                           ▼
       DefaultRuleStore             Maps in-memory
              │
              ▼
         RuleFactory
              │
              ▼
     Rule Provider (createRulePort)
              │
              ├── default ✅
              ├── mock / test ✅
              └── database / remote / persistence (reservados)
```

---

## Fronteiras explícitas

| Pode | Não pode |
|------|----------|
| Registrar / listar / habilitar Rules | Conhecer regras clínicas / TISS / contratos |
| Expor catálogos Operator / Action / Priority | Avaliar expressões / regex / DSL |
| Guardar MetadataReference / WorkflowReference | Importar Metadata/Workflow concretos |
| Preparar PersistencePort bridge | Criar migrations / alterar banco |
| Expor health / capabilities | Alterar UI / APIs |
| Preparar tipos Evaluation / Context / Outcome | Executar Evaluation nesta sprint |
