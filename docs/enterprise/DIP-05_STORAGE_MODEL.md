# DIP-05 — Storage Model

**Sprint:** DIP-05 — Storage Manager Runtime  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Modelos canônicos

| Modelo | kind | Função |
|--------|------|--------|
| `CanonicalStorageIdentity` | `canonical-storage-identity` | Identidade opaca do documento |
| `CanonicalStorageMetadata` | `canonical-storage-metadata` | Metadados estruturais da sessão |
| `CanonicalStorageReference` | `canonical-storage-reference` | Referências a storage / intake / capture / OCR / classification |
| `CanonicalStorageCapabilities` | `canonical-storage-capabilities` | Capabilities tecnológicas (todas FALSE) |
| `CanonicalStorageConfiguration` | `canonical-storage-configuration` | Configuração estrutural (provider preferido) |
| `CanonicalStorageRequest` | `canonical-storage-request` | Pedido de coordenação |
| `CanonicalStorageSession` | `canonical-storage-session` | Sessão persistida no store |
| `CanonicalStorageResult` | `canonical-storage-result` | Resultado da coordenação |
| `CanonicalStorageProviderReference` | `canonical-storage-provider-reference` | Provider futuro (sem conexão) |

---

## 2. Status da sessão

```
pending → coordinating → coordinated
                      ↘ failed
                      ↘ deferred
```

`coordinated` significa coordenação estrutural concluída — **não** armazenamento real.

---

## 3. Capabilities tecnológicas (sempre FALSE)

| Capability | Valor |
|------------|-------|
| `supportsVersioning` | `false` |
| `supportsRetentionPolicy` | `false` |
| `supportsEncryption` | `false` |
| `supportsCompression` | `false` |
| `supportsDeduplication` | `false` |
| `supportsCloudStorage` | `false` |
| `supportsLocalStorage` | `false` |
| `supportsImmutableStorage` | `false` |
| `implementsRealStorage` | `false` |
| `implementsUpload` | `false` |
| `implementsDownload` | `false` |
| `implementsVersioning` | `false` |
| `implementsRetention` | `false` |
| `implementsPhysicalFileWrite` | `false` |
| `implementsExternalProviderCall` | `false` |

---

## 4. Storage Provider references (estruturais)

| providerReferenceId | displayName | connected | implementsRealStorage |
|---------------------|-------------|-----------|----------------------|
| `supabase-storage` | Supabase Storage | `false` | `false` |
| `azure-blob` | Azure Blob Storage | `false` | `false` |
| `aws-s3` | AWS S3 | `false` | `false` |
| `google-cloud-storage` | Google Cloud Storage | `false` | `false` |
| `sharepoint` | SharePoint | `false` | `false` |
| `nas` | NAS | `false` | `false` |
| `local-storage` | Local Storage | `false` | `false` |
| `mock-storage` | Mock Storage | `false` | `false` |

---

## 5. Identidade determinística

```ts
createStorageManagerRuntimeSessionId()
// → dip-storage-session-1, dip-storage-session-2, ...
```

Reset exclusivo para testes: `resetAllStorageManagerRuntimeIdSequences()`.

---

## 6. Flags de execução

Em toda sessão/resultado DIP-05:

- `realStorageExecuted: false`
- `realUploadExecuted: false`
