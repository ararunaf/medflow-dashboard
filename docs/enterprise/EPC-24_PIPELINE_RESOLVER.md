# EPC-24 — Pipeline Resolver

**Sprint:** EPC-24 Sprint 02 — Dynamic Pipeline Resolution  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/pipeline-resolver/`  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Objetivo

Transformar a composição estática do Canonical Execution Orchestrator em resolução dinâmica estrutural.

O **Pipeline Resolver** descobre quais módulos (Ports oficiais) participam da execução e devolve a composição completa — **sem executar qualquer etapa**.

---

## 2. Arquitetura (ECS-01)

```
Application
  ↓
PipelineResolverPort
  ↓
Adapter
  ↓
Store
  ↓
Factory
  ↓
Provider
```

| Camada | Responsabilidade |
|--------|------------------|
| Port | Contrato: `resolvePipeline`, `getPipeline`, `listPipelines`, `health`, `capabilities` |
| Adapter | Default / Mock in-memory |
| Store | Definições e resoluções in-process |
| Factory | Materializa adapter por `provider` |
| Provider | `createPipelineResolverPort()` |

---

## 3. Modelos canônicos

| Modelo | Papel |
|--------|-------|
| `PipelineDefinition` | Definição estrutural do pipeline |
| `PipelineStage` | Estágio (1 Port oficial) |
| `PipelineNode` | Nó com `portRef` / `portContract` |
| `PipelineDependency` | Dependência linear estrutural |
| `PipelineResolution` | Pedido de resolução |
| `PipelineResolutionResult` | Composição resolvida (sem execução) |
| `PipelineCapabilities` | Capacidades do Port |

Nenhum modelo contém regras de negócio.

---

## 4. Port

```ts
interface PipelineResolverPort {
  resolvePipeline(input?): Promise<ResolvePipelineResult>;
  getPipeline(input): Promise<GetPipelineResult>;
  listPipelines(input?): Promise<ListPipelinesResult>;
  health(): Promise<PipelineResolverHealth>;
  capabilities(): PipelineCapabilities;
}
```

Flags explícitas:

- `stagesExecuted: false`
- `enginesInvoked: false`
- `resolvedViaOfficialPortsOnly: true`
- `structuralResolutionOnly: true`

---

## 5. Ports oficiais referenciados

```
Document Intake → Document Processing → Processing Provider → OCR Provider
→ TISS Mapping → TISS Vocabulary → TISS Profile → Healthcare Model
→ Contract Rule Binding → TISS Rule Runtime → AI Auditor
```

Fonte: `OFFICIAL_PORT_CHAIN`.

Imports são **type-only**. Nenhum Engine é acoplado. Nenhum Port é invocado para negócio nesta sprint.

---

## 6. O que NÃO faz

- OCR / IA / Rule Engine / Workflow
- Parser XML / Validação / Contratos / Operadoras
- Banco / Supabase / Workers / HTTP / Filas
- Execução paralela / execução de etapas

---

## 7. Testes

```bash
npm run enterprise:pipeline-resolver:test
```

Cobertura: Resolution, Composition, Ordering, Metadata, Dependencies, Factory, Provider, Adapter, Port, Health, Capabilities.
