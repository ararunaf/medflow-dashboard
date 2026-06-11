# Auditoria Forense de Rotas — MedicFlow-AI

**Data:** 08/06/2026  
**Fonte primária:** `src/routeTree.gen.ts` (gerado por TanStack Router)  
**Fonte secundária:** arquivos em `src/routes/`  
**Commit:** `e7db791` (branch `main`, repo `medflow-dashboard`)

---

## Lista completa de rotas implementadas

### Rotas públicas

| Rota | Arquivo | Classificação |
|------|---------|---------------|
| `/site` | `src/routes/site.tsx` | Landing comercial |
| `/login` | `src/routes/login.tsx` | Autenticação |
| `/login/esqueci-senha` | `src/routes/login.esqueci-senha.tsx` | Autenticação |
| `/login/redefinir-senha` | `src/routes/login.redefinir-senha.tsx` | Autenticação |

### Rotas autenticadas — Operacional

| Rota | Arquivo | Classificação |
|------|---------|---------------|
| `/` | `src/routes/index.tsx` | Dashboard operacional |
| `/escalas` | `src/routes/escalas.tsx` | **Escalas** (profissionais) |
| `/plantoes` | `src/routes/plantoes.tsx` | **Plantões** |
| `/central` | `src/routes/central.tsx` | Central operacional |
| `/perfil` | `src/routes/perfil.tsx` | Perfil do usuário |
| `/ajuda` | `src/routes/ajuda.tsx` | Central de ajuda |
| `/operacao` | `src/routes/operacao.tsx` | Painel operacional |

### Rotas autenticadas — Financeiro

| Rota | Arquivo | Classificação |
|------|---------|---------------|
| `/executivo` | `src/routes/executivo.tsx` | **Executivo** |
| `/financeiro` | `src/routes/financeiro.tsx` | **Financeiro** (hub) |
| `/financeiro/dashboard-executivo` | `src/routes/financeiro.dashboard-executivo.tsx` | **Relatórios** / Dashboard |
| `/financeiro/fechamento-operacional` | `src/routes/financeiro.fechamento-operacional.tsx` | Fechamento |
| `/financeiro/conciliacao-operacional` | `src/routes/financeiro.conciliacao-operacional.tsx` | Conciliação |

### Rotas autenticadas — TISS

| Rota | Arquivo | Classificação |
|------|---------|---------------|
| `/tiss` | `src/routes/tiss.tsx` | **TISS** |

### Rotas autenticadas — Instituição e implantação

| Rota | Arquivo | Classificação |
|------|---------|---------------|
| `/instituicao` | `src/routes/instituicao.tsx` | **Instituição** / Configurações |
| `/piloto` | `src/routes/piloto.tsx` | **Administração** / Piloto |
| `/lancamento` | `src/routes/lancamento.tsx` | Go-live |

**Total de rotas:** 20 (17 autenticadas + 3 públicas de login + 1 landing)

---

## Classificação solicitada

### Operacional

| Módulo | Rota(s) | Status |
|--------|---------|--------|
| Escalas | `/escalas` | **Implementado** |
| Plantões | `/plantoes` | **Implementado** |
| Financeiro | `/financeiro`, `/financeiro/*`, `/executivo` | **Implementado** |
| TISS | `/tiss` | **Implementado** |
| Instituição | `/instituicao` | **Implementado** |

### Clínico

| Módulo | Rota esperada | Status | Evidência |
|--------|---------------|--------|-----------|
| Pacientes | `/pacientes`, `/paciente` | **NÃO implementado** | EVIDÊNCIA NÃO ENCONTRADA em `routeTree.gen.ts` e `src/routes/` |
| Prontuário | `/prontuario`, `/prontuarios` | **NÃO implementado** | EVIDÊNCIA NÃO ENCONTRADA |
| Consultas | `/consultas` | **NÃO implementado** | EVIDÊNCIA NÃO ENCONTRADA |
| Agenda Clínica | `/agenda` | **NÃO implementado** | Existe `/escalas` (agenda de **profissionais**, não de pacientes) |
| Atendimento | `/atendimento` | **NÃO implementado** | EVIDÊNCIA NÃO ENCONTRADA |

---

## Menu de navegação (sidebar)

Fonte: `src/components/app-shell.tsx` — função `navForRole()`

| Label | Rota | Tipo |
|-------|------|------|
| Home | `/` | Operacional |
| Piloto | `/piloto` | Implantação |
| Go-live | `/lancamento` | Implantação |
| Ajuda | `/ajuda` | Suporte |
| Executivo | `/executivo` | Financeiro |
| Escalas | `/escalas` | Operacional |
| Plantões | `/plantoes` | Operacional |
| Financeiro | `/financeiro` | Financeiro |
| Dashboard fin. | `/financeiro/dashboard-executivo` | Financeiro |
| Fechamento | `/financeiro/fechamento-operacional` | Financeiro |
| TISS | `/tiss` | TISS |
| Instituição | `/instituicao` | Instituição |
| Painel ops | `/operacao` | Operacional |
| Perfil | `/perfil` | Usuário |

**EVIDÊNCIA NÃO ENCONTRADA** de itens de menu para Pacientes, Prontuário, Consultas, Agenda Clínica ou Atendimento.

---

## Screenshots de rotas encontradas

Salvos em `docs/evidence/`:

| Rota | Screenshot | Observação |
|------|------------|------------|
| `/login` | `01-login.png` | ✓ |
| `/` | `02-dashboard.png` | ✓ |
| `/escalas` | `03-agenda-escalas.png` | Agenda de **escalas**, não clínica |
| `/plantoes` | `04-plantoes.png` | ✓ |
| `/financeiro` | `05-financeiro.png` | ✓ |
| `/financeiro/dashboard-executivo` | `06-relatorios-dashboard-executivo.png` | ✓ |
| `/instituicao` | `07-configuracoes-instituicao.png` | ✓ |
| `/piloto` | `08-administracao-piloto.png` | ✓ |
| `/tiss` | `09-tiss.png` | ✓ |
| `/perfil` | `10-perfil.png` | ✓ |
| `/central` | `11-central-operacional.png` | ✓ |
| `/ajuda` | `12-ajuda.png` | ✓ |
| `/pacientes` | — | **EVIDÊNCIA NÃO ENCONTRADA** — rota inexistente |
| `/prontuario` | — | **EVIDÊNCIA NÃO ENCONTRADA** — rota inexistente |

---

## Busca em histórico Git

`git grep` em todos os commits não encontrou definições de rotas clínicas.

**Conclusão:** EVIDÊNCIA NÃO ENCONTRADA de que rotas clínicas tenham existido em versões anteriores.

---

## Resumo

| Categoria | Rotas | Quantidade |
|-----------|-------|------------|
| Operacional (escalas, plantões, central) | `/`, `/escalas`, `/plantoes`, `/central`, `/operacao` | 5 |
| Financeiro | `/executivo`, `/financeiro`, `/financeiro/*` | 4 |
| TISS | `/tiss` | 1 |
| Instituição/Implantação | `/instituicao`, `/piloto`, `/lancamento` | 3 |
| Autenticação/Público | `/site`, `/login`, `/login/*` | 4 |
| Usuário/Suporte | `/perfil`, `/ajuda` | 2 |
| **Clínico** | — | **0** |

---

*Evidência de árvore de rotas: `src/routeTree.gen.ts`, listagem em `docs/evidence/directory-tree-src.txt`*
