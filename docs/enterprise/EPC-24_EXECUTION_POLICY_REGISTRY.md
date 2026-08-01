# EPC-24 — Execution Policy Registry Foundation

**Sprint:** EPC-24 Sprint 10 — Execution Policy Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Registro Canônico de Políticas de Execução — módulo responsável **exclusivamente** por representar estruturalmente as políticas disponíveis para uma execução.

Esta Sprint **não** interpreta políticas.  
**Não** aplica políticas.  
**Não** executa qualquer Engine.  
**Não** implementa Rule Engine.

Toda implementação é exclusivamente estrutural.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution Policy Registry
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 10):

1. Criar Execution Context  
2. Resolver Pipeline  
3. Criar Execution State Machine  
4. Criar Execution Event Bus  
5. Registrar Execution no Registry  
6. Criar Execution Trace  
7. Registrar Capability Registry  
8. Registrar Dependency Registry  
9. Registrar Policy Registry  
10. Anexar `executionPolicyRegistryId` ao Context  
11. Devolver Context enriquecido  

Nenhuma Engine é invocada. Nenhuma política é interpretada. Nenhuma regra é aplicada.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionPolicyRegistryPort
  → Adapter (Default | Mock)
    → Store (in-memory)
      ← Factory
        ← Provider (createExecutionPolicyRegistryPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `registerPolicy()` | Registra política estrutural in-memory |
| `getPolicy()` | Obtém política por id / key |
| `listPolicies()` | Lista políticas estruturais |
| `findPolicies()` | Busca políticas por filtro estrutural |
| `statistics()` | Estatísticas estruturais do catálogo |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação interpreta políticas, aplica regras, invoca Rule Engine ou acessa Engines.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo EPC-24 atualizado além do novo Policy Registry  
- **Execution Context** — permanece objeto de transporte; anexa apenas referência opaca `executionPolicyRegistryId`  
- Integração exclusiva via Ports oficiais  

---

## 6. Proibições respeitadas

OCR · Parser XML · Rule Engine · Workflow · AI · TISS · FHIR · DICOM · Banco · Supabase · Redis · Policy Evaluation · Rule Execution · Decision Engine · Workers · HTTP · Persistência · Execução paralela

---

## 7. Módulo

`src/lib/enterprise/execution-policy-registry/`
