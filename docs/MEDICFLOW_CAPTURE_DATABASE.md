# MEDICFLOW — Capture Database Schema

**Migration:** `supabase/migrations/20260703120000_intelligent_capture_foundation.sql`  
**Sprint:** MEDICFLOW-INTELLIGENT-CAPTURE-02

---

## Enums

### `capture_session_status`

| Valor | Descrição |
|-------|-----------|
| `CREATED` | Sessão criada, aguardando upload |
| `UPLOADED` | Arquivo recebido no storage |
| `PREPROCESSING` | Metadados de pré-processamento (sem OCR) |
| `OCR_PENDING` | Pronto para OCR (gate futuro) |
| `OCR_COMPLETED` | OCR concluído (futuro) |
| `PARSING` | Parser estruturando campos |
| `AUDITING` | Auditoria preventiva |
| `REVIEW` | Revisão humana |
| `APPROVED` | Confirmado pelo usuário |
| `ARCHIVED` | Soft delete / arquivamento |

### Outros enums

- `capture_channel`: `mobile_camera`, `file_upload`, `scanner_folder`, `api_ingest`
- `capture_finding_severity`: `info`, `low`, `medium`, `high`, `critical`
- `capture_finding_status`: `open`, `resolved`, `dismissed`

---

## Tabelas

### `capture_sessions`

Orquestra o pipeline. Colunas principais:

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | RLS |
| `status` | capture_session_status | default `CREATED` |
| `channel` | capture_channel | |
| `status_history` | jsonb | audit trail de transições |
| `created_by` | uuid FK → profiles | |
| `deleted_at` | timestamptz | soft delete |

**Índices:** `(tenant_id, id)` UNIQUE, `(tenant_id, status, created_at DESC)`

### `capture_documents`

Metadados de arquivos no bucket.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `session_id` | uuid | FK composta → capture_sessions |
| `storage_path_original` | text | UNIQUE por bucket |
| `checksum_sha256` | text | integridade |
| `storage_path_audit` | text | manifest JSON |

### `capture_pages`

Páginas individuais (PDF multi-page). UNIQUE `(tenant_id, document_id, page_number)`.

### `capture_fields`

Campos extraídos (estrutura para OCR/parser futuro). Soft delete via `deleted_at`.

### `capture_findings`

Achados de auditoria preventiva por sessão.

### `capture_corrections`

Correções do usuário — learning loop futuro.

### `capture_templates`

Templates de parser versionados por tenant. UNIQUE `(tenant_id, template_key, version)`.

---

## RLS

Todas as tabelas: `ENABLE ROW LEVEL SECURITY`.

| Operação | Policy |
|----------|--------|
| SELECT | `tenant_id IN current_tenant_ids()` + `deleted_at IS NULL` onde aplicável |
| INSERT/UPDATE | `can_manage_billing()` + `created_by = auth.uid()` |

---

## Relacionamentos

```
capture_sessions (1) ──< (N) capture_documents
capture_documents (1) ──< (N) capture_pages
capture_sessions (1) ──< (N) capture_fields
capture_sessions (1) ──< (N) capture_findings
capture_sessions (1) ──< (N) capture_corrections
tenants (1) ──< (N) capture_templates
```

---

## Auditoria

- `status_history` em `capture_sessions` — append de `{ from, to, at, actorProfileId, note }`
- `created_by`, `updated_by`, `deleted_by` em entidades principais
- Triggers `capture_set_updated_at()` em tabelas mutáveis

---

## Aplicar Migration

```bash
supabase db push
```

Verificar:

```sql
SELECT id, public FROM storage.buckets WHERE id = 'clinical-documents';
SELECT tablename FROM pg_tables WHERE tablename LIKE 'capture_%';
```
