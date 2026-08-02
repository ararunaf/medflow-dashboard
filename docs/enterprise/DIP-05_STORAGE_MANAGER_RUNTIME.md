# DIP-05 — Storage Manager Runtime

**Sprint:** DIP-05 — Storage Manager Runtime  
**Plataforma:** MedicFlow Enterprise — Document Intelligence Platform  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Objetivo

Criar a infraestrutura oficial do Storage Manager Runtime da plataforma Enterprise.

Todo futuro mecanismo de armazenamento deverá obrigatoriamente utilizar esta infraestrutura.
Nenhum Storage Provider poderá ser acessado diretamente pelo produto.

---

## 2. Escopo (estrutural apenas)

### Inclui

- Módulo `src/lib/enterprise/storage-manager-runtime/`
- `StorageManagerRuntimePort`, adapters default/mock, store in-memory, factory, provider
- Modelos canônicos de storage documental
- Capabilities tecnológicas registradas como FALSE / informativas
- Referências estruturais a Storage Providers futuros (Supabase, Azure Blob, AWS S3, GCS, SharePoint, NAS, Local, Mock)
- Integração com Enterprise Runtime, Capture Engine Runtime, OCR Runtime, Document Classification Runtime e Canonical Execution Orchestrator
- Migração estrutural do fluxo oficial de captura para passar pelo Storage Manager Runtime
- Suite `enterprise:storage-manager-runtime:test`
- Documentação DIP-05

### Explicitamente fora de escopo

- Armazenamento real / arquivos físicos
- Upload / download reais
- Integração Supabase Storage / Azure Blob / AWS S3 / GCS / SharePoint / NAS
- Versionamento funcional
- Retenção automática
- Compressão / criptografia / deduplicação executadas
- Qualquer serviço externo / HTTP / credenciais
- Mudança de comportamento de produto, UI, API ou migrations

---

## 3. Fluxo oficial

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
Provider futuro (referência apenas)
```

---

## 4. Componentes

| Artefato | Responsabilidade |
|----------|------------------|
| `StorageManagerRuntimePort` | Contrato único de coordenação de storage |
| `DefaultStorageManagerRuntimeAdapter` | Bridge Orchestrator + Classification Runtime + Provider Adapter reference |
| `MockStorageManagerRuntimeAdapter` | Homologação / isolamento de contrato |
| `InMemoryStorageManagerRuntimeStore` | Estado in-process de sessões |
| `StorageManagerRuntimeFactory` | Materializa o adapter pedido |
| `createStorageManagerRuntimePort` (Provider) | Entry point de composição |
| Modelos canônicos | Session / Request / Result / Identity / Metadata / Capabilities / Configuration / Reference |

---

## 5. Integração produto

O produto continua acessando exclusivamente `getEnterpriseRuntime().registerCaptureDocumentIntake(...)`.

Não há nova API HTTP, Server Function ou tela.
O Capture Engine Runtime, após OCR e Classification, chama `coordinateStorage` no Storage Manager Runtime.

---

## 6. Documentação relacionada

- `DIP-05_STORAGE_ARCHITECTURE.md`
- `DIP-05_STORAGE_MODEL.md`
- `DIP-05_STORAGE_CERTIFICATION.md`
