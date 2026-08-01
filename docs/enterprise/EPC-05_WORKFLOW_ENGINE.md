# EPC-05 — Workflow Engine Foundation

**Sprint:** EPC-05 — Workflow Engine Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + Ports EPC-01/EPC-02/EPC-03/EPC-04  
**Continuidade:** Espelha o padrão Persistence / Storage / Configuration / Metadata Enterprise

---

## 1. Objetivo

Implantar o Workflow Engine Enterprise como mecanismo **totalmente genérico** para controlar estados e transições:

```
Application
    ↓
WorkflowPort
    ↓
WorkflowAdapter
    ↓
Workflow Store
    ↓
Workflow Provider
```

O Workflow Engine **jamais conhece**:

- Paciente
- Guia
- Operadora
- Contrato
- Financeiro
- TISS
- OCR
- IA
- Authorization
- Auditoria
- Rule Engine (como implementação)
- BPM clínico

Seu papel exclusivo: **orquestrar estados e transições**.  
Toda lógica de negócio permanece no Rule Engine e nos Business Modules (sprints futuras).

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `WorkflowPort` | `src/lib/enterprise/workflow/ports/workflow-port.ts` |
| Tipos + conceitos nativos | `src/lib/enterprise/workflow/ports/types.ts` |
| Conditions (prep estrutural) | `src/lib/enterprise/workflow/ports/conditions.ts` |
| Execution model helpers | `src/lib/enterprise/workflow/ports/execution.ts` |
| History / Checkpoint helpers | `src/lib/enterprise/workflow/ports/history.ts` |
| Runtime estrutural | `src/lib/enterprise/workflow/runtime/workflow-runtime.ts` |
| `DefaultWorkflowStore` | `src/lib/enterprise/workflow/store/default-workflow-store.ts` |
| `DefaultWorkflowAdapter` | `src/lib/enterprise/workflow/adapters/default-workflow-adapter.ts` |
| `MockWorkflowAdapter` | `src/lib/enterprise/workflow/adapters/mock-workflow-adapter.ts` |
| Provider `createWorkflowPort` | `src/lib/enterprise/workflow/providers/create-workflow-port.ts` |
| PoC Application (não ligado a UI/API) | `src/lib/enterprise/workflow/demo/workflow-health-query.ts` |
| Testes | `scripts/enterprise/tests/workflow-engine.test.ts` |
| Script npm | `npm run enterprise:workflow:test` |

---

## 3. Contrato `WorkflowPort`

| Operação | Responsabilidade |
|----------|------------------|
| `registerWorkflow` | Registrar / atualizar definição de Workflow |
| `getWorkflow` | Obter Workflow por id / nome / namespace |
| `listWorkflows` | Listar Workflows (filtros estruturais) |
| `start` | Iniciar instância (State) no Stage inicial |
| `advance` | Avançar por Transition (estrutural) |
| `rollback` | Reverter para Checkpoint |
| `cancel` | Cancelar instância |
| `getState` | Obter State atual |
| `health` | Prontidão sem mutação |
| `capabilities` | Capacidades declaradas do adapter |

**Proibido no Port:** tipos/imports de Paciente, Guia, Operadora, Contrato, Financeiro, TISS, OCR, IA, Authorization, Auditoria.

Nenhum módulo de produto foi migrado nesta sprint.

---

## 4. Conceitos nativos (únicos)

O Workflow Engine conhece **apenas**:

| Conceito | Papel |
|----------|-------|
| Workflow | Definição do grafo |
| Stage | Nó / estágio |
| Transition | Aresta entre Stages |
| State | Instância de execução |
| Action | Intenção estrutural (sem side-effect de negócio) |
| Condition | Descriptor estrutural (sem Rule Engine) |
| Event | Sinal estrutural |
| Trigger | Iniciador estrutural |
| Result | Resultado de operação |
| Status | Status nativo do Engine |
| Timeout | Descriptor de tempo (sem scheduler externo) |
| History | Histórico estrutural |
| Checkpoint | Snapshot para rollback |

---

## 5. Modelo de execução

```
Workflow
  ↓
Stages
  ↓
Transitions
  ↓
Conditions
  ↓
Actions
  ↓
Events
```

Nenhuma lógica de negócio é executada. Conditions `always` / `never` / `event` têm avaliação estrutural trivial; `expression` / `metadata` / `external` passam por default até o Rule Engine futuro.

---

## 6. Integração futura (documentada, não implementada)

| Consumidor | Como consumirá |
|------------|----------------|
| Rule Engine | Avaliará Conditions `expression` / `external` |
| AI Engine | Emitirá Events / Triggers estruturais |
| OCR | Avançará Transitions após captura (fora do Core) |
| Contract Intelligence | Registrará Workflows genéricos ligados a metadata |
| Document Identity | Usará Stages/Status genéricos |
| Business Modules | Orquestrarão via `WorkflowPort` apenas |

---

## 7. Persistência futura (FASE 8)

Ainda **não** utiliza banco. Store default é in-process.  
Provider `persistence` reservado — adapter futuro fará bridge com `PersistencePort` (EPC-01), sem o Workflow conhecer tabelas ou entidades.

---

## 8. Metadata futura (FASE 9)

O Workflow **não** conhece entidades.  
Usa apenas `WorkflowMetadataRef` (ids/names/namespaces opacos) vindos do Metadata Engine.

---

## 9. O que NÃO foi feito (proposital)

- Workflows clínicos
- Processos TISS
- Authorization / Auditoria
- OCR / IA
- Rule Engine / BPM
- Alterações de UI / API / banco / migrations
- Alterações em Storage / Metadata / Configuration
