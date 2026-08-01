# EPC-01 — Migration Plan (Strangler Fig)

**Sprint:** EPC-01 — Persistence Ports Foundation  
**Data:** 31/07/2026  
**Princípio:** migrar pouco, provar sempre, nunca big-bang

---

## 1. Estado atual (após EPC-01)

| Item | Estado |
|------|--------|
| `PersistencePort` | Existe |
| `SupabasePersistenceAdapter` | Existe (default) |
| Provider | Existe |
| Módulos de negócio no Port | **0** (intencional) |
| PoC Application | 1 (demo health summary — só testes) |
| Supabase clients legados | **Inalterados e em uso** |

---

## 2. Estratégia

```
Fase A (EPC-01)     Fundar Port + Adapter + convenções     ← FEITO
Fase B              Migrar 1 módulo baixo risco por vez
Fase C              Extrair repository ports tipados
Fase D              Opcional: adapters postgres/sqlserver/oracle
Fase E              Remover imports diretos de Supabase no Application
```

Cada fase exige: build + TypeScript + ESLint + testes + smoke = PASS, e zero mudança perceptível ao usuário (exceto quando a sprint for explicitamente funcional).

---

## 3. Ordem sugerida de migração (futuro)

Prioridade por **baixo risco / baixo acoplamento**:

1. **Serviços de leitura operacional isolados** (queries simples, sem side effects)
2. **Módulos de configuração/feature flags** (se houver I/O direto)
3. **Capture infrastructure** (após repository port específico)
4. **TISS / Financeiro / Dashboard** — por último (alto impacto)

**Nunca** iniciar por Auth, RLS helpers, Storage buckets ou Server Functions críticas.

---

## 4. Receita por módulo (checklist)

Para cada módulo candidato:

1. [ ] Identificar operações de persistência usadas
2. [ ] Definir Port especializado (ex.: `XxxRepositoryPort`) **ou** estender contrato acordado — sem vazar Supabase
3. [ ] Implementar adapter Supabase que **reutiliza as mesmas queries atuais** (copy behavior, don’t optimize)
4. [ ] Injetar Port no composition root / server fn do módulo
5. [ ] Manter caminho legado atrás de feature flag **somente se necessário**; preferir cutover atômico do módulo
6. [ ] Testes de paridade (mesmo input → mesmo output)
7. [ ] Remover import direto de Supabase **somente daquele módulo**
8. [ ] Atualizar docs enterprise + certificação da sprint

---

## 5. Como adicionar outro banco (futuro)

1. Implementar `XxxPersistenceAdapter implements PersistencePort` (+ repository adapters)
2. Registrar em `createPersistencePort`
3. Binding por ambiente/tenant **somente** após EPC de config/bindings
4. Certificar paridade com suite de regressão
5. Supabase permanece default até cutover explícito aprovado

Mock/Test já disponíveis para desenvolvimento sem vendor.

---

## 6. Anti-padrões (bloquear em review)

- Migrar “tudo de Capture” numa PR
- Alterar SQL/filtros “já que estamos mexendo”
- Expor `SupabaseClient` no Port “só por um tempo”
- Domain importar `@/lib/server/supabase`
- Introduzir segundo banco em produção sem adapter + certificação

---

## 7. Critério de conclusão da trilha Persistence

A trilha Persistence (além de EPC-01) só se considera madura quando:

- Application/Domain não importam Supabase
- Todo I/O de dados passa por Ports
- Adapter default Supabase preserva RLS/auth semantics
- Existe pelo menos um adapter de teste usado na CI
- Documentação de cutover multi-banco publicada

EPC-01 **não** exige esses critérios finais — apenas a fundação.
