# EPC-24 — Execution Environment Registry Foundation

**Sprint:** EPC-24 Sprint 14 — Execution Environment Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Registro Canônico de Ambientes de Execução — módulo responsável **exclusivamente** por representar estruturalmente os ambientes disponíveis para uma execução.

Esta Sprint **não** seleciona ambientes.  
**Não** provisiona ambientes.  
**Não** ativa ambientes.  
**Não** executa qualquer Engine.

Toda implementação é exclusivamente estrutural.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution Environment Registry
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 14):

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
13. Registrar Environment Registry  
14. Anexar `executionEnvironmentRegistryId` ao Context  
15. Devolver Context enriquecido  

Nenhuma Engine é invocada. Nenhum ambiente é selecionado, provisionado ou ativado.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionEnvironmentRegistryPort
  → Adapter (Default | Mock)
    → Store (in-memory)
      ← Factory
        ← Provider (createExecutionEnvironmentRegistryPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `registerEnvironment()` | Registra ambiente estrutural in-memory |
| `getEnvironment()` | Obtém ambiente por id / key |
| `listEnvironments()` | Lista ambientes estruturais |
| `findEnvironments()` | Busca ambientes por filtro estrutural |
| `statistics()` | Estatísticas estruturais do catálogo |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação seleciona, provisiona ou ativa ambientes. Nenhuma operação acessa Engines.

---

## 5. Proibições desta Sprint

- OCR · Parser XML · Rule Engine · Workflow · AI · TISS · FHIR · DICOM  
- Banco · Supabase · Redis · HTTP · Workers · Persistência  
- Environment Selection · Environment Provisioning · Environment Activation  
- Execução paralela · Processamento real  

---

## 6. Integração

- **Orchestrator:** registra e anexa Environment Registry após Resource Registry  
- **Execution Context:** apenas referência opaca (`executionEnvironmentRegistryId`) + histórico  
- **Enterprise Foundation:** intacta (congelada em `medicflow-enterprise-foundation-v1.0.0`)

---

## 7. Testes

```bash
npm run enterprise:execution-environment-registry:test
```

Arquivo: `scripts/enterprise/tests/execution-environment-registry-engine.test.ts`
