# EPC-24 — Execution Requirement Registry Foundation

**Sprint:** EPC-24 Sprint 12 — Execution Requirement Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Registro Canônico de Requisitos de Execução — módulo responsável **exclusivamente** por representar estruturalmente os requisitos disponíveis para uma execução.

Esta Sprint **não** valida requisitos.  
**Não** verifica pré-condições.  
**Não** executa qualquer Engine.  
**Não** implementa Rule Engine.

Toda implementação é exclusivamente estrutural.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution Requirement Registry
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 12):

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
12. Anexar `executionRequirementRegistryId` ao Context  
13. Devolver Context enriquecido  

Nenhuma Engine é invocada. Nenhum requisito é validado. Nenhuma pré-condição é verificada.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionRequirementRegistryPort
  → Adapter (Default | Mock)
    → Store (in-memory)
      ← Factory
        ← Provider (createExecutionRequirementRegistryPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `registerRequirement()` | Registra requisito estrutural in-memory |
| `getRequirement()` | Obtém requisito por id / key |
| `listRequirements()` | Lista requisitos estruturais |
| `findRequirements()` | Busca requisitos por filtro estrutural |
| `statistics()` | Estatísticas estruturais do catálogo |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação valida requisitos, bloqueia execução, invoca Rule Engine ou acessa Engines.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo EPC-24 atualizado além do novo Requirement Registry  
- **Execution Context** — permanece objeto de transporte; anexa apenas referência opaca `executionRequirementRegistryId`  
- Integração exclusiva via Ports oficiais  

---

## 6. Proibições respeitadas

OCR · Parser XML · Rule Engine · Workflow · AI · TISS · FHIR · DICOM · Banco · Supabase · Redis · Requirement Validation · Execution Blocking · Decision Engine · Workers · HTTP · Persistência · Execução paralela

---

## 7. Módulo

`src/lib/enterprise/execution-requirement-registry/`
