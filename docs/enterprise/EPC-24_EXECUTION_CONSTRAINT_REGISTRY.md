# EPC-24 — Execution Constraint Registry Foundation

**Sprint:** EPC-24 Sprint 11 — Execution Constraint Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Registro Canônico de Restrições de Execução — módulo responsável **exclusivamente** por representar estruturalmente as restrições disponíveis para uma execução.

Esta Sprint **não** valida restrições.  
**Não** aplica restrições.  
**Não** executa qualquer Engine.  
**Não** implementa Rule Engine.

Toda implementação é exclusivamente estrutural.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution Constraint Registry
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 11):

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
11. Anexar `executionConstraintRegistryId` ao Context  
12. Devolver Context enriquecido  

Nenhuma Engine é invocada. Nenhuma restrição é validada. Nenhum bloqueio de execução.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionConstraintRegistryPort
  → Adapter (Default | Mock)
    → Store (in-memory)
      ← Factory
        ← Provider (createExecutionConstraintRegistryPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `registerConstraint()` | Registra restrição estrutural in-memory |
| `getConstraint()` | Obtém restrição por id / key |
| `listConstraints()` | Lista restrições estruturais |
| `findConstraints()` | Busca restrições por filtro estrutural |
| `statistics()` | Estatísticas estruturais do catálogo |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação valida restrições, bloqueia execução, invoca Rule Engine ou acessa Engines.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo EPC-24 atualizado além do novo Constraint Registry  
- **Execution Context** — permanece objeto de transporte; anexa apenas referência opaca `executionConstraintRegistryId`  
- Integração exclusiva via Ports oficiais  

---

## 6. Proibições respeitadas

OCR · Parser XML · Rule Engine · Workflow · AI · TISS · FHIR · DICOM · Banco · Supabase · Redis · Constraint Validation · Execution Blocking · Decision Engine · Workers · HTTP · Persistência · Execução paralela

---

## 7. Módulo

`src/lib/enterprise/execution-constraint-registry/`
