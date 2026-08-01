# EPC-24 — Pipeline Architecture

**Sprint:** EPC-24 Sprint 02 — Dynamic Pipeline Resolution  
**Padrão:** ECS-01 Enterprise Component Specification  
**Baseline:** `medicflow-enterprise-foundation-v1.0.0`

---

## 1. Visão geral

```
┌─────────────────────────────────────────────────────────────┐
│ Application                                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ CanonicalExecutionOrchestratorPort                          │
│  (não conhece sequência; não chama Ports Foundation)        │
└───────────────────────────┬─────────────────────────────────┘
                            │ resolvePipeline()
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ PipelineResolverPort                                        │
│  Application → Port → Adapter → Store → Factory → Provider  │
└───────────────────────────┬─────────────────────────────────┘
                            │ composição estrutural
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Official Ports (type-only refs / DI registry)               │
│  DocumentIntake · DocumentProcessor · ProcessingProvider    │
│  OCRProvider · TISSMapping · TISSVocabulary · TISSProfile   │
│  HealthcareModel · ContractRuleBinding · TISSRuleRuntime    │
│  AIAuditor                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Módulos tocados

| Módulo | Alteração |
|--------|-----------|
| `pipeline-resolver/` | **NOVO** — resolução dinâmica |
| `canonical-execution-orchestrator/` | Integração exclusiva via Resolver |
| Foundation engines (EPC-00–23) | **INTACTOS** |
| Ports existentes | **NÃO modificados** |

---

## 3. Hierarquia ECS-01 (Pipeline Resolver)

| Camada | Artefato |
|--------|----------|
| Port | `PipelineResolverPort` |
| Adapter | `DefaultPipelineResolverAdapter`, `MockPipelineResolverAdapter` |
| Store | `DefaultPipelineResolverStore` |
| Factory | `PipelineResolverFactory` |
| Provider | `createPipelineResolverPort` |
| Demo (Application) | `getPipelineResolverHealthSummary` |

---

## 4. Fluxo de dados estrutural

1. `ResolvePipelineInput` → `PipelineResolution`
2. Store → `PipelineDefinition` (canônico seedado)
3. `PipelineResolutionResult` com:
   - `orderedStages` / `orderedNodes`
   - `dependencies`
   - `officialPortRefs` / `officialPortContracts`
4. Orchestrator projeta steps e devolve result estrutural

---

## 5. Invariantes

1. Sem inversão de hierarquia (Port não importa Adapter)
2. Application depende só do Port
3. Sem regras clínicas / TISS / ANS nos adapters/stores
4. Sem tipos de vendor na superfície do Port
5. Mock + Default obrigatórios; provider desconhecido → throw
6. `health()` + `capabilities()` obrigatórios
7. Type-only imports de Ports oficiais
8. Foundation congelada intacta
9. Nenhuma etapa executada nesta sprint

---

## 6. Preparação para próximas sprints

O Pipeline Resolver estabelece a infraestrutura de descoberta. Sprints futuras poderão:

- Invocar Ports oficiais através do Orchestrator (ainda via Ports)
- Ativar OCR / Mapping / Rule Runtime / AI Auditor
- Sem acoplamento direto entre Engines
