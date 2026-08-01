# EPC-19 — Canonical Healthcare Model Catalog

**Sprint:** EPC-19 — Canonical Healthcare Model Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-19_CANONICAL_HEALTHCARE_MODEL.md`](./EPC-19_CANONICAL_HEALTHCARE_MODEL.md)

---

## 1. Base estrutural obrigatória (FASE 7)

Todos os modelos canônicos possuem:

| Campo | Tipo | Função |
|-------|------|--------|
| `id` | `string` | Identidade estável |
| `version` | `string?` | Versão estrutural |
| `status` | `HealthcareEntityStatus?` | Status genérico |
| `metadataReference` | `HealthcareMetadataReference?` | Ref opaca Metadata Engine |
| `configurationReference` | `HealthcareConfigurationReference?` | Ref opaca Configuration Engine |
| `tags` | `HealthcareTag[]?` | Classificação livre |
| `customAttributes` | `Record<string, unknown>?` | Extensão estrutural |
| `createdAt` | `string?` | Timestamp ISO |
| `updatedAt` | `string?` | Timestamp ISO |

**Sem qualquer lógica.**

---

## 2. Catálogo de modelos (16)

| # | Modelo | `kind` | Conceito universal |
|---|--------|--------|--------------------|
| 1 | `HealthcareDocument` | `document` | Documento de saúde genérico |
| 2 | `HealthcareOrganization` | `organization` | Organização de saúde genérica |
| 3 | `HealthcareProfessional` | `professional` | Profissional de saúde |
| 4 | `HealthcarePatient` | `patient` | Paciente |
| 5 | `HealthcareBeneficiary` | `beneficiary` | Beneficiário (sem plano/operadora) |
| 6 | `HealthcareProcedure` | `procedure` | Procedimento (código opaco) |
| 7 | `HealthcareDiagnosis` | `diagnosis` | Diagnóstico (código opaco) |
| 8 | `HealthcareAuthorization` | `authorization` | Autorização |
| 9 | `HealthcareAttendance` | `attendance` | Atendimento |
| 10 | `HealthcareEpisode` | `episode` | Episódio de cuidado |
| 11 | `HealthcareClaim` | `claim` | Solicitação / cobrança canônica |
| 12 | `HealthcareAudit` | `audit` | Auditoria estrutural |
| 13 | `HealthcarePayment` | `payment` | Pagamento |
| 14 | `HealthcareAttachment` | `attachment` | Anexo (referência, sem binário) |
| 15 | `HealthcareEvidence` | `evidence` | Evidência opaca |
| 16 | `HealthcareReference` | `reference` | Referência genérica entre artefatos |

Constante: `HEALTHCARE_ENTITY_KINDS` (16 entradas).

União discriminada: `HealthcareEntity`.

---

## 3. Campos específicos (abstratos)

Campos adicionais são **rótulos livres / códigos opacos**. Não há enum de mercado, tabela ANS, TUSS, CID ou guia.

Exemplos permitidos:

- `code?: string` em Procedure / Diagnosis — valor opaco
- `membershipCode?: string` em Beneficiary — sem semântica de operadora
- `amount?: number` + `currency?: string` em Claim / Payment — conceito financeiro universal

Exemplos **proibidos** neste catálogo:

- campos TISS / XML
- códigos CID / TUSS tipados
- identificadores ANS
- nomes de operadoras / cooperativas

---

## 4. HealthcareRelationship (FASE 8)

Representação estrutural apenas — **sem implementação de grafo**.

| Campo | Função |
|-------|--------|
| `sourceKind` / `sourceId` | Origem |
| `targetKind` / `targetId` | Destino |
| `relationshipType` | Rótulo livre do vínculo |

Cadeia estrutural de exemplo (documentada, não executável):

```
Patient
  ↓
Attendance
  ↓
Procedure
  ↓
Authorization
  ↓
Audit
  ↓
Payment
```

Constante: `HEALTHCARE_RELATIONSHIP_CHAIN_EXAMPLE`.

---

## 5. Garantias de universalidade

| Garantia | Status |
|----------|--------|
| Conceitos universais de saúde | ✅ |
| Independentes de operadora | ✅ |
| Independentes de ANS | ✅ |
| Independentes de TISS | ✅ |
| Reutilizáveis por qualquer produto IAeasy | ✅ |
| Preparados para TISS Intelligence (consumo futuro) | ✅ (prep) |
| Preparados para AI Auditor / OCR / Workflow | ✅ (prep) |
