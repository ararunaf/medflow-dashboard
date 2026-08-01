# EPC-19A — Build Report

**Sprint:** EPC-19A — Enterprise Stabilization  
**Data:** 31/07/2026  
**Comando:** `npm run build`  
**Resultado final:** **PASS**

---

## 1. Estado antes da sprint

| Item | Valor |
|------|-------|
| Resultado | **FAIL** |
| Erro | `"useTenantBranding" is not exported by "src/components/tenant-branding-provider.tsx"` |
| Consumidor | `src/routes/executivo.tsx` (split de componente TanStack Router) |
| Histórico | Reportado como FAIL pré-existente desde EPC-01 até EPC-19 |

## 2. Correção aplicada

| Campo | Detalhe |
|-------|---------|
| Arquivo | `src/routes/executivo.tsx` |
| Antes | `import { useTenantBranding } from "@/components/tenant-branding-provider"` |
| Depois | `import { useTenantBranding } from "@/components/tenant-branding-context"` |
| Comportamento | Inalterado — o hook já existia e era usado em `app-shell.tsx` via o mesmo módulo |
| Escopo | Correção mínima de import; sem mudança de UI/API/fluxo |

## 3. Estado depois da sprint

```
vite v7.x building client/server for production...
✓ built in ~7s
BUILD_EXIT=0
```

| Gate | Resultado |
|------|-----------|
| `npm run build` | **PASS** |
| Artefatos `dist/` | Gerados com sucesso (client + server) |

## 4. Gates correlatos

| Gate | Comando | Resultado |
|------|---------|-----------|
| TypeScript | `npx tsc --noEmit` | **PASS** (0 erros) |
| ESLint | `npm run lint` | **PASS** |
| Smoke | `npm run smoke-check` | **PASS** |

## 5. Declaração

O Build global deixa de ser débito pré-existente. A falha histórica de `useTenantBranding` / `executivo.tsx` está **eliminada** nesta sprint, sem alteração funcional do produto.
