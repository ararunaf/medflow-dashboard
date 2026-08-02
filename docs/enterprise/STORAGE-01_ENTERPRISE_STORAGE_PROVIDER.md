# STORAGE-01 — Enterprise Storage Provider

**Sprint:** STORAGE-01 — Enterprise Storage Provider  
**Padrão:** ECS-01 (Port / Adapter / Factory / Registry / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## Cadeia obrigatória

```
Produto
  ↓
Enterprise Runtime
  ↓
Capture Runtime
  ↓
OCR Runtime
  ↓
Document Classification Runtime
  ↓
Storage Manager Runtime
  ↓
StorageProviderPort
  ↓
Default Storage Adapter
  ↓
Storage Backend (Supabase Storage homologado)
```

## Capacidades

- Storage Provider / Port / Default Adapter / Factory / Registry
- Resultado canônico: `CanonicalStorageResult`, `CanonicalStorageMetadata`, `CanonicalStoredDocument`
- Upload / Download / Delete / Metadata / Signed URL
- Timeout / Retry / Cancelamento
- Logging estrutural / Telemetria estrutural
- Backend homologado: Supabase Storage (reutilizado — sem implementação paralela)

## Proibido

- Bypass do `StorageProviderPort`
- Acesso direto a `supabase.storage` / `storage.from` pelo produto
- Acesso direto a Azure Blob / AWS S3 / Google Cloud Storage pelo produto
- Bypass ao Storage Manager Runtime

## Próximo gate obrigatório

Após esta sprint: **STORAGE-GATE-01** — certificar ausência de bypass e aderência ECS-01  
somente então avançar para **SEARCH-01**.
