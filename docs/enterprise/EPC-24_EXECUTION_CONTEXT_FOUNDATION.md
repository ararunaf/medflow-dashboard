# EPC-24 — Execution Context Foundation

**Sprint:** EPC-24 Sprint 03 — Execution Context Foundation  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/execution-context/`  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Objetivo

Criar o **Contexto Canônico de Execução (Execution Context)** — único objeto compartilhado ao longo de toda a execução do pipeline.

Nesta Sprint o contexto **NÃO** executa qualquer processamento.  
É apenas criado, propagado e enriquecido estruturalmente.

---

## 2. Fluxo esperado

```
CanonicalExecutionRequest
  ↓
Execution Context
  ↓
Pipeline Resolver
  ↓
Pipeline Definition
  ↓
Canonical Execution Result
```

Nenhuma etapa é executada. O contexto percorre estruturalmente o pipeline.

---

## 3. Arquitetura (ECS-01)

```
Application
  ↓
ExecutionContextPort
  ↓
Adapter
  ↓
Store
  ↓
Factory
  ↓
Provider
```

| Camada | Responsabilidade |
|--------|------------------|
| Port | Contrato: `createContext`, `updateContext`, `getContext`, `listContexts`, `health`, `capabilities` |
| Adapter | Default / Mock in-memory |
| Store | Contextos in-process |
| Factory | Materializa adapter por `provider` |
| Provider | `createExecutionContextPort()` |

---

## 4. Integração com Orchestrator

O Canonical Execution Orchestrator (Sprints 01/02) foi atualizado para:

1. criar Execution Context via `ExecutionContextPort`;
2. solicitar composição ao `PipelineResolverPort`;
3. anexar a composição ao Context;
4. devolver o Context enriquecido estruturalmente.

Flags:

- `dependsOnExecutionContext: true`
- `usesExecutionContextExclusively: true`
- `dependsOnPipelineResolver: true`

---

## 5. Independência do Pipeline Resolver

O Pipeline Resolver **não conhece** o conteúdo do Execution Context.  
Toda comunicação ocorre por interfaces canônicas (`ResolvePipelineInput` / `PipelineResolutionResult`).

---

## 6. O que NÃO faz

- OCR / IA / Rule Engine / Workflow
- Parser XML / Validação / Contratos / Operadoras
- Banco / Supabase / Workers / HTTP / Filas
- Execução paralela / processamento real
- Persistência externa

---

## 7. Documentação relacionada

- `EPC-24_CONTEXT_MODEL.md`
- `EPC-24_CONTEXT_ARCHITECTURE.md`
- `EPC-24_CONTEXT_CERTIFICATION.md`
