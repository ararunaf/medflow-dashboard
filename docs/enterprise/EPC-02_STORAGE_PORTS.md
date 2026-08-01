# EPC-02 — Storage Ports Foundation

**Sprint:** EPC-02 — Storage Ports Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + adapters default Supabase Storage  
**Continuidade:** Espelha o padrão da EPC-01 (Persistence)

---

## 1. Objetivo

Criar a camada de abstração de armazenamento de documentos do MedicFlow Enterprise:

```
Application
    ↓
StoragePort      (contrato — zero detalhes de vendor / bucket)
    ↓
StorageAdapter   (SupabaseStorageAdapter hoje)
    ↓
Storage Provider (Supabase Storage — inalterado)
```

O usuário não deve perceber qualquer alteração. Uploads, downloads, OCR e Captura Inteligente permanecem no caminho legado.

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `StoragePort` | `src/lib/enterprise/storage/ports/storage-port.ts` |
| Tipos vendor-agnósticos + Document Identity prep | `src/lib/enterprise/storage/ports/types.ts` |
| `SupabaseStorageAdapter` | `src/lib/enterprise/storage/adapters/supabase-storage-adapter.ts` |
| `MockStorageAdapter` | `src/lib/enterprise/storage/adapters/mock-storage-adapter.ts` |
| Provider `createStoragePort` | `src/lib/enterprise/storage/providers/create-storage-port.ts` |
| PoC Application (não ligado a UI/API/Upload) | `src/lib/enterprise/storage/demo/storage-health-query.ts` |
| Testes | `scripts/enterprise/tests/storage-ports.test.ts` |
| Script npm | `npm run enterprise:storage:test` |

---

## 3. Contrato `StoragePort`

Responsabilidades atuais (EPC-02 — fundação estável):

- `providerId` — identificação do provedor
- `health()` — prontidão sem mutação de objetos
- `capabilities()` — capacidades declaradas (put/get/delete/signedUrl/versioning)
- `put` / `get` / `delete` / `signedUrl` — operações de objeto sob **key lógica**

**Proibido no Port:** tipos/imports de `@supabase/*`, nomes de bucket, Azure SDK, AWS SDK, paths físicos de NAS/SharePoint.

Módulos de Upload/OCR/Captura **não** foram migrados nesta sprint (strangler fig consciente).

---

## 4. Document Identity (preparação — EPC-08)

`StorageDocumentContext` (todos os campos **opcionais**) pode ser passado em `document?` nas operações:

| Campo | Uso futuro |
|-------|------------|
| `documentId` | Identidade estável do documento |
| `tenantId` | Escopo multi-tenant |
| `metadata` | Metadados livres |
| `version` | Versionamento |
| `hash` | Integridade |
| `tags` | Classificação |
| `origin` | Origem do fluxo |
| `correlationId` | Rastreio cross-service |

EPC-02 **não** implementa EPC-08. A options bag garante evolução sem quebra de assinatura.

---

## 5. Adapter default — Supabase

`SupabaseStorageAdapter`:

- Implementa `StoragePort`
- Encapsula verificação de configuração pública via runtime injetável
- Default de produção: `createStoragePort()` → Supabase
- Operações de objeto só executam I/O quando o runtime fornece delegates (fundação sem alterar uploads legados)
- Não altera clients existentes, buckets, OCR nem Captura

`MockStorageAdapter` / mecanismo `test` existem para testes/simulação in-memory.

---

## 6. Convenções oficiais

### 6.1 Como criar um novo adapter

1. Criar classe em `src/lib/enterprise/storage/adapters/<nome>-storage-adapter.ts`
2. Implementar `StoragePort` (sem vazar SDK do vendor no Port)
3. Exportar em `adapters/index.ts` e, se aplicável, no barrel `storage/index.ts`
4. Registrar no `createStoragePort` switch
5. Adicionar testes em `scripts/enterprise/tests/`
6. Documentar em `docs/enterprise/` (ADR + migration note)

### 6.2 Como criar um novo provider / factory option

1. Estender `StorageProviderId` em `ports/types.ts`
2. Tratar o novo case em `createStoragePort`
3. Manter default de produção = `supabase` até decisão explícita de cutover
4. Falhar de forma explícita se o adapter ainda não existir (sem fallback silencioso)

### 6.3 Como adicionar um novo provedor de storage

| Provedor | Status EPC-02 | Próximo passo |
|----------|---------------|---------------|
| `supabase` | **Default implementado** | Migrar módulos gradualmente (ver migration plan) |
| `mock` / `test` | Implementado (in-memory) | Uso em unit/integration/certificação |
| `azure-blob` | Reservado (erro explícito) | Adapter dedicado futuro |
| `s3` | Reservado (erro explícito) | Adapter dedicado futuro |
| `gcs` | Reservado (erro explícito) | Adapter dedicado futuro |
| `nas` | Reservado (erro explícito) | Adapter dedicado futuro |
| `local` | Reservado (erro explícito) | Adapter dedicado futuro |
| `sharepoint` | Reservado (erro explícito) | Adapter dedicado futuro |

Regra: Domain/Application **nunca** importam o SDK de object storage. Só o adapter importa.

### 6.4 Regra de dependência (obrigatória)

| Camada | Pode depender de |
|--------|------------------|
| Domain | `StoragePort` (+ tipos do Port) |
| Application | `StoragePort`, `createStoragePort` (composition root) |
| Infrastructure / Adapters | Supabase Storage SDK, clients atuais, drivers futuros |
| UI / Upload / OCR / Captura (EPC-02) | **Inalterado** — continua no caminho legado |

### 6.5 O que NÃO fazer nesta fundação

- Não migrar dezenas de módulos de uma vez
- Não alterar buckets, uploads, downloads
- Não alterar OCR, IA, Captura Inteligente, Financeiro, Dashboard
- Não alterar APIs, banco, migrations, Server Functions, UI, RLS
- Não “otimizar” paths/storage no meio da migração arquitetural
- Não expor o client Supabase Storage através do `StoragePort`

---

## 7. PoC (prova de conceito)

`getStorageHealthSummary(port)` é um use-case mínimo de Application que:

1. Recebe apenas `StoragePort`
2. Chama `health()` + `capabilities()`
3. Não é referenciado por rotas, Server Functions, Upload ou UI

Isso prova a inversão de dependência **sem** alterar comportamento do produto.

---

## 8. Testes

```bash
npm run enterprise:storage:test
```

Valida contrato, provider, adapter Supabase (runtime injetado), mock/test, ops in-memory, prep Document Identity e PoC Application.

---

## 9. Relação com EPC-00 / EPC-01 / roadmap

- EPC-00 definiu o alvo documental (`StoragePort` conceitual).
- EPC-01 implantou o padrão Persistence (Ports & Adapters).
- EPC-02 replica o mesmo padrão para Storage + prep Document Identity.
- Migração modular permanece no plano (`EPC-02_MIGRATION_PLAN.md`) — strangler fig, baixo risco.
