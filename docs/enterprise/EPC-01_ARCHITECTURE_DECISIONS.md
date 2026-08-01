# EPC-01 — Architecture Decisions (ADR)

**Sprint:** EPC-01 — Persistence Ports Foundation  
**Data:** 31/07/2026  
**Status:** Aceito

---

## ADR-EPC-01-001 — Introduzir PersistencePort sem migrar módulos

### Contexto

O código atual chama Supabase diretamente (`.from()`, clients SSR/browser/admin). Uma migração big-bang é de alto risco.

### Decisão

Criar `PersistencePort` + `SupabasePersistenceAdapter` + provider, **sem** migrar módulos de negócio nesta sprint. Apenas um PoC Application (demo) + testes provam o fluxo.

### Consequências

- Risco de regressão próximo de zero
- Arquitetura pronta para strangler fig
- Dívida consciente: módulos ainda importam Supabase até sprints futuras

---

## ADR-EPC-01-002 — Port mínimo (health + capabilities), sem CRUD genérico

### Contexto

Um `PersistencePort` “deus” com CRUD genérico tende a vazar semântica SQL/PostgREST e incentivar anemic repositories.

### Decisão

EPC-01 limita o Port a identidade/health/capabilities. Repositórios tipados por agregado serão Ports especializados em sprints posteriores (ex.: `CaptureSessionRepositoryPort`), compostos sobre a mesma pasta `enterprise/persistence`.

### Consequências

- Contrato estável e pequeno
- Evita API prematura difícil de evoluir
- Adapter Supabase não precisa wrappear o client inteiro agora

---

## ADR-EPC-01-003 — Supabase continua default; outros DBs reservados com erro explícito

### Contexto

Roadmap exige PostgreSQL dedicado, SQL Server, Oracle, Mock e Test no futuro.

### Decisão

`createPersistencePort()` default = `supabase`. Mecanismos `postgres` / `sqlserver` / `oracle` estão no type union mas lançam erro descritivo até haver adapter. `mock` e `test` estão disponíveis.

### Consequências

- Sem fallback silencioso para banco inexistente
- Extensão previsível via switch do provider
- Produção permanece 100% no caminho atual

---

## ADR-EPC-01-004 — Runtime injetável no adapter Supabase

### Contexto

Clients Supabase SSR dependem de cookies/TanStack Start; `import.meta.env` acopla a Vite. Testes Node precisam isolar isso.

### Decisão

`SupabasePersistenceAdapter` aceita `SupabasePersistenceRuntime` (`isConfigured`, `ping?`). Default usa `getSupabasePublicConfig()`. Testes injetam runtime fake.

### Consequências

- Testes determinísticos sem rede
- Adapter encapsula o mecanismo sem forçar I/O em EPC-01
- Health HTTP de produção permanece intocado

---

## ADR-EPC-01-005 — Localização em `src/lib/enterprise/persistence`

### Contexto

Já existem padrões plugáveis em Capture OCR e RAG embeddings, mas não há pasta Enterprise unificada.

### Decisão

Criar namespace `src/lib/enterprise/persistence/{ports,adapters,providers,demo}` alinhado à trilha EPC documentada em `docs/enterprise/`.

### Consequências

- Separação clara da infra legada
- Próximos ports (Storage, AI) podem espelhar a mesma árvore
- Imports `@/lib/enterprise/persistence` formam a boundary oficial

---

## ADR-EPC-01-006 — Domain nunca depende de Supabase

### Contexto

Dependency Rule do EPC-00: Domain não depende de Infrastructure.

### Decisão

Convenção oficial: Domain/Application consomem só `PersistencePort` (e futuros repository ports). Adapters são os únicos autorizados a importar `@supabase/*` / `@/lib/supabase` / `@/lib/server/supabase*`.

### Consequências

- Inversão de dependência formalizada
- Enforcement via review + documentação; lint rule restritiva pode vir em sprint posterior (fora do escopo EPC-01 para evitar churn)

---

## Decisões explicitamente NÃO tomadas (fora de escopo)

| Tema | Motivo |
|------|--------|
| Troca de banco | Proibido na sprint |
| UnitOfWork completo | Prematuro sem migração de módulos |
| Alterar health HTTP | Evitar mudança observável |
| Migrar Capture/TISS/Financeiro | Alto risco; ver migration plan |
| StoragePort / AiProvider | Outras sprints EPC |
