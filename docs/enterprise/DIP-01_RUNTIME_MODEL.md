# DIP-01 — Document Intake Runtime Model

**Sprint:** DIP-01 — Document Intake Runtime  
**Data:** 02/08/2026  
**Documento pai:** [`DIP-01_DOCUMENT_INTAKE_RUNTIME.md`](./DIP-01_DOCUMENT_INTAKE_RUNTIME.md)

---

## 1. Modelos canônicos

| Modelo | Função |
|--------|--------|
| `CanonicalDocumentIntakeSession` | Sessão de runtime (estado + refs) |
| `CanonicalDocumentIntakeRequest` | Pedido de registro |
| `CanonicalDocumentIntakeResult` | Resultado do registro |
| `CanonicalDocumentIntakeIdentity` | Identidade opaca do documento |
| `CanonicalDocumentIntakeMetadata` | Metadados estruturais (session/tenant/corr) |
| `CanonicalDocumentIntakeSource` | Origem (`UPLOAD`, …) |
| `CanonicalDocumentIntakeReference` | Refs opacas (storage/metadata/intake/exec) |
| `CanonicalDocumentIntakeCapabilities` | Capacidades declaradas do pedido |

---

## 2. Sessão — campos

```ts
CanonicalDocumentIntakeSession = {
  kind: "canonical-document-intake-session"
  runtimeSessionId: string
  status: "pending" | "coordinating" | "registering" | "registered" | "failed"
  request: CanonicalDocumentIntakeRequest
  intakeId?: string
  executionId?: string
  createdAt: string
  updatedAt: string
  message?: string
  code?: string
  errors?: readonly string[]
}
```

---

## 3. Request — campos

```ts
CanonicalDocumentIntakeRequest = {
  kind: "canonical-document-intake-request"
  identity: CanonicalDocumentIntakeIdentity   // documentId obrigatório
  metadata: CanonicalDocumentIntakeMetadata   // sessionId obrigatório
  source: CanonicalDocumentIntakeSource
  reference?: CanonicalDocumentIntakeReference
  capabilities?: CanonicalDocumentIntakeCapabilities
  structuralNotes?: string
}
```

---

## 4. Mapeamento Captura → canônico

| Entrada Captura (ARCH-01) | Modelo canônico |
|---------------------------|-----------------|
| `documentId` | `identity.documentId` |
| `sessionId` | `metadata.sessionId` + `reference.metadataId` |
| `storagePath` | `reference.storageKey` |
| `tenantRef` | `metadata.tenantRef` |
| `correlationId` | `metadata.correlationId` |
| `channel` | `source.channel` / `metadata.channel` |
| (fixo) `UPLOAD` | `source.sourceType` |

---

## 5. O que o modelo NÃO contém

- Texto OCR / embeddings
- XML TISS / guias
- Classificação documental
- Resultados de Rule Engine
- Dados clínicos tipados
- Filas / workers / scheduler

Apenas referências opacas e estado estrutural da sessão de intake.
