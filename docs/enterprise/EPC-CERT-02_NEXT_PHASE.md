# EPC-CERT-02 — Next Phase Risk Report (EPC-11)

**Sprint:** EPC-CERT-02 — Enterprise Organization Certification  
**Data:** 31/07/2026  
**Próxima fase alvo:** **EPC-11 — Contract Intelligence Foundation**  
**Natureza:** Relatório de riscos — **sem implementação**

---

## 1. Premissa

A Enterprise Organization Layer (EPC-09, EPC-10A, EPC-10B) foi auditada e certificada com veredito **GO** (ver [`EPC-CERT-02_ORGANIZATION_CERTIFICATION.md`](./EPC-CERT-02_ORGANIZATION_CERTIFICATION.md)).

EPC-11 deve nascer **sobre** Tenant / Assignment / Rule Pack via **referências opacas**, sem inverter a hierarquia e sem acoplar Contract Intelligence ao Core organizacional.

---

## 2. O que EPC-11 pode / não pode fazer

### Pode

- Introduzir fundação de Contract Intelligence como componente/produto **separado** (Port próprio conforme ECS-01)
- Associar contratos a Tenants via Assignment Objects existentes ou refs opacas novas no módulo de produto
- Referenciar Rule Packs por `packId` / `TargetReference` sem importar Rule Engine
- Usar Configuration / Storage / Document Identity / AI Providers **via Application**, não via Assignment Adapter
- Declarar lifecycle estrutural de artefatos contratuais (sem regras comerciais completas na fundação)
- Preparar OCR / IA Auditora **sem** iniciá-los nesta entrada (sprints futuras)

### Não pode (na entrada da EPC-11)

- Fazer Tenant Assignment Adapter carregar / resolver Rule Packs, Storage, AI ou Documents
- Embutir TISS, glosa, tabela de procedimentos ou regras de operadora no Core organizacional
- Alterar Ports certificados da Org Layer “para facilitar contrato” sem sprint de evolução explícita
- Criar migrations de produto como side-effect da fundação sem decisão de arquitetura
- Ligar UI/API de faturamento ao Core Org Layer sem sprint de integração
- “Corrigir” DEV-ORG-01…07 dentro de EPC-11 como side-effect (sprints dedicadas)

---

## 3. Riscos da próxima fase

| ID | Risco | Severidade | Mitigação recomendada |
|----|-------|------------|------------------------|
| RISK-ORG-01 | Contract Intelligence importar `tenant-assignment` adapters concretos | ALTO | Application depende só de Ports; factory cria Port |
| RISK-ORG-02 | Resolver `TargetReference` dentro do Core Assignment | **CRÍTICO** | Resolução só na Application / módulo de produto |
| RISK-ORG-03 | Embutir schema contratual / TISS no `customAttributes` do Tenant Core como “padrão” | ALTO | Schemas de contrato no módulo EPC-11; Core permanece opaco |
| RISK-ORG-04 | Acoplar Rule Pack ao Rule Engine na fundação | MÉDIO | Manter `RuleReference` opaca; evaluation em sprint posterior |
| RISK-ORG-05 | Exigir kind `WORKFLOW` antes de existir | MÉDIO | Usar refs locais / customAttributes até sprint de kind |
| RISK-ORG-06 | Pressão para abrir Auth/RBAC “junto” com Contract Intelligence | ALTO | Auth/RBAC em sprint própria; Org Layer não é Auth |
| RISK-ORG-07 | Iniciar OCR / IA Auditora dentro de EPC-11 Foundation | MÉDIO | Manter escopo Foundation; OCR/IA em sprints nomeadas |
| RISK-ORG-08 | Usar EPC-11 para “limpar” factory/ e OrganizationType | BAIXO | Débitos DEV-ORG em sprints dedicadas |

---

## 4. Pré-requisitos satisfeitos pela Organization Layer

| Pré-requisito para Contract Intelligence | Status |
|------------------------------------------|--------|
| Tenant genérico multi-org | ✅ |
| Assignment Objects canônicos (5 kinds) | ✅ |
| Rule Pack versionado com deps opacas | ✅ |
| Refs opacas a Configuration / Storage / Document / AI | ✅ |
| Desacoplamento Assignment ↔ engines | ✅ |
| Isolamento sem ciclos | ✅ |
| Versionamento / lifecycle estruturais | ✅ |
| ECS-01 DNA | ✅ (com débitos documentados) |
| Bloqueio arquitetural crítico | ❌ nenhum |

---

## 5. Débitos que NÃO precisam ser resolvidos antes de EPC-11

1. Realocar `factory/` → lógica só em `providers/` (DEV-ORG-01)
2. Abrir / generalizar `OrganizationType` (DEV-ORG-02)
3. Restringir barrel exports (DEV-ORG-03)
4. Adicionar kind `WORKFLOW` (DEV-ORG-04)
5. Unificar casing de lifecycle (DEV-ORG-05)
6. Tornar `capabilities()` async (DEV-ORG-06)
7. Enriquecer versionamento do Tenant (DEV-ORG-07)

Esses itens são **recomendações** (ALTO/MÉDIO/BAIXO), **não gates** de entrada da Contract Intelligence.

---

## 6. Gate de entrada EPC-11

| Gate | Status |
|------|--------|
| Organization Layer certificada (GO) | ✅ |
| Sem ciclos / sem acoplamentos fortes | ✅ |
| Refs opacas preservadas | ✅ |
| Multi-org sem mudança de Core | ✅ |
| Nenhum desvio CRÍTICO aberto | ✅ |
| Produção / UI / API / migrations intocadas nesta certificação | ✅ |

**Decisão:** EPC-11 **pode iniciar**.

---

## 7. Recomendação de escopo mínimo para EPC-11

1. Definir Port de Contract Intelligence (ECS-01) **sem** conhecer TISS operacional completo.
2. Associar contratos a `tenantId` / Assignment por referência opaca.
3. Referenciar Rule Packs por id — sem evaluate nesta fundação.
4. Não tocar adapters da Org Layer.
5. Não iniciar OCR nem IA Auditora.
6. Documentar fronteira: Org Layer = identidade/associação; Contract Intelligence = domínio contratual.

---

## 8. Conclusão

Não há bloqueio arquitetural da Organization Layer para a EPC-11.  
O risco principal é **reacoplar** referências opacas durante a implementação de Contract Intelligence — risco de processo, não de fundação.  
**Roadmap: prosseguir para EPC-11 — Contract Intelligence Foundation.**
