# EPC-06A — Rule Migration Plan (Strangler Fig)

**Sprint:** EPC-06A — Rule Engine Core Foundation  
**Data:** 31/07/2026  
**Princípio:** migrar pouco, provar sempre, nunca big-bang

---

## 1. Estado atual (após EPC-06A)

| Item | Estado |
|------|--------|
| `RulePort` | Existe |
| `DefaultRuleAdapter` | Existe (default) |
| `MockRuleAdapter` | Existe (test/mock/offline) |
| `DefaultRuleStore` | Existe (in-process) |
| `RuleFactory` | Existe (normalização estrutural) |
| Provider `createRulePort` | Existe |
| Conceitos nativos | Declarados |
| Catálogo Operators | Registrado (sem lógica) |
| Catálogo Actions | Registrado (sem execução) |
| Catálogo Priorities | Registrado (sem scheduler) |
| Evaluation / parser / DSL | **Não** (EPC-06B) |
| MetadataReference / WorkflowReference | Prep opaca |
| PersistencePort bridge | Documentado (não implementado) |
| Módulos de negócio no Port | **0** (intencional) |
| PoC Application | 1 (demo health summary — só testes) |
| UI / APIs / Settings / Storage / Metadata / Configuration / Workflow | **Inalterados** |

---

## 2. Estratégia

```
Fase A (EPC-06A)  Fundar Port + Adapter + Store + Factory + catálogos     ← FEITO
Fase B (EPC-06B)  Linguagem / evaluator genérico (sem domínio MedicFlow)
Fase C            1 Rule abstrata de baixo risco em Application
Fase D            Consumir RulePort em 1 use-case com paridade ao legado
Fase E            Ligar Workflow Conditions expression/external ao RulePort
Fase F            Provider persistence via PersistencePort quando houver requisito
Fase G            MetadataReference resolvida via MetadataPort (sem entidades no Core)
Fase H            AI / Document Identity / Business Modules acima do Engine
```

Cada fase exige: build + TypeScript + ESLint + testes + smoke = PASS, e zero mudança perceptível ao usuário (exceto quando a sprint for explicitamente funcional).

---

## 3. Ordem sugerida de uso futuro

Prioridade por **baixo risco / baixo acoplamento**:

1. **Regras de infraestrutura** (gates técnicos genéricos)
2. **Thresholds / flags** via Configuration + Rule descriptors
3. **Workflow Conditions** `expression` / `external` → RulePort (após EPC-06B)
4. **Document Identity** genérico (Business Module)
5. **AI Providers** como produtores de Context / consumidores de Outcome
6. **Business Modules MedicFlow** — **acima** do Engine, nunca dentro

**Nunca** iniciar por: hardcode de regras clínicas/TISS/contratuais dentro de `src/lib/enterprise/rule/`.

---

## 4. Receita por regra futura (checklist)

Para cada regra candidata:

1. [ ] Modelar como `RuleDefinition` (Conditions + Actions estruturais)
2. [ ] Operators apenas do catálogo oficial
3. [ ] Actions como descriptors; side-effects na Application
4. [ ] MetadataReference / WorkflowReference opacas se necessário
5. [ ] Consumir via `RulePort` em Application — nunca importar Adapter no Domain
6. [ ] Testes de paridade com comportamento legado
7. [ ] Remover regra hardcoded somente após certificação
8. [ ] **Proibido:** colocar semântica TISS/clínica/contratual no Core

---

## 5. Preparação para consumidores futuros

| Consumidor | Preparado em EPC-06A? | Implementado? |
|------------|----------------------|---------------|
| Workflow | Sim (`WorkflowReference` + docs) | **Não** |
| Metadata | Sim (`MetadataReference`) | **Não** (sem bind) |
| Configuration | Sim (docs de integração) | **Não** |
| Document Identity | Sim (docs) | **Não** |
| AI Providers | Sim (docs / Outcome futuro) | **Não** |
| Business Modules | Sim (Port contract) | **Não** |
| PersistencePort | Sim (provider `persistence` + Store) | **Não** |
| Evaluator / DSL | Preparado via tipos | **Não** (EPC-06B) |

---

## 6. Anti-padrões (proibidos)

- Importar tipos de Captura/TISS/Financeiro/Contratos no Rule Core
- Avaliar expressões / regex no adapter default (EPC-06A)
- Executar Actions com side-effects no Core
- Criar migration `rules` sem sprint dedicada
- Ligar UI/API ao Port sem PoC + testes de paridade
- Implementar linguagem de regras fora da EPC-06B
- Hardcodar nomes de entidades clínicas em Conditions

---

## 7. Critério de “pronto para migrar um módulo”

Um módulo só deve passar a usar `RulePort` quando:

1. Definição genérica (sem conceitos MedicFlow no Core)
2. Evaluator EPC-06B disponível (se precisar Evaluation)
3. Testes de paridade verdes
4. Zero mudança de UX não autorizada
5. Certificação da sprint correspondente
6. Rollback plan documentado (feature flag / dual-run se necessário)

---

## 8. Preparação explícita para EPC-06B

A EPC-06B poderá introduzir, sem quebrar o Port atual:

- Operações de Evaluation no Port (ou Port estendido)
- Interpreter / linguagem genérica
- Resolução de Operators do catálogo
- Produção de `RuleEvaluation` / `Outcome`
- Integração com Workflow Conditions

O contrato EPC-06A (`register` / `get` / `list` / `enable` / `disable` / `health` / `capabilities`) permanece estável.
