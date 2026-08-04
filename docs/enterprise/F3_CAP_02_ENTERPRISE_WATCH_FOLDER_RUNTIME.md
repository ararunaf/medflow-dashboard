# F3-CAP-02 — Enterprise Watch Folder Runtime Foundation

**Sprint:** F3-CAP-02 — Enterprise Watch Folder Runtime Foundation  
**Roadmap:** Fase 3 — Bloco A — Captura Inteligente  
**Padrão:** ECS-01 (Port → Provider → Factory → Registry → Adapter → Store)  
**Data:** 2026-08-04

---

## Objetivo

Criar a Foundation Enterprise do Watch Folder Runtime, preparando a plataforma para futuros provedores:

- Watch Folder Local
- Watch Folder em Rede
- NAS / SMB / UNC Paths
- Azure File Share
- Storage Monitor
- Entrada automática de documentos

**Sem implementar nenhuma dessas funcionalidades nesta sprint.**

---

## Escopo entregue

| Item | Status |
|------|--------|
| `src/lib/enterprise/watch-folder-runtime/` | Criado |
| `WatchFolderRuntimePort` | Criado |
| Provider / Factory / Registry | Criados (`mock`, `test`, `default`, `enterprise`) |
| Adapters (Default / Enterprise alias / Mock) | Criados |
| Store in-memory | Criado |
| Demo `getWatchFolderRuntimeHealthSummary()` | Criado |
| Integração Enterprise Runtime (`getWatchFolderRuntimePort` + `watchFolderRuntimeOk`) | Criada |
| Teste `enterprise:watch-folder-runtime:test` | Criado |

---

## Fora de escopo (proibido nesta sprint)

- FileSystemWatcher / WatchService / Watchdog
- Polling / Scanner / OCR / Upload / IA
- Filas / Workers / Scheduler reais
- SMB / UNC / Azure Files reais
- Leitura de arquivos / sincronização / background services
- Alterações em Centro Operacional, Scanner Runtime, XML, TISS, Banco, APIs, RBAC

---

## Capabilities (todas `false` para implementação real)

- `localWatchImplemented`
- `networkWatchImplemented`
- `uncImplemented`
- `smbImplemented`
- `azureFilesImplemented`
- `pollingImplemented`
- `fileSystemWatcherImplemented`
- `recursiveWatchImplemented`
- `changeNotificationImplemented`
- `automaticImportImplemented`

---

## Wiring estrutural de dependências

Preparado (sem consumo funcional):

- Scanner Runtime
- Capture Engine Runtime
- OCR Runtime
- Persistent Queue Runtime
- Scheduler Runtime
- Worker Runtime
- Observability Runtime

---

## Acesso oficial

```ts
const port = runtime.getWatchFolderRuntimePort();
const health = await runtime.health(); // health.watchFolderRuntimeOk
```

Fluxo obrigatório:

`Produto → Enterprise Runtime → WatchFolderRuntimePort → Adapter → Store → Canonical Watch Folder Result`
