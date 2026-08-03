# ARCH-DEBT-01 — Registro Oficial de Ressalvas Arquiteturais

**Sprint:** ARCH-DEBT-01 — Architectural Exception Register  
**Data:** 02/08/2026  
**Natureza:** Sprint exclusiva de governança — **sem alteração de código, Runtime, Provider, Adapter, testes, banco, APIs, UI ou comportamento**  
**Status do registro:** ATIVO — referência oficial para exceções arquiteturais aceitas temporariamente  
**Parecer desta sprint:** **GO COM RESSALVAS**

---

## 1. Objetivo

Este documento é o **Registro Oficial de Ressalvas Arquiteturais** do MedicFlow Enterprise.

A partir de ARCH-DEBT-01:

- nenhuma ressalva deve permanecer apenas em relatórios de Sprint ou transcripts de Gate;
- toda exceção arquitetural temporariamente aceita deve constar neste registro;
- novas ressalvas só podem ser adicionadas por auditoria/gate oficial posterior (não nesta sprint).

---

## 2. Regras de governança do registro

1. **Não inventar** problemas novos.
2. **Não alterar** criticidade sem justificativa explícita da origem.
3. **Não reabrir** itens resolvidos.
4. Itens eliminados em Sprint posterior: `Status = Resolvida` + Sprint de correção.
5. Gates aprovados com ressalvas: itens permanecem `Aceita` ou `Planejada` até tratamento.
6. Fontes auditadas: relatórios em `docs/enterprise/` + Gates aprovados em transcripts oficiais (quando o Gate não gerou markdown checked-in).

### Status canônicos

| Status | Significado |
|--------|-------------|
| **Aberta** | Identificada; ainda sem aceite formal de continuidade nem plano fechado |
| **Planejada** | Aceita e com Sprint prevista nomeada |
| **Aceita** | Aceita temporariamente pelo Gate/Sprint (GO COM RESSALVAS / dívida consciente) |
| **Resolvida** | Eliminada por Sprint posterior com evidência |

### Criticidade canônica

| Criticidade | Significado |
|-------------|-------------|
| **Bloqueante** | Impediu ou impede continuidade do roadmap (NO-GO / blocker explícito) |
| **Não bloqueante** | Não impede continuidade; pode impedir GO puro |

---

## 3. Escopo auditado

| Área | Fontes |
|------|--------|
| Enterprise Foundation | EPC-00…EPC-24, ECS-01, EPC-CERT-01, EPC-CERT-02, EPC-19A |
| Enterprise Infrastructure | INF-01…INF-05, FASE_B consolidado |
| Document Intelligence Platform | DIP-01…DIP-06 |
| OCR / Classification / Storage / Search / TISS | OCR-01 (código + OCR-GATE-01), CLASS-01, STORAGE-01, SEARCH-01, TISS-01 |
| Integração Runtime | ARCH-01, ARCH-02 |
| Gates / Auditorias | GATE-ARCH-02, GATE-ARCH-03, GATE-ARCH-03A, OCR-GATE-01, CLASS-GATE-01, STORAGE-GATE-01, SEARCH-GATE-01 |

### Nota sobre Gates

Até ARCH-DEBT-01, os relatórios de Gate **não** estavam materializados como markdown em `docs/enterprise/`.  
As ressalvas desses Gates foram consolidadas aqui a partir dos transcripts oficiais:

| Gate | Transcript | Parecer original |
|------|------------|------------------|
| GATE-ARCH-02 | `640989a4-0ab1-48a2-b87a-c1f6f9f15c94` | NO-GO |
| GATE-ARCH-03 | `7175d9b9-3845-4dbc-8cb6-3b457490a296` | GO COM RESSALVAS |
| GATE-ARCH-03A | `322230c3-35f5-401b-bcc1-f80b81958ab3` | GO COM RESSALVAS |
| ARCH-02 | `f0add393-14ce-459b-a745-840af8395ca7` | GO |
| OCR-GATE-01 | `ba3e0f85-ac8e-4c51-9ecf-2440c40638f2` | GO |
| CLASS-GATE-01 | `399a1900-51f9-4823-9309-831151d66675` | GO |
| STORAGE-GATE-01 | `6a8c25e2-4b17-47c6-b406-42934ae44830` | GO COM RESSALVAS |
| SEARCH-GATE-01 | `4ea20d57-a783-4ec7-9d65-4ccc429067d0` | GO |

---

## 4. Dashboard consolidado

| Métrica | Quantidade |
|---------|------------|
| **Total de ressalvas registradas** | **63** |
| Prioridade **Alta** | **12** |
| Prioridade **Média** | **18** |
| Prioridade **Baixa** | **33** |
| Criticidade **Bloqueante** (histórico GATE-ARCH-02) | **4** |
| Criticidade **Não bloqueante** | **59** |
| Status **Resolvida** | **6** |
| Status **Planejada** | **3** |
| Status **Aceita** | **53** |
| Status **Aberta** | **1** |
| Pendentes (Aberta + Aceita + Planejada) | **57** |

### Bloqueantes — estado atual

| ID | Título | Status atual | Impede roadmap agora? |
|----|--------|--------------|-----------------------|
| AER-GA02-B1 | 0 consumidores Enterprise / ilha estrutural | **Resolvida** (ARCH-01) | Não |
| AER-GA02-B2 | EPC-24 + INF fora de `main` | **Aceita** | Não bloqueia SEARCH-01 no branch Enterprise; permanece dívida de governança de trunk |
| AER-GA02-B3 | Application 0/43 | **Resolvida** (ARCH-01 / decisão ECS-01) | Não |
| AER-GA02-B4 | Staging Foundation pendente | **Aceita** | Não bloqueia SEARCH-01 (Gates posteriores não reemitiram NO-GO) |

**Nenhuma ressalva bloqueante impede a continuidade do roadmap funcional para TISS-CATALOG-GATE-01.**  
TISS-01/TISS-02 implementaram Provider/Runtime + Canonical Catalog (estrutural). **AER-GA03-A4** permanece Aceita (dual-path produto vs enterprise — convergência pós Gate).  
SEARCH-GATE-01 / STORAGE-GATE-01 permanecem com ressalvas não bloqueantes (incl. **AER-STG-A1**).

---

## 5. Tabela resumida

| ID | Título | Origem | Categoria | Prioridade | Criticidade | Status | Sprint prevista |
|----|--------|--------|-----------|------------|-------------|--------|-----------------|
| AER-CORE-DEV-01 | Pasta `rule/factory/` proibida | EPC-CERT-01 | Maintainability | Média | Não bloqueante | Aceita | Adequação ECS-01 futura |
| AER-CORE-DEV-02 | Persistence `mechanismId` legado | EPC-CERT-01 / ECS-01 | Maintainability | Baixa | Não bloqueante | Aceita | Adequação ECS-01 futura |
| AER-CORE-DEV-03 | `MetadataReference` inconsistente | EPC-CERT-01 | Architecture | Média | Não bloqueante | Aceita | Adequação Core futura |
| AER-CORE-DEV-04 | Suites `*-ports` Gen A | EPC-CERT-01 | Maintainability | Baixa | Não bloqueante | Aceita | Adequação testes futura |
| AER-CORE-DEV-05 | Docs Gen A em EPC-01/02 | EPC-CERT-01 | Maintainability | Baixa | Não bloqueante | Aceita | Docs Gen B futura |
| AER-CORE-DEV-06 | EPC-06B sem ARCHITECTURE/MIGRATION | EPC-CERT-01 | Maintainability | Média | Não bloqueante | Aceita | Docs Gen B futura |
| AER-CORE-DEV-07 | Action kinds sem executor | EPC-CERT-01 | Maintainability | Baixa | Não bloqueante | Aceita | Adequação Rule futura |
| AER-CORE-GLOBAL-01 | Build/TS global pré-existente | EPC-CERT-01/02 | Infrastructure | Alta | Não bloqueante* | **Resolvida** | EPC-19A |
| AER-ORG-DEV-01 | Pasta `factory/` na Org Layer | EPC-CERT-02 | Architecture | Alta | Não bloqueante | Aceita | Adequação ECS-01 Org |
| AER-ORG-DEV-02 | `OrganizationType` healthcare-biased | EPC-CERT-02 | Architecture | Alta | Não bloqueante | Aceita | Adequação Org futura |
| AER-ORG-DEV-03 | Barrel exporta Factory/Adapters/Stores | EPC-CERT-02 | Maintainability | Média | Não bloqueante | Aceita | Adequação superfície futura |
| AER-ORG-DEV-04 | Ausência de kind `WORKFLOW` | EPC-CERT-02 | Architecture | Média | Não bloqueante | Aceita | Quando necessário ao roadmap |
| AER-ORG-DEV-05 | Casing lifecycle inconsistente | EPC-CERT-02 | Maintainability | Baixa | Não bloqueante | Aceita | Unificação cosmética futura |
| AER-ORG-DEV-06 | `capabilities()` síncrono | EPC-CERT-02 | Maintainability | Baixa | Não bloqueante | Aceita | Alinhamento ECS opcional |
| AER-ORG-DEV-07 | Versionamento Tenant assimétrico | EPC-CERT-02 | Maintainability | Baixa | Não bloqueante | Aceita | Aceitável na fundação |
| AER-EPC-DEBT-01 | Dívida consciente: produto fora dos Ports | EPC-01…06A ADRs | Architecture | Média | Não bloqueante | Aceita | Sprints de migração por domínio |
| AER-19A-R01 | Ciclo residual `routeTree.gen.ts` | EPC-19A | Maintainability | Baixa | Não bloqueante | Aceita | Não prevista (framework) |
| AER-INF-STRUCT-01 | INF estrutural (sem backends reais) | FASE B / INF-01…05 | Infrastructure | Média | Não bloqueante | Aceita | Adapters reais (pós-funcional) |
| AER-GA02-B1 | 0 consumidores / ilha Enterprise | GATE-ARCH-02 | Architecture | Alta | **Bloqueante** | **Resolvida** | ARCH-01 |
| AER-GA02-B2 | EPC-24 + INF fora de `main` | GATE-ARCH-02 | Infrastructure | Alta | **Bloqueante** | Aceita | Merge/governança de trunk |
| AER-GA02-B3 | Application 0/43 | GATE-ARCH-02 | Architecture | Alta | **Bloqueante** | **Resolvida** | ARCH-01 + decisão ECS-01 |
| AER-GA02-B4 | Staging Foundation pendente | GATE-ARCH-02 | Infrastructure | Média | **Bloqueante** | Aceita | Release/staging Foundation |

| AER-GA03-A1 | Dual-path Captura (estrutural vs funcional) | GATE-ARCH-03 | Architecture | Alta | Não bloqueante | Aceita | Consolidação dual-path |
| AER-GA03-A2 | OCR real fora do OCR Runtime | GATE-ARCH-03 | Architecture | Alta | Não bloqueante | **Resolvida** | OCR-01 / OCR-GATE-01 |
| AER-GA03-A3 | Storage Captura fora do Storage Manager | GATE-ARCH-03 | Architecture | Alta | Não bloqueante | Aceita | STORAGE-CONV-01 (ver AER-STG-A1) |
| AER-GA03-A4 | TISS produto vs `enterprise/tiss-*` | GATE-ARCH-03 | Architecture | Alta | Não bloqueante | Aceita | TISS-CONV-01 (pós TISS-GATE-01) |
| AER-GA03-M5 | Módulos EPC não compostos no Runtime | GATE-ARCH-03 | Architecture | Média | Não bloqueante | Aceita | Composição por fase |
| AER-GA03-M6 | INF in-memory insuficiente para escala | GATE-ARCH-03 | Scalability | Média | Não bloqueante | Aceita | Adapters reais INF |
| AER-GA03-M7 | Modelos canônicos não unificados | GATE-ARCH-03 | Maintainability | Média | Não bloqueante | Aceita | Consolidação na ativação |
| AER-GA03-M8 | Seed Unimed/Bradesco hardcoded | GATE-ARCH-03 | Maintainability | Média | Não bloqueante | Aceita | Externalizar Registry/Port |
| AER-GA03-M9 | Bridge best-effort | GATE-ARCH-03 / ARCH-01 | Architecture | Média | Não bloqueante | Aceita | Consolidação dual-path |
| AER-GA03-B10 | ECS-01 incompleto em EPC antigos | GATE-ARCH-03 | Maintainability | Baixa | Não bloqueante | Aceita | Adequação ECS-01 |
| AER-GA03-B11 | ESLint warnings fora do Enterprise | GATE-ARCH-03 | Maintainability | Baixa | Não bloqueante | Aceita | Limpeza qualidade futura |
| AER-GA03-B12 | `StoragePort` unbound (legado) | GATE-ARCH-03 | Architecture | Baixa | Não bloqueante | Aceita | STORAGE-DEBT-01 |
| AER-GA03-B13 | Nuance posição do Orchestrator (docs) | GATE-ARCH-03 | Maintainability | Baixa | Não bloqueante | Aceita | Alinhar documentação |
| AER-GA03A-R1 | Escape hatch `getAIProviderPort()` | GATE-ARCH-03A | Architecture | Média | Não bloqueante | Aceita | API interna / proibir produto |
| AER-GA03A-R2 | OCR dual-path pós-ARCH-02 | GATE-ARCH-03A | Architecture | Alta | Não bloqueante | **Resolvida** | OCR-01 / OCR-GATE-01 |
| AER-GA03A-R3 | StoragePort não injetado no DIP-05 | GATE-ARCH-03A | Architecture | Média | Não bloqueante | Aceita | STORAGE-CONV-01 / wiring Runtime |
| AER-GA03A-R4 | Classification/Search sem Provider Port | GATE-ARCH-03A | Architecture | Média | Não bloqueante | **Resolvida** | CLASS-01 + SEARCH-01 |
| AER-GA03A-R5 | ECS-01 pastas incompletas (8 módulos) | GATE-ARCH-03A | Maintainability | Baixa | Não bloqueante | Aceita | Adequação ECS-01 |
| AER-GA03A-R6 | Artefatos `.vercel` stale (OpenAI legado) | GATE-ARCH-03A | Infrastructure | Baixa | Não bloqueante | Aberta | Rebuild/redeploy |
| AER-GA03A-R7 | INF in-memory (reafirmação 03A) | GATE-ARCH-03A | Scalability | Média | Não bloqueante | Aceita | Adapters reais INF |
| AER-OCRG-B1 | Seam `fetchFn` de teste | OCR-GATE-01 | Maintainability | Baixa | Não bloqueante | Aceita | Isolar seam (opcional) |
| AER-OCRG-B2 | `health()` direto no OCR Port | OCR-GATE-01 | Architecture | Baixa | Não bloqueante | Aceita | Opcional via Capture Runtime |
| AER-OCRG-B3 | Logging/telemetria OCR estruturais | OCR-GATE-01 | Observability | Baixa | Não bloqueante | Aceita | Acoplar OBS (opcional) |
| AER-OCRG-B4 | MQ/Workers/Scheduler não acoplados ao OCR | OCR-GATE-01 | Scalability | Baixa | Não bloqueante | Aceita | Bridge OCR→INF (opcional) |
| AER-CLSG-B1 | `fetchFn` não dispara Classification | CLASS-GATE-01 | Maintainability | Baixa | Não bloqueante | Aceita | Isolar path de teste |
| AER-CLSG-B2 | `documentType` não propagado ao produto/UI | CLASS-GATE-01 | Architecture | Baixa | Não bloqueante | Aceita | Propagação pós-OCR |
| AER-CLSG-B3 | Telemetria Classification estrutural | CLASS-GATE-01 | Observability | Baixa | Não bloqueante | Aceita | Conforme desenho CLASS-01 |
| AER-CLSG-B4 | Batch classification desabilitado | CLASS-GATE-01 | Scalability | Baixa | Não bloqueante | Aceita | Quando houver requisito |
| AER-STG-A1 | Bypass da cadeia Runtime de Storage | STORAGE-GATE-01 | Architecture | Alta | Não bloqueante | **Planejada** | **STORAGE-CONV-01** |
| AER-STG-M1 | Coexistência EPC-02 `StoragePort` | STORAGE-GATE-01 | Maintainability | Média | Não bloqueante | **Planejada** | **STORAGE-DEBT-01** |
| AER-STG-B1 | Observability Storage estrutural | STORAGE-GATE-01 | Observability | Baixa | Não bloqueante | **Planejada** | **OBS-STORAGE-01** |
| AER-STG-B2 | Runtime default Storage in-memory | STORAGE-GATE-01 | Infrastructure | Baixa | Não bloqueante | Aceita | Bind explícito / ops |
| AER-SRCHG-B1 | Logging/telemetria Search estrutural | SEARCH-GATE-01 | Observability | Baixa | Não bloqueante | Aceita | Acoplar OBS (opcional) |
| AER-SRCHG-B2 | Catálogo Search in-memory | SEARCH-GATE-01 | Scalability | Baixa | Não bloqueante | Aceita | Adapter indexado futuro |
| AER-SRCHG-B3 | Escape hatch `getSearchProviderPort()` | SEARCH-GATE-01 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-SRCHG-B4 | MQ/Workers/Scheduler não acoplados ao Search | SEARCH-GATE-01 | Scalability | Baixa | Não bloqueante | Aceita | Bridge Search→INF (opcional) |
| AER-TISS-B1 | Logging/telemetria TISS estrutural | TISS-01 | Observability | Baixa | Não bloqueante | Aceita | Acoplar OBS (opcional) |
| AER-TISS-B2 | Escape hatch `getTISSProviderPort()` | TISS-01 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-TISS-B3 | TISS-01 sem XML/dispatch reais | TISS-01 | Architecture | Baixa | Não bloqueante | Aceita | Sprints funcionais pós TISS-GATE-01 |
| AER-TISS-B4 | Escape hatch `getTISSCatalogPort()` | TISS-02 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-TISS-B5 | Seed mínimo in-memory do Catalog | TISS-02 | Scalability | Baixa | Não bloqueante | Aceita | Carga por configuração futura |

\*Em EPC-CERT-01/02 o Build/TS global foi Estado Global pré-existente **fora do escopo** (não bloqueava certificação Core/Org). Eliminado em EPC-19A.

**Notas de contagem:**

- Prioridades de GATE-ARCH-02 B1–B4 não vieram rotuladas Alta/Média/Baixa na origem; foram mapeadas por severidade do blocker (B1–B3 → Alta; B4 → Média), preservando criticidade **Bloqueante**.
- AER-GA03A-R4 foi **Resolvida** em SEARCH-01 (Classification Provider em CLASS-01; Search Provider em SEARCH-01).
- Resolvidas confirmadas: AER-CORE-GLOBAL-01, AER-GA02-B1, AER-GA02-B3, AER-GA03-A2, AER-GA03A-R2, AER-GA03A-R4.

---

## 6. Fichas detalhadas

### 6.1 EPC-CERT-01 — Core

#### AER-CORE-DEV-01
- **Título:** Pasta `rule/factory/` proibida pela ECS-01  
- **Descrição:** O Rule Engine mantém pasta `factory/`, desvio estrutural ECS-01.  
- **Origem:** EPC-CERT-01 (`EPC-CERT-01_ECS_CONFORMANCE.md` DEV-01)  
- **Categoria:** Maintainability  
- **Prioridade:** Média  
- **Impacto:** Manutenção  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** DNA ECS-01 preservado; desvio cosmético/estrutural; zero críticos no Core.  
- **Sprint prevista:** Adequação ECS-01 futura  
- **Status:** Aceita  

#### AER-CORE-DEV-02
- **Título:** Persistence `mechanismId` (exceção legada)  
- **Descrição:** Persistence usa `mechanismId` em vez de `providerId` canônico.  
- **Origem:** EPC-CERT-01 DEV-02 / ECS-01 Naming  
- **Categoria:** Maintainability  
- **Prioridade:** Baixa  
- **Impacto:** Manutenção  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** Exceção legada oficial; novos Engines não devem replicar.  
- **Sprint prevista:** Adequação ECS-01 futura  
- **Status:** Aceita  

#### AER-CORE-DEV-03
- **Título:** Shapes incompatíveis de `MetadataReference`  
- **Descrição:** Metadata Engine vs Rule/Workflow usam shapes diferentes de referência.  
- **Origem:** EPC-CERT-01 DEV-03  
- **Categoria:** Architecture  
- **Prioridade:** Média  
- **Impacto:** Manutenção / Escalabilidade de contratos  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** Risco conceitual; não impede AI Provider Ports.  
- **Sprint prevista:** Adequação Core futura  
- **Status:** Aceita  

#### AER-CORE-DEV-04 / AER-CORE-DEV-05 / AER-CORE-DEV-06 / AER-CORE-DEV-07
- **Títulos:** Suites `*-ports`; Docs Gen A; EPC-06B docs incompletos; action kinds sem executor  
- **Origem:** EPC-CERT-01 DEV-04…DEV-07  
- **Categoria:** Maintainability  
- **Prioridade:** Baixa / Baixa / Média / Baixa  
- **Impacto:** Manutenção  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** Inventário oficial de desvios; nenhum crítico.  
- **Sprint prevista:** Sprints de adequação documental/estrutural  
- **Status:** Aceita  

#### AER-CORE-GLOBAL-01
- **Título:** Build FAIL + TypeScript global pré-existente  
- **Descrição:** `useTenantBranding` / ~207 erros `tsc` fora de `enterprise/**` documentados como Estado Global.  
- **Origem:** EPC-CERT-01 / EPC-CERT-02  
- **Categoria:** Infrastructure  
- **Prioridade:** Alta  
- **Impacto:** Produção / Manutenção  
- **Criticidade:** Não bloqueante para certificação Core/Org (fora de escopo)  
- **Justificativa técnica:** Débito global pré-existente, não atribuível aos Engines certificados.  
- **Sprint prevista / correção:** **EPC-19A**  
- **Status:** **Resolvida** (Build PASS, 0 erros TS — `EPC-19A_CERTIFICATION.md`)  

---

### 6.2 EPC-CERT-02 — Organization Layer

#### AER-ORG-DEV-01 … AER-ORG-DEV-07
Inventário oficial DEV-ORG-01…07 (`EPC-CERT-02_ORGANIZATION_CERTIFICATION.md` §6).

| ID | Desvio | Prioridade | Status |
|----|--------|------------|--------|
| AER-ORG-DEV-01 | `factory/` nos 3 componentes | Alta | Aceita |
| AER-ORG-DEV-02 | `OrganizationType` fechado com viés healthcare | Alta | Aceita |
| AER-ORG-DEV-03 | Barrel exporta Factory/Adapters/Stores | Média | Aceita |
| AER-ORG-DEV-04 | Sem kind `WORKFLOW` | Média | Aceita |
| AER-ORG-DEV-05 | Lifecycle casing inconsistente | Baixa | Aceita |
| AER-ORG-DEV-06 | `capabilities()` sync | Baixa | Aceita |
| AER-ORG-DEV-07 | Versionamento Tenant assimétrico | Baixa | Aceita |

- **Criticidade:** Não bloqueante (nenhum impede EPC-11)  
- **Sprint prevista:** Adequação ECS-01 Org / sprints dedicadas futuras  
- **Impacto:** Manutenção / reuso  

---

### 6.3 ADRs / ECS / EPC-19A / Fase B

#### AER-EPC-DEBT-01
- **Título:** Dívida consciente — módulos de produto fora dos Ports  
- **Descrição:** ADRs EPC-01…06A aceitam que módulos ainda importam Supabase / fluxos / configs / regras de produto fora do Port até sprints futuras.  
- **Origem:** EPC-01…EPC-06A Architecture Decisions (“Dívida consciente”)  
- **Categoria:** Architecture  
- **Prioridade:** Média  
- **Impacto:** Manutenção / Escalabilidade  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** Strangler fig deliberado; risco de regressão controlado.  
- **Sprint prevista:** Migrações por domínio (parcialmente OCR-01 / CLASS-01 / STORAGE-01)  
- **Status:** Aceita  

#### AER-19A-R01
- **Título:** Ciclo residual gerado `routeTree.gen.ts` → `router.tsx`  
- **Origem:** EPC-19A  
- **Categoria:** Maintainability  
- **Prioridade:** Baixa  
- **Impacto:** Manutenção  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** Residual de framework TanStack Router; não altera Build/TS/ESLint/testes.  
- **Sprint prevista:** Não prevista (aceite consciente)  
- **Status:** Aceita  

#### AER-INF-STRUCT-01
- **Título:** Infraestrutura INF apenas estrutural (sem backends reais)  
- **Descrição:** FASE B certificou INF-01…05 sem filas/workers/cron/logs/métricas/health reais.  
- **Origem:** FASE_B + INF-01…05 CERTIFICATION  
- **Categoria:** Infrastructure  
- **Prioridade:** Média  
- **Impacto:** Escalabilidade / Observabilidade / Produção (alto volume)  
- **Criticidade:** Não bloqueante (GO da Fase B)  
- **Justificativa técnica:** Fundação estrutural deliberada; adapters reais ficam para fase posterior.  
- **Sprint prevista:** Adapters reais INF (pós-fase funcional, conforme Gates)  
- **Status:** Aceita  

---

### 6.4 GATE-ARCH-02 (histórico NO-GO)

#### AER-GA02-B1 — Resolvida
- **Título:** Enterprise Foundation sem consumidores de produto  
- **Origem:** GATE-ARCH-02 B1  
- **Categoria:** Architecture · **Prioridade:** Alta · **Criticidade:** Bloqueante (à época)  
- **Status:** **Resolvida** em **ARCH-01** (Captura upload → Enterprise Runtime → Ports)  

#### AER-GA02-B2 — Aceita
- **Título:** EPC-24 + INF-01…05 fora de `main`  
- **Origem:** GATE-ARCH-02 B2  
- **Categoria:** Infrastructure · **Prioridade:** Alta · **Criticidade:** Bloqueante (governança de trunk)  
- **Justificativa técnica:** Baseline certificada avançou em branches de feature; `origin/main` ainda sem FASE B / Runtime (evidência git em 02/08/2026).  
- **Sprint prevista:** Merge/governança de trunk  
- **Status:** Aceita  
- **Nota:** Não impede SEARCH-01 no branch Enterprise ativo; impede declaração de trunk = Foundation completa.

#### AER-GA02-B3 — Resolvida
- **Título:** Camada Application 0/43  
- **Origem:** GATE-ARCH-02 B3  
- **Status:** **Resolvida** em **ARCH-01** via `ECS-01_APPLICATION_LAYER_DECISION.md` (Application absorvida pelo Enterprise Runtime; deixa de ser blocker).  

#### AER-GA02-B4 — Aceita
- **Título:** Staging Foundation pendente / release gate  
- **Origem:** GATE-ARCH-02 B4  
- **Categoria:** Infrastructure · **Prioridade:** Média (mapeada) · **Criticidade:** Bloqueante (à época)  
- **Sprint prevista:** Release/staging Foundation  
- **Status:** Aceita  

---

### 6.5 GATE-ARCH-03 / 03A

#### Alta
- **AER-GA03-A1** Dual-path Captura — **Aceita** — consolidação dual-path  
- **AER-GA03-A2** OCR fora do OCR Runtime — **Resolvida** (OCR-01 / OCR-GATE-01)  
- **AER-GA03-A3** Storage fora do Storage Manager — **Aceita** — estado atual em **AER-STG-A1** / STORAGE-CONV-01  
- **AER-GA03-A4** TISS dual-path — **Aceita** — fase TISS  

#### Média / Baixa GATE-ARCH-03
Ver tabela resumida (AER-GA03-M5…M9, B10…B13). Todas **Não bloqueantes**, status **Aceita**.

#### GATE-ARCH-03A
- **AER-GA03A-R1** Escape hatch AI Port — Aceita  
- **AER-GA03A-R2** OCR dual-path — **Resolvida** (OCR-01)  
- **AER-GA03A-R3** Storage wiring DIP — Aceita (segue AER-STG-A1)  
- **AER-GA03A-R4** Classification/Search sem Provider — **Resolvida** (CLASS-01 + SEARCH-01)  
- **AER-GA03A-R5** ECS pastas incompletas — Aceita  
- **AER-GA03A-R6** `.vercel` stale — **Aberta** (rebuild/redeploy)  
- **AER-GA03A-R7** INF in-memory — Aceita (alias temático de AER-INF-STRUCT-01 / AER-GA03-M6)  

##### AER-GA03A-R4 — Resolvida
- **Título:** Classification/Search sem Provider Port  
- **Descrição:** Document Classification Runtime e Document Search Runtime não tinham Provider Port oficial; risco de busca/classificação fora da Foundation.  
- **Origem:** GATE-ARCH-03A  
- **Categoria:** Architecture  
- **Prioridade:** Média  
- **Criticidade:** Não bloqueante  
- **Status:** **Resolvida** em **CLASS-01** (Classification Provider) + **SEARCH-01** (Search Provider / SearchProviderPort / DefaultSearchProviderAdapter / Storage-backed)  
- **Evidência:** `src/lib/enterprise/search-provider/`, `enterprise:search-provider:test`, wiring em Enterprise Runtime + Document Search Runtime  

---

### 6.6 OCR-GATE-01 / CLASS-GATE-01 / STORAGE-GATE-01 / SEARCH-GATE-01

#### OCR-GATE-01 (GO) — AER-OCRG-B1…B4
Riscos **Baixa**, **Não bloqueantes**, status **Aceita**. Sem risco Alta/bloqueante.

#### CLASS-GATE-01 (GO) — AER-CLSG-B1…B4
Riscos **Baixa**, **Não bloqueantes**, status **Aceita**. “Nenhum risco Alta ou bloqueante.”

#### SEARCH-GATE-01 (GO) — AER-SRCHG-B1…B4
Riscos **Baixa**, **Não bloqueantes**, status **Aceita**. Sem risco Alta/bloqueante.  
Busca documental Enterprise exclusivamente via `SearchProviderPort` → Adapter → `StorageProviderPort`.  
`coordinateSearch` no Capture permanece coordenação estrutural (`realSearchExecuted=false`); execução real via `DocumentSearchRuntimePort.search()` / `SearchProviderPort.search()`.

##### AER-SRCHG-B1
- **Título:** Logging/telemetria Search estrutural  
- **Descrição:** Logs/telemetria retornam no resultado canônico do Adapter; sem acoplamento à Observability Foundation.  
- **Origem:** SEARCH-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** OBS-SEARCH-01 (opcional)

##### AER-SRCHG-B2
- **Título:** Catálogo Search in-memory  
- **Descrição:** `DefaultSearchProviderAdapter` indexa/consulta via `InMemorySearchCatalog`; escala a milhões de documentos exige adapter indexado futuro sem quebrar o Port.  
- **Origem:** SEARCH-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Adapter indexado futuro  
- **Impacto alto volume (20 mil boletins/mês):** Não bloqueia certificação do Port; para busca produtiva em alto volume, planejar índice persistente/distribuído atrás do mesmo `SearchProviderPort`.

##### AER-SRCHG-B3
- **Título:** Escape hatch `getSearchProviderPort()` no Enterprise Runtime  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getAIProviderPort` / AER-GA03A-R1). Cadeia oficial permanece Runtime → Capture → Document Search Runtime → Port.  
- **Origem:** SEARCH-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

##### AER-SRCHG-B4
- **Título:** MQ/Workers/Scheduler não acoplados ao Search  
- **Descrição:** Fundação INF existe; Search não consome filas/workers/cron.  
- **Origem:** SEARCH-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Bridge Search→INF (opcional)

#### TISS-01 — AER-TISS-B1…B3
Riscos **Baixa**, **Não bloqueantes**, status **Aceita**. Infraestrutura Enterprise TISS sem XML/dispatch reais.  
Cadeia oficial: Enterprise Runtime → TISS Runtime → `TISSProviderPort` → Adapter. Sem lógica de operadora/contrato/tenant.

##### AER-TISS-B1
- **Título:** Logging/telemetria TISS estrutural  
- **Descrição:** Logs/telemetria retornam no resultado canônico do Adapter; sem acoplamento à Observability Foundation.  
- **Origem:** TISS-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** OBS-TISS-01 (opcional)

##### AER-TISS-B2
- **Título:** Escape hatch `getTISSProviderPort()` no Enterprise Runtime  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getAIProviderPort` / AER-GA03A-R1). Cadeia oficial permanece Runtime → TISS Runtime → Port.  
- **Origem:** TISS-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

##### AER-TISS-B3
- **Título:** TISS-01 sem XML/dispatch reais  
- **Descrição:** `realTissExecuted=false` por design nesta sprint; sem XML, envio a operadoras, validações clínicas ou regras ANS.  
- **Origem:** TISS-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Sprints funcionais pós TISS-GATE-01

#### TISS-02 — AER-TISS-B4…B5
Riscos **Baixa**, **Não bloqueantes**, status **Aceita**. Canonical Catalog como única fonte oficial de conhecimento TISS.  
Cadeia oficial: Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → Adapter → `InMemoryTISSCatalog`. Sem lógica de operadora/versão.

##### AER-TISS-B4
- **Título:** Escape hatch `getTISSCatalogPort()` no Enterprise Runtime  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getTISSProviderPort` / AER-TISS-B2). Cadeia oficial permanece Runtime → TISS Runtime → TISSCatalogPort.  
- **Origem:** TISS-02 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

##### AER-TISS-B5
- **Título:** Seed mínimo in-memory do Canonical Catalog  
- **Descrição:** TISS-02 carrega apenas exemplos mínimos (versões/guias/perfis/domínios/categorias/procedimentos/metadados). Catálogo completo será carregado por configuração futura — sem XML/operadoras.  
- **Origem:** TISS-02 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Carga por configuração / TISS-03+

#### STORAGE-GATE-01 (GO COM RESSALVAS)

##### AER-STG-A1
- **Título:** Bypass da cadeia Runtime de Storage  
- **Descrição:** Persistência real usa `createBoundStorageProviderPort` e não percorre Enterprise → Capture → OCR → Classification → Storage Manager Runtime. I/O permanece exclusivo via `StorageProviderPort` (sem `storage.from` fora do Adapter).  
- **Origem:** STORAGE-GATE-01  
- **Categoria:** Architecture  
- **Prioridade:** Alta  
- **Impacto:** Produção (certificação plena Storage) / Manutenção  
- **Criticidade:** Não bloqueante para NO-GO; impede GO puro de Storage  
- **Justificativa técnica:** Port exclusivo e seguro; Gates PASS; Search Runtime estrutural não depende do bridge.  
- **Sprint prevista:** **STORAGE-CONV-01**  
- **Status:** Planejada  
- **Autorização de continuidade:** SEARCH-01 pode iniciar **com risco aceito**.

##### AER-STG-M1
- **Título:** Coexistência do Port legado EPC-02 `StoragePort`  
- **Origem:** STORAGE-GATE-01 · **Prioridade:** Média · **Status:** Planejada · **Sprint:** STORAGE-DEBT-01  

##### AER-STG-B1
- **Título:** Logging/telemetria Storage sem Observability Foundation  
- **Origem:** STORAGE-GATE-01 · **Prioridade:** Baixa · **Status:** Planejada · **Sprint:** OBS-STORAGE-01  

##### AER-STG-B2
- **Título:** Default Runtime Storage in-memory até bind do client  
- **Origem:** STORAGE-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Bind operacional  

---

## 7. Itens explicitamente NÃO registrados como ressalva nova

Conforme regra “não criar novas ressalvas / não inventar”:

- seções “fora de escopo” de DIP/INF que são fronteira normal de sprint (sem tratamento de ressalva/debt);
- status de lifecycle `"deferred"` em models;
- ARCH-02 (GO) — sem lista própria de ressalvas; residual `.vercel` registrado sob GATE-ARCH-03A;
- DIP-03/04/05 “sem capacidade real” na fundação estrutural — tratados como estado certificado da fundação e subsequentemente mitigados por OCR-01/CLASS-01/STORAGE-01 quando aplicável (não reabertos como dívida nova).

---

## 8. Certificação ARCH-DEBT-01

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | O registro oficial foi criado? | **SIM** — `docs/enterprise/ARCHITECTURAL_EXCEPTION_REGISTER.md` |
| 2 | Todas as ressalvas conhecidas foram consolidadas? | **SIM** — Foundation, Infrastructure, DIP, OCR/CLASS/STORAGE, ARCH-01/02 e Gates |
| 3 | Existem ressalvas sem origem identificada? | **NÃO** |
| 4 | Existe alguma ressalva bloqueante? | **Históricas sim (GATE-ARCH-02 B1–B4)**; **ativas que impeçam roadmap funcional: NÃO**. B2/B4 permanecem Aceitas como dívida de trunk/staging |
| 5 | Existe alguma ressalva que impeça a continuidade do roadmap? | **NÃO** — STORAGE-GATE-01 autorizou SEARCH-01 com risco aceito |
| 6 | Existe alguma ressalva crítica para produção? | **SIM, não bloqueante de roadmap:** AER-STG-A1 (certificação plena Storage condicionada à convergência Runtime); INF estrutural para alto volume; `.vercel` stale |
| 7 | Existe alguma ressalva relacionada ao ECS-01? | **SIM** — DEV/DEV-ORG, pastas `factory/`, Application decision, incompleude de pastas |
| 8 | Existe alguma relacionada ao desacoplamento? | **SIM** — dual-path Captura/TISS, bridge best-effort, Ports órfãos, dívida consciente produto↔Ports |
| 9 | Existe alguma relacionada aos Providers? | **SIM** — Storage/OCR/Classification/AI Providers e escape hatch AI |
| 10 | Existe alguma relacionada aos Runtimes? | **SIM** — bypass Storage Manager Runtime, composição Runtime, OCR Runtime (resolvida) |
| 11 | Existe alguma relacionada ao Orchestrator? | **SIM** — AER-GA03-B13 (nuance documental); Orchestrator permanece coordenação |
| 12 | Existe alguma relacionada ao Enterprise Runtime? | **SIM** — composition gaps, escape hatch, default Storage in-memory, dual-path |
| 13 | Todas possuem Sprint prevista para tratamento? | **Quase todas** — itens Aceitos apontam sprint futura/nomeada; AER-19A-R01 é aceite sem sprint (framework); AER-GA03A-R6 aponta rebuild/redeploy |
| 14 | Existe alguma ressalva esquecida em relatórios antigos? | **NÃO identificada** após varredura dos relatórios/certificações Enterprise e Gates listados |
| 15 | O roadmap permanece íntegro? | **SIM** |

---

## 9. Parecer final (ARCH-DEBT-01)

# GO COM RESSALVAS

### Declarações oficiais

1. A fase de **governança arquitetural atual** (consolidação do Registro Oficial de Ressalvas) está **encerrada** com a publicação deste documento.  
2. **Não existe ressalva bloqueante que impeça a continuidade do roadmap funcional.**  
3. O roadmap permanece **liberado** para continuidade.  
4. Fica autorizado o início da próxima Sprint: **SEARCH-01 — Enterprise Search Provider**, sob o risco aceito de **AER-STG-A1** (STORAGE-GATE-01).  
5. A certificação plena de produção do Storage permanece condicionada a **STORAGE-CONV-01**.

### Atualização SEARCH-GATE-01 (02/08/2026)

1. **SEARCH-01 encerrada oficialmente** — Enterprise Search certificado (**GO**).  
2. Novas ressalvas Baixa: **AER-SRCHG-B1…B4** (Aceitas, não bloqueantes).  
3. **AER-GA03A-R4** permanece **Resolvida** (CLASS-01 + SEARCH-01).  
4. Roadmap liberado para **TISS-01 — Enterprise TISS Provider**.  
5. Nenhuma ressalva Alta/bloqueante nova no Search; AER-STG-A1 permanece Planejada (Storage).

### Atualização TISS-01 (02/08/2026)

1. **TISS-01 implementado** — Enterprise TISS Provider + TISS Runtime (estrutural; `realTissExecuted=false`).  
2. Cadeia oficial: Enterprise Runtime → TISS Runtime → `TISSProviderPort` → `DefaultTISSProviderAdapter`.  
3. Novas ressalvas Baixa: **AER-TISS-B1…B3** (Aceitas, não bloqueantes).  
4. **AER-GA03-A4** permanece **Aceita** (dual-path produto vs `enterprise/tiss-*` — convergência em TISS-CONV-01 pós Gate).  
5. Roadmap liberado para **TISS-GATE-01** (certificação de desacoplamento). **Não iniciar funcionalidades TISS reais antes do Gate.**

### Atualização TISS-02 (02/08/2026)

1. **TISS-02 implementado** — Enterprise TISS Canonical Catalog (`TISSCatalogPort` + `InMemoryTISSCatalog`).  
2. Cadeia oficial: Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `DefaultTISSCatalogAdapter` → `InMemoryTISSCatalog`.  
3. Novas ressalvas Baixa: **AER-TISS-B4…B5** (Aceitas, não bloqueantes).  
4. Sem lógica específica de operadora/versão; sem catálogo paralelo; sem bypass do Port.  
5. Roadmap liberado para **TISS-CATALOG-GATE-01**. **Não iniciar XML TISS / Rule Packs (TISS-03) antes do Gate.**

---

## 10. Controle de mudanças do registro

| Data | Sprint | Alteração |
|------|--------|-----------|
| 02/08/2026 | ARCH-DEBT-01 | Criação do registro oficial e consolidação inicial |
| 02/08/2026 | SEARCH-GATE-01 | Certificação Search (GO); AER-SRCHG-B1…B4; liberação TISS-01 |
| 02/08/2026 | TISS-01 | Enterprise TISS Provider/Runtime; AER-TISS-B1…B3; liberação TISS-GATE-01 |
| 02/08/2026 | TISS-02 | Enterprise TISS Canonical Catalog; AER-TISS-B4…B5; liberação TISS-CATALOG-GATE-01 |
