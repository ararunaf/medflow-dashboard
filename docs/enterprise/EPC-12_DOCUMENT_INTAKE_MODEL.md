# EPC-12 — Document Intake Model

**Sprint:** EPC-12 — Document Intake Foundation  
**Data:** 31/07/2026  
**Natureza:** Especificação do modelo canônico — sem OCR, IA, captura ou domínio clínico  
**Documento pai:** [`EPC-12_DOCUMENT_INTAKE_FOUNDATION.md`](./EPC-12_DOCUMENT_INTAKE_FOUNDATION.md)

---

## 1. Modelo canônico (FASE 6)

O Document Intake possui **apenas** os campos abaixo. Nada além disso no núcleo tipado.  
Nenhum campo específico de saúde.

| Campo | Tipo | Papel |
|-------|------|-------|
| `intakeId` | `IntakeId` | Identificador canônico |
| `sourceType` | `SourceType` | Origem documental (enumeração) |
| `receivedAt` | ISO string | Momento estrutural de recebimento |
| `status` | `IntakeStatus` | Ciclo de vida estrutural |
| `priority` | `IntakePriority` | Prioridade estrutural (rótulo) |
| `documentIdentityReference` | `IntakeDocumentIdentityReference` | Ref opaca a Document Identity |
| `storageReference` | `IntakeStorageReference` | Ref opaca a Storage |
| `metadataReference` | `IntakeMetadataReference` | Ref opaca a Metadata Engine |
| `workflowReference` | `IntakeWorkflowReference` | Ref opaca a Workflow |
| `configurationReference` | `IntakeConfigurationReference` | Ref opaca a Configuration |
| `tags` | `IntakeTag[]` | Classificação livre |
| `customAttributes` | `Record<string, unknown>` | Extensão opaca |
| `capabilities` | `IntakeDeclaredCapability[]` | Capacidades declaradas pelo intake |

---

## 2. SourceType (FASE 7)

Somente enumeração. Sem lógica de captura, upload, watcher, scanner ou e-mail.

| Valor | Papel estrutural |
|-------|------------------|
| `UPLOAD` | Origem upload (rótulo) |
| `WATCH_FOLDER` | Origem pasta monitorada (rótulo) |
| `API` | Origem API |
| `EMAIL` | Origem e-mail (rótulo) |
| `SCANNER` | Origem scanner (rótulo) |
| `TWAIN` | Origem TWAIN (rótulo) |
| `WIA` | Origem WIA (rótulo) |
| `FILE_SYSTEM` | Origem sistema de arquivos (rótulo) |
| `XML` | Origem payload XML (rótulo) |
| `JSON` | Origem payload JSON (rótulo) |
| `WEBSERVICE` | Origem webservice (rótulo) |
| `OUTRO` | Origem genérica |

Helpers: `hasKnownSourceType`, `intakeHasKnownSourceType`, `listSourceTypes`, constante `SOURCE_TYPES`.

---

## 3. Ciclo de vida / Status (FASE 8)

Estados estruturais preparados (sem implementação operacional):

| Status | Papel |
|--------|-------|
| `RECEIVED` | Recebido |
| `QUEUED` | Enfileirado (rótulo) |
| `READY` | Pronto (rótulo) |
| `PROCESSING` | Em processamento (rótulo) |
| `COMPLETED` | Concluído (rótulo) |
| `FAILED` | Falhou (rótulo) |
| `ARCHIVED` | Arquivado (rótulo) |

Prioridades conhecidas: `LOW` | `NORMAL` | `HIGH` | `URGENT`.

Helpers: `hasKnownStatus`, `hasKnownPriority`, `isReceived`, `isCompleted`, `isFailed`, `isArchived`, `withLifecycle`, `prepareStatusTransition`, `preparePriority`.

Sem fila real. Sem processamento. Sem arquivamento operacional.

---

## 4. Referências opacas

Todas as referências são **opacas**. Document Intake **não** importa nem resolve engines.

### 4.1 Document Identity

```ts
type IntakeDocumentIdentityReference = {
  documentId?: string;
  documentType?: string;
  version?: string; // prep de versionamento via Identity
  kind?: string;
};
```

### 4.2 Storage

```ts
type IntakeStorageReference = {
  key?: string;
  container?: string;
  provider?: string;
  uri?: string;
};
```

### 4.3 Metadata / Workflow / Configuration

Mesmo padrão opaco de EPC-11 (ids / names / versions / kinds livres).

### 4.4 Referência genérica futura

`IntakeOpaqueReference` — prep para OCR Providers, AI Providers, Contract Foundation, etc., tipicamente transportada via `customAttributes` nesta fundação.

---

## 5. Versionamento

O núcleo do Intake **não** possui campo `version` próprio (intake é um evento de entrada).  
Versionamento de conteúdo / identidade é suportado via:

- `documentIdentityReference.version` (opaco)
- `metadataReference.version` / `workflowReference.version` / `configurationReference.version`

Isso prepara o modelo para versionamento sem acoplar Intake a engines.

---

## 6. O que NÃO existe no modelo

- Campos clínicos / TISS / operadoras / cooperativas
- Texto OCR / blobs / páginas interpretadas
- Regras / cláusulas / validação contratual
- Credenciais de scanner / e-mail / pasta
- Paths reais de upload ou watcher
- Qualquer semântica de produto MedicFlow

---

## 7. Relação com outros componentes

| Componente | Relação nesta sprint |
|------------|----------------------|
| Document Identity | Ref opaca apenas |
| Storage | Ref opaca apenas |
| Metadata | Ref opaca apenas |
| Workflow | Ref opaca apenas |
| Configuration | Ref opaca apenas |
| OCR Providers | Prep documental (sem implementação) |
| AI Providers | Prep documental (sem implementação) |
| Contract Foundation | Prep documental (sem implementação) |
| Rule Engine | Sem ligação |
