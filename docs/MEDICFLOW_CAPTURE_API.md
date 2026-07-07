# MEDICFLOW — Capture API

**Sprint:** MEDICFLOW-INTELLIGENT-CAPTURE-02  
**Autenticação:** JWT Supabase (sessão MedicFlow)  
**RBAC:** `can_manage_billing()` / `financial_closing:read`

---

## REST Endpoints

Base URL: mesma origem da aplicação (Cloudflare Worker / dev server).

### POST /capture

Cria sessão de captura. Opcionalmente envia arquivo no mesmo request.

**Request** (`application/json`):

```json
{
  "channel": "file_upload",
  "correlationId": "optional-trace-id",
  "metadata": {},
  "file": {
    "name": "guia_consulta.pdf",
    "mimeType": "application/pdf",
    "base64Content": "<base64>",
    "checksumSha256": "optional-sha256-hex"
  }
}
```

**Response** `201`:

```json
{
  "ok": true,
  "data": {
    "session": { "id": "uuid", "status": "OCR_PENDING" },
    "document": { "storagePathOriginal": "{tenant_id}/{capture_id}/original/..." }
  }
}
```

Sem `file`: retorna sessão em `CREATED`.

---

### GET /capture/:id

Retorna sessão com documentos vinculados.

### GET /capture/:id/status

Retorna status e `statusHistory` (polling leve).

### DELETE /capture/:id

Soft delete — `deleted_at` + status `ARCHIVED`.

---

## Erros

| HTTP | code |
|------|------|
| 400 | `validation_failed` |
| 401 | `unauthenticated` |
| 404 | `not_found` |
| 405 | `method_not_allowed` |
| 500 | `internal_error` |

---

## Server Functions

| Function | Descrição |
|----------|-----------|
| `createCaptureSessionFn` | Cria sessão |
| `uploadCaptureFileFn` | Upload base64 |
| `getCaptureSessionFn` | Detalhe |
| `getCaptureSessionStatusFn` | Status |
| `deleteCaptureSessionFn` | Soft delete |

Import: `@/lib/capture/api`

---

## Fluxo pós-upload

```
CREATED → UPLOADED → PREPROCESSING → OCR_PENDING
```

Nenhum endpoint executa OCR.
