# EPC-01 — Persistence Ports Foundation

**Sprint:** EPC-01 — Persistence Ports Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + adapters default Supabase

---

## 1. Objetivo

Criar a camada de abstração de persistência do MedicFlow Enterprise:

```
Application
    ↓
PersistencePort   (contrato — zero detalhes de vendor)
    ↓
Adapter           (SupabasePersistenceAdapter hoje)
    ↓
Supabase          (mecanismo atual — inalterado)
```

O usuário não deve perceber qualquer alteração. Supabase permanece o mecanismo default.

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `PersistencePort` | `src/lib/enterprise/persistence/ports/persistence-port.ts` |
| Tipos vendor-agnósticos | `src/lib/enterprise/persistence/ports/types.ts` |
| `SupabasePersistenceAdapter` | `src/lib/enterprise/persistence/adapters/supabase-persistence-adapter.ts` |
| `MockPersistenceAdapter` | `src/lib/enterprise/persistence/adapters/mock-persistence-adapter.ts` |
| Provider `createPersistencePort` | `src/lib/enterprise/persistence/providers/create-persistence-port.ts` |
| PoC Application (não ligado a UI/API) | `src/lib/enterprise/persistence/demo/persistence-health-query.ts` |
| Testes | `scripts/enterprise/tests/persistence-ports.test.ts` |
| Script npm | `npm run enterprise:persistence:test` |

---

## 3. Contrato `PersistencePort`

Responsabilidades atuais (EPC-01 — fundação mínima e estável):

- `mechanismId` — identificação do mecanismo
- `health()` — prontidão sem mutação de dados
- `capabilities()` — capacidades declaradas (RLS, realtime, transações, JSON)

**Proibido no Port:** tipos/imports de `@supabase/*`, `Database`, PostgREST, cookies SSR, service role.

Operações de repositório/CRUD **não** foram migradas nesta sprint (strangler fig consciente).

---

## 4. Adapter default — Supabase

`SupabasePersistenceAdapter`:

- Implementa `PersistencePort`
- Encapsula verificação de configuração pública via runtime injetável
- Default de produção: `createPersistencePort()` → Supabase
- Não altera clients existentes (`getServerSupabase`, `getBrowserSupabase`, `getAdminSupabase`)
- Não altera health endpoints HTTP de produção

`MockPersistenceAdapter` / mecanismo `test` existem para testes sem rede/vendor.

---

## 5. Convenções oficiais

### 5.1 Como criar um novo adapter

1. Criar classe em `src/lib/enterprise/persistence/adapters/<nome>-persistence-adapter.ts`
2. Implementar `PersistencePort` (sem vazar SDK do vendor no Port)
3. Exportar em `adapters/index.ts` e, se aplicável, no barrel `persistence/index.ts`
4. Registrar no `createPersistencePort` switch
5. Adicionar testes em `scripts/enterprise/tests/`
6. Documentar em `docs/enterprise/` (ADR + migration note)

### 5.2 Como criar um novo provider / factory option

1. Estender `PersistenceMechanismId` em `ports/types.ts`
2. Tratar o novo case em `createPersistencePort`
3. Manter default de produção = `supabase` até decisão explícita de cutover
4. Falhar de forma explícita se o adapter ainda não existir (sem fallback silencioso)

### 5.3 Como adicionar um novo banco / mecanismo

| Mecanismo | Status EPC-01 | Próximo passo |
|-----------|---------------|---------------|
| `supabase` | **Default implementado** | Migrar módulos gradualmente (ver migration plan) |
| `mock` / `test` | Implementado | Uso em unit/integration tests |
| `postgres` | Reservado (erro explícito) | Adapter dedicado futuro |
| `sqlserver` | Reservado (erro explícito) | Adapter dedicado futuro |
| `oracle` | Reservado (erro explícito) | Adapter dedicado futuro |

Regra: Domain/Application **nunca** importam o SDK do banco. Só o adapter importa.

### 5.4 Regra de dependência (obrigatória)

| Camada | Pode depender de |
|--------|------------------|
| Domain | `PersistencePort` (+ tipos do Port) |
| Application | `PersistencePort`, `createPersistencePort` (composition root) |
| Infrastructure / Adapters | Supabase SDK, clients atuais, drivers futuros |
| UI / rotas existentes (EPC-01) | **Inalterado** — continua usando clients atuais |

### 5.5 O que NÃO fazer nesta fundação

- Não migrar dezenas de módulos de uma vez
- Não trocar banco
- Não alterar RLS, auth, storage, OCR, IA, TISS, financeiro, dashboard
- Não “otimizar” consultas no meio da migração arquitetural
- Não expor o client Supabase através do `PersistencePort`

---

## 6. PoC (prova de conceito)

`getPersistenceHealthSummary(port)` é um use-case mínimo de Application que:

1. Recebe apenas `PersistencePort`
2. Chama `health()` + `capabilities()`
3. Não é referenciado por rotas, Server Functions ou UI

Isso prova a inversão de dependência **sem** alterar comportamento do produto.

---

## 7. Testes

```bash
npm run enterprise:persistence:test
```

Valida contrato, provider, adapter Supabase (runtime injetado), mock/test e PoC Application.

---

## 8. Relação com EPC-00 / roadmap

- EPC-00 definiu o alvo documental (`PersistencePort` conceitual).
- EPC-01 implementa a **fundação** do Port + adapter default + convenções.
- Migração modular permanece no plano (`EPC-01_MIGRATION_PLAN.md`) e sprints seguintes — strangler fig, baixo risco.
