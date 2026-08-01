# EPC-20 — TISS Concept Catalog

**Sprint:** EPC-20 — TISS Vocabulary Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-20_TISS_VOCABULARY_FOUNDATION.md`](./EPC-20_TISS_VOCABULARY_FOUNDATION.md)  
**Implementação:** `src/lib/enterprise/tiss-vocabulary/ports/models.ts`

---

## 1. Modelo canônico — `TISSConcept`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| ConceptId (`id`) | `string` | Sim | Identificador estável do conceito |
| ConceptCode (`conceptCode`) | `string` | Sim | Código canônico opaco (não é tag XML) |
| CanonicalName (`canonicalName`) | `string` | Sim | Nome semântico permanente |
| Description (`description`) | `string` | Não | Descrição livre |
| Category (`category`) | `TISSConceptCategory` | Sim | Categoria semântica de negócio |
| Status (`status`) | `TISSConceptStatus` | Não | Status estrutural |
| Version (`version`) | `string` | Não | Versão do conceito no catálogo (**não** versão XML TISS) |
| MetadataReference | opaco | Não | Ref. a Metadata Engine |
| ConfigurationReference | opaco | Não | Ref. a Configuration Engine |
| Tags | `string[]` | Não | Classificação livre |
| CustomAttributes | `Record<string, unknown>` | Não | Extensão estrutural |

---

## 2. Categorias semânticas (16)

Estas categorias representam **conceitos de negócio**.  
Elas **NÃO** representam campos XML.

| # | Category | Código fundação | CanonicalName |
|---|----------|-----------------|---------------|
| 1 | `patient` | `TISS.PATIENT` | Patient |
| 2 | `beneficiary` | `TISS.BENEFICIARY` | Beneficiary |
| 3 | `professional` | `TISS.PROFESSIONAL` | Professional |
| 4 | `provider` | `TISS.PROVIDER` | Provider |
| 5 | `organization` | `TISS.ORGANIZATION` | Organization |
| 6 | `procedure` | `TISS.PROCEDURE` | Procedure |
| 7 | `diagnosis` | `TISS.DIAGNOSIS` | Diagnosis |
| 8 | `authorization` | `TISS.AUTHORIZATION` | Authorization |
| 9 | `attendance` | `TISS.ATTENDANCE` | Attendance |
| 10 | `guide` | `TISS.GUIDE` | Guide |
| 11 | `claim` | `TISS.CLAIM` | Claim |
| 12 | `audit` | `TISS.AUDIT` | Audit |
| 13 | `payment` | `TISS.PAYMENT` | Payment |
| 14 | `attachment` | `TISS.ATTACHMENT` | Attachment |
| 15 | `observation` | `TISS.OBSERVATION` | Observation |
| 16 | `relationship` | `TISS.RELATIONSHIP` | Relationship |

**Total de conceitos canônicos de fundação:** **16** (um por categoria).

Constante de runtime: `TISS_FOUNDATION_CONCEPTS`.

---

## 3. ConceptRelationship (estrutural)

Somente representação. Sem lógica. Sem motor de grafo.

| Campo | Descrição |
|-------|-----------|
| `id` | Identificador do relacionamento |
| `sourceCategory` / `sourceConceptId` | Origem |
| `targetCategory` / `targetConceptId` | Destino |
| `relationshipType` | Tipo estrutural livre |
| refs / tags / customAttributes | Extensão estrutural |

### Cadeia de exemplo (documentada, não executável)

```
Procedure
  ↓
Authorization
  ↓
Guide
  ↓
Audit
```

Constante: `TISS_RELATIONSHIP_CHAIN_EXAMPLE`.

---

## 4. O que o catálogo NÃO contém

- Elementos / tags XML TISS
- Schemas XSD
- Números de versão ANS/TISS como lógica
- Regras de validação
- Mapeamentos de layout
- Códigos de operadora
- Prompts de IA / OCR

---

## 5. Extensibilidade

Novos conceitos podem ser registrados via `registerConcept()` sem alterar o Healthcare Model.  
Novas versões XML TISS **não** exigem novos conceitos permanentes — apenas novos mapeamentos na camada TISS Mapping (futuro).
