# EPC-05 — Workflow Migration Plan (Strangler Fig)

**Sprint:** EPC-05 — Workflow Engine Foundation  
**Data:** 31/07/2026  
**Princípio:** migrar pouco, provar sempre, nunca big-bang

---

## 1. Estado atual (após EPC-05)

| Item | Estado |
|------|--------|
| `WorkflowPort` | Existe |
| `DefaultWorkflowAdapter` | Existe (default) |
| `MockWorkflowAdapter` | Existe (test/mock/offline) |
| `DefaultWorkflowStore` | Existe (in-process) |
| Provider `createWorkflowPort` | Existe |
| Conceitos nativos | Declarados |
| Runtime start/advance/rollback/cancel | Estrutural (sem negócio) |
| Conditions | Prep estrutural (sem Rule Engine) |
| History / Checkpoint | Implementados em memória |
| Timeout | Descriptor (sem scheduler) |
| MetadataRef | Prep opaca |
| PersistencePort bridge | Documentado (não implementado) |
| Módulos de negócio no Port | **0** (intencional) |
| PoC Application | 1 (demo health summary — só testes) |
| UI / APIs / Settings / Storage / Metadata / Configuration | **Inalterados** |

---

## 2. Estratégia

```
Fase A (EPC-05)   Fundar Port + Adapter + Store + runtime estrutural + conceitos  ← FEITO
Fase B            1 Workflow abstrato de baixo risco (não clínico) em Application
Fase C            Consumir WorkflowPort em 1 use-case com paridade ao fluxo legado
Fase D            Ligar Conditions expression/external ao Rule Engine (sprint dedicada)
Fase E            Provider persistence via PersistencePort quando houver requisito real
Fase F            MetadataRef resolvida via MetadataPort (sem entidades no Core)
Fase G            AI / OCR / Contract Intelligence emitem Events/Triggers externos
Fase H            Domínios MedicFlow orquestrados pelos Business Modules — nunca no Core
```

Cada fase exige: build + TypeScript + ESLint + testes + smoke = PASS, e zero mudança perceptível ao usuário (exceto quando a sprint for explicitamente funcional).

---

## 3. Ordem sugerida de uso futuro

Prioridade por **baixo risco / baixo acoplamento**:

1. **Fluxos de infraestrutura** (onboarding técnico, jobs internos genéricos)
2. **Estados de captura genéricos** (received → processed → failed) sem TISS no Core
3. **Integração Rule Engine** para Conditions não triviais
4. **Persistência** de State via PersistencePort
5. **Metadata** descrevendo Stages como Schema/Entity externos
6. **AI / OCR** como produtores de Events externos
7. **Business Modules MedicFlow** — **acima** do Engine, nunca dentro

**Nunca** iniciar por: hardcode de Paciente/Guia/Operadora/TISS dentro de `src/lib/enterprise/workflow/`.

---

## 4. Receita por processo futuro (checklist)

Para cada processo candidato a orquestração:

1. [ ] Modelar como `WorkflowDefinition` (Stages + Transitions)
2. [ ] Conditions estruturais apenas; regras complexas no Rule Engine
3. [ ] Actions como descriptors; side-effects na Application
4. [ ] Events / Triggers sem semântica clínica no Core
5. [ ] MetadataRef opaca se precisar alinhar a Metadata Engine
6. [ ] Consumir via `WorkflowPort` em Application — nunca importar Adapter no Domain
7. [ ] Testes de paridade com comportamento legado
8. [ ] Remover orquestração hardcoded somente após certificação

---

## 5. Preparação para consumidores futuros

| Consumidor | Preparado em EPC-05? | Implementado? |
|------------|----------------------|---------------|
| Rule Engine | Sim (Condition kinds + docs) | **Não** |
| AI Engine | Sim (Events / Triggers / Actions externas) | **Não** |
| OCR | Sim (advance externo documentado) | **Não** |
| Contract Intelligence | Sim (Workflow genérico + MetadataRef) | **Não** |
| Document Identity | Sim (Stages/Status genéricos) | **Não** |
| Business Modules | Sim (Port contract) | **Não** |
| Metadata Engine | Sim (`WorkflowMetadataRef`) | **Não** (sem bind) |
| PersistencePort | Sim (provider `persistence` + Store contract) | **Não** |

---

## 6. Anti-padrões (proibidos)

- Importar tipos de Captura/TISS/Financeiro no Workflow Core
- Executar OCR/IA dentro de `advance`
- Criar migration `workflows` sem sprint dedicada
- Ligar UI/API ao Port sem PoC + testes de paridade
- Implementar BPM / Rule Engine dentro do adapter default
- Hardcodar nomes de entidades clínicas em Stages

---

## 7. Critério de “pronto para migrar um módulo”

Um módulo só deve passar a usar `WorkflowPort` quando:

1. Definição genérica (sem conceitos MedicFlow no Core)
2. Testes de paridade verdes
3. Zero mudança de UX não autorizada
4. Certificação da sprint correspondente
5. Rollback plan documentado (feature flag / dual-run se necessário)
