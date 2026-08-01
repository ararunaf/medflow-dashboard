# EPC-24 — Execution Trace Architecture

**Sprint:** EPC-24 Sprint 07  
**Padrão:** ECS-01 Enterprise Component Specification

---

## 1. Hierarquia oficial

```
Application
  ↓
ExecutionTracePort
  ↓
Adapter (DefaultExecutionTraceAdapter | MockExecutionTraceAdapter)
  ↓
Store (DefaultExecutionTraceStore — in-memory)
  ↑
Factory (ExecutionTraceFactory)
  ↑
Provider (createExecutionTracePort)
```

---

## 2. Camadas

| Camada | Responsabilidade |
|--------|------------------|
| Port | Contrato estrutural (`createTrace`, `appendTrace`, `getTrace`, `listTraceEntries`, `statistics`, `health`, `capabilities`) |
| Adapter | Implementação in-memory; Default + Mock |
| Store | Map in-process; sem banco / Redis / Supabase |
| Factory | Materializa adapter por `provider` (`default` \| `mock` \| `test`); desconhecido → erro |
| Provider | Inversão de dependência para Application |
| Demo | PoC Application depende só do Port |

---

## 3. Integração no Canonical Orchestrator

Após Registry:

1. `createExecutionTraceForContext` via `ExecutionTracePort`
2. `attachTraceToExecutionContext` — anexa `executionTraceId`
3. Continua lifecycle / pipeline structural walk / finalize

O Orchestrator **não** embute lógica de Trace; apenas orquestra via Port.

Capabilities do Orchestrator:

- `dependsOnExecutionTrace: true`
- `usesExecutionTraceStructurally: true`

---

## 4. Desacoplamento

- Trace **não** conhece Engines  
- Engines **não** conhecem Trace  
- Context só carrega referência opaca  
- Registry / Event Bus / State Machine / Pipeline Resolver permanecem independentes  

---

## 5. O que esta arquitetura NÃO faz

- Logs reais  
- OpenTelemetry / analytics externos  
- Persistência / banco  
- Auditoria funcional  
- Processamento / Engines  
- HTTP / Workers / filas  

---

## 6. Localização

`src/lib/enterprise/execution-trace/`
