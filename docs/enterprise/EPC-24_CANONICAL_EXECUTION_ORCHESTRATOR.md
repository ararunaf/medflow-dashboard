# EPC-24 — Canonical Execution Orchestrator Foundation

**Sprint:** EPC-24 Sprint 01 — Canonical Execution Orchestrator  
**Data:** 01/08/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Continuidade:** Espelha o padrão Enterprise (ECS-01)

---

## 1. Objetivo

Criar o **único ponto de entrada canônico** responsável por coordenar, de forma totalmente desacoplada, o pipeline Enterprise já certificado na Foundation:

```
Application
  → CanonicalExecutionOrchestratorPort
    → Adapter
      → Store
        → Factory
          → Provider
```

O Orquestrador **não implementa** regras TISS, OCR, IA, validações, parser XML, integrações, contratos específicos, operadoras, banco ou UI.  
Ele apenas **orquestra estruturalmente** os Ports oficiais já existentes.

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| Port | `src/lib/enterprise/canonical-execution-orchestrator/ports/` |
| Adapters (Default + Mock) | `src/lib/enterprise/canonical-execution-orchestrator/adapters/` |
| Store in-memory | `src/lib/enterprise/canonical-execution-orchestrator/store/` |
| Factory | `src/lib/enterprise/canonical-execution-orchestrator/factory/` |
| Provider | `src/lib/enterprise/canonical-execution-orchestrator/providers/` |
| Demo Application | `src/lib/enterprise/canonical-execution-orchestrator/demo/` |
| Barrel | `src/lib/enterprise/canonical-execution-orchestrator/index.ts` |
| Testes | `scripts/enterprise/tests/canonical-execution-orchestrator-engine.test.ts` |
| Script npm | `enterprise:canonical-execution-orchestrator:test` |

Documentação complementar:

- [`EPC-24_EXECUTION_PIPELINE.md`](./EPC-24_EXECUTION_PIPELINE.md)
- [`EPC-24_ARCHITECTURE.md`](./EPC-24_ARCHITECTURE.md)
- [`EPC-24_CERTIFICATION.md`](./EPC-24_CERTIFICATION.md)

---

## 3. O que o Orquestrador **jamais** conhece

- Regras TISS / ANS
- OCR real / engines de visão
- IA / prompts / providers de modelo
- Parser XML / integrações externas
- Contratos específicos / operadoras
- Banco / Supabase / migrations
- UI / rotas / Server Functions
- Workflow clínico / Workers / filas / HTTP

---

## 4. Superfície do Port

`CanonicalExecutionOrchestratorPort`:

| Método | Papel |
|--------|-------|
| `startExecution()` | Cria contexto + percorre estruturalmente os 11 steps |
| `getExecution()` | Recupera contexto / result / trace |
| `listExecutions()` | Lista execuções in-memory |
| `health()` | Prontidão leve |
| `capabilities()` | Capacidades estáticas (declara o que NÃO faz) |

---

## 5. Providers suportados

| Id | Adapter |
|----|---------|
| `default` | `DefaultCanonicalExecutionOrchestratorAdapter` |
| `mock` | `MockCanonicalExecutionOrchestratorAdapter` |
| `test` | `MockCanonicalExecutionOrchestratorAdapter` (`provider: "test"`) |

---

## 6. Família de adapters

- **Default** — in-process, store em memória, orquestração estrutural
- **Mock** — homologação / testes offline (inclui modo unhealthy)

Ambos in-memory. Sem banco. Sem HTTP. Sem Workers. Sem filas.

---

## 7. Testes

```bash
npm run enterprise:canonical-execution-orchestrator:test
```

Cobertura: criação, pipeline estrutural, referências entre Ports, execução mock, health, capabilities, Factories, Provider.

---

## 8. Fora de escopo (Sprint 01)

- Invocação real dos Ports Foundation (OCR / Mapping / Runtime / Auditor)
- Qualquer regra de negócio
- Qualquer parser ou integração externa
- Alteração da Enterprise Foundation existente

---

## 9. Próximos passos

Evoluções futuras poderão, **sem comprometer o Core**:

1. Invocar Ports Foundation via registry injetado (`FoundationPortRegistry`)
2. Avançar steps de forma incremental (não apenas single-shot estrutural)
3. Propagar traces para observabilidade Enterprise
4. Servir como entrada única das implementações de inteligência TISS
