# F3-CAP-02 — Watch Folder Runtime Architecture

**Sprint:** F3-CAP-02  
**Padrão arquitetural:** ECS-01  
**Camada:** Enterprise Foundation

---

## Diagrama lógico

```text
Produto / Application
        │
        ▼
Enterprise Runtime
  getWatchFolderRuntimePort()
  health().watchFolderRuntimeOk
        │
        ▼
WatchFolderRuntimePort
        │
        ▼
WatchFolderRuntimeFactory  ←  WatchFolderRuntimeRegistry
        │                         (mock | test | default | enterprise)
        ▼
DefaultWatchFolderRuntimeAdapter
  (= EnterpriseWatchFolderRuntimeAdapter)
  ou MockWatchFolderRuntimeAdapter
        │
        ▼
InMemoryWatchFolderRuntimeStore
        │
        ▼
Canonical Watch Folder Result
```

---

## Estrutura de pastas

```text
src/lib/enterprise/watch-folder-runtime/
  ports/        # Port, Canonical Models, Capabilities, Types, Identity
  providers/    # createWatchFolderRuntimePort / WatchFolderRuntimeProvider
  factory/      # WatchFolderRuntimeFactory
  registry/     # mock | test | default | enterprise
  adapters/     # Default / Enterprise (alias) / Mock
  store/        # WatchFolderRuntimeStore + InMemory
  demo/         # getWatchFolderRuntimeHealthSummary()
  index.ts
```

---

## Operações estruturais do Port

| Operação | Comportamento nesta fundação |
|----------|------------------------------|
| `register` | Persiste Watch Folder canônico in-memory |
| `unregister` | Remove do store |
| `discover` | Lista catálogo in-memory |
| `openSession` | Abre sessão estrutural (sem watcher) |
| `closeSession` | Fecha sessão estrutural |
| `observe` | Registra observação canônica (sem FS) |
| `stats` | Estatísticas do store |
| `health` | Prontidão + shape das deps |
| `capabilities` | Declaração estática |

Nenhuma operação lê disco, abre `fs.watch`, faz polling, SMB, UNC ou Azure Files.

---

## Dependências estruturais

Injetadas via `WatchFolderRuntimeEnterpriseDeps` e validadas apenas por shape no `health()`:

| Dep | Consumo funcional |
|-----|-------------------|
| Scanner Runtime | Não |
| Capture Engine Runtime | Não |
| OCR Runtime | Não |
| Persistent Queue Runtime | Não |
| Scheduler Runtime | Não |
| Worker Runtime | Não |
| Observability Runtime | Não |

---

## Composition Root

Único ponto de integração no produto:

- `EnterpriseRuntime.getWatchFolderRuntimePort()`
- `EnterpriseRuntimeHealth.watchFolderRuntimeOk`

Não há bypass direto do Domain para Adapter/Store.
