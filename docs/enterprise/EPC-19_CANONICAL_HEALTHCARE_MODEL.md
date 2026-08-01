# EPC-19 — Enterprise Canonical Healthcare Data Model Foundation

**Sprint:** EPC-19 — Canonical Healthcare Model Foundation  
**Data:** 31/07/2026  
**Natureza:** Fundação arquitetural — **sem alteração de produto, UI, APIs, banco, OCR, IA, Workflow ou Rule Engine**  
**Padrão obrigatório:** [`ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md`](./ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md)

---

## 1. Objetivo

Criar o **Modelo Canônico Enterprise de Dados da Saúde** — linguagem universal sobre a qual toda inteligência futura do MedicFlow trabalhará.

Este modelo **não** depende de:

- ANS
- TISS / TUSS / CID
- Operadoras (Unimed, Hapvida, Bradesco, SulAmérica, …)
- Cooperativas
- Prestadores específicos
- XML / PDF / OCR / banco / UI

Representa **apenas conceitos universais** de saúde suplementar.

---

## 2. Princípio arquitetural

Toda inteligência futura trabalha sobre o Canonical Healthcare Model.

**Nunca** diretamente sobre XML TISS, PDF, OCR, banco ou operadora.

Fluxo obrigatório:

```
Documento
  ↓
ProcessingOutput
  ↓
Canonical Healthcare Model
  ↓
TISS Intelligence
  ↓
Rule Engine
  ↓
AI Auditor
```

Qualquer padrão futuro (TISS, HL7 FHIR, DICOM, XML proprietário) deverá ser **convertido para este modelo** antes de alimentar Rule Engine, Workflow ou AI Auditor.

---

## 3. Arquitetura (ECS-01)

```
Application
  ↓
HealthcareModelPort
  ↓
HealthcareModelAdapter
  ↓
HealthcareModelStore
  ↓
HealthcareModelFactory
  ↓
HealthcareModelProvider
```

Pasta: `src/lib/enterprise/healthcare-model/`

| Camada | Artefato |
|--------|----------|
| Port | `HealthcareModelPort` |
| Default Adapter | `DefaultHealthcareModelAdapter` (in-memory) |
| Mock Adapter | `MockHealthcareModelAdapter` |
| Store | `DefaultHealthcareModelStore` |
| Factory | `HealthcareModelFactory` / `createHealthcareModelFactory` |
| Provider | `createHealthcareModelPort` |
| Demo PoC | `getHealthcareModelHealthSummary` |

---

## 4. Superfície do Port

Operações mínimas:

| Operação | Função |
|----------|--------|
| `createEntity()` | Cria / registra entidade canônica |
| `getEntity()` | Obtém entidade por id |
| `listEntities()` | Lista com filtros estruturais |
| `health()` | Prontidão do adapter/store |
| `capabilities()` | Capacidades estáticas (inclui `knowsTiss: false`) |

---

## 5. Escopo explícito desta sprint

### Faz

- Port / Adapters / Store / Factory / Provider / Demo
- 16 modelos canônicos abstratos
- `HealthcareRelationship` (estrutural)
- Documentação de integração **futura**
- Testes de fundação

### Não faz

- Guia TISS / XML TISS / campos TISS
- CID / TUSS / ANS
- Operadoras / cooperativas
- Regras / validações / auditoria executável
- OCR / IA / Workflow / Rule Engine
- APIs / banco / UI / migrations

---

## 6. Documentos satélite

| Documento | Função |
|-----------|--------|
| [`EPC-19_MODEL_CATALOG.md`](./EPC-19_MODEL_CATALOG.md) | Catálogo dos modelos canônicos |
| [`EPC-19_ARCHITECTURE.md`](./EPC-19_ARCHITECTURE.md) | Arquitetura + integração futura |
| [`EPC-19_CERTIFICATION.md`](./EPC-19_CERTIFICATION.md) | Certificação obrigatória |

---

## 7. Declaração de autoridade

A partir desta sprint, o Canonical Healthcare Model é a **linguagem canônica** do MedicFlow Enterprise.

O núcleo Enterprise **nunca** deverá depender diretamente de um padrão específico de mercado.
