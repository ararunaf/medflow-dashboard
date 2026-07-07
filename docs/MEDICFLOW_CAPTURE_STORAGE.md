# MEDICFLOW — Capture Storage

**Bucket:** `clinical-documents`  
**Access:** Private (RLS)  
**Sprint:** MEDICFLOW-INTELLIGENT-CAPTURE-02

---

## Bucket Configuration

| Propriedade | Valor |
|-------------|-------|
| ID | `clinical-documents` |
| Public | `false` |
| Max file size | 25 MB |
| Allowed MIME | PDF, JPEG, PNG, WebP, TIFF |

---

## Folder Layout

```
clinical-documents/
  {tenant_id}/
    {capture_id}/
      original/{filename}
      processed/
      thumbnail/
      audit/manifest.json
```

---

## Storage Policies

| Policy | Operação | Regra |
|--------|----------|-------|
| `clinical_documents_select_tenant` | SELECT | folder tenant ∈ `current_tenant_ids()` |
| `clinical_documents_insert_billing` | INSERT | `can_manage_billing()` |
| `clinical_documents_update_billing` | UPDATE | idem |
| `clinical_documents_delete_restricted` | DELETE | negado (service role only) |

---

## Upload Flow

1. Validar MIME/tamanho
2. Upload original + audit manifest
3. INSERT `capture_documents` + `capture_pages`
4. State machine → `OCR_PENDING`

---

## Verificação

```sql
SELECT id, public FROM storage.buckets WHERE id = 'clinical-documents';
```

Teste: `npm run capture:test`
