# EPC-23 — TISS Rule Runtime Foundation

**Sprint:** EPC-23 — TISS Rule Runtime Foundation  
**Data:** 31/07/2026  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/tiss-rule-runtime/`  
**Baseline compatível:** MVP operacional + Enterprise Platform Core (EPC-01..22) + ECS-01  
**Continuidade:** Espelha o padrão Enterprise (ECS-01) — motor de orquestração do pipeline  
**Dependências conceituais:** Healthcare Model (EPC-19), TISS Profile (EPC-22), Contract (EPC-11), Contract Rule Binding (EPC-17), Rule Packs (EPC-09), Rule Engine (EPC-06A), Expression Engine (EPC-06B), AI Auditor (EPC-18)

---

## 1. Objetivo

Criar exclusivamente a **infraestrutura do Runtime de Execução TISS**.

O Runtime é a camada responsável por conduzir um documento através do pipeline Enterprise.

O Runtime **NÃO** toma decisões.  
O Runtime **NÃO** interpreta regras.  
O Runtime **NÃO** interpreta contratos.  
O Runtime apenas **coordena a execução**.

---

## 2. Princípio arquitetural

Fluxo obrigatório:

```
Healthcare Model
  ↓
TISS Profile
  ↓
Contract Rule Binding
  ↓
Rule Pack Resolution
  ↓
Rule Engine
  ↓
Expression Engine
  ↓
Execution Result
  ↓
AI Auditor (futuro)
```

Nunca:

```
Healthcare Model → Rule Engine
```

Sem Runtime.

---

## 3. Escopo desta sprint

### Inclui

| Item | Status |
|------|--------|
| `TISSRuleRuntimePort` | ✅ |
| `DefaultTISSRuleRuntimeAdapter` (in-memory) | ✅ |
| `MockTISSRuleRuntimeAdapter` | ✅ |
| `TISSRuleRuntimeStore` | ✅ |
| `TISSRuleRuntimeFactory` | ✅ |
| `createTISSRuleRuntimePort` (Provider) | ✅ |
| Modelos: TISSExecutionContext / ExecutionStage / ExecutionPipeline / ExecutionResult / ExecutionMetadata / ExecutionTrace | ✅ |
| RuntimeCapabilities estruturais | ✅ |
| Tracing canônico (in-process) | ✅ |
| Documentação de integração futura | ✅ |
| Testes Enterprise + certificação | ✅ |

### Explicitamente fora (NÃO fazer)

- Regras TISS / Validações ANS
- Contratos reais / específicos
- OCR / AI / Parser XML
- Banco / APIs / UI / Migrations
- Integrações funcionais com outros Ports
- Alteração de comportamento do produto

---

## 4. Arquitetura (ECS-01)

```
Application
  ↓
TISSRuleRuntimePort
  ↓
TISSRuleRuntimeAdapter
  ↓
TISSRuleRuntimeStore
  ↓
TISSRuleRuntimeFactory
  ↓
TISSRuleRuntimeProvider
```

Ver [`EPC-23_ARCHITECTURE.md`](./EPC-23_ARCHITECTURE.md).  
Ver modelos em [`EPC-23_RUNTIME_MODEL.md`](./EPC-23_RUNTIME_MODEL.md).  
Ver pipeline em [`EPC-23_EXECUTION_PIPELINE.md`](./EPC-23_EXECUTION_PIPELINE.md).

---

## 5. Superfície do Port

| Operação | Papel |
|----------|-------|
| `startExecution()` | Inicia execução a partir de Healthcare Model ref |
| `resolveProfile()` | Resolve TISS Profile (estrutural) |
| `resolveBindings()` | Resolve Contract Rule Bindings (estrutural) |
| `resolveRulePacks()` | Resolve Rule Packs (estrutural) |
| `dispatchRules()` | Despacha para Rule Engine (sem executar regras) |
| `collectResults()` | Coleta resultado sem interpretar |
| `health()` | Prontidão leve |
| `capabilities()` | Capacidades estáticas (declara o que NÃO faz) |

---

## 6. Providers

| Id | Adapter | Uso |
|----|---------|-----|
| `default` | `DefaultTISSRuleRuntimeAdapter` | Fundação / produção estrutural |
| `mock` | `MockTISSRuleRuntimeAdapter` | Testes / homologação / offline |
| `test` | `MockTISSRuleRuntimeAdapter` (`provider: "test"`) | Suítes automatizadas |

Resolução: `createTISSRuleRuntimePort({ provider })`.  
Mecanismo desconhecido → **throw** explícito (sem fallback silencioso).

---

## 7. RuntimeCapabilities (FASE 8)

Somente estrutura — sem implementação funcional de paralelismo/retry/rollback:

- `supportsParallelExecution`
- `supportsBatchExecution`
- `supportsVersioning`
- `supportsTracing`
- `supportsRollback`
- `supportsRetry`

---

## 8. Integração futura (FASE 9)

Documentada em `FUTURE_INTEGRATION_NOTES` e em [`EPC-23_EXECUTION_PIPELINE.md`](./EPC-23_EXECUTION_PIPELINE.md).

Sem integração funcional nesta sprint.

---

## 9. Testes

```bash
npm run enterprise:tiss-rule-runtime:test
```

Categorias ECS-01: contract, mock, health, capabilities, factory, smoke, pipeline orchestration.

---

## 10. Próximos passos

1. Integrar estruturalmente com `TISSProfilePort` / `ContractRuleBindingPort` / `RulePackPort`
2. Encaminhar despacho real ao Rule Engine (ainda sem regras TISS)
3. Conectar AI Auditor pós-`ExecutionResult`
4. Persistência / batch / parallel (quando houver sprint dedicada)

---

## Documentos relacionados

- [`EPC-23_RUNTIME_MODEL.md`](./EPC-23_RUNTIME_MODEL.md)
- [`EPC-23_EXECUTION_PIPELINE.md`](./EPC-23_EXECUTION_PIPELINE.md)
- [`EPC-23_ARCHITECTURE.md`](./EPC-23_ARCHITECTURE.md)
- [`EPC-23_CERTIFICATION.md`](./EPC-23_CERTIFICATION.md)
