# EPC-CERT-01 — Dependency Analysis

**Sprint:** EPC-CERT-01 — Enterprise Platform Core Certification  
**Data:** 31/07/2026  
**Natureza:** Auditoria de dependências — **sem alteração de código**

---

## 1. Método

1. Varredura de imports em `src/lib/enterprise/**/*.ts`
2. Busca de referências cruzadas entre Engines (`persistence`, `storage`, `configuration`, `metadata`, `workflow`, `rule`)
3. Busca de vazamento de domínio (`tiss`, `operadora`, `contrato`, `guia`, `ocr`, `openai`, `paciente`, `glosa`, etc.)
4. Inspeção da direção Port ← Adapter ← Store/Runtime ← Provider

---

## 2. Grafo de dependências entre Engines

```
persistence ──(isolado)──► (apenas @/lib/supabase/config no adapter vendor)
storage     ──(isolado)──► (apenas @/lib/supabase/config no adapter vendor)
configuration ──(isolado)
metadata      ──(isolado)
workflow      ──(isolado)  [refs opacas a Metadata; sem import]
rule          ──(isolado)  [refs opacas a Metadata/Workflow; sem import]
rule/expression ──► rule/ports/types (mesmo Engine; tipos estruturais)
```

**Dependências circulares entre Engines:** **nenhuma.**

---

## 3. Matriz de acoplamento

| De → Para | Persistence | Storage | Configuration | Metadata | Workflow | Rule | Expression |
|-----------|-------------|---------|---------------|----------|----------|------|------------|
| Persistence | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Storage | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configuration | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ |
| Metadata | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ |
| Workflow | ❌ | ❌ | ❌ | ❌ (só ref opaca tipada localmente) | — | ❌ | ❌ |
| Rule | ❌ | ❌ | ❌ | ❌ (ref opaca) | ❌ (ref opaca) | — | ❌ (Port não importa Expression) |
| Expression | ❌ | ❌ | ❌ | ❌ | ❌ | tipos ports (mesmo pacote) | — |

---

## 4. Dependency Inversion

| Camada | Dependências observadas | Conformidade |
|--------|-------------------------|--------------|
| Port | apenas tipos do próprio contrato | ✅ |
| Adapter | Port + Store/Runtime/Factory helper + (vendor config se vendor) | ✅ |
| Store | tipos do Port | ✅ |
| Provider/Factory | Port + Adapters | ✅ |
| Demo Application | apenas Port (tipos + chamada health/capabilities) | ✅ |
| Expression Evaluator | tipos Rule + AST/parser/runtime/registry | ✅ (módulo irmão; RulePort não chama evaluator) |

**Violações de Dependency Inversion:** **nenhuma.**

---

## 5. Dependências indevidas / acoplamentos

### 5.1 Aceitáveis (por design)

| Dependência | Local | Classificação |
|-------------|-------|---------------|
| `@/lib/supabase/config` | `supabase-persistence-adapter.ts`, `supabase-storage-adapter.ts` | Vendor adapter — **permitido** |
| Expression → `rule/ports/types` | `rule-evaluator.ts` | Mesmo Engine (Rule + Expression) — **permitido** |
| Adapters → `rule/factory` | Default/Mock Rule adapters | Helper interno — **permitido funcionalmente**; pasta viola ECS-01 estruturalmente |

### 5.2 Acoplamentos fortes

| Achado | Severidade | Impede EPC-07? | Detalhe |
|--------|------------|----------------|---------|
| Nenhum acoplamento forte entre Engines | — | Não | Engines isolados |
| Refs Metadata duplicadas (shapes diferentes) | MÉDIO | Não | Acoplamento **conceitual futuro**, não de import atual |
| Action catalog com labels “approve/reject” | BAIXO | Não | Catálogo sem executor; não acopla a módulos clínicos |

**Acoplamentos fortes de código (imports / SDKs no Port):** **não existem.**

---

## 6. Vazamento de domínio / infra

| Proibido no Core | Presente como conhecimento executável? | Observação |
|------------------|----------------------------------------|------------|
| TISS | Não | Apenas comentários de exclusão |
| Operadoras | Não | Idem |
| Contratos comerciais | Não | Idem |
| Guias / Paciente / CID | Não | Idem |
| OCR / IA / OpenAI | Não | Idem |
| Banco / SQL / Supabase no Port | Não | Supabase só em adapters vendor |
| API routes / UI / Next | Não | Demo sem rotas |

---

## 7. Workflow × Rule × Expression (fronteiras)

| Relação | Estado auditado |
|---------|-----------------|
| Workflow importa Rule? | **Não** |
| Workflow importa Expression? | **Não** |
| Workflow avalia regras? | **Não** — conditions estruturais (`always`/`never`/`event`; stubs `expression`/`metadata`/`external` → `true`) |
| RulePort chama Expression? | **Não** — `supportsEvaluation: false` no Port |
| Expression avalia RuleDefinition? | **Sim**, via `evaluateRule` no módulo Expression (fora do Port) |

Fronteiras estão corretas para fundação. Integração Workflow↔Rule↔Expression permanece **preparada**, não implementada no Port.

---

## 8. Conclusão da análise de dependências

1. **Zero dependências circulares** entre Engines Enterprise.
2. **Zero violações de Dependency Inversion.**
3. **Zero acoplamentos fortes** de código entre Engines.
4. Únicos pontos de atenção são **conceituais** (shapes de referência) e **estruturais** (`rule/factory/`), ambos não bloqueantes para EPC-07.

Relatório satélite: [`EPC-CERT-01_ECS_CONFORMANCE.md`](./EPC-CERT-01_ECS_CONFORMANCE.md)
