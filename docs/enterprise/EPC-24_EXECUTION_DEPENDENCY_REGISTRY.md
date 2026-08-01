# EPC-24 — Execution Dependency Registry Foundation

**Sprint:** EPC-24 Sprint 09 — Execution Dependency Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Registro Canônico de Dependências de Execução — módulo responsável **exclusivamente** por representar estruturalmente as dependências entre capacidades e componentes do pipeline.

Esta Sprint **não** resolve dependências.  
**Não** ordena execução.  
**Não** calcula DAG.  
**Não** executa qualquer Engine.

Toda implementação é exclusivamente estrutural.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution Dependency Registry
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 09):

1. Criar Execution Context  
2. Resolver Pipeline  
3. Criar Execution State Machine  
4. Criar Execution Event Bus  
5. Registrar Execution no Registry  
6. Criar Execution Trace  
7. Registrar Capability Registry  
8. Registrar Dependency Registry  
9. Anexar `executionDependencyRegistryId` ao Context  
10. Devolver Context enriquecido  

Nenhuma Engine é invocada. Nenhuma dependência é resolvida. Nenhuma ordenação automática ocorre.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionDependencyRegistryPort
  → Adapter (Default | Mock)
    → Store (in-memory)
      ← Factory
        ← Provider (createExecutionDependencyRegistryPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `registerDependency()` | Registra dependência estrutural in-memory |
| `getDependency()` | Obtém dependência por id / key |
| `listDependencies()` | Lista dependências estruturais |
| `findDependencies()` | Busca dependências por filtro estrutural |
| `statistics()` | Estatísticas estruturais do catálogo |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação resolve dependências, aplica topological sort, calcula DAG ou acessa Engines.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo EPC-24 atualizado além do novo Dependency Registry  
- **Execution Context** — permanece objeto de transporte; apenas referencia `executionDependencyRegistryId`  
- Integração exclusiva via Ports oficiais  

---

## 6. Proibições

OCR · Parser XML · Rule Engine · Workflow · AI · TISS · FHIR · DICOM · Banco · Supabase · Redis · DAG Solver · Topological Sort · Dependency Resolution · Workers · HTTP · Persistência · Execução paralela

---

## 7. Caminho

`src/lib/enterprise/execution-dependency-registry/`
