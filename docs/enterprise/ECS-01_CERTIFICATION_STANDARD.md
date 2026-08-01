# ECS-01 — Certification Standard

**Sprint:** ECS-01 — Enterprise Component Specification  
**Data:** 31/07/2026  
**Natureza:** Padrão oficial de certificação Enterprise — **sem alteração de certificações existentes**  
**Documento pai:** [`ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md`](./ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md)

---

## 1. Objetivo

Padronizar o questionário, os critérios e a estrutura do relatório de certificação de **toda** sprint Enterprise.

Nenhuma sprint Enterprise futura poderá ser considerada aprovada sem responder ao questionário obrigatório e preencher o relatório no formato deste standard.

---

## 2. Arquivo de certificação

```
docs/enterprise/EPC-XX_{COMPONENT}_CERTIFICATION.md
```

Para sprints transversais (ex.: ECS-01), usar:

```
docs/enterprise/{PREFIX}-{NN}_{TITLE}_CERTIFICATION.md
```

ou incluir a seção de certificação / relatório no documento pai + resposta explícita no corpo da entrega.

---

## 3. Estrutura obrigatória do relatório

```markdown
# EPC-XX — {Component} Engine Certification Report

**Sprint:** …  
**Data:** DD/MM/AAAA  
**Resultado:** **APROVADA** | **REPROVADA** | **APROVADA COM RESSALVAS**

## 1. Questionário obrigatório
## 2. Critérios de aprovação
## 3. Inventário de arquivos
## 4. Evidência de testes / gates
## 5. Arquitetura certificada
## 6. Declaração final
```

---

## 4. Questionário obrigatório (núcleo — todas as sprints)

Toda sprint Enterprise **deverá** responder:

| # | Pergunta | Tipo de resposta |
|---|----------|------------------|
| 1 | Funcionalidade mudou? | Sim / Não (+ detalhe se Sim) |
| 2 | Tela mudou? | Sim / Não |
| 3 | API mudou? | Sim / Não |
| 4 | Migration criada? | Sim / Não (+ nomes se Sim) |
| 5 | Comportamento mudou? | Sim / Não |
| 6 | Quantos arquivos foram alterados/criados no escopo? | Número + referência ao inventário |
| 7 | Adapters criados? | Quantidade + nomes |
| 8 | Ports criados? | Quantidade + nomes |
| 9 | Quantos módulos passaram a depender/utilizar o Port? | Número + quais (PoC conta) |
| 10 | Existem regressões conhecidas atribuíveis à sprint? | Sim / Não |
| 11 | Build / testes da sprint passaram? | Sim / Não (+ gates) |
| 12 | Compatibilidade com o comportamento anterior preservada? | Sim / Não |
| 13 | Estado Global: há falhas pré-existentes fora do escopo? | Sim / Não (+ nota) |
| 14 | Resultado da Sprint? | APROVADA / REPROVADA / APROVADA COM RESSALVAS |

### 4.1 Formulação canônica (tabela no relatório)

Usar exatamente esta tabela (textos podem ter micro-ajustes de domínio, mas a intenção deve permanecer):

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Alguma funcionalidade mudou? | |
| 2 | Alguma tela mudou? | |
| 3 | Alguma API mudou? | |
| 4 | Alguma migration foi criada? | |
| 5 | Algum comportamento mudou? | |
| 6 | Quantos arquivos foram alterados? | |
| 7 | Quantos adapters foram criados? | |
| 8 | Quantos ports foram criados? | |
| 9 | Quantos módulos passaram a utilizar o Port? | |
| 10 | Existe regressão conhecida? | |
| 11 | Todos os testes (gates da sprint) passaram? | |
| 12 | O comportamento permanece 100% compatível? | |
| 13 | Há débitos / falhas de Estado Global pré-existentes fora do escopo? | |
| 14 | Resultado da Sprint? | |

> **Nota de compatibilidade histórica:** certificações EPC-01…05 usam 12 perguntas núcleo + extensões específicas (Q13+). O núcleo ECS-01 adiciona explicitamente **Estado Global** e **Resultado da Sprint** como Q13–Q14. Extensões de domínio continuam a partir de **Q15**.

---

## 5. Extensões por tipo de sprint

### 5.1 Sprint de fundação de Engine (típico)

Acrescentar conforme relevante:

| # | Pergunta |
|---|----------|
| 15 | O Engine está preparado para multi-tenant / multi-provider futuramente? |
| 16 | Há vazamento de conhecimento clínico no Core? |
| 17 | Há vazamento de regra de negócio no Core? |
| 18 | Há lock-in de provider na superfície do Port? |
| 19 | O componente está conforme ECS-01 (estrutura/naming/testes/docs)? |

### 5.2 Extensões de domínio (exemplos históricos)

| Domínio | Exemplos de perguntas extras |
|---------|------------------------------|
| Storage | Prep de Document Identity? |
| Configuration | Prep multi-tenant / multi-provider? |
| Metadata | Versionamento? Inheritance? Prep Workflow/Rule/IA? |
| Workflow | Prep Metadata / Rule Engine / AI Providers? Sem regras clínicas? |

Extensões são **permitidas e encorajadas**, desde que o núcleo Q1–Q14 permaneça intacto.

### 5.3 Sprint apenas documental (ex.: ECS-01)

Respostas esperadas típicas:

| # | Resposta típica |
|---|-----------------|
| 1–5 | **Não** |
| 6 | N arquivos **somente docs** (listar) |
| 7–8 | **0** (nenhum Port/Adapter de código) |
| 9 | **0** |
| 10 | **Não** |
| 11 | N/A ou gates documentais / verificação de presença dos arquivos |
| 12 | **Sim** |
| 13 | Conforme estado do repositório |
| 14 | **APROVADA** se critérios documentais cumpridos |

---

## 6. Critérios de aprovação (seção 2)

Tabela mínima:

| Critério | Status |
|----------|--------|
| Nenhuma funcionalidade do usuário alterada (ou alteração autorizada e documentada) | ✅/❌ |
| Nenhuma tela alterada (idem) | ✅/❌ |
| Nenhuma API modificada (idem) | ✅/❌ |
| Nenhuma migration indevida | ✅/❌ |
| Nenhuma regressão atribuível à sprint | ✅/❌ |
| Ports/Adapters conforme escopo | ✅/❌ |
| Testes obrigatórios (ECS-01 Test Standard) | ✅/❌ |
| Documentação obrigatória (ECS-01 Documentation Standard) | ✅/❌ |
| Conformidade ECS-01 (novos Engines) | ✅/❌ |
| Arquitetura sem inversão de hierarquia | ✅/❌ |

Sprints de fundação sem mudança de comportamento devem ter **Não** em Q1–Q5 para aprovação plena típica.

---

## 7. Inventário de arquivos (seção 3)

Separar obrigatoriamente:

### Código
Lista de paths criados/alterados.

### Testes / tooling
Suite + `package.json` scripts, se houver.

### Documentação
Os 4 docs canônicos (+ ADRs se houver).

Informar **total** no escopo da sprint.  
Declarar explicitamente o que **não** foi tocado (UI, APIs, migrations, Engines vizinhos, etc.) quando for sprint de fundação.

---

## 8. Evidência de testes / gates (seção 4)

### 8.1 Tabela de gates

| Gate | Comando | Resultado |
|------|---------|-----------|
| Suite do Engine | `npm run enterprise:{component}:test` | PASS N/N |
| Regressão Engine anterior | `npm run enterprise:{prev}:test` | PASS N/N |
| Outros gates do escopo | … | … |

### 8.2 Separação obrigatória

1. **Resultado da Sprint** — apenas gates do escopo.  
2. **Estado Global pré-existente** — falhas conhecidas fora do escopo (build global, eslint amplo, etc.), quando existirem.

Falhas pré-existentes **não** reprovam automaticamente a sprint se estiverem documentadas e fora do escopo.

---

## 9. Arquitetura certificada (seção 5)

Incluir diagrama da hierarquia real certificada, por exemplo:

```
Application (demo)
    ↓
{Xxx}Port
    ↓
{Xxx}Adapter
    ↓
{Xxx}Store (se houver)
    ↓
Factory / Provider
    ↓
Infrastructure
```

Confirmar:

- Sem inversão de dependências  
- Sem vazamento clínico  
- Sem lock-in no Port  

---

## 10. Declaração final (seção 6)

Texto mínimo:

- Resultado (**APROVADA** / etc.)  
- Natureza da sprint (fundação / migração / documental)  
- Se o comportamento do produto permanece inalterado  
- Se o Engine/componente está apto a evoluir sem refatorar o Core  
- Referência de conformidade a **ECS-01** (obrigatória a partir desta sprint)

---

## 11. Quando a sprint é REPROVADA

Reprovar se qualquer item for verdadeiro:

1. Mudança não autorizada de funcionalidade/UI/API/comportamento.  
2. Migration criada fora do escopo declarado.  
3. Suites obrigatórias do escopo falhando.  
4. Port com vazamento de vendor ou conhecimento clínico.  
5. Inversão da hierarquia Application → Port → Adapter.  
6. Documentação obrigatória ausente.  
7. Novo Engine fora do padrão ECS-01 sem waiver arquitetural explícito.  

---

## 12. Certificação desta sprint ECS-01 (auto-aplicação)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Alguma funcionalidade mudou? | **Não** |
| 2 | Alguma tela mudou? | **Não** |
| 3 | Alguma API mudou? | **Não** |
| 4 | Alguma migration foi criada? | **Não** |
| 5 | Algum comportamento mudou? | **Não** |
| 6 | Quantos arquivos foram alterados? | **5** (somente documentação ECS-01) |
| 7 | Quantos adapters foram criados? | **0** |
| 8 | Quantos ports foram criados? | **0** |
| 9 | Quantos módulos passaram a utilizar algum Port novo? | **0** |
| 10 | Existe regressão conhecida? | **Não** atribuível a ECS-01 |
| 11 | Gates da sprint passaram? | **Sim** — artefatos documentais criados conforme FASE 10 |
| 12 | O comportamento permanece 100% compatível? | **Sim** |
| 13 | Estado Global pré-existente fora do escopo? | **Sim, possível** — não alterado por ECS-01 |
| 14 | Resultado da Sprint? | **APROVADA** (documental) |
| 15 | Especificação oficial dos componentes existe? | **Sim** |
| 16 | Padrão único para novos Engines definido? | **Sim** |
| 17 | Engines existentes foram modificados? | **Não** |
| 18 | Roadmap pode prosseguir para o próximo Engine (EPC-06)? | **Sim** — com conformidade ECS-01 obrigatória |

### Critérios ECS-01

| Critério | Status |
|----------|--------|
| Nenhum código alterado | ✅ |
| Nenhuma funcionalidade modificada | ✅ |
| Especificação oficial criada | ✅ |
| Padrão único para novos Engines | ✅ |
| Documentação ECS-01 concluída (5 arquivos) | ✅ |

---

## 13. Declaração

Este Certification Standard é **vinculante** para todas as sprints Enterprise a partir da aprovação de ECS-01.  
Certificações EPC-01…05 permanecem válidas como legado; novos relatórios devem seguir este formato.
