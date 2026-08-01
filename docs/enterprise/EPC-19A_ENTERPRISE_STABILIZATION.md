# EPC-19A — Enterprise Stabilization

**Sprint:** EPC-19A — Enterprise Stabilization  
**Data:** 31/07/2026  
**Natureza:** Estabilização estrutural exclusiva — **nenhuma funcionalidade nova**  
**Resultado:** **APROVADA**

---

## 1. Objetivo

Eliminar débitos estruturais acumulados desde as primeiras EPCs (Build FAIL, TypeScript global, imports/exports, tipagens de serialização, ciclos de dependência de produto) e certificar uma baseline técnica limpa antes da fase **TISS Intelligence**.

## 2. Escopo executado

| Fase | Conteúdo | Status |
|------|----------|--------|
| 1 | Auditoria Build / TypeScript / ESLint / Imports / Exports / Aliases / Dead Code / Barrels / Circular Deps | ✅ |
| 2 | Correção Build FAIL (`useTenantBranding` / `executivo.tsx`) | ✅ |
| 3 | Eliminação de erros TypeScript em todo o repositório | ✅ |
| 4 | Imports/exports inválidos, tipagens quebradas, referências inexistentes | ✅ |
| 5 | Circular dependencies (produto) | ✅ (residual gerado documentado) |
| 6 | Build + TypeScript + ESLint + Smoke + Testes | ✅ |
| 7 | Regressão completa Enterprise Engines | ✅ |
| 8 | Validação de não-regressão das EPCs | ✅ |
| 9 | Documentação obrigatória | ✅ |

## 3. O que NÃO foi feito (conforme mandato)

- OCR real / IA real / TISS Intelligence
- Workflow novo, regras novas, contratos novos
- Healthcare Intelligence
- Novos Providers / Engines / Models Enterprise
- Alterações de UI funcional, APIs de produto, migrations de banco
- Alterações em `src/lib/enterprise/**` (0 arquivos Enterprise tocados)

## 4. Correções estruturais principais

### 4.1 Build FAIL (Fase 2)

- **Causa:** `src/routes/executivo.tsx` importava `useTenantBranding` de `tenant-branding-provider.tsx`, onde o hook **não é exportado**.
- **Correção mínima:** import corrigido para `@/components/tenant-branding-context` (mesmo padrão de `app-shell.tsx`).
- **Resultado:** `npm run build` → **PASS**.

### 4.2 Cascade TypeScript — serializabilidade TanStack Start

- **Causa raiz:** `createServerFn` rejeita `unknown` / `Record<string, unknown>` via `ValidateSerializableMapped`, quebrando tipagem de handlers e fazendo clientes inferirem `unknown`.
- **Correção:** fronteiras server/DTO passaram a usar `Json` (ou bags `{ [key: string]: Json | undefined }`); `MutationResult<unknown>` em `tiss-server.ts` tipado com `Awaited<ReturnType<typeof …>>`.

### 4.3 Tipos Supabase `capture_*`

- Tabelas `capture_sessions`, `capture_documents`, `capture_pages` adicionadas em `database.types.ts` (somente tipos — **sem migration**).
- Casts `Json` onde metadata de domínio encontrava a coluna tipada.

### 4.4 Demais correções estruturais

- Router `search` obrigatório em Links/navigates com `validateSearch`
- Toast / SkeletonRow / AuthChangeEvent / DomainErrorCode
- Barrel `CorrectionProposal` duplicado
- Imports órfãos (`executive` aggregator, `UpdateCorrectionProposalInput`)
- `vite.config.ts` → `PluginOption[]`
- Ciclos de produto: `audit-rule` ↔ `audit-finding` (extraído `audit-enums.ts`); `emit` ↔ `sinks` (extraído `sink-registry.ts`)

## 5. Residual estrutural documentado (não bloqueante)

| Item | Decisão |
|------|---------|
| Ciclo `routeTree.gen.ts` → `router.tsx` | Gerado pelo TanStack Router. **Não alterado** — mudança exigiria arquitetura de roteamento fora do escopo. |

## 6. Documentos desta sprint

| Documento | Função |
|-----------|--------|
| [`EPC-19A_ENTERPRISE_STABILIZATION.md`](./EPC-19A_ENTERPRISE_STABILIZATION.md) | Narrativa e escopo |
| [`EPC-19A_BUILD_REPORT.md`](./EPC-19A_BUILD_REPORT.md) | Relatório de Build |
| [`EPC-19A_TYPESCRIPT_REPORT.md`](./EPC-19A_TYPESCRIPT_REPORT.md) | Relatório TypeScript |
| [`EPC-19A_CERTIFICATION.md`](./EPC-19A_CERTIFICATION.md) | Certificação + questionário |

## 7. Pronto para próxima fase

O repositório está com baseline técnica certificada para iniciar **TISS Intelligence**, sem carregar o débito de Build FAIL / TypeScript global acumulado nas EPCs anteriores.
