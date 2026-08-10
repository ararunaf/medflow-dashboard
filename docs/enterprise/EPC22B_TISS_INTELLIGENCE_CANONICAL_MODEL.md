# EPC-22B — Enterprise TISS Intelligence Canonical Model

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-22B |
| Fase | Fase 6 — Enterprise TISS Intelligence Engine |
| Componente | `EnterpriseTissIntelligenceCanonicalEngine` |
| Capacidade ativada | `tissIntelligenceCanonicalModelImplemented = true` |

## 2. Objetivo

Estabelecer a camada de modelos canônicos semânticos de decisão da Fase 6 (TISS Intelligence), sem implementar IA, regras, inferência, recomendação, Decision Engine, Explainability ou qualquer lógica funcional.

## 3. Arquivos criados

- `src/lib/enterprise/tiss-intelligence-engine/intelligence-canonical/enterprise-tiss-intelligence-canonical-engine.ts`
- `src/lib/enterprise/tiss-intelligence-engine/intelligence-canonical/models.ts`
- `src/lib/enterprise/tiss-intelligence-engine/intelligence-canonical/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-intelligence-canonical-engine.test.ts`

## 4. Arquivos alterados

- `src/lib/enterprise/tiss-intelligence-engine/ports/capabilities.ts`
- `docs/enterprise/TISS_INTELLIGENCE_ENGINE_PERMANENT_ARCHITECTURE_RULE.md`

## 5. Capabilities

| Capability | Valor |
|---|---|
| `tissIntelligenceDiscoveryImplemented` | `true` |
| `tissIntelligenceCanonicalModelImplemented` | `true` |
| `tissIntelligenceRegistryImplemented` | `false` |
| `tissIntelligenceDecisionEngineImplemented` | `false` |
| `tissGenericIntelligenceEngineImplemented` | `false` |

## 6. Modelos canônicos criados

- `TissIntelligenceContext`
- `TissDecisionScenario`
- `TissDecisionCriterion`
- `TissRecommendationProfile`
- `TissEvidenceReference`
- `TissDecisionDomain`

Cada modelo possui apenas `readonly properties` e `constructor`. Nenhum método, lógica, validação ou algoritmo.

## 7. Justificativa técnica

A Vocabulary Foundation responde "O que existe?". A Mapping Foundation responde "Como os conceitos se relacionam?". A Intelligence Foundation responde "Como essas informações poderão apoiar decisões?".

Os modelos da EPC-22B representam exclusivamente contratos semânticos de decisão, sem repetir conceitos da Vocabulary ou relações da Mapping.

## 8. Confirmação dos imports autorizados

```ts
import { GenericTissEngine } from "../../tiss-engine/generic-tiss-engine";
import { GenericTissIntegrationEngine } from "../../tiss-integration-engine/generic-tiss-integration-engine";
import { GenericWorkflowEngine } from "../../workflow-engine/generic-workflow-engine";
import { EnterpriseMasterOrchestrationEngine } from "../../master-orchestration/master";
import { EnterpriseGenericTissVocabularyEngine } from "../../tiss-intelligence/generic-vocabulary";
import { EnterpriseGenericTissMappingEngine } from "../../tiss-mapping/generic-mapping";
import { EnterpriseTissIntelligenceDiscoveryEngine } from "../intelligence-discovery";
```

Não foram importadas engines internas da Vocabulary nem da Mapping Foundation.

## 9. Confirmação de ausência de lógica funcional

A engine `EnterpriseTissIntelligenceCanonicalEngine` contém sete propriedades `readonly`, um construtor e `getCapabilities()`. Não contém IA, regras, inferência, recomendação, Decision Engine, Explainability, Rule Evaluation, consulta, parser, cache, persistência, busca, execução ou validação.

## 10. Matriz comparativa

| Foundation | Pergunta que responde | Domínio |
|---|---|---|
| Vocabulary | "O que existe?" | Conceitos e termos |
| Mapping | "Como os conceitos se relacionam?" | Relações entre conceitos |
| Intelligence | "Como essas informações poderão apoiar decisões?" | Contexto, critérios e cenários decisórios |

## 11. Semantic Responsibility Matrix

| Camada | Responsabilidade | Não representa |
|---|---|---|
| Vocabulary Foundation | Conceitos canônicos TISS | Cenários, critérios, recomendações |
| Mapping Foundation | Relações entre conceitos | Regras de decisão, perfis de recomendação |
| Intelligence Foundation (Canonical) | Estruturas semânticas de decisão | Conceitos em si, catálogos, relações diretas |

Os modelos de Intelligence representam **apenas** estruturas semânticas de decisão. Não duplicam conceitos da Vocabulary, nem relações da Mapping.

## 12. Prova documental de ausência de duplicação conceitual

- `TissDecisionDomain`, `TissIntelligenceContext`, `TissDecisionScenario`, `TissDecisionCriterion`, `TissRecommendationProfile` e `TissEvidenceReference` não contém campos de catálogo, terminologia, códigos TUSS, códigos de procedimento ou relações de mapeamento.
- A Canonical Engine não importa `EnterpriseTissVocabularyDiscoveryEngine`, `EnterpriseTissVocabularyCanonicalEngine`, `EnterpriseTissVocabularyRegistryEngine`, `EnterpriseTissVocabularyQueryEngine`, `EnterpriseTissMappingDiscoveryEngine`, `EnterpriseTissMappingCanonicalEngine`, `EnterpriseTissMappingRegistryEngine` ou `EnterpriseTissMappingQueryEngine`.

## 13. Confirmação documental de que apenas os Gateways oficiais foram utilizados

A engine consome:

- `EnterpriseTissIntelligenceDiscoveryEngine` (camada anterior da Fase 6)
- `EnterpriseGenericTissMappingEngine` (Gateway da Fase 5)
- `EnterpriseGenericTissVocabularyEngine` (Gateway da Fase 4)

Nenhum acesso às engines internas das fundações.

## 14. Conclusão

A camada de Canonical Model da Fase 6 foi estabelecida estritamente como estrutura semântica de decisão. As camadas de Registry, Decision Engine e Generic Intelligence permanecem não implementadas.
