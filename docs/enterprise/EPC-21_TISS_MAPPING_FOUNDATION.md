# EPC-21 — TISS Mapping Foundation

**Sprint:** EPC-21 — TISS Mapping Foundation  
**Data:** 31/07/2026  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/tiss-mapping/`  
**Baseline compatível:** MVP operacional + Enterprise Platform Core (EPC-01..20) + ECS-01  
**Continuidade:** Espelha o padrão Enterprise (ECS-01) — ponte declarativa Origem → Healthcare Model  
**Dependências conceituais:** TISS Vocabulary (EPC-20), Canonical Healthcare Model (EPC-19)

---

## 1. Objetivo

Criar exclusivamente a **infraestrutura de Mapping** entre qualquer origem de dados e o Healthcare Model.

O Mapping é **totalmente declarativo** e **independente do formato de origem**.

O Mapping **NÃO**:

- executa regras
- valida dados
- interpreta contratos
- faz parse de XML / JSON / OCR / FHIR / DICOM

O Mapping **apenas traduz estruturas**.

---

## 2. Princípio arquitetural

Arquitetura obrigatória:

```
Origem
  ↓
Field Mapping
  ↓
Concept Mapping
  ↓
Canonical Mapping
  ↓
Healthcare Model
```

Nunca:

```
Origem → Rule Engine
```

Nunca:

```
Origem → Healthcare Model
```

Sem passar pelo Mapping.

---

## 3. Escopo desta sprint

### Inclui

| Item | Status |
|------|--------|
| `TISSMappingPort` | ✅ |
| `DefaultTISSMappingAdapter` (in-memory) | ✅ |
| `MockTISSMappingAdapter` | ✅ |
| `TISSMappingStore` | ✅ |
| `TISSMappingFactory` | ✅ |
| `createTISSMappingPort` (Provider) | ✅ |
| Modelos: Field / Concept / Canonical / Definition / Version / Relationship | ✅ |
| `MappingCapabilities` | ✅ |
| Documentação de futuras origens | ✅ |
| Testes Enterprise + certificação | ✅ |

### Explicitamente fora (NÃO fazer)

- Parser XML
- Leitor JSON / OCR / FHIR Adapter / DICOM Adapter
- Importadores / Integrações
- Validações / Rule Engine / Workflow
- Banco / APIs / UI / Migrations
- Alteração do Healthcare Model (EPC-19) ou Vocabulary (EPC-20)

---

## 4. Arquitetura (ECS-01)

```
Application
  ↓
TISSMappingPort
  ↓
TISSMappingAdapter
  ↓
TISSMappingStore
  ↓
TISSMappingFactory
  ↓
TISSMappingProvider
```

Ver [`EPC-21_ARCHITECTURE.md`](./EPC-21_ARCHITECTURE.md).  
Ver modelos em [`EPC-21_MAPPING_MODEL.md`](./EPC-21_MAPPING_MODEL.md).

---

## 5. Três camadas de Mapping

| Camada | Entrada | Saída | Escopo |
|--------|---------|-------|--------|
| **Field Mapping** | Campo de origem | Conceito do Vocabulário TISS | Sem Healthcare Model |
| **Concept Mapping** | Conceito do Vocabulário | Kind do Healthcare Model | Sem formato de origem |
| **Canonical Mapping** | Conceitos + bindings | Blueprint do Healthcare Model | Sem validação / regras |

---

## 6. MappingCapabilities

Estrutura apenas (sem execução):

- `SupportsVersioning`
- `SupportsAliases`
- `SupportsFallback`
- `SupportsInheritance`
- `SupportsTransformation`

---

## 7. Futuras origens (documentação apenas)

Todas convergem para o mesmo Mapping — **sem implementação nesta sprint**:

XML TISS · JSON · REST API · SOAP · OCR · CSV · Banco legado · FHIR · DICOM

Ver § futuras origens em [`EPC-21_ARCHITECTURE.md`](./EPC-21_ARCHITECTURE.md).

---

## 8. Isolamento de produto

| Área | Impacto EPC-21 |
|------|----------------|
| `src/lib/tiss` / `src/lib/capture` | Nenhum |
| Rotas / UI / APIs | Nenhum |
| Migrations / RLS | Nenhum |
| Healthcare Model / Vocabulary | Nenhum (sem alteração) |
| Rule Engine / Workflow / OCR / AI | Nenhum |

---

## 9. Documentação

| Documento | Conteúdo |
|-----------|----------|
| [`EPC-21_TISS_MAPPING_FOUNDATION.md`](./EPC-21_TISS_MAPPING_FOUNDATION.md) | Visão geral da sprint |
| [`EPC-21_MAPPING_MODEL.md`](./EPC-21_MAPPING_MODEL.md) | Modelos canônicos |
| [`EPC-21_ARCHITECTURE.md`](./EPC-21_ARCHITECTURE.md) | Camadas ECS-01 + futuras origens |
| [`EPC-21_CERTIFICATION.md`](./EPC-21_CERTIFICATION.md) | Certificação obrigatória |

---

## 10. Resultado esperado

Separar claramente:

1. **RESULTADO DA SPRINT** — fundação Mapping operacional em isolamento.
2. **ESTADO GLOBAL DO PROJETO** — produto 100% compatível; nenhum comportamento alterado.

Essa arquitetura permitirá incorporar novas versões da TISS e novos padrões de interoperabilidade **apenas adicionando ou ajustando mapeamentos**, preservando o restante da plataforma.
