# EPC-03 — Configuration Migration Plan (Strangler Fig)

**Sprint:** EPC-03 — Configuration Engine Foundation  
**Data:** 31/07/2026  
**Princípio:** migrar pouco, provar sempre, nunca big-bang

---

## 1. Estado atual (após EPC-03)

| Item | Estado |
|------|--------|
| `ConfigurationPort` | Existe |
| `DefaultConfigurationAdapter` | Existe (default) |
| `MockConfigurationAdapter` | Existe (test/mock/offline) |
| `DefaultConfigurationStore` | Existe (in-process) |
| Provider `createConfigurationPort` | Existe |
| Hierarquia oficial | Declarada |
| Resolução hierárquica | Preparada (primeiro hit) |
| Tipagem Boolean/Number/String/Enum/JSON/Collection | Preparada |
| Feature Flags infraestrutura | Preparada (**não** usada em produto) |
| Módulos de negócio no Port | **0** (intencional) |
| PoC Application | 1 (demo health summary — só testes) |
| Settings / Auth / Env Manager / Flags legadas | **Inalterados e em uso** |

---

## 2. Estratégia

```
Fase A (EPC-03)   Fundar Port + Adapter + Store + hierarquia + tipagem + flags prep  ← FEITO
Fase B            Migrar 1 leitura de config baixo risco (não crítica) via Port
Fase C            Bind `readLegacy` / adapter env ao mecanismo atual (mesmo comportamento)
Fase D            Introduzir overrides Tenant/Module com testes de paridade
Fase E            Feature Flags cutover opcional (atrás de flag de migração)
Fase F            Providers database/redis/remote quando houver requisito real
Fase G            Remover imports diretos de config ad-hoc no Application
```

Cada fase exige: build + TypeScript + ESLint + testes + smoke = PASS, e zero mudança perceptível ao usuário (exceto quando a sprint for explicitamente funcional).

---

## 3. Ordem sugerida de migração (futuro)

Prioridade por **baixo risco / baixo acoplamento**:

1. **Constantes de aplicação não sensíveis** (timeouts de UI, labels internas de debug)
2. **Capabilities / toggles internos de infraestrutura** (já no Configuration Engine)
3. **Overrides por environment** (staging vs prod) via camada `environment`
4. **Overrides por tenant** — somente após multi-tenant EF estar maduro
5. **Feature flags de produto** — cutover explícito, nunca silencioso
6. **Contratos / operadoras / rule packs** — camadas de domínio **acima** do Port, nunca dentro do Engine

**Nunca** iniciar por: cutover total de Settings UI, Auth policies, ou flags críticas de produção sem certificação.

---

## 4. Receita por módulo (checklist)

Para cada módulo candidato:

1. [ ] Identificar chaves de configuração usadas hoje
2. [ ] Mapear para `ConfigurationValue` (`kind` adequado)
3. [ ] Escolher escopo estrutural (`platform` / `tenant` / `module` / …)
4. [ ] Implementar leitura via `ConfigurationPort` **reutilizando o mesmo comportamento atual**
5. [ ] Manter caminho legado até paridade comprovada
6. [ ] Testes de paridade (valor igual ao legado)
7. [ ] Remover import direto legado somente após certificação

---

## 5. Preparação multi-tenant / multi-provider

| Capacidade | Preparado em EPC-03? | Implementado? |
|------------|----------------------|---------------|
| Escopo `tenant` na hierarquia | Sim | Estrutural apenas |
| `resolutionContext.tenantId` | Sim | Walk mínimo |
| Multi-tenant real (isolamento RLS/org) | Não | Fora de escopo |
| Múltiplos providers (`env`/`database`/`redis`) | Sim (ids + factory) | Adapters futuros |
| Feature flags de produto | Infra apenas | Não em uso |

---

## 6. Critérios para iniciar Fase B

- EPC-03 certificada (comportamento 100% compatível)
- Chave candidata sem impacto em PHI / billing / auth
- Teste de paridade definido
- Rollback = manter caminho legado

---

## 7. Fora de escopo permanente deste plano (até sprint dedicada)

- Cooperativas / operadoras / contratos como entidades do Engine
- OCR / IA / TISS / Financeiro / Captura Inteligente
- Alteração de banco / migrations de configuração
- Substituição do Environment Manager atual
