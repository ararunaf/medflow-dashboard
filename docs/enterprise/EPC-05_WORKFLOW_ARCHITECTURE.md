# EPC-05 — Workflow Architecture (ADR)

**Sprint:** EPC-05 — Workflow Engine Foundation  
**Data:** 31/07/2026  
**Status:** Aceito

---

## ADR-EPC-05-001 — Introduzir WorkflowPort sem migrar módulos

### Contexto

A plataforma precisará orquestrar estados de múltiplos processos (clínicos, financeiros, captura, contratos). Codificar esses processos no Core do Workflow Engine acoplaria a IAeasy ao MedicFlow.

### Decisão

Criar `WorkflowPort` + `DefaultWorkflowAdapter` + `MockWorkflowAdapter` + provider + store in-process + runtime estrutural, **sem** migrar módulos de negócio. Apenas PoC Application (demo) + testes provam o fluxo.

### Consequências

- Risco de regressão próximo de zero
- Arquitetura pronta para strangler fig / orquestração genérica
- Dívida consciente: processos de produto continuam fora do Port até sprints futuras

---

## ADR-EPC-05-002 — Engine genérico sem conhecimento de domínio MedicFlow

### Contexto

O Workflow Engine deve ser reutilizável em qualquer plataforma IAeasy. Se conhecer Paciente/Guia/Operadora/TISS agora, deixa de ser Enterprise-core.

### Decisão

O Port/Adapters/Store/Runtime usam **somente** conceitos nativos:

Workflow · Stage · Transition · State · Action · Condition · Event · Trigger · Result · Status · Timeout · History · Checkpoint

Proibido importar ou modelar Paciente, Guia, Operadora, Contrato, Financeiro, TISS, OCR, IA, Authorization, Auditoria.

### Consequências

- Core estável diante de evolução de domínio
- Domínio específico fica em Business Modules + Rule Engine
- Testes e mock permanecem simples

---

## ADR-EPC-05-003 — Default store in-process (sem banco novo)

### Contexto

Criar tabela/migration de workflow nesta sprint violaria “NÃO alterar banco / NÃO criar migrations”.

### Decisão

`DefaultWorkflowStore` é um Map in-process (workflows / states). O adapter default o utiliza. Providers `database` / `remote` / `persistence` ficam reservados com erro explícito.

### Consequências

- Zero impacto em schema/RLS/migrations
- Store default adequado para fundação + testes
- Persistência via PersistencePort fica para sprint futura

---

## ADR-EPC-05-004 — Conditions estruturais sem Rule Engine

### Contexto

Conditions serão necessárias; implementar Rule Engine agora anteciparia regras de domínio e violaria o escopo.

### Decisão

1. Descriptor `WorkflowCondition` com kinds: always / never / expression / event / metadata / external
2. Avaliação estrutural trivial no runtime (`always`/`never`/`event`; demais passam por default)
3. **Não** implementar Rule Engine, expressões de domínio ou BPM

### Consequências

- Fundação testável sem acoplamento
- Hook claro para Rule Engine futuro
- Zero regra de negócio no Core

---

## ADR-EPC-05-005 — Actions registradas, não executadas como negócio

### Contexto

Actions poderiam disparar OCR/IA/APIs. Isso acoplaria o Engine a side-effects de produto.

### Decisão

Actions são descriptors. No advance, são apenas anexadas ao History (kind=`action`). Side-effects reais ficam em Application/Business Modules que observam o State.

### Consequências

- Engine permanece puro quanto a estado/transição
- Integração com AI/OCR/CI é externa e documentada

---

## ADR-EPC-05-006 — Metadata por referência opaca

### Contexto

Workflows precisarão alinhar Stages a Schemas/Entities do Metadata Engine, sem conhecer entidades.

### Decisão

Campo opcional `WorkflowMetadataRef` (ids/names/namespaces/kinds opacos). Nenhum import de `MetadataPort` nesta sprint — apenas preparação de contrato.

### Consequências

- Integração futura sem breaking change
- Zero vazamento de domínio clínico no Workflow Core

---

## ADR-EPC-05-007 — Persistência futura via PersistencePort

### Contexto

Estados de workflow precisarão sobreviver a restarts. Criar adapter de banco agora quebraria o escopo.

### Decisão

Documentar provider `persistence` e contrato `WorkflowStore` como ponto de bridge. Sprint futura implementará `PersistenceWorkflowStore` usando `PersistencePort` (EPC-01).

### Consequências

- Sem migrations agora
- Caminho claro de evolução
- Workflow nunca conhece SQL/Supabase diretamente

---

## Diagrama oficial

```
┌─────────────────────────────────────────────────────────────┐
│ Application (PoC demo / futuros Business Modules)           │
└───────────────────────────┬─────────────────────────────────┘
                            │ depende de
                            ▼
                   ┌─────────────────┐
                   │  WorkflowPort   │
                   └────────┬────────┘
                            │ implementado por
              ┌─────────────┴─────────────┐
              ▼                           ▼
   DefaultWorkflowAdapter        MockWorkflowAdapter
              │                           │
              ▼                           ▼
     DefaultWorkflowStore          Maps in-memory
              │
              ▼
     Workflow Provider (createWorkflowPort)
              │
              ├── default ✅
              ├── mock / test ✅
              └── database / remote / persistence (reservados)
```

---

## Fronteiras explícitas

| Pode | Não pode |
|------|----------|
| Controlar Stage / Transition / State | Conhecer Paciente / Guia / Operadora |
| Avaliar conditions estruturais triviais | Executar regras de negócio |
| Registrar Actions no History | Chamar OCR / IA / TISS |
| Guardar MetadataRef opaca | Importar Metadata entities concretas |
| Preparar PersistencePort bridge | Criar migrations / alterar banco |
| Expor health / capabilities | Alterar UI / APIs |
