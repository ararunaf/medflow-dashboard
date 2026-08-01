# ECS-01 — Documentation Standard

**Sprint:** ECS-01 — Enterprise Component Specification  
**Data:** 31/07/2026  
**Natureza:** Padrão oficial de documentação Enterprise — **sem alteração de documentação existente de Engines**  
**Documento pai:** [`ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md`](./ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md)

---

## 1. Objetivo

Padronizar os documentos obrigatórios de cada componente Enterprise e o formato de cada um.

Cada novo componente **deverá** possuir obrigatoriamente:

1. `ENGINE.md`  
2. `ARCHITECTURE.md`  
3. `MIGRATION_PLAN.md`  
4. `CERTIFICATION.md`  

(Arquivos nomeados com prefixo de sprint + domínio — ver §2.)

---

## 2. Nomenclatura de arquivos

Local: `docs/enterprise/`

| Documento | Nome canônico |
|-----------|---------------|
| Engine | `EPC-XX_{COMPONENT}_ENGINE.md` |
| Architecture | `EPC-XX_{COMPONENT}_ARCHITECTURE.md` |
| Migration Plan | `EPC-XX_{COMPONENT}_MIGRATION_PLAN.md` |
| Certification | `EPC-XX_{COMPONENT}_CERTIFICATION.md` |
| Architecture Decisions (opcional) | `EPC-XX_{COMPONENT}_ARCHITECTURE_DECISIONS.md` |

Onde:

- `EPC-XX` = id da sprint do Engine (ou prefixo da trilha, se outro programa)  
- `{COMPONENT}` = domínio em SCREAMING_SNAKE (`WORKFLOW`, `RULE_ENGINE`, `AI_PROVIDER`, …)

### 2.1 Exceções legadas (não replicar)

| Legado | Substituto canônico |
|--------|---------------------|
| `EPC-01_PERSISTENCE_PORTS.md` | `*_ENGINE.md` |
| `EPC-02_STORAGE_PORTS.md` | `*_ENGINE.md` |
| `EPC-01_ARCHITECTURE_DECISIONS.md` (sem domínio) | `*_ARCHITECTURE.md` (+ ADR opcional com domínio) |
| `EPC-01_CERTIFICATION.md` / `EPC-01_MIGRATION_PLAN.md` (sem domínio) | `EPC-XX_{COMPONENT}_*.md` |

**ECS-01 não renomeia documentos legados.**

---

## 3. Formato — ENGINE.md

Documento de **produto arquitetural** do Engine: o que é, o que entrega, o que não faz.

### 3.1 Cabeçalho obrigatório

```markdown
# EPC-XX — {Component} Engine Foundation

**Sprint:** EPC-XX — {Component} Engine Foundation  
**Data:** DD/MM/AAAA  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** …  
**Continuidade:** Espelha o padrão Enterprise (ECS-01)
```

### 3.2 Seções obrigatórias

| # | Seção | Conteúdo mínimo |
|---|-------|-----------------|
| 1 | Objetivo | Papel do Engine + diagrama Application → Port → Adapter → … |
| 2 | O que foi entregue | Tabela artefato → caminho |
| 3 | O que o Engine **jamais** conhece | Lista de exclusões (clínico / negócio / UI) |
| 4 | Superfície do Port | Métodos + tipos principais |
| 5 | Providers suportados | Ids implementados + reservados |
| 6 | Família de adapters | Default / Vendor / Mock |
| 7 | Testes | Script npm + arquivo |
| 8 | Fora de escopo | O que deliberadamente não foi feito |
| 9 | Próximos passos | Evoluções futuras sem comprometer o Core |

### 3.3 Tom

- Factual, arquitetural, sem marketing.
- Deixar explícito quando a sprint é fundação sem mudança de comportamento.

---

## 4. Formato — ARCHITECTURE.md

Documento de **decisões e hierarquia**.

### 4.1 Cabeçalho

```markdown
# EPC-XX — {Component} Architecture
```

### 4.2 Seções obrigatórias

| # | Seção | Conteúdo mínimo |
|---|-------|-----------------|
| 1 | Hierarquia de dependências | Diagrama ASCII ou mermaid alinhado a ECS-01 §3 |
| 2 | Mapa de pastas | Árvore real do componente |
| 3 | Contratos | Port, Health, Capabilities, Options |
| 4 | Adapters | Responsabilidades e ids |
| 5 | Store / Runtime | Presente ou N/A com justificativa |
| 6 | Factory | Default, resolução, erros explícitos |
| 7 | Isolamento | O que não pode importar / vazar |
| 8 | Relação com outros Engines | Refs opacas / preps (se houver) |
| 9 | Conformidade ECS-01 | Checklist resumido (estrutura + naming) |

### 4.3 ADR opcional

Quando houver decisões polêmicas ou trade-offs relevantes, criar `*_ARCHITECTURE_DECISIONS.md` com entradas:

- Contexto  
- Decisão  
- Consequências  
- Alternativas rejeitadas  

---

## 5. Formato — MIGRATION_PLAN.md

Documento de **como o mundo real migrará** para o Port — sem executar a migração na fundação.

### 5.1 Cabeçalho

```markdown
# EPC-XX — {Component} Migration Plan
```

### 5.2 Seções obrigatórias

| # | Seção | Conteúdo mínimo |
|---|-------|-----------------|
| 1 | Estado atual | Como o produto faz hoje (sem Port) |
| 2 | Estado alvo | Application → Port → Adapter |
| 3 | Estratégia | Strangler / dual-read / feature flag / etc. |
| 4 | Fases | F0 fundação (feita) → F1 bridge → F2 cutover → F3 cleanup |
| 5 | Não-objetivos desta sprint | Deixar claro o que **não** migra agora |
| 6 | Riscos | Lock-in, regressão, dual-write, etc. |
| 7 | Critérios de cutover futuro | Condições para apontar produto ao Port |

Na sprint de fundação, o plano é **prospectivo**. Nenhuma migration de banco é criada só por existir este documento.

---

## 6. Formato — CERTIFICATION.md

Documento de **aprovação da sprint**. Formato detalhado em:

[`ECS-01_CERTIFICATION_STANDARD.md`](./ECS-01_CERTIFICATION_STANDARD.md)

Seções mínimas:

1. Questionário obrigatório  
2. Critérios de aprovação  
3. Inventário de arquivos  
4. Evidência de testes / gates  
5. Arquitetura certificada  
6. Declaração final  

---

## 7. Documentos de especificação de plataforma (ECS / EPC-00)

Além dos docs por Engine, a plataforma pode ter documentos transversais:

| Prefixo | Uso |
|---------|-----|
| `EPC-00_*` | Baseline / roadmap / audit / target architecture |
| `ECS-01_*` | Especificação de componentes (esta família) |
| `EPC-XX_*` | Entrega de um Engine específico |

Regras:

- Não sobrescrever docs de sprints anteriores.
- Não “corrigir” Gen A legada nesta sprint.
- Novos docs transversais seguem `docs/enterprise/{PREFIX}-{NN}_{TITLE}.md`.

---

## 8. Idioma e estilo

| Aspecto | Padrão |
|---------|--------|
| Idioma | Português (Brasil) |
| Identificadores de código | Inglês (como no código) |
| Tabelas | Preferir tabelas para inventários e checklists |
| Diagramas | ASCII e/ou mermaid |
| Ênfase | Usar **negrito** só para resultados críticos (ex.: **APROVADA**, **Não**) |
| Links | Relativos entre docs em `docs/enterprise/` |

---

## 9. Checklist documental por Engine novo

- [ ] `*_ENGINE.md` completo (§3)  
- [ ] `*_ARCHITECTURE.md` completo (§4)  
- [ ] `*_MIGRATION_PLAN.md` completo (§5)  
- [ ] `*_CERTIFICATION.md` completo (Certification Standard)  
- [ ] Nomes de arquivo no padrão canônico Gen B  
- [ ] Referência a ECS-01 / continuidade com Engines anteriores  
- [ ] Nenhum doc de Engine anterior alterado sem necessidade explícita  

---

## 10. Inventário documental dos Engines existentes

| Engine | ENGINE / PORTS | ARCHITECTURE | MIGRATION | CERTIFICATION | Geração |
|--------|----------------|--------------|-----------|---------------|---------|
| Persistence | `EPC-01_PERSISTENCE_PORTS.md` | `EPC-01_ARCHITECTURE_DECISIONS.md` | `EPC-01_MIGRATION_PLAN.md` | `EPC-01_CERTIFICATION.md` | Gen A |
| Storage | `EPC-02_STORAGE_PORTS.md` | `EPC-02_ARCHITECTURE_DECISIONS.md` | `EPC-02_MIGRATION_PLAN.md` | `EPC-02_CERTIFICATION.md` | Gen A |
| Configuration | `EPC-03_CONFIGURATION_ENGINE.md` | `EPC-03_CONFIGURATION_ARCHITECTURE.md` | `EPC-03_CONFIGURATION_MIGRATION_PLAN.md` | `EPC-03_CONFIGURATION_CERTIFICATION.md` | Gen B ✅ |
| Metadata | `EPC-04_METADATA_ENGINE.md` | `EPC-04_METADATA_ARCHITECTURE.md` | `EPC-04_METADATA_MIGRATION_PLAN.md` | `EPC-04_METADATA_CERTIFICATION.md` | Gen B ✅ |
| Workflow | `EPC-05_WORKFLOW_ENGINE.md` | `EPC-05_WORKFLOW_ARCHITECTURE.md` | `EPC-05_WORKFLOW_MIGRATION_PLAN.md` | `EPC-05_WORKFLOW_CERTIFICATION.md` | Gen B ✅ |

---

## 11. Declaração

Este Documentation Standard é **vinculante** para todos os novos componentes Enterprise a partir da aprovação de ECS-01.
