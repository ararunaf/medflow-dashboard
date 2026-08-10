# EPC-21C — Enterprise TISS Mapping Registry

## 1. Identificação

| Campo | Valor |
|---|---|
| Sprint | EPC-21C |
| Fase | Fase 5 — TISS Mapping Foundation |
| Componente | `EnterpriseTissMappingRegistryEngine` |
| Capacidade ativada | `tissMappingRegistryImplemented = true` |

## 2. Objetivo

Estabelecer a camada estrutural de registro do mapeamento TISS Enterprise. A camada Registry organiza e referencia os contratos canônicos definidos em EPC-21B, sem implementar persistência, consulta, carregamento, cache, indexação ou runtime.

## 3. Componentes criados

- `src/lib/enterprise/tiss-mapping/mapping-registry/enterprise-tiss-mapping-registry-engine.ts`
- `src/lib/enterprise/tiss-mapping/mapping-registry/index.ts`
- `scripts/enterprise/tests/enterprise-tiss-mapping-registry-engine.test.ts`

## 4. Propriedades da engine

- `canonicalEngine: EnterpriseTissMappingCanonicalEngine`
- `discoveryEngine: EnterpriseTissMappingDiscoveryEngine`
- `genericVocabularyEngine: EnterpriseGenericTissVocabularyEngine`
- `genericTissEngine: GenericTissEngine`
- `genericTissIntegrationEngine: GenericTissIntegrationEngine`
- `workflowEngine: GenericWorkflowEngine`
- `masterOrchestrationEngine: EnterpriseMasterOrchestrationEngine`

## 5. Capabilities

| Capability | Valor |
|---|---|
| `tissMappingDiscoveryImplemented` | `true` |
| `tissMappingCanonicalModelImplemented` | `true` |
| `tissMappingRegistryImplemented` | `true` |
| `tissMappingQueryEngineImplemented` | `false` |
| `tissGenericMappingEngineImplemented` | `false` |

## 6. Reutilização

A engine consome exclusivamente as engines autorizadas:

- `EnterpriseTissMappingCanonicalEngine`
- `EnterpriseTissMappingDiscoveryEngine`
- `EnterpriseGenericTissVocabularyEngine`
- `GenericTissEngine`
- `GenericTissIntegrationEngine`
- `GenericWorkflowEngine`
- `EnterpriseMasterOrchestrationEngine`

## 7. Diagrama arquitetural atualizado

```text
EnterpriseGenericTissMappingEngine (EPC-21E — futuro)
            │
            ▼
EnterpriseTissMappingQueryEngine (EPC-21D — futuro)
            │
            ▼
EnterpriseTissMappingRegistryEngine (EPC-21C)
            │
            ▼
EnterpriseTissMappingCanonicalEngine (EPC-21B)
            │
            ▼
EnterpriseTissMappingDiscoveryEngine (EPC-21A)
            │
            ▼
EnterpriseGenericTissVocabularyEngine (EPC-20E)
            │
            ▼
  ├─ EnterpriseTissVocabularyQueryEngine (EPC-20D)
  ├─ EnterpriseTissVocabularyRegistryEngine (EPC-20C)
  ├─ EnterpriseTissVocabularyCanonicalEngine (EPC-20B)
  ├─ EnterpriseTissVocabularyDiscoveryEngine (EPC-20A)
  ├─ GenericTissEngine (Bloco H)
  ├─ GenericTissIntegrationEngine (Bloco H)
  ├─ GenericWorkflowEngine (Bloco I)
  └─ EnterpriseMasterOrchestrationEngine (Bloco J)
```

## 8. Matriz Discovery × Canonical × Registry × Query × Generic Mapping

| Camada | Responsabilidade | Entrada | Saída | Dependências permitidas | Dependências proibidas |
|---|---|---|---|---|---|
| **Discovery (EPC-21A)** | Identificar o domínio de mapeamento | Vocabulary Gateway, Blocos H/I/J | Contexto de mapeamento | `EnterpriseGenericTissVocabularyEngine`, `GenericTissEngine`, `GenericTissIntegrationEngine`, `GenericWorkflowEngine`, `EnterpriseMasterOrchestrationEngine` | Engines internas da Vocabulary Foundation |
| **Canonical (EPC-21B)** | Definir os contratos canônicos de relação | Discovery + Vocabulary Gateway + Blocos H/I/J | Modelos canônicos (`TissMappingRule`, `TissMappingRelation`, etc.) | `EnterpriseTissMappingDiscoveryEngine`, `EnterpriseGenericTissVocabularyEngine`, Blocos H/I/J | Engines internas da Vocabulary Foundation |
| **Registry (EPC-21C)** | Organizar e referenciar contratos canônicos | Canonical + Discovery + Vocabulary Gateway + Blocos H/I/J | Referência estrutural aos contratos | `EnterpriseTissMappingCanonicalEngine`, `EnterpriseTissMappingDiscoveryEngine`, `EnterpriseGenericTissVocabularyEngine`, Blocos H/I/J | Persistência real, consulta, algoritmos |
| **Query (EPC-21D)** | Consultar o Registry (futuro) | Registry + camadas inferiores + Blocos H/I/J | Resultados de consulta (futuro) | `EnterpriseTissMappingRegistryEngine`, camadas inferiores, Blocos H/I/J | Acesso direto ao Canonical sem passar pelo Registry |
| **Generic Mapping (EPC-21E)** | Gateway único da Mapping Foundation | Todas as camadas inferiores + Blocos H/I/J | Capabilities consolidadas | `EnterpriseTissMappingQueryEngine` (futuro) + camadas inferiores | Acesso direto a Discovery, Canonical, Registry ou Query |

## 9. Prova documental de que o Registry apenas referencia contratos

O `EnterpriseTissMappingRegistryEngine` contém unicamente:

- sete propriedades `readonly` apontando para engines já homologadas;
- um construtor;
- um método `getCapabilities()`.

Não possui:

- propriedades de armazenamento (`store`, `cache`, `index`);
- métodos de consulta (`query`, `find`, `list`);
- métodos de carregamento (`load`, `import`, `fetch`);
- dependências de banco de dados, parser, XML, SOAP ou runtime.

Portanto, o Registry **organiza e referencia** os contratos definidos no Canonical Model, sem substituí-lo e sem antecipar o Query Engine.

## 10. Confirmação de ausência de duplicação arquitetural

- `Discovery` não repete o `Canonical`.
- `Registry` não repete o `Canonical`.
- `Registry` não antecipa o `Query`.
- Cada camada adiciona exatamente uma responsabilidade estrutural.
- A Fase 5 continua consumindo a Fase 4 exclusivamente pelo `EnterpriseGenericTissVocabularyEngine`.

## 11. Validação

- `npm run build` — PASS
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS (0 erros, 7 warnings históricos)
- `npm run smoke-check` — PASS
- `npx tsx --test scripts/enterprise/tests/*.test.ts` — suíte Enterprise completa

## 12. Status

A camada de Registry da TISS Mapping Foundation foi estabelecida. A próxima sprint, EPC-21D, ainda não foi iniciada.
