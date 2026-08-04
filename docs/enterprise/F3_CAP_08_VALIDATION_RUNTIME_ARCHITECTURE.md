# F3-CAP-08 — Validation Runtime Architecture

**Sprint:** F3-CAP-08 — Enterprise Validation Runtime Foundation  
**Padrão:** ECS-01  
**Data:** 2026-08-04

---

## Fluxo estrutural oficial

```
Produto
  → Enterprise Runtime
    → ValidationRuntimePort
      → DefaultValidationRuntimeAdapter / EnterpriseValidationRuntimeAdapter /
        MockValidationRuntimeAdapter
        → InMemoryValidationRuntimeStore
          → ValidationResult (canônico estrutural)
```

Nenhuma etapa executa validação real.

---

## Camadas ECS-01

| Camada | Responsabilidade |
|--------|------------------|
| `ports/` | `ValidationRuntimePort`, modelos canônicos, capabilities, identity, types |
| `providers/` | `createValidationRuntimePort()` / `getValidationRuntimePort()` |
| `factory/` | `ValidationRuntimeFactory` — instancia adapter por provider id |
| `registry/` | Catálogo `mock` / `test` / `default` / `enterprise` |
| `adapters/` | Default (= Enterprise alias) e Mock |
| `store/` | `ValidationRuntimeStore` + `InMemoryValidationRuntimeStore` |
| `demo/` | `getValidationRuntimeHealthSummary()` |

---

## Operações estruturais

| Operação | Comportamento nesta sprint |
|----------|----------------------------|
| `openJob` | Abre job canônico in-memory — sem validação |
| `closeJob` | Fecha job canônico — sem teardown real |
| `submitRequest` | Registra `ValidationRequest` — sem engine |
| `registerDocument` | Registra referência documental — sem ler bytes |
| `getResult` | Retorna `ValidationResult` vazio estrutural |
| `stats` | Contadores in-process |
| `health` | Shape-check de peers + store |
| `capabilities` | Declara flags `*Implemented = false` |
| `providerInfo` | Metadados do provedor |

---

## ValidationContext

```
ValidationContext
  ├── DocumentClassificationContext?   (ponte Classification)
  ├── DocumentExtractionResult?        (ponte Extraction)
  └── FutureValidationRuleContracts    (todas não avaliadas)
```

Regras futuras declaradas (somente contrato):

- template corresponde à operadora
- versão TISS compatível
- documento compatível com template
- qualidade mínima
- confiança mínima
- campos obrigatórios
- consistência entre campos
- compatibilidade guia ↔ operadora
- consistência documental
- score geral de validação

---

## Integração Enterprise Runtime

- Getter: `getValidationRuntimePort()`
- Health flag: `validationRuntimeOk`
- Provider default: `enterprise`
- `enterpriseDeps` com lazy getters para peers CAP/INF (shape-check em `health()`)

---

## Garantias arquiteturais

1. Nenhuma validação funcional implementada.
2. Somente contratos e arquitetura.
3. Todas as regras futuras permanecem desabilitadas (`*Implemented = false`).
4. Enterprise Foundation e Centro Operacional permanecem íntegros.
