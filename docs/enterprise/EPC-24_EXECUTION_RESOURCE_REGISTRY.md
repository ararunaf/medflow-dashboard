# EPC-24 — Execution Resource Registry Foundation

**Sprint:** EPC-24 Sprint 13 — Execution Resource Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Registro Canônico de Recursos de Execução — módulo responsável **exclusivamente** por representar estruturalmente os recursos disponíveis para uma execução.

Esta Sprint **não** aloca recursos.  
**Não** verifica reserva/balanceamento.  
**Não** executa qualquer Engine.  
**Não** implementa Resource Allocation.

Toda implementação é exclusivamente estrutural.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution Resource Registry
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 13):

1. Criar Execution Context  
2. Resolver Pipeline  
3. Criar Execution State Machine  
4. Criar Execution Event Bus  
5. Registrar Execution no Registry  
6. Criar Execution Trace  
7. Registrar Capability Registry  
8. Registrar Dependency Registry  
9. Registrar Policy Registry  
10. Registrar Constraint Registry  
11. Registrar Requirement Registry  
12. Registrar Resource Registry  
13. Anexar `executionResourceRegistryId` ao Context  
14. Devolver Context enriquecido  

Nenhuma Engine é invocada. Nenhum recurso é alocado, reservado ou balanceado.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionResourceRegistryPort
  → Adapter (Default | Mock)
    → Store (in-memory)
      ← Factory
        ← Provider (createExecutionResourceRegistryPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `registerResource()` | Registra recurso estrutural in-memory |
| `getResource()` | Obtém recurso por id / key |
| `listResources()` | Lista recursos estruturais |
| `findResources()` | Busca recursos por filtro estrutural |
| `statistics()` | Estatísticas estruturais do catálogo |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação aloca recursos, bloqueia execução, invoca Resource Allocation ou acessa Engines.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo EPC-24 atualizado além do novo Resource Registry  
- **Execution Context** — permanece objeto de transporte; anexa apenas referência opaca `executionResourceRegistryId`  
- Integração exclusiva via Ports oficiais  

---

## 6. Proibições respeitadas

OCR · Parser XML · Resource Allocation · Scheduling · Workflow · AI · TISS · FHIR · DICOM · Banco · Supabase · Redis · Resource Reservation · Load Balancing · Workers · HTTP · Persistência · Execução paralela

---

## 7. Módulo

`src/lib/enterprise/execution-resource-registry/`
