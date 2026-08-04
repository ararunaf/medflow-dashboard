# F3-CAP-03 — Upload Runtime Architecture

**Sprint:** F3-CAP-03  
**Padrão arquitetural:** ECS-01  
**Camada:** Enterprise Foundation

---

## Diagrama lógico

```text
Produto / Application
        │
        ▼
Enterprise Runtime
  getUploadRuntimePort()
  health().uploadRuntimeOk
        │
        ▼
UploadRuntimePort
        │
        ▼
UploadRuntimeFactory  ←  UploadRuntimeRegistry
        │                         (mock | test | default | enterprise)
        ▼
DefaultUploadRuntimeAdapter
  (= EnterpriseUploadRuntimeAdapter)
  ou MockUploadRuntimeAdapter
        │
        ▼
InMemoryUploadRuntimeStore
        │
        ▼
Canonical Upload Result
```

---

## Estrutura de pastas

```text
src/lib/enterprise/upload-runtime/
  ports/        # Port, Canonical Models, Capabilities, Types, Identity
  providers/    # createUploadRuntimePort / UploadRuntimeProvider
  factory/      # UploadRuntimeFactory
  registry/     # mock | test | default | enterprise
  adapters/     # Default / Enterprise (alias) / Mock
  store/        # UploadRuntimeStore + InMemory
  demo/         # getUploadRuntimeHealthSummary()
  index.ts
```

---

## Operações estruturais do Port

| Operação | Comportamento nesta fundação |
|----------|------------------------------|
| `register` | Persiste Upload canônico in-memory |
| `unregister` | Remove do store |
| `discover` | Lista catálogo in-memory |
| `openSession` | Abre sessão estrutural (sem upload real) |
| `closeSession` | Fecha sessão estrutural |
| `receive` | Registra receipt canônico (sem arquivo) |
| `stats` | Estatísticas do store |
| `health` | Prontidão + shape das deps |
| `capabilities` | Declaração estática |

Nenhuma operação faz upload HTTP, multipart, chunked, resumable, Azure Blob, Supabase, S3, Drive, OneDrive ou Dropbox.

---

## Dependências estruturais

Injetadas via `UploadRuntimeEnterpriseDeps` e validadas apenas por shape no `health()`:

| Dep | Consumo funcional |
|-----|-------------------|
| Scanner Runtime | Não |
| Watch Folder Runtime | Não |
| Capture Engine Runtime | Não |
| OCR Runtime | Não |
| Persistent Queue Runtime | Não |
| Scheduler Runtime | Não |
| Worker Runtime | Não |
| Observability Runtime | Não |

---

## Composition Root

Único ponto de integração no produto:

- `EnterpriseRuntime.getUploadRuntimePort()`
- `EnterpriseRuntimeHealth.uploadRuntimeOk`

Não há bypass direto do Domain para Adapter/Store.
