# F3-CAP-09 — AI Orchestration Architecture

**Sprint:** F3-CAP-09  
**Padrão:** ECS-01  
**Data:** 2026-08-04

---

## Visão

```
Produto
  → Enterprise Runtime
    → AIOrchestrationRuntimePort
      → DefaultAIOrchestrationRuntimeAdapter
         / EnterpriseAIOrchestrationRuntimeAdapter (alias)
         / MockAIOrchestrationRuntimeAdapter
      → InMemoryAIOrchestrationRuntimeStore
      → AIExecutionResult (estrutural)
```

Factory + Registry resolvem `mock | test | default | enterprise`.
Default da factory: `enterprise`.

---

## Camadas ECS-01

| Camada | Responsabilidade |
|--------|------------------|
| Port | `AIOrchestrationRuntimePort` — contrato único |
| Canonical | AIRequest, AIResponse, AIContext, AIWorkflow, AIAgent, AIProvider, AIExecutionPlan, AIExecutionResult, AITask, AIHealth, AIStatistics, AICapabilities, AIStatus |
| Capabilities | Declaração `*Implemented = false` |
| Identity | `AI_ORCHESTRATION_RUNTIME_IDENTITY` |
| Provider | `createAIOrchestrationRuntimePort()` |
| Factory | `AIOrchestrationRuntimeFactory` |
| Registry | mock / test / default / enterprise |
| Adapters | Default (= Enterprise) + Mock |
| Store | `AIOrchestrationRuntimeStore` + InMemory |
| Demo | `getAIOrchestrationRuntimeHealthSummary()` |

---

## Operações estruturais

`openJob` · `closeJob` · `submitRequest` · `registerTask` · `getResult` · `stats` · `health` · `capabilities` · `providerInfo`

Nenhuma operação dispara LLM, HTTP, agente, workflow ou decisão.

---

## Integração estrutural

`AIOrchestrationRuntimeEnterpriseDeps` injeta getters lazy dos peers.
Em `health()`, apenas shape-check (`health` + `capabilities` presentes).
Peers **não** são chamados funcionalmente (evita ciclos).

---

## Agentes (somente contratos)

ClassificationAgent · ExtractionAgent · ValidationAgent · AuditAgent ·
TISSAgent · MedicalGuideAgent · QualityAgent · SupervisorAgent ·
CoordinatorAgent

Todos com `agentExecutionImplemented: false`.

---

## Provedores futuros (somente contratos)

OpenAI · Azure OpenAI · Gemini · Claude · Ollama · Llama · Custom Provider

Todos com `enabled: false`, `connected: false`, `httpImplemented: false`.

---

## Fora de escopo (explícito)

IA real · OpenAI · Azure OpenAI · Gemini · Claude · Ollama · Llama ·
Machine Learning · Prompt Engineering · HTTP · APIs externas ·
agentes inteligentes · tomada de decisão automática · banco ·
persistência · auditoria automática
