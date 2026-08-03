# TISS-CONV-01 — Convergência do Produto Capture para a Enterprise Foundation

**Sprint:** TISS-CONV-01  
**Data:** 03/08/2026  
**Natureza:** Convergência arquitetural — **sem novas funcionalidades de produto**  
**Parecer:** ver seção final / ARCHITECTURAL_EXCEPTION_REGISTER

---

## 1. Objetivo

Eliminar o dual-path entre o produto Capture e a Enterprise Foundation para conhecimento TISS.

Fluxo oficial exclusivo após esta Sprint:

```
Produto (Capture)
  → Enterprise Runtime
  → TISS Runtime
  → TISSCatalogPort
  → RulePackEnginePort
  → Enterprise Base Rule Packs
  → Canonical Execution
```

## 2. O que foi migrado

| Antes (dual-path) | Depois (Enterprise) |
|-------------------|---------------------|
| `TUSS_CATALOG` / `TUSS_REQUIRES_AUTH` hardcoded em Capture | Seed canônico no `TISSCatalog` + pack `base-procedure-authorization-pack` |
| `isTussInCatalog` / `tussRequiresAuthorization` locais | Gateway Capture → Runtime → Catalog + RulePackEngine |
| Guide types só em parser templates | Códigos canônicos no Catalog (`guia-consulta`, `guia-sadt`, `guia-honorario`) + ponte `catalogGuideTypeCode` |
| Strings `TISS 4.01.00` hardcoded no enricher | Rótulo via `TISSCatalogPort.getVersion` |
| `tuss_procedures` como conhecimento paralelo | CRUD operacional tenant; membership canônico via Catalog |

## 3. O que NÃO foi feito (proibido nesta Sprint)

- XML TISS
- Regras específicas de operadoras
- Contratos novos / validações ANS
- Novos Providers / Runtimes
- Alteração de comportamento funcional percebido pelo usuário

## 4. Artefatos principais

- `src/lib/capture/enterprise/tiss-knowledge-gateway.ts`
- `src/lib/capture/audit/data/tuss-catalog.ts` (facade)
- Seed Catalog + Base Rule Pack de autorização
- `scripts/enterprise/tests/tiss-conv-01-capture-convergence.test.ts`

## 5. Ressalvas

Ver `ARCHITECTURAL_EXCEPTION_REGISTER.md` — atualização TISS-CONV-01.
