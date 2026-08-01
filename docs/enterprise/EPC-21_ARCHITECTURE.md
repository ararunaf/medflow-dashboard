# EPC-21 — TISS Mapping Architecture

**Sprint:** EPC-21 — TISS Mapping Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-21_TISS_MAPPING_FOUNDATION.md`](./EPC-21_TISS_MAPPING_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getTISSMappingHealthSummary)       │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSMappingPort                                      │
│  registerFieldMapping | registerConceptMapping       │
│  registerCanonicalMapping | getMapping | listMappings│
│  health | capabilities                               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultTISSMappingAdapter                           │
│  MockTISSMappingAdapter                              │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSMappingStore (in-process)                        │
│  field / concept / canonical / definition / version  │
│  + structural relationships                          │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSMappingFactory → createTISSMappingPort           │
└──────────────────────────────────────────────────────┘
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Fronteiras

| Pode | Não pode |
|------|----------|
| Registrar mapeamentos declarativos | Implementar parser XML / JSON / OCR |
| Persistir em store in-process | Criar banco / migrations |
| Health / capabilities | Alterar UI / APIs |
| Separar Field / Concept / Canonical | Executar regras ou validações |
| Documentar multi-fonte / multi-versão | Integrar FHIR / DICOM / SOAP / REST |
| Referenciar Vocabulário e Healthcare kinds | Alterar EPC-19 / EPC-20 |

---

## 3. Fluxo canônico obrigatório

```
Qualquer origem de dados
  ↓
Field Mapping          (origem → Vocabulário TISS)
  ↓
Concept Mapping        (Vocabulário → Healthcare Model kinds)
  ↓
Canonical Mapping      (blueprints do Healthcare Model)
  ↓
Canonical Healthcare Model   (EPC-19)
  ↓
Rule Engine / Workflow / AI Auditor
```

O núcleo Enterprise **nunca** recebe dados brutos de origem sem passar pelas três camadas.

---

## 4. Posição no pipeline Enterprise

```
TISS XML / JSON / OCR / API / CSV / FHIR / DICOM / legado
  ↓
TISS Mapping                 ← EPC-21 (esta sprint)
  ↓
TISS Vocabulary              (EPC-20)
  ↓
Canonical Healthcare Model   (EPC-19)
  ↓
Rule Engine / Workflow / AI Auditor
```

- Mapping conhece **rótulos** de versão/origem; Vocabulary **não**.
- Healthcare Model permanece agnóstico à origem.
- Mudanças de versão TISS impactam **apenas** Mapping.

---

## 5. Futuras origens (FASE 11 — documentação apenas)

Nenhuma integração é implementada nesta sprint. Todas as origens abaixo **deverão** convergir para o mesmo Mapping:

| Origem | Como usará o Mapping (futuro) |
|--------|-------------------------------|
| **XML TISS** | Field Mapping liga elementos/caminhos XML → `conceptCode`; versões distintas = `MappingVersion` distintas |
| **JSON** | Field Mapping liga paths JSON → conceitos; mesmo Concept/Canonical Mapping |
| **REST API** | Payload normalizado → Field Mapping; sem o Port chamar a API |
| **SOAP** | Envelope/body → Field Mapping; Mapping não embute cliente SOAP |
| **OCR** | Tokens/campos opacos do OCR Provider → Field Mapping → Vocabulário |
| **CSV** | Colunas → Field Mapping |
| **Banco legado** | Colunas/views → Field Mapping |
| **FHIR** | Recursos/elementos → Field Mapping → Vocabulário → Healthcare Model |
| **DICOM** | Tags/atributos → Field Mapping → Vocabulário → Healthcare Model |

### Contrato conceitual comum

1. Extrator/adaptador de origem (fora do Mapping) produz **campos estruturados opacos**.
2. **Field Mapping** traduz campo → conceito do Vocabulário (EPC-20).
3. **Concept Mapping** traduz conceito → kind do Healthcare Model (EPC-19).
4. **Canonical Mapping** declara a montagem do objeto canônico.
5. Somente então o Healthcare Model é materializado (sprint futura de bind).

Nenhuma origem pode saltar etapas.

---

## 6. Multi-versão TISS

| Camada | Responsabilidade |
|--------|------------------|
| Artefato TISS vN | Layout / schema de mercado |
| **TISS Mapping (EPC-21)** | Adaptar vN → conceitos via Field/Concept/Canonical |
| TISS Vocabulary (EPC-20) | Conceitos permanentes |
| Healthcare Model (EPC-19) | Entidades de runtime |

Nova versão TISS = novos/ajustados registros de Mapping. Vocabulário e núcleo permanecem estáveis.

---

## 7. Isolamento de produto

| Área de produto | Impacto EPC-21 |
|-----------------|----------------|
| `src/lib/tiss` | Nenhum |
| `src/lib/capture` (parser) | Nenhum |
| Rotas / UI | Nenhum |
| Server Functions / APIs | Nenhum |
| Migrations / RLS | Nenhum |
| Healthcare Model / Vocabulary | Nenhum (sem alteração) |

---

## 8. Capabilities (exclusões explícitas)

```ts
implementsXmlParser: false
implementsValidation: false
implementsRules: false
implementsRuleEngine: false
implementsWorkflow: false
implementsOcr: false
implementsAi: false
supportsThreeLayerMapping: true
supportsDeclarativeMapping: true
supportsMultiSource: true
supportsMultiVersionTiss: true
fieldMappingDecoupledFromHealthcareModel: true
conceptMappingUsesVocabularyOnly: true
canonicalMappingProducesHealthcareModelOnly: true
```

---

## 9. Testes

- Suite: `scripts/enterprise/tests/tiss-mapping-engine.test.ts`
- Script: `npm run enterprise:tiss-mapping:test`
- Categorias: Contract, Mock, Health, Capabilities, Factory, Smoke, Store/ops, Isolation
