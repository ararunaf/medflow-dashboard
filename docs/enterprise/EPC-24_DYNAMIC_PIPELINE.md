# EPC-24 — Dynamic Pipeline Resolution

**Sprint:** EPC-24 Sprint 02  
**Documento pai:** [`EPC-24_PIPELINE_RESOLVER.md`](./EPC-24_PIPELINE_RESOLVER.md)  
**Orchestrator:** [`EPC-24_CANONICAL_EXECUTION_ORCHESTRATOR.md`](./EPC-24_CANONICAL_EXECUTION_ORCHESTRATOR.md)

---

## 1. De estático para dinâmico

### Sprint 01 (estático)

O Canonical Execution Orchestrator conhecia a sequência fixa (`FOUNDATION_PORT_CHAIN` / `CANONICAL_ORCHESTRATION_PIPELINE`) e materializava steps diretamente.

### Sprint 02 (dinâmico)

```
Canonical Execution Request
  ↓
Pipeline Resolver          ← composição dinâmica
  ↓
Document Processing Port   ← referências estruturais
  ↓
Processing Provider Port
  ↓
OCR Provider Port
  ↓
TISS Mapping Port
  ↓
TISS Vocabulary Port
  ↓
TISS Profile Port
  ↓
Healthcare Model Port
  ↓
Contract Rule Binding Port
  ↓
TISS Rule Runtime Port
  ↓
AI Auditor Port
  ↓
Canonical Execution Result
```

**Nenhuma etapa é executada.** Somente resolução estrutural.

---

## 2. Contrato do Orchestrator

O Orchestrator:

1. Recebe `CanonicalExecutionRequest`
2. Solicita ao `PipelineResolverPort.resolvePipeline()` a composição completa
3. Projeta `PipelineResolutionResult` → `CanonicalExecutionStep[]`
4. Marca steps como completed com `artifactRef` opaco (estrutural)
5. Persiste context / result / trace
6. Retorna o pacote

O Orchestrator:

- **NÃO** chama Ports Foundation diretamente
- **NÃO** conhece a sequência dos módulos em runtime
- **Depende exclusivamente** do Pipeline Resolver para composição

Capabilities:

- `dependsOnPipelineResolver: true`
- `resolvesPipelineDynamically: true`

---

## 3. Resolução vs execução

| Aspecto | Sprint 02 |
|---------|-----------|
| Descoberta de módulos | ✅ via Resolver |
| Ordenação | ✅ estrutural |
| Dependências | ✅ lineares documentadas |
| Metadados | ✅ estruturais |
| Execução de OCR/IA/regras | ❌ |
| Invocação de Engines | ❌ (`enginesInvoked: false`) |
| Stages executed | ❌ (`stagesExecuted: false`) |

---

## 4. Integração DI

```ts
createCanonicalExecutionOrchestratorFactory({
  pipelineResolver: createPipelineResolverPort({ provider: "mock" }),
});

// Default: Orchestrator instancia createPipelineResolverPort() internamente
new DefaultCanonicalExecutionOrchestratorAdapter();
```

---

## 5. Compatibilidade Sprint 01

Constantes `FOUNDATION_PORT_CHAIN` / `CANONICAL_ORCHESTRATION_PIPELINE` permanecem no Orchestrator como **documentação / compatibilidade de testes**.

A fonte de verdade da composição em runtime é o Pipeline Resolver (`OFFICIAL_PORT_CHAIN`).
