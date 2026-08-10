# TISS Intelligence Engine — Permanent Architecture Rule

## 1. Escopo

Este documento rege a Fase 6 — Enterprise TISS Intelligence Engine do projeto `medflow-dashboard`.

## 2. Princípios permanentes

- Uma sprint ativa exatamente uma capability.
- Nenhuma engine das Fases 4 e 5 pode ser alterada pelas sprints da Fase 6.
- Nenhum Bloco A-J pode ser alterado pelas sprints da Fase 6.
- Nenhum Port, Provider, Adapter, Registry, Factory, Store ou Model existente pode ser modificado.
- Criar novos Ports, Providers, Factories, Registries, Adapters ou Stores somente mediante necessidade técnica comprovada.
- Reutilizar antes de criar.
- Cada engine da Fase 6 deve conter apenas propriedades `readonly`, construtor e `getCapabilities()` até que uma sprint específica autorize funcionalidade.
- A Fase 6 consome as Fases 4 e 5 exclusivamente através dos Gateways oficiais.
- A Fase 6 nunca importa diretamente as engines internas de Vocabulary ou Mapping.

## 3. Roadmap

| Entrega | Status |
|---|---|
| ARCH-22 Intelligence Discovery | ✅ Concluída |
| EPC-22A Intelligence Discovery Engine | ✅ Implementada |
| EPC-22B Intelligence Canonical Model | ✅ Implementada |
| EPC-22C Intelligence Registry | ✅ Implementada |
| EPC-22D Intelligence Decision Engine | ✅ Implementada |
| EPC-22E EnterpriseGenericTissIntelligenceEngine | ✅ Implementada |
| EPC-22R Final Certification | ⏳ Não iniciada |
| AUDIT-22 Final Audit | ⏳ Não iniciada |

## 4. Capabilities

| Capability | Valor |
|---|---|
| `tissIntelligenceDiscoveryImplemented` | `true` |
| `tissIntelligenceCanonicalModelImplemented` | `true` |
| `tissIntelligenceRegistryImplemented` | `true` |
| `tissIntelligenceDecisionEngineImplemented` | `true` |
| `tissGenericIntelligenceEngineImplemented` | `true` |

## 5. Cadeia arquitetural

```text
EnterpriseGenericTissIntelligenceEngine
            │
            ▼
EnterpriseTissIntelligenceDecisionEngine
            │
            ▼
EnterpriseTissIntelligenceRegistryEngine
            │
            ▼
EnterpriseTissIntelligenceCanonicalEngine
            │
            ▼
EnterpriseTissIntelligenceDiscoveryEngine
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

## 6. Regras de encapsulamento

- `EnterpriseGenericTissIntelligenceEngine` será o único ponto oficial de acesso à TISS Intelligence Foundation.
- Nenhuma engine interna de Vocabulary, Mapping ou Intelligence será consumida diretamente por módulos externos.
- A Fase 6 consome a Fase 5 (`EnterpriseGenericTissMappingEngine`) e a Fase 4 (`EnterpriseGenericTissVocabularyEngine`) somente pelos respectivos Gateways.
- Não são permitidos acessos laterais entre as engines das fundações.
- Não são permitidos ciclos de dependência.

## 7. Fronteiras arquiteturais

| Foundation | Pergunta que responde |
|---|---|
| Vocabulary Foundation | "O que existe?" |
| Mapping Foundation | "Como os conceitos se relacionam?" |
| Intelligence Foundation | "Como utilizar essas informações para tomada de decisão?" |
| Integrações futuras | "Executar as decisões produzidas pela camada de inteligência" |

## 8. Reutilização autorizada

A Fase 6 poderá reutilizar, sem modificar:

- `EnterpriseGenericTissVocabularyEngine`
- `EnterpriseGenericTissMappingEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 9. Condição de permanência

Todas as sprints da Fase 6 permanecem estruturais até que uma sprint específica autorize funcionalidade. Nenhum parser, IA, LLM, algoritmo, consulta real, cache, persistência, runtime, XML, SOAP, TUSS, OCR, Edge Function ou Supabase será introduzido sem autorização explícita.

## 10. Semantic Responsibility Matrix

A TISS Intelligence Foundation é composta por três responsabilidades semânticas distintas e não sobrepostas:

```text
Vocabulary
    ↓ conceitos
Mapping
    ↓ relacionamentos
Intelligence
    ↓ contexto decisório
```

| Foundation | Responde a | Representa | Não representa |
|---|---|---|---|
| Vocabulary | "O que existe?" | Conceitos, termos, definições canônicas | Cenários, critérios, recomendações, decisões |
| Mapping | "Como os conceitos se relacionam?" | Relações, mapeamentos, fontes, alvos | Regras de decisão, perfis de recomendação |
| Intelligence | "Como essas informações podem apoiar decisões?" | Contextos, cenários, critérios, evidências, perfis de recomendação, domínios de decisão | Conceitos em si, catálogos ou relações diretas de mapeamento |

Os modelos da camada Intelligence (`TissIntelligenceContext`, `TissDecisionScenario`, `TissDecisionCriterion`, `TissRecommendationProfile`, `TissEvidenceReference`, `TissDecisionDomain`) são estruturas semânticas de decisão. Eles não duplicam conceitos da Vocabulary Foundation, nem relações da Mapping Foundation. A evolução para Rule Evaluation, Recommendation, Explainability e Decision Output ocorrerá em sprints futuras.

## 11. Future Decision Layer

> **Diretriz arquitetural futura.**
>
> A camada de decisão (`EnterpriseTissIntelligenceDecisionEngine` — EPC-22D) ainda não foi implementada. Sua evolução está prevista para sprints futuras e poderá contemplar os seguintes conceitos, sem antecipar design ou código:
>
> - **Rule Evaluation** — estruturação de regras de negócio TISS para análise de conformidade.
> - **Recommendation** — geração de sugestões baseadas nos contratos canônicos de Vocabulary, Mapping e Intelligence.
> - **Explainability** — rastreabilidade das decisões produzidas.
> - **Decision Output** — contrato canônico representando o resultado de uma decisão.
>
> Nenhuma classe, interface, capability ou arquivo foi criado para estes conceitos nesta sprint. A documentação acima serve apenas como diretriz arquitetural futura.

## 12. Intelligence Responsibility Matrix

| Camada | Responsabilidade | Consome |
|---|---|---|
| **Discovery** | Identifica o domínio da inteligência | Gateways Vocabulary + Mapping + Blocos H/I/J |
| **Canonical** | Modela semanticamente o domínio | Discovery + Gateways + Blocos H/I/J |
| **Registry** | Organiza e referencia contratos | Canonical + Discovery + Gateways + Blocos H/I/J |
| **Decision** | Prepara futura tomada de decisão | Registry + Canonical + Discovery + Gateways + Blocos H/I/J |
| **Gateway** | Futura exposição pública | Decision + Gateways + Blocos H/I/J |

A Registry:

- Não substitui a Canonical.
- Não antecipa a Decision.
- Não executa decisões.
- Apenas referencia contratos homologados.

## 13. Structural Isolation Proof

A `EnterpriseTissIntelligenceRegistryEngine` comprova isolamento estrutural:

- **Não importa nenhuma engine interna da Vocabulary Foundation.**
  - Não referencia `EnterpriseTissVocabularyDiscoveryEngine`.
  - Não referencia `EnterpriseTissVocabularyCanonicalEngine`.
  - Não referencia `EnterpriseTissVocabularyRegistryEngine`.
  - Não referencia `EnterpriseTissVocabularyQueryEngine`.

- **Não importa nenhuma engine interna da Mapping Foundation.**
  - Não referencia `EnterpriseTissMappingDiscoveryEngine`.
  - Não referencia `EnterpriseTissMappingCanonicalEngine`.
  - Não referencia `EnterpriseTissMappingRegistryEngine`.
  - Não referencia `EnterpriseTissMappingQueryEngine`.

- **Consome apenas os Gateways oficiais e as engines Intelligence autorizadas.**
  - `EnterpriseTissIntelligenceCanonicalEngine`
  - `EnterpriseTissIntelligenceDiscoveryEngine`
  - `EnterpriseGenericTissMappingEngine`
  - `EnterpriseGenericTissVocabularyEngine`
  - `GenericTissEngine`
  - `GenericTissIntegrationEngine`
  - `GenericWorkflowEngine`
  - `EnterpriseMasterOrchestrationEngine`

## 14. Decision Readiness Matrix

| Camada | Responsabilidade | Consome |
|---|---|---|
| **Discovery** | Identifica o contexto de inteligência | Gateways Vocabulary + Mapping + Blocos H/I/J |
| **Canonical** | Representa semanticamente o domínio | Discovery + Gateways + Blocos H/I/J |
| **Registry** | Organiza e referencia contratos | Canonical + Discovery + Gateways + Blocos H/I/J |
| **Decision** | Prepara futura decisão | Registry + Canonical + Discovery + Gateways + Blocos H/I/J |
| **Gateway** | Futura exposição pública | Decision + Gateways + Blocos H/I/J |

A `EnterpriseTissIntelligenceDecisionEngine` **NÃO** contém:

- Regras
- Inferência
- IA
- Recomendação
- Explainability
- Algoritmo

Apenas referencia contratos homologados.

## 15. Future Intelligence Boundary

A `EnterpriseTissIntelligenceDecisionEngine` comprova documentalmente que:

- **NÃO invade responsabilidades das futuras integrações.**
- **NÃO executa funcionalidades clínicas.**
- **NÃO acessa bancos.**
- **NÃO consome OCR.**
- **NÃO consome XML.**
- **NÃO consome SOAP.**
- Permanece **completamente estrutural**.

## 16. Architectural Gateway Proof

### 16.1 Consumidores permitidos

- Módulos enterprise futuros que precisem acessar a TISS Intelligence Foundation.
- Pontos de entrada controlados (Console, Orchestration, Governance, etc.).
- Qualquer acesso externo passa exclusivamente por `EnterpriseGenericTissIntelligenceEngine`.

### 16.2 Consumidores proibidos

- Acesso direto à `EnterpriseTissIntelligenceDiscoveryEngine`.
- Acesso direto à `EnterpriseTissIntelligenceCanonicalEngine`.
- Acesso direto à `EnterpriseTissIntelligenceRegistryEngine`.
- Acesso direto à `EnterpriseTissIntelligenceDecisionEngine`.
- Acesso direto às engines internas de Vocabulary ou Mapping.

### 16.3 Prova de encapsulamento

A `EnterpriseGenericTissIntelligenceEngine` encapsula as quatro engines internas da Fase 6, expondo apenas referências estruturais e a função `getCapabilities()`. Não expõe métodos de negócio, regras, IA, decisão, inferência, recomendação, explicabilidade, scoring ou execução.

### 16.4 Prova de inexistência de acessos laterais

A engine consome exclusivamente as camadas imediatamente inferiores e os Gateways oficiais das fases anteriores. Não existe dependência cruzada entre as camadas internas da Vocabulary, Mapping e Intelligence.

### 16.5 Prova de inexistência de dependências circulares

A cadeia segue estritamente o fluxo top-down:

```text
Generic Intelligence → Decision → Registry → Canonical → Discovery → Mapping → Vocabulary → Blocos H/I/J
```

Nenhuma camada inferior consome uma camada superior.

### 16.6 Prova documental de unicidade do Gateway

Nenhuma outra engine da Fase 6 é exportada como ponto de acesso público. O `index.ts` do `generic-intelligence` exporta apenas `EnterpriseGenericTissIntelligenceEngine`. Os diretórios `intelligence-discovery`, `intelligence-canonical`, `intelligence-registry` e `intelligence-decision` não são expostos como pontos de entrada globais, mantendo seu consumo reservado à cadeia interna.

## 17. Foundation Independence Matrix

| Foundation | Independência | Gateway oficial |
|---|---|---|
| **Vocabulary Foundation (Fase 4)** | Continua independente, sem alterações | `EnterpriseGenericTissVocabularyEngine` |
| **Mapping Foundation (Fase 5)** | Continua independente, sem alterações | `EnterpriseGenericTissMappingEngine` |
| **Intelligence Foundation (Fase 6)** | Continua independente, sem alterar Vocabulary nem Mapping | `EnterpriseGenericTissIntelligenceEngine` |

- Nenhuma Foundation altera outra.
- A comunicação entre as fundações ocorre exclusivamente pelos Gateways oficiais.
- As engines internas de cada Foundation permanecem encapsuladas.
