# EPC-19A — TypeScript Report

**Sprint:** EPC-19A — Enterprise Stabilization  
**Data:** 31/07/2026  
**Comando:** `npx tsc --noEmit`  
**Resultado final:** **PASS** — **0 erros**

---

## 1. Estado antes da sprint

| Métrica | Valor |
|---------|-------|
| Erros totais | **~207** (baseline histórica das EPCs / CERT) |
| Erros em `src/lib/enterprise` | **0** (Enterprise já limpo) |
| Escopo dos erros | Capture, Operational, TISS, UI, Services, Pages, Shared, Hooks |

### Distribuição aproximada (pré-correção)

| Área / padrão | Ordem de magnitude |
|---------------|--------------------|
| Cascade `createServerFn` + `unknown` / `Record<string, unknown>` | ~117 |
| Supabase `never` por `capture_*` ausentes em `database.types.ts` | ~20–22 |
| Router `search` / Vite plugins / toast / misc | ~25–30 |
| Imports/exports órfãos e tipagens locais | ~15–25 |

### Códigos TS mais frequentes (pré-correção)

| Código | Contagem aprox. | Significado |
|--------|-----------------|------------|
| TS2345 | ~97 | Argumento incompatível (unwrap/server fn) |
| TS18046 | ~50 | Valor `unknown` |
| TS2339 | ~18 | Propriedade inexistente |
| TS2322 | ~12 | Assignability |
| Outros | restante | Imports, excess props, Auth events, etc. |

## 2. Estratégia de correção (estrutural)

1. **P0 — Serializabilidade:** DTOs/fronteiras server usam `Json` em vez de `Record<string, unknown>` / `unknown`.
2. **P1 — Database types:** declarar `capture_sessions` / `capture_documents` / `capture_pages` (tipos only).
3. **P2 — Tooling:** `PluginOption[]` no Vite; ESLint/Prettier autofix.
4. **P3 — Call sites:** narrowing `res.ok` nos clients Capture; `describeError(...).message`; tipagem de queries TISS.
5. **P4 — Ciclos de produto:** enums de auditoria e sink-registry de monitoramento.

Nenhuma alteração de arquitetura Enterprise. Nenhum Port/Adapter Enterprise modificado.

## 3. Estado depois da sprint

| Métrica | Valor |
|---------|-------|
| Erros totais | **0** |
| Erros corrigidos | **~207** |
| `src/lib/enterprise` | Continua **0** erros; **0** arquivos Enterprise alterados |

## 4. Categorias cobertas

| Categoria | Status |
|-----------|--------|
| Capture | ✅ limpa |
| Operational | ✅ limpa |
| TISS | ✅ limpa |
| UI / Components | ✅ limpa |
| Services | ✅ limpa |
| Pages / Routes | ✅ limpa |
| Shared / Hooks | ✅ limpa |
| Vite config | ✅ limpa |

## 5. Residual

Nenhum erro TypeScript remanescente no `tsc --noEmit` global.

O único residual estrutural fora do TypeScript é o ciclo gerado `routeTree.gen.ts` → `router.tsx` (ver relatório de estabilização) — **não produz erro de TypeScript**.
