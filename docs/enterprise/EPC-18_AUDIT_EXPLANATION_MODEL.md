# EPC-18 — Audit Explanation Model

**Sprint:** EPC-18 — AI Auditor Foundation  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/ai-auditor/ports/`

---

## 1. Objetivo

Definir os modelos canônicos da AI Auditora:

1. `AuditExplanation` (FASE 6)
2. `AuditFinding` (FASE 7)
3. `ConfidenceLevel` (FASE 8)

Sem IA real. Sem HTTP. Sem prompts. Sem decisões.

O restante do MedicFlow consome **exclusivamente** `AuditExplanation`.

---

## 2. AuditExplanation (FASE 6)

| Campo | Tipo | Papel |
|-------|------|-------|
| `AuditId` / `auditId` | `string` | Identidade da explicação |
| `Summary` / `summary` | `string` | Resumo explicativo (não decisão) |
| `EvidenceList` / `evidenceList` | `AuditEvidence[]?` | Evidências opacas |
| `RelatedRules` / `relatedRules` | refs opacas | Regras relacionadas (sem execução) |
| `ReferencedContracts` / `referencedContracts` | refs opacas | Contratos referenciados (sem interpretação) |
| `ConfidenceLevel` / `confidenceLevel` | `ConfidenceLevel` | Nível estrutural |
| `Findings` / `findings` | `AuditFinding[]?` | Achados explicativos |
| `Recommendations` / `recommendations` | `string[]?` | Recomendações textuais (não binding) |
| `Warnings` / `warnings` | `string[]?` | Avisos estruturais |
| `MetadataReference` / `metadataReference` | ref opaca | Prep Metadata Engine |
| `ConfigurationReference` / `configurationReference` | ref opaca | Prep Configuration Engine |
| `ProcessingReference` / `processingReference` | ref opaca | Prep Document Processing |
| `WorkflowReference` / `workflowReference` | ref opaca | Prep Workflow |
| `RulePackReference` / `rulePackReference` | ref opaca | Prep Rule Pack |
| `DocumentReference` / `documentReference` | ref opaca | Prep Documento |
| `Timestamp` / `timestamp` | `string` | Instantâneo ISO |
| `Tags` / `tags` | `string[]?` | Classificação livre |
| `CustomAttributes` / `customAttributes` | `Record<string, unknown>?` | Bag opaco |

### Extensões estruturais (versionamento / auditoria futura)

| Campo | Papel |
|-------|-------|
| `explanationVersion` | Versão do modelo de explicação |
| `selectedAiProvider` | Provider selecionado via Orchestrator (opaco) |
| `simulated` | Indica fundação determinística (sem LLM) |

**Independência de vendor:** nenhum campo acopla OpenAI, Gemini, Claude, Azure, Ollama ou LM Studio.

---

## 3. AuditFinding (FASE 7)

| Campo | Tipo | Papel |
|-------|------|-------|
| `FindingId` / `findingId` | `string` | Identidade do finding |
| `Category` / `category` | `string?` | Categoria estrutural |
| `Severity` / `severity` | `info \| low \| medium \| high \| critical \| string` | Severidade estrutural |
| `Description` / `description` | `string?` | Descrição |
| `Evidence` / `evidence` | `AuditEvidence[]?` | Evidências |
| `RelatedRule` / `relatedRule` | ref opaca | Regra relacionada |
| `Confidence` / `confidence` | `ConfidenceLevel?` | Confiança do finding |
| `Reference` / `reference` | `string?` | Referência livre |

Sem lógica. Sem aprovação. Sem reprovação.

---

## 4. ConfidenceLevel (FASE 8) — somente estrutural

| Level | Calibrado na fundação? |
|-------|------------------------|
| `LOW` | Não |
| `MEDIUM` | Não |
| `HIGH` | Não |
| `VERY_HIGH` | Não |
| `UNKNOWN` | Não |

Helpers: `CONFIDENCE_LEVELS`, `CONFIDENCE_LEVEL_CATALOG`, `isKnownConfidenceLevel`, `getConfidenceLevel`, `listConfidenceLevels`.

A fundação usa `UNKNOWN` nas explicações determinísticas (sem calibração de modelo).

---

## 5. AuditRequest / AuditResult

### AuditRequest

Carrega:

- `deterministicOutcome` — eco do Rule Engine (opaco; não reavaliado)
- referências opacas (documento, processing, workflow, rule pack, contratos, etc.)
- preferências de Provider para o AI Orchestrator

**Não contém prompts.**

### AuditResult

```ts
{
  ok: boolean;
  explanation?: AuditExplanation; // único artefato consumível
  message?: string;
  code?: string;
}
```

Consumidores de produto devem usar exclusivamente `explanation`.

---

## 6. Store

`StoredAuditExplanation = { request, explanation }`

Persistência in-process via `DefaultAIAuditorStore`.  
Sem banco. Sem migrations.

---

## 7. Garantias

| Garantia | Status |
|----------|--------|
| Independente do modelo de IA | Sim |
| Preparado para versionamento (`explanationVersion`) | Sim |
| Preparado para auditoria futura (store + timestamp + refs) | Sim |
| Sem resposta bruta de LLM | Sim |
| Sem decisão de aprovação/reprovação | Sim |
