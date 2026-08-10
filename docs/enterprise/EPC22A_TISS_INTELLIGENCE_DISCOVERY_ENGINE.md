# EPC-22A — Enterprise TISS Intelligence Discovery Engine

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-22A |
| Fase | Fase 6 — Enterprise TISS Intelligence Engine |
| Componente | `EnterpriseTissIntelligenceDiscoveryEngine` |
| Capacidade ativada | `tissIntelligenceDiscoveryImplemented = true` |

## 2. Objetivo

Estabelecer a primeira camada estrutural da Fase 6 (TISS Intelligence), responsável por posicionar a descoberta de domínio de inteligência sem implementar qualquer lógica funcional.

## 3. Arquivos criados

- `src/lib/enterprise/tiss-intelligence-engine/ports/capabilities.ts`
- `src/lib/enterprise/tiss-intelligence-engine/intelligence-discovery/enterprise-tiss-intelligence-discovery-engine.ts`
- `src/lib/enterprise/tiss-intelligence-engine/intelligence-discovery/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-intelligence-discovery-engine.test.ts`

## 4. Arquivo alterado

- `docs/enterprise/TISS_INTELLIGENCE_ENGINE_PERMANENT_ARCHITECTURE_RULE.md`

## 5. Capabilities

| Capability | Valor |
|---|---|
| `tissIntelligenceDiscoveryImplemented` | `true` |
| `tissIntelligenceCanonicalModelImplemented` | `false` |
| `tissIntelligenceRegistryImplemented` | `false` |
| `tissIntelligenceDecisionEngineImplemented` | `false` |
| `tissGenericIntelligenceEngineImplemented` | `false` |

## 6. Propriedades da engine

- `genericMappingEngine: EnterpriseGenericTissMappingEngine`
- `genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine`
- `genericTissEngine: GenericTissEngine`
- `genericTissIntegrationEngine: GenericTissIntegrationEngine`
- `workflowEngine: GenericWorkflowEngine`
- `masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine`

## 7. Confirmação dos imports autorizados

```ts
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseGenericTissMappingEngine } from "../../tiss-mapping/generic-mapping";
```

Não há import de `EnterpriseTissMappingDiscoveryEngine`, `EnterpriseTissMappingCanonicalEngine`, `EnterpriseTissMappingRegistryEngine`, `EnterpriseTissMappingQueryEngine` nem de `EnterpriseTissVocabularyDiscoveryEngine`, `EnterpriseTissVocabularyCanonicalEngine`, `EnterpriseTissVocabularyRegistryEngine`, `EnterpriseTissVocabularyQueryEngine`.

## 8. Confirmação de ausência de lógica funcional

A engine possui seis propriedades `readonly`, um construtor e `getCapabilities()`. Não possui métodos de IA, regras, inferência, recomendação, decisão, explicação, parser, cache, persistência, consulta, execução, busca ou indexação.

## 9. Diagrama atualizado da arquitetura Intelligence Foundation

```text
EnterpriseGenericTissIntelligenceEngine (futuro EPC-22E)
            │
            ▼
EnterpriseTissIntelligenceDecisionEngine (futuro EPC-22D)
            │
            ▼
EnterpriseTissIntelligenceRegistryEngine (futuro EPC-22C)
            │
            ▼
EnterpriseTissIntelligenceCanonicalEngine (futuro EPC-22B)
            │
            ▼
EnterpriseTissIntelligenceDiscoveryEngine (EPC-22A)
            │
            ▼
EnterpriseGenericTissMappingEngine
            │
            ▼
EnterpriseGenericTissVocabularyEngine
            │
            ▼
  ├─ GenericTissEngine
  ├─ GenericTissIntegrationEngine
  ├─ GenericWorkflowEngine
  └─ EnterpriseMasterOrchestrationEngine
```

## 10. Matriz de responsabilidades

| Camada | Responsabilidade | Consome | Implementada? |
|---|---|---|---|
| **Discovery (EPC-22A)** | Descobrir o domínio de inteligência | Gateways Vocabulary + Mapping + Blocos H/I/J | ✅ Sim, estruturalmente |
| **Canonical (EPC-22B)** | Modelar contratos canônicos de inteligência | Discovery + Gateways | ⏳ Não |
| **Registry (EPC-22C)** | Organizar e referenciar contratos | Canonical + Gateways | ⏳ Não |
| **Decision (EPC-22D)** | Preparar futuras decisões | Registry + Gateways | ⏳ Não |
| **Generic Intelligence (EPC-22E)** | Gateway único da Fase 6 | Decision + Gateways | ⏳ Não |

## 11. Confirmação documental de uso exclusivo de Gateways oficiais

A `EnterpriseTissIntelligenceDiscoveryEngine` consome exclusivamente:

- `EnterpriseGenericTissVocabularyEngine` (Gateway da Fase 4)
- `EnterpriseGenericTissMappingEngine` (Gateway da Fase 5)

Nenhuma engine interna das fundações anteriores é importada diretamente.

## 12. Confirmação de que nenhuma engine interna da Vocabulary Foundation foi importada

Não existem imports de:

- `EnterpriseTissVocabularyDiscoveryEngine`
- `EnterpriseTissVocabularyCanonicalEngine`
- `EnterpriseTissVocabularyRegistryEngine`
- `EnterpriseTissVocabularyQueryEngine`

## 13. Confirmação de que nenhuma engine interna da Mapping Foundation foi importada

Não existem imports de:

- `EnterpriseTissMappingDiscoveryEngine`
- `EnterpriseTissMappingCanonicalEngine`
- `EnterpriseTissMappingRegistryEngine`
- `EnterpriseTissMappingQueryEngine`

## 14. Conclusão

A camada de Discovery da Fase 6 foi estabelecida de forma estritamente estrutural. As demais camadas (Canonical, Registry, Decision, Generic Intelligence) permanecem não implementadas.
