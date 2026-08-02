# DIP-05 — Storage Architecture

**Sprint:** DIP-05 — Storage Manager Runtime  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Cadeia obrigatória

```
Produto
  ↓
Enterprise Runtime
  ↓
Capture Engine Runtime
  ↓
OCR Runtime
  ↓
Document Classification Runtime
  ↓
StorageManagerRuntimePort
  ↓
Canonical Execution Orchestrator
  ↓
Storage Provider Adapter (referência estrutural)
  ↓
Provider futuro
```

É proibido:

- acessar Storage Providers diretamente do produto;
- bypassar Enterprise Runtime / Capture Runtime / OCR Runtime / Classification Runtime / Orchestrator;
- executar armazenamento real / upload nesta sprint.

---

## 2. Árvore do módulo

```
src/lib/enterprise/storage-manager-runtime/
  index.ts
  ports/
    storage-manager-runtime-port.ts
    models.ts
    types.ts
    identity.ts
    index.ts
  adapters/
    default-storage-manager-runtime-adapter.ts
    mock-storage-manager-runtime-adapter.ts
    index.ts
  store/
    storage-manager-runtime-store.ts
    in-memory-storage-manager-runtime-store.ts
    index.ts
  factory/
    storage-manager-runtime-factory.ts
    index.ts
  providers/
    create-storage-manager-runtime-port.ts
    index.ts
  demo/
    storage-manager-runtime-health-query.ts
    index.ts
```

---

## 3. Dependências Enterprise (DI)

```ts
type StorageManagerRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort;
};
```

`DefaultStorageManagerRuntimeAdapter` exige `enterpriseDeps`.
Implementação paralela é proibida.

Capture Engine Runtime passa a incluir:

```ts
getStorageManagerRuntimePort(): StorageManagerRuntimePort;
```

---

## 4. Coordenação estrutural

1. `coordinateStorage` cria sessão `pending` → `coordinating`
2. `CanonicalExecutionOrchestrator.startExecution` (tags `dip-05`)
3. Consulta health/capabilities do Document Classification Runtime (hop anterior)
4. Registra referência estrutural ao Storage Provider Adapter
5. Sessão → `coordinated` com `realStorageExecuted: false` e `realUploadExecuted: false`

Nenhuma chamada a Supabase Storage, Azure Blob, AWS S3, GCS, SharePoint, NAS, filesystem ou HTTP.

---

## 5. Composition root

`DefaultEnterpriseRuntime` resolve e expõe:

- `getStorageManagerRuntimePort()`
- health agregado `storageManagerRuntimeOk`
- bridge `registerCaptureDocumentIntake` propaga `storageManagerRuntimeSessionId` / `storageExecutionId`

---

## 6. Separação EPC-02 vs DIP-05

| Componente | Papel |
|------------|-------|
| `src/lib/enterprise/storage/` (EPC-02) | StoragePort de baixo nível (foundation) |
| `src/lib/enterprise/storage-manager-runtime/` (DIP-05) | Runtime oficial de coordenação DIP |

DIP-05 **não** substitui nem reutiliza adapters EPC-02 nesta sprint — apenas coordena estruturalmente.
