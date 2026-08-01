# EPC-23 — TISS Rule Runtime Architecture

**Sprint:** EPC-23 — TISS Rule Runtime Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-23_TISS_RULE_RUNTIME_FOUNDATION.md`](./EPC-23_TISS_RULE_RUNTIME_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getTISSRuleRuntimeHealthSummary)   │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSRuleRuntimePort                                  │
│  startExecution | resolveProfile | resolveBindings   │
│  resolveRulePacks | dispatchRules | collectResults   │
│  health | capabilities                               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultTISSRuleRuntimeAdapter                       │
│  MockTISSRuleRuntimeAdapter                          │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSRuleRuntimeStore (in-process)                    │
│  contexts / pipelines / results / traces / metadata  │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSRuleRuntimeFactory → createTISSRuleRuntimePort   │
└──────────────────────────────────────────────────────┘
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Fronteiras

| Pode | Não pode |
|------|----------|
| Orquestrar estágios estruturais | Executar regras / validações TISS |
| Registrar refs opacas | Interpretar contratos / ANS |
| Produzir ExecutionTrace in-process | Criar banco / migrations |
| Health / capabilities | Alterar UI / APIs |
| Declarar capacidades estruturais | Implementar parallel/batch/retry reais |
| Documentar integração futura | Integrar Ports Enterprise funcionalmente |
| Preparar AI Auditor | Implementar AI / OCR / parser XML |

---

## 3. Fluxo canônico obrigatório

```
Healthcare Model                 (EPC-19) — entrada exclusiva
  ↓
TISS Profile                     (EPC-22)
  ↓
Contract Rule Binding            (EPC-17)
  ↓
Rule Pack Resolution             (EPC-09)
  ↓
Rule Engine                      (EPC-06A)
  ↓
Expression Engine                (EPC-06B)
  ↓
Execution Result                 ← EPC-23 coleta
  ↓
AI Auditor (futuro)              (EPC-18)
```

**Nunca:** Healthcare Model → Rule Engine sem Runtime.

---

## 4. Posição no pipeline Enterprise

```
Origem (XML/OCR/API/…)
  → Mapping → Vocabulary → Profile
  → Healthcare Model
  → ★ TISS Rule Runtime (EPC-23) ★
      → Binding → Packs → Rule Engine → Expression
      → Execution Result → AI Auditor
```

O Runtime é o **motor de orquestração**.  
Inteligência de negócio permanece nos componentes especializados.

---

## 5. Mapa de pastas

```
src/lib/enterprise/tiss-rule-runtime/
├── ports/
│   ├── tiss-rule-runtime-port.ts
│   ├── types.ts
│   ├── models.ts
│   ├── identity.ts
│   ├── pipeline.ts
│   └── index.ts
├── adapters/
│   ├── default-tiss-rule-runtime-adapter.ts
│   ├── mock-tiss-rule-runtime-adapter.ts
│   ├── runtime-stage-helpers.ts
│   └── index.ts
├── store/
│   ├── tiss-rule-runtime-store.ts
│   ├── default-tiss-rule-runtime-store.ts
│   └── index.ts
├── factory/
│   ├── tiss-rule-runtime-factory.ts
│   └── index.ts
├── providers/
│   ├── create-tiss-rule-runtime-port.ts
│   └── index.ts
├── demo/
│   ├── tiss-rule-runtime-health-query.ts
│   └── index.ts
└── index.ts
```

---

## 6. Isolamento

- Nenhum import de rotas, Server Functions, UI, Auth, Financeiro ou Captura.
- Nenhum import funcional de outros Ports Enterprise (apenas documentação / refs opacas).
- Store in-process — sem Supabase, sem migrations, sem RLS.
- `dispatchRules()` retorna sempre `rulesExecuted: false`.

---

## 7. Aderência ECS-01

| Requisito ECS-01 | Status |
|------------------|--------|
| Port único | ✅ `TISSRuleRuntimePort` |
| Default + Mock adapters | ✅ |
| Store interno | ✅ |
| Factory + Provider | ✅ |
| `providerId` | ✅ |
| Throw em provider desconhecido | ✅ |
| Health + Capabilities | ✅ |
| Demo Application → Port | ✅ |
| Testes Enterprise | ✅ |
| Documentação padrão | ✅ |
