# EPC-21 — Mapping Model

**Sprint:** EPC-21 — TISS Mapping Foundation  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/tiss-mapping/ports/models.ts`  
**Documento pai:** [`EPC-21_TISS_MAPPING_FOUNDATION.md`](./EPC-21_TISS_MAPPING_FOUNDATION.md)

---

## 1. Princípio

Todos os modelos são **estruturais e declarativos**.

- Sem lógica
- Sem validação
- Sem regras
- Sem parsers
- Sem execução de transformação

---

## 2. Modelos obrigatórios

### 2.1 FieldMapping

**Responsabilidade:** Campo de origem → Conceito do Vocabulário TISS.

```
campo_001  →  Beneficiary   (TISS.BENEFICIARY)
campo_010  →  Procedure     (TISS.PROCEDURE)
```

| Campo | Papel |
|-------|-------|
| `sourceField` | Identificador do campo na origem |
| `sourcePath` | Caminho opaco (sem parser) |
| `sourceKind` | Rótulo da origem (`xml-tiss`, `json`, …) |
| `sourceAlias` | Alias estrutural opcional |
| `targetConceptCode` | Código do Vocabulário TISS |
| `targetConceptId` | Id opcional do conceito |

**Garantia:** Field Mapping **não** referencia `targetEntityKind` do Healthcare Model.

---

### 2.2 ConceptMapping

**Responsabilidade:** Conceitos do Vocabulário → Healthcare Model.

| Campo | Papel |
|-------|-------|
| `sourceConceptCode` | Código do Vocabulário TISS |
| `sourceConceptId` | Id opcional do conceito |
| `targetEntityKind` | Kind do Healthcare Model (EPC-19) |
| `targetAttribute` | Atributo estrutural opcional |

**Garantia:** Concept Mapping **não** conhece XML, OCR, JSON ou qualquer formato de origem. Utiliza **apenas** referências ao Vocabulário TISS.

---

### 2.3 CanonicalMapping

**Responsabilidade:** Montar declarativamente a forma dos objetos do Healthcare Model.

| Campo | Papel |
|-------|-------|
| `targetEntityKind` | Kind canônico a montar |
| `fieldBindings` | Ligações conceito → `attributePath` |
| `conceptMappingIds` | Concept Mappings que alimentam a montagem |
| `assemblyHint` | Hint estrutural opaco (não é regra) |

**Garantia:** Canonical Mapping produz **exclusivamente** blueprints do Healthcare Model. Sem validação. Sem inteligência. Sem regras.

---

### 2.4 MappingDefinition

Agregação das três camadas para uma origem/versão.

| Campo | Papel |
|-------|-------|
| `name` | Nome estável |
| `sourceKind` | Origem coberta |
| `versionId` / `mappingVersionLabel` | Versionamento estrutural |
| `fieldMappingIds` | Field Mappings incluídos |
| `conceptMappingIds` | Concept Mappings incluídos |
| `canonicalMappingIds` | Canonical Mappings incluídos |

---

### 2.5 MappingVersion

Versão estrutural de um Mapping (ex.: rótulo TISS `3.05.00`).

Permite múltiplas versões sem alterar Vocabulário nem Healthcare Model.

---

### 2.6 MappingRelationship

Relacionamento estrutural entre registros (ex.: `field-to-concept`, `concept-to-canonical`).

Somente representação — sem motor de grafo.

---

## 3. Cadeia documentada

```
MAPPING_LAYER_CHAIN = field → concept → canonical
MAPPING_PIPELINE    = origem → field-mapping → concept-mapping → canonical-mapping → healthcare-model
```

---

## 4. MappingCapabilities (FASE 10)

| Capability | Significado estrutural |
|------------|------------------------|
| `SupportsVersioning` | Versionamento declarativo |
| `SupportsAliases` | Aliases de campos de origem |
| `SupportsFallback` | Fallback declarativo (sem execução) |
| `SupportsInheritance` | Herança declarativa (sem execução) |
| `SupportsTransformation` | Transformação declarativa (sem execução) |

Todas são **flags estruturais**. Nenhuma implica motor de execução nesta sprint.

---

## 5. Referências opacas

- `MappingMetadataReference` → Metadata Engine (prep)
- `MappingConfigurationReference` → Configuration Engine (prep)
- `HealthcareEntityKindRef` → kinds do EPC-19 por string (sem import runtime)

---

## 6. O que estes modelos NÃO são

| Não é | Motivo |
|-------|--------|
| Parser | Mapping não lê arquivos |
| Validador | Mapping não valida dados |
| Rule Engine | Mapping não executa regras |
| Contrato | Mapping não interpreta contratos |
| Integração | Mapping não chama APIs / OCR / FHIR |
