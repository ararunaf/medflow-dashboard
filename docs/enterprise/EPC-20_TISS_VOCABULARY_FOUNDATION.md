# EPC-20 — TISS Vocabulary Foundation

**Sprint:** EPC-20 — TISS Vocabulary Foundation  
**Data:** 31/07/2026  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/tiss-vocabulary/`  
**Baseline compatível:** MVP operacional + Enterprise Platform Core (EPC-01..19) + ECS-01  
**Continuidade:** Espelha o padrão Enterprise (ECS-01) — catálogo semântico TISS  
**Próxima sprint relacionada:** TISS Mapping (futuro) → bind ao Healthcare Model (EPC-19)

---

## 1. Objetivo

Criar exclusivamente o **Vocabulário Canônico TISS** — um catálogo semântico totalmente desacoplado do layout XML TISS — que será utilizado por toda a plataforma Enterprise.

O Vocabulário representa **conceitos**.

Ele **NÃO** representa:

- arquivos
- layouts
- versões XML
- validações executáveis

---

## 2. Princípio arquitetural

Arquitetura obrigatória:

```
TISS XML
  ↓
TISS Mapping          (futuro)
  ↓
TISS Vocabulary       ← EPC-20 (esta sprint)
  ↓
Canonical Healthcare Model   (EPC-19)
  ↓
Rule Engine
```

Nunca:

```
TISS XML → Rule Engine
```

---

## 3. Escopo desta sprint

### Inclui

| Item | Status |
|------|--------|
| `TISSVocabularyPort` | ✅ |
| `DefaultTISSVocabularyAdapter` (in-memory) | ✅ |
| `MockTISSVocabularyAdapter` | ✅ |
| `TISSVocabularyFactory` | ✅ |
| `createTISSVocabularyPort` (Provider) | ✅ |
| Modelo `TISSConcept` | ✅ |
| Categorias semânticas (16) | ✅ |
| `ConceptRelationship` estrutural | ✅ |
| Catálogo de fundação (16 conceitos) | ✅ |
| Documentação de integração futura | ✅ |
| Testes Enterprise + certificação | ✅ |

### Explicitamente fora (NÃO fazer)

- Parser XML TISS
- TISS Intelligence
- Regras
- Validações
- OCR / AI / Workflow
- Banco / APIs / UI / Migrations
- Alteração do Healthcare Model (EPC-19)

---

## 4. Arquitetura (ECS-01)

```
Application
  ↓
TISSVocabularyPort
  ↓
TISSVocabularyAdapter
  ↓
TISSVocabularyStore
  ↓
TISSVocabularyFactory
  ↓
TISSVocabularyProvider
```

Ver [`EPC-20_ARCHITECTURE.md`](./EPC-20_ARCHITECTURE.md).

---

## 5. Port — operações mínimas

| Operação | Descrição |
|----------|-----------|
| `registerConcept()` | Registra / atualiza conceito canônico |
| `getConcept()` | Obtém por `conceptId` ou `conceptCode` |
| `listConcepts()` | Lista com filtros estruturais |
| `health()` | Prontidão do adapter/store |
| `capabilities()` | Capacidades estáticas (inclui exclusões) |

---

## 6. Modelo e catálogo

- Modelo: `TISSConcept` — ver [`EPC-20_CONCEPT_CATALOG.md`](./EPC-20_CONCEPT_CATALOG.md)
- Categorias: Patient, Beneficiary, Professional, Provider, Organization, Procedure, Diagnosis, Authorization, Attendance, Guide, Claim, Audit, Payment, Attachment, Observation, Relationship
- Relacionamentos: `ConceptRelationship` (somente estrutural)

---

## 7. Decisão estrutural permanente

O TISS Vocabulary Foundation é a **base semântica** da plataforma.

- Nunca depende de uma versão específica da TISS.
- Representa conceitos permanentes.
- Futuras versões da TISS serão adaptadas a este vocabulário via **TISS Mapping**.

Isso garante que mudanças no padrão TISS **não** impactem diretamente o núcleo Enterprise do MedicFlow.

---

## 8. Documentos da sprint

| Documento | Papel |
|-----------|-------|
| [`EPC-20_TISS_VOCABULARY_FOUNDATION.md`](./EPC-20_TISS_VOCABULARY_FOUNDATION.md) | Fundação / escopo |
| [`EPC-20_CONCEPT_CATALOG.md`](./EPC-20_CONCEPT_CATALOG.md) | Catálogo de conceitos e categorias |
| [`EPC-20_ARCHITECTURE.md`](./EPC-20_ARCHITECTURE.md) | Arquitetura e integrações futuras |
| [`EPC-20_CERTIFICATION.md`](./EPC-20_CERTIFICATION.md) | Certificação da sprint |

---

## 9. Resultado

**EPC-20 adiciona apenas infraestrutura isolada sob `src/lib/enterprise/tiss-vocabulary/`.**  
Nenhuma funcionalidade, tela, API, migration ou comportamento de produto foi alterado.
