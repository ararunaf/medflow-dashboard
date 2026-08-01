# EPC-02 — Architecture Decisions (ADR)

**Sprint:** EPC-02 — Storage Ports Foundation  
**Data:** 31/07/2026  
**Status:** Aceito

---

## ADR-EPC-02-001 — Introduzir StoragePort sem migrar módulos

### Contexto

Upload/OCR/Captura e demais fluxos documentais ainda podem acoplar-se a detalhes de storage (ou ainda não passam por uma boundary Enterprise). Uma migração big-bang é de alto risco.

### Decisão

Criar `StoragePort` + `SupabaseStorageAdapter` + `MockStorageAdapter` + provider, **sem** migrar módulos de negócio nesta sprint. Apenas um PoC Application (demo) + testes provam o fluxo.

### Consequências

- Risco de regressão próximo de zero
- Arquitetura pronta para strangler fig
- Dívida consciente: fluxos legados de documento permanecem até sprints futuras

---

## ADR-EPC-02-002 — Espelhar o padrão da EPC-01

### Contexto

EPC-01 estabeleceu árvore `ports/adapters/providers/demo`, runtime injetável, factory com erro explícito para mecanismos futuros e PoC isolado.

### Decisão

Replicar a mesma estrutura sob `src/lib/enterprise/storage/`, trocando apenas a semântica (Storage vs Persistence).

### Consequências

- Consistência cognitiva entre Ports Enterprise
- Onboarding e reviews previsíveis
- Próximos ports (AI, etc.) podem seguir o mesmo molde

---

## ADR-EPC-02-003 — Operações put/get/delete/signedUrl no Port; I/O de produção não bound

### Contexto

EPC-00 define `StoragePort { put / get / delete / signedUrl }`. Migrar uploads reais nesta sprint violaria “não alterar Upload/OCR/Captura”.

### Decisão

Incluir as quatro operações no contrato. O `SupabaseStorageAdapter` declara capacidades e só executa I/O quando o runtime injeta delegates. Default de produção: health/capabilities via config; ops retornam `ok: false` com mensagem de fundação (sem tocar buckets).

### Consequências

- Contrato alinhado ao alvo Enterprise
- Zero impacto em buckets/uploads existentes
- Migração futura = bind de runtime ou implementação com o client legado, módulo a módulo

---

## ADR-EPC-02-004 — Document Identity via options bag opcional (prep EPC-08)

### Contexto

EPC-08 trará DocumentId, TenantId, Metadata, Version, Hash, Tags, Origin, CorrelationId. Introduzir campos obrigatórios agora quebraria assinaturas depois.

### Decisão

Definir `StorageDocumentContext` com **todos** os campos opcionais e aceitar `document?: StorageDocumentContext` em put/get/delete/signedUrl.

### Consequências

- Assinaturas estáveis para EPC-08
- Nenhuma obrigatoriedade prematura
- Adapters podem ignorar `document` até a sprint de identidade

---

## ADR-EPC-02-005 — Supabase continua default; outros provedores reservados com erro explícito

### Contexto

Roadmap exige Azure Blob, S3, GCS, NAS, Local, SharePoint sem alterar a camada de negócio.

### Decisão

`createStoragePort()` default = `supabase`. Provedores futuros estão no type union mas lançam erro descritivo até haver adapter. `mock` e `test` estão disponíveis (in-memory).

### Consequências

- Sem fallback silencioso para storage inexistente
- Extensão previsível via switch do provider
- Produção permanece 100% no caminho atual

---

## ADR-EPC-02-006 — Runtime injetável no adapter Supabase

### Contexto

Clients Supabase SSR dependem de cookies/TanStack Start; `import.meta.env` acopla a Vite. Testes Node precisam isolar isso. Não se deve alterar uploads reais nesta sprint.

### Decisão

`SupabaseStorageAdapter` aceita `SupabaseStorageRuntime` (`isConfigured`, `ping?`, `put?`, `get?`, `delete?`, `signedUrl?`). Default usa `getSupabasePublicConfig()`. Testes injetam runtime fake.

### Consequências

- Testes determinísticos sem rede/buckets
- Adapter encapsula o mecanismo sem forçar I/O em EPC-02
- Upload/download de produção permanece intocado

---

## ADR-EPC-02-007 — Localização em `src/lib/enterprise/storage`

### Contexto

EPC-01 criou `src/lib/enterprise/persistence`. Storage deve espelhar, não misturar.

### Decisão

Criar namespace `src/lib/enterprise/storage/{ports,adapters,providers,demo}` alinhado à trilha EPC.

### Consequências

- Separação clara Persistence vs Storage
- Import boundary oficial: `@/lib/enterprise/storage`
- Domain nunca importa SDK de object store

---

## Decisões explicitamente NÃO tomadas (fora de escopo)

| Tema | Motivo |
|------|--------|
| Alterar buckets / uploads / downloads | Proibido na sprint |
| Migrar OCR / Captura / Upload | Alto risco; ver migration plan |
| Implementar EPC-08 Document Identity | Apenas preparação de tipos |
| Trocar provedor em produção | Proibido |
| Otimizar paths / reorganizar pastas | Proibido |
| AiProvider / outros ports | Outras sprints EPC |
