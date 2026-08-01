# EPC-24 — Execution Registry Foundation

**Sprint:** EPC-24 Sprint 06 — Execution Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Registro Canônico de Execuções — módulo responsável **exclusivamente** por representar estruturalmente o catálogo das execuções criadas pelo Orchestrator.

Esta Sprint **não** executa Engines.  
**Não** cria persistência.  
**Não** utiliza banco.  
**Não** utiliza Supabase.  
**Não** implementa histórico funcional.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution Registry
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 06):

1. Criar Execution Context  
2. Resolver Pipeline  
3. Criar Execution State Machine  
4. Criar Execution Event Bus  
5. Registrar Execution no Registry  
6. Anexar `executionRegistryId` ao Context  
7. Devolver Context enriquecido  

Nenhuma Engine é invocada. Nenhuma persistência real é realizada.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionRegistryPort
  → Adapter (Default | Mock)
    → Store (in-memory)
      ← Factory
        ← Provider (createExecutionRegistryPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `registerExecution()` | Registra execução no catálogo in-memory |
| `getExecution()` | Obtém entrada por `executionRegistryId` ou `executionId` |
| `listExecutions()` | Lista entradas com filtro estrutural opcional |
| `findExecution()` | Busca por query estrutural |
| `removeExecution()` | Remove entrada do catálogo in-memory |
| `statistics()` | Estatísticas estruturais do catálogo |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação acessa banco, Supabase ou APIs externas.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo EPC-24 atualizado além do novo Registry  
- Integração exclusiva via `ExecutionRegistryPort`  
- Execution Context permanece objeto de transporte (apenas referência `executionRegistryId`)  
- Pipeline Resolver, State Machine e Event Bus permanecem intactos e independentes  
- Enterprise Foundation (EPC-00–23) permanece congelada  

---

## 6. Proibições (cumpridas)

- Sem OCR / Parser XML / Rule Engine / Workflow / AI / TISS / FHIR / DICOM  
- Sem banco / Supabase / Redis / cache distribuído / persistência  
- Sem Workers / HTTP / Cloudflare / filas / Pub/Sub / subscribers  
- Sem eventos reais / execução paralela / Engines  

---

## 7. Localização

`src/lib/enterprise/execution-registry/`

Testes: `scripts/enterprise/tests/execution-registry-engine.test.ts`  
Script: `npm run enterprise:execution-registry:test`
