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
| OCR / Classification / Storage / Search / TISS | OCR-01 (código + OCR-GATE-01), CLASS-01, STORAGE-01, SEARCH-01, TISS-01, TISS-02, TISS-03, TISS-RULE-GATE-01, TISS-03A, TISS-RULEPACK-GATE-01, TISS-CONV-01, TISS-04, TISS-XML-GATE-01, XML-HOTFIX-01, TISS-XML-GATE-01A, TISS-05, TISS-XMLGEN-GATE-01, TISS-06, TISS-06A, TISS-07, TISS-SCHEMA-GATE-01, TISS-08, TISS-VALIDATION-GATE-01 |
| Integração Runtime | ARCH-01, ARCH-02 |
| Gates / Auditorias | GATE-ARCH-02, GATE-ARCH-03, GATE-ARCH-03A, OCR-GATE-01, CLASS-GATE-01, STORAGE-GATE-01, SEARCH-GATE-01, TISS-CATALOG-GATE-01, TISS-RULE-GATE-01, TISS-RULEPACK-GATE-01, TISS-CONV-01, TISS-XML-GATE-01, TISS-XML-GATE-01A, TISS-XMLGEN-GATE-01, TISS-06A, TISS-SCHEMA-GATE-01, TISS-VALIDATION-GATE-01 |

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
| TISS-CATALOG-GATE-01 | (transcript da sessão de auditoria) | GO COM RESSALVAS |
| TISS-RULE-GATE-01 | (transcript da sessão de auditoria) | GO COM RESSALVAS |
| TISS-RULEPACK-GATE-01 | (transcript da sessão de auditoria) | GO COM RESSALVAS |
| TISS-XML-GATE-01 | (transcript da sessão de auditoria) | **NO-GO** (histórico; supersedido por TISS-XML-GATE-01A) |
| TISS-XML-GATE-01A | `docs/enterprise/TISS-XML-GATE-01A_XML_RUNTIME_RECERTIFICATION.md` | **GO COM RESSALVAS** |
| TISS-XMLGEN-GATE-01 | `docs/enterprise/TISS-XMLGEN-GATE-01_CERTIFICATION.md` | **GO COM RESSALVAS** |
| TISS-06A | `docs/enterprise/TISS-06A_XML_SERIALIZER_GATE_CERTIFICATION.md` | **GO COM RESSALVAS** |
| TISS-SCHEMA-GATE-01 | `docs/enterprise/TISS-SCHEMA-GATE-01_CERTIFICATION.md` | **GO COM RESSALVAS** |
| TISS-VALIDATION-GATE-01 | `docs/enterprise/TISS-VALIDATION-GATE-01_CERTIFICATION.md` | **GO COM RESSALVAS** |

---

## 4. Dashboard consolidado

| Métrica | Quantidade |
|---------|------------|
| **Total de ressalvas registradas** | **86** |
| Prioridade **Alta** | **14** |
| Prioridade **Média** | **20** |
| Prioridade **Baixa** | **52** |
| Criticidade **Bloqueante** (histórico GATE-ARCH-02 + TISS-XML-GATE-01) | **5** |
| Criticidade **Não bloqueante** | **81** |
| Status **Resolvida** | **11** |
| Status **Planejada** | **3** |
| Status **Aceita** | **71** |
| Status **Aberta** | **1** |
| Pendentes (Aberta + Aceita + Planejada) | **75** |

### Bloqueantes — estado atual

| ID | Título | Status atual | Impede roadmap agora? |
|----|--------|--------------|-----------------------|
| AER-GA02-B1 | 0 consumidores Enterprise / ilha estrutural | **Resolvida** (ARCH-01) | Não |
| AER-GA02-B2 | EPC-24 + INF fora de `main` | **Aceita** | Não bloqueia SEARCH-01 no branch Enterprise; permanece dívida de governança de trunk |
| AER-GA02-B3 | Application 0/43 | **Resolvida** (ARCH-01 / decisão ECS-01) | Não |
| AER-GA02-B4 | Staging Foundation pendente | **Aceita** | Não bloqueia SEARCH-01 (Gates posteriores não reemitiram NO-GO) |
| AER-XMLG-T1 | `tsc --noEmit` FAIL no XML Runtime Adapter (3× TS2352) | **Resolvida** (XML-HOTFIX-01) | Não — reconfirmada em TISS-XML-GATE-01A; TISS-05 liberado |

**Arquitetura XML Runtime permanece íntegra** (cadeia oficial sem Provider/Adapter paralelo; sem bypass Enterprise).  
**AER-XMLG-T1 Resolvida** em XML-HOTFIX-01; **reconfirmada RESOLVIDA** em TISS-XML-GATE-01A.  
**TISS-XML-GATE-01A** reemite certificação oficial: **GO COM RESSALVAS** (ressalvas Baixa **AER-XMLRT-B1…B3**).  
**AER-GA03-A4** / **AER-TISSCG-A1** **Resolvidas** (dual-path de conhecimento TISS/TUSS eliminado).  
**AER-RPE-B2** / **AER-TISSCG-B1** / **AER-XMLG-T1** permanecem Resolvidas.  
**AER-RPEG-M1**, **AER-RPEG-B1…B2**, **AER-RPKG-B1…B2**, **AER-XMLRT-B1…B3**, **AER-XMLGEN-B1…B2**, **AER-XMLSER-B1…B2**, **AER-XMLSCH-B1…B2**, **AER-XMLVAL-B1…B2** permanecem Aceitas (não bloqueantes / baixa prioridade).  
**AER-TISSCV-B1…B2** permanecem Aceitas.  
**AER-GA03-M8** permanece Aceita (seeds Unimed/Bradesco de Contract Intelligence).  
SEARCH-GATE-01 / STORAGE-GATE-01 permanecem com ressalvas não bloqueantes (incl. **AER-STG-A1**).  
**TISS-XMLGEN-GATE-01** reconfirma certificação do XML Generation Runtime: **GO COM RESSALVAS** (sem novas ressalvas; **AER-XMLGEN-B1…B2** / **AER-XMLRT-B1…B3** reconfirmadas Aceitas).  
**TISS-06** adiciona Enterprise XML Serializer Runtime com ressalvas Baixa **AER-XMLSER-B1…B2**.  
**TISS-06A** reconfirma certificação do XML Serializer Runtime: **GO COM RESSALVAS** (sem novas ressalvas; **AER-XMLSER-B1…B2** / **AER-XMLGEN-B1…B2** / **AER-XMLRT-B1…B3** reconfirmadas Aceitas).  
**TISS-07** adiciona Enterprise XML Schema Runtime com ressalvas Baixa **AER-XMLSCH-B1…B2**.  
**TISS-SCHEMA-GATE-01** reconfirma certificação do XML Schema Runtime: **GO COM RESSALVAS** (sem novas ressalvas; **AER-XMLSCH-B1…B2** / **AER-XMLSER-B1…B2** / **AER-XMLGEN-B1…B2** / **AER-XMLRT-B1…B3** reconfirmadas Aceitas).  
**TISS-08** adiciona Enterprise XML Validation Runtime com ressalvas Baixa **AER-XMLVAL-B1…B2**.  
**TISS-VALIDATION-GATE-01** reconfirma certificação do XML Validation Runtime: **GO COM RESSALVAS** (sem novas ressalvas; **AER-XMLVAL-B1…B2** / **AER-XMLSCH-B1…B2** / **AER-XMLSER-B1…B2** / **AER-XMLGEN-B1…B2** / **AER-XMLRT-B1…B3** reconfirmadas Aceitas).

### XML Enterprise Dashboard (indicadores permanentes)

| Indicador | Valor | Critério |
|-----------|------:|----------|
| **XML Coverage** | **50%** | 1/2 fluxos XML na Enterprise Foundation (path estrutural+canônico Runtime ✓; MVP produto `xml-export-service` ✗) |
| **XML Runtime Coverage** | **100%** | Infraestrutura oficial TISS-04 completa (Port/Factory/Registry/Provider/Store/Models/Adapters/wiring) |
| **XML Generation Runtime Coverage** | **100%** | Infraestrutura oficial TISS-05 completa (Port/Factory/Registry/Provider/Store/Models/Adapters/wiring) |
| **XML Serializer Runtime Coverage** | **100%** | Infraestrutura oficial TISS-06 completa (Port/Factory/Registry/Provider/Store/Models/Adapters/wiring) |
| **XML Schema Runtime Coverage** | **100%** | Infraestrutura oficial TISS-07 completa (Port/Factory/Registry/Provider/Store/Models/Adapters/wiring) |
| **XML Validation Runtime Coverage** | **100%** | Infraestrutura oficial TISS-08 completa (Port/Factory/Registry/Provider/Store/Models/Adapters/wiring) |
| **XML Legacy Components** | **1** | `src/lib/services/tiss/xml-export-service.ts` (+ superfície produto/API/UI) |
| **XML Enterprise Compliance** | **95%** | ECS-01 completo nos módulos XML; desvios não bloqueantes **AER-XMLRT-B1…B3** / **AER-XMLGEN-B1…B2** / **AER-XMLSER-B1…B2** / **AER-XMLSCH-B1…B2** / **AER-XMLVAL-B1…B2** |

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
| AER-GA03-A4 | TISS produto vs `enterprise/tiss-*` | GATE-ARCH-03 | Architecture | Alta | Não bloqueante | **Resolvida** | TISS-CONV-01 |
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
| AER-TISSCG-A1 | Conhecimento TISS/TUSS no produto Capture paralelo ao Catalog | TISS-CATALOG-GATE-01 | Architecture | Alta | Não bloqueante | **Resolvida** | TISS-CONV-01 |
| AER-TISSCV-B1 | Patterns OCR de templates permanecem no Capture (adapter OCR) | TISS-CONV-01 | Maintainability | Baixa | Não bloqueante | Aceita | Aceitável — não é conhecimento TISS |
| AER-TISSCV-B2 | Tabela `tuss_procedures` permanece como CRUD operacional tenant | TISS-CONV-01 | Maintainability | Baixa | Não bloqueante | Aceita | Membership canônico só via Catalog |
| AER-TISSCG-M1 | Ports EPC-20/21/22 paralelos (stores vazios, não wired) | TISS-CATALOG-GATE-01 | Architecture | Média | Não bloqueante | Aceita | Consolidação / deprecação pós Rule Packs |
| AER-TISSCG-B1 | `getTISSCatalogPort?` opcional no TISS Runtime deps | TISS-CATALOG-GATE-01 | Architecture | Baixa | Não bloqueante | **Resolvida** | TISS-03 |
| AER-TISSCG-B2 | Barrel exporta Store/seed + `getStore()` no Adapter | TISS-CATALOG-GATE-01 | Maintainability | Baixa | Não bloqueante | Aceita | Restringir superfície pública |
| AER-RPE-B1 | Escape hatch `getRulePackEnginePort()` | TISS-03 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-RPE-B2 | Seed mínimo estrutural de Rule Packs | TISS-03 | Scalability | Baixa | Não bloqueante | **Resolvida** | TISS-03A |
| AER-RPEG-M1 | Fundação EPC-09/23/06A paralela (não wired) | TISS-RULE-GATE-01 | Architecture | Média | Não bloqueante | Aceita | Consolidação / wiring pós Base Packs |
| AER-RPEG-B1 | Barrel exporta Store/seed + `getStore()` no Adapter | TISS-RULE-GATE-01 | Maintainability | Baixa | Não bloqueante | Aceita | Restringir superfície pública |
| AER-RPEG-B2 | Best-effort `executePack` no TISS Runtime | TISS-RULE-GATE-01 | Architecture | Baixa | Não bloqueante | Aceita | Endurecer falha quando packs forem críticos |
| AER-RPKG-B1 | Runtime `process()` executa só o pack default (foundation) | TISS-RULEPACK-GATE-01 | Architecture | Baixa | Não bloqueante | Aceita | Multi-pack execution / seleção explícita |
| AER-RPKG-B2 | Lacuna de cobertura: References + Catalog Metadata | TISS-RULEPACK-GATE-01 | Maintainability | Baixa | Não bloqueante | Aceita | Packs de existência para reference/metadata |
| AER-XMLRT-B1 | Escape hatch `getXMLRuntimePort()` | TISS-04 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-XMLRT-B2 | Produto `xml-export-service` permanece fora do XML Runtime | TISS-04 | Architecture | Baixa | Não bloqueante | Aceita | Convergência futura / pós TISS-05 |
| AER-XMLRT-B3 | Barrel exporta Store + `getStore()` no Adapter | TISS-04 | Maintainability | Baixa | Não bloqueante | Aceita | Restringir superfície pública |
| AER-XMLG-T1 | `tsc --noEmit` FAIL — 3× TS2352 no DefaultXMLRuntimeAdapter | TISS-XML-GATE-01 | Infrastructure | Alta | **Bloqueante** | **Resolvida** | XML-HOTFIX-01 |
| AER-XMLGEN-B1 | Escape hatch `getXMLGenerationRuntimePort()` | TISS-05 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-XMLGEN-B2 | Barrel exporta Store + `getStore()` no Adapter (Generation) | TISS-05 | Maintainability | Baixa | Não bloqueante | Aceita | Restringir superfície pública |
| AER-XMLSER-B1 | Escape hatch `getXMLSerializerRuntimePort()` | TISS-06 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-XMLSER-B2 | Barrel exporta Store + `getStore()` no Adapter (Serializer) | TISS-06 | Maintainability | Baixa | Não bloqueante | Aceita | Restringir superfície pública |
| AER-XMLSCH-B1 | Escape hatch `getXMLSchemaRuntimePort()` | TISS-07 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-XMLSCH-B2 | Barrel exporta Store + `getStore()` no Adapter (Schema) | TISS-07 | Maintainability | Baixa | Não bloqueante | Aceita | Restringir superfície pública |
| AER-XMLVAL-B1 | Escape hatch `getXMLValidationRuntimePort()` | TISS-08 | Architecture | Baixa | Não bloqueante | Aceita | API interna / proibir produto |
| AER-XMLVAL-B2 | Barrel exporta Store + `getStore()` no Adapter (Validation) | TISS-08 | Maintainability | Baixa | Não bloqueante | Aceita | Restringir superfície pública |

\*Em EPC-CERT-01/02 o Build/TS global foi Estado Global pré-existente **fora do escopo** (não bloqueava certificação Core/Org). Eliminado em EPC-19A.

**Notas de contagem:**

- Prioridades de GATE-ARCH-02 B1–B4 não vieram rotuladas Alta/Média/Baixa na origem; foram mapeadas por severidade do blocker (B1–B3 → Alta; B4 → Média), preservando criticidade **Bloqueante**.
- AER-GA03A-R4 foi **Resolvida** em SEARCH-01 (Classification Provider em CLASS-01; Search Provider em SEARCH-01).
- Resolvidas confirmadas: AER-CORE-GLOBAL-01, AER-GA02-B1, AER-GA02-B3, AER-GA03-A2, AER-GA03A-R2, AER-GA03A-R4, AER-TISSCG-B1, AER-RPE-B2, AER-GA03-A4, AER-TISSCG-A1, AER-XMLG-T1.

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
- **AER-GA03-A4** TISS dual-path — **Resolvida** (TISS-CONV-01)  

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

#### TISS-CATALOG-GATE-01 (GO COM RESSALVAS) — AER-TISSCG-A1 / M1 / B1 / B2
Riscos **Alta/Média/Baixa**, **Não bloqueantes**, status **Aceita**.  
Cadeia Enterprise certificada: Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → Adapter → `InMemoryTISSCatalog` (conhecimento puro; sem regras/XML/validações).  
Catálogo **é** a única fonte oficial na cadeia Enterprise; conhecimento TISS/TUSS permanece no produto Capture (dual-path já previsto em **AER-GA03-A4**).

##### AER-TISSCG-A1 — Resolvida
- **Título:** Conhecimento TISS/TUSS no produto Capture paralelo ao Canonical Catalog  
- **Descrição:** Evidências concretas do dual-path: `src/lib/capture/audit/data/tuss-catalog.ts` (`TUSS_CATALOG` / `TUSS_REQUIRES_AUTH`), guide types/templates do parser, strings `TISS 4.01.00` em contract enricher/rules, e `src/lib/services/tiss/tuss-service.ts` → `tuss_procedures`. Nenhum desses caminhos consome `TISSCatalogPort`.  
- **Origem:** TISS-CATALOG-GATE-01  
- **Categoria:** Architecture  
- **Prioridade:** Alta  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** Já coberta em espírito por **AER-GA03-A4**; Gate materializa inventário. Não impede Rule Packs Enterprise (TISS-03) sobre o Catalog.  
- **Sprint prevista / correção:** **TISS-CONV-01**  
- **Status:** **Resolvida** (TISS-CONV-01)  
- **Evidência:** Gateway `tiss-knowledge-gateway.ts`; seed TUSS no Catalog; pack `base-procedure-authorization-pack`; facade Capture sem Sets hardcoded; membership via Ports.

##### AER-TISSCG-M1
- **Título:** Ports EPC-20/21/22 paralelos (vocabulary/mapping/profile)  
- **Descrição:** Módulos `tiss-vocabulary`, `tiss-mapping`, `tiss-profile` mantêm Port/Factory/Adapter/Store próprios com catálogos estruturais (ex.: 16 conceitos EPC-20; famílias `tiss-4.x`/`tiss-5.x` em EPC-22). Stores vazios e **não wired** no Enterprise Runtime; sobreposição de responsabilidade com o Canonical Catalog.  
- **Origem:** TISS-CATALOG-GATE-01 · **Prioridade:** Média · **Status:** Aceita · **Sprint:** Consolidação / deprecação pós Rule Packs

##### AER-TISSCG-B1
- **Título:** `getTISSCatalogPort?` opcional em `TISSRuntimeEnterpriseDeps`  
- **Descrição:** Default Runtime injeta o Port; o tipo marca opcional e `process()` continua sem catalog se ausente (`processedViaTISSCatalogPort=false`).  
- **Origem:** TISS-CATALOG-GATE-01 · **Prioridade:** Baixa · **Status:** **Resolvida** (TISS-03) · **Sprint de correção:** TISS-03  
- **Evidência:** `getTISSCatalogPort()` tornou-se obrigatório em `TISSRuntimeEnterpriseDeps`; Default adapter falha na construção se ausente; `process()` consome sempre via Port.

##### AER-TISSCG-B2
- **Título:** Barrel exporta Store/seed + `getStore()` no Adapter  
- **Descrição:** `tiss-catalog/index.ts` reexporta `InMemoryTISSCatalog` e seeds; adapters expõem `getStore()` fora do Port — superfície de uso indevido (sem consumidor produto atual).  
- **Origem:** TISS-CATALOG-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Restringir superfície pública

#### TISS-03 — AER-RPE-B1…B2
Riscos **Baixa**, **Não bloqueantes**, status **Aceita**.  
Cadeia: Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → Adapter → Rule Pack Store.

##### AER-RPE-B1
- **Título:** Escape hatch `getRulePackEnginePort()`  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getTISSCatalogPort` / AER-TISS-B4). Cadeia oficial permanece Runtime → TISS Runtime → RulePackEnginePort.  
- **Origem:** TISS-03 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

##### AER-RPE-B2
- **Título:** Seed mínimo estrutural de Rule Packs  
- **Descrição:** TISS-03 carregava apenas pack estrutural de exemplo. **TISS-03A** introduziu 7 Enterprise Base Rule Packs canônicos (+ foundation) com metadata, version, priority, tags, categories, conditions, actions, expectedResult e compatibilidade multi-versão — todos genéricos, via `RulePackEnginePort` + `TISSCatalogPort`.  
- **Origem:** TISS-03 · **Prioridade:** Baixa · **Status:** **Resolvida** · **Sprint de correção:** TISS-03A — Enterprise Base Rule Packs

#### TISS-RULE-GATE-01 (GO COM RESSALVAS) — AER-RPEG-M1 / B1 / B2
Riscos **Média/Baixa**, **Não bloqueantes**, status **Aceita**.  
Cadeia Enterprise certificada: Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → Adapter → Rule Pack Store.  
`RulePackEnginePort` é o **único mecanismo oficial de interpretação** na cadeia Enterprise wired.  
Engine genérico: interpreta packs estruturais; conhecimento TISS exclusivamente via `TISSCatalogPort`; sem XML/operadora/contrato/tenant hardcoded.

##### AER-RPEG-M1
- **Título:** Fundação EPC-09 / EPC-23 / EPC-06A paralela (não wired no Runtime)  
- **Descrição:** Coexistem módulos `rule-pack` (`RulePackPort` — gestão de packs), `tiss-rule-runtime` (`TISSRuleRuntimePort` — orquestração estrutural sem interpretação) e `rule` (`RulePort` — Core Rule Engine). Nenhum está wired no Enterprise Runtime / TISS Runtime para interpretação TISS. Não são `RulePackEngine` paralelo; sobreposição de responsabilidade futura com o Engine.  
- **Origem:** TISS-RULE-GATE-01  
- **Categoria:** Architecture  
- **Prioridade:** Média  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** Análogo a **AER-TISSCG-M1**. Teste oficial confirma ausência de `RulePackEnginePort` / `DefaultRulePackEngineAdapter` duplicados. Não impede Base Rule Packs (TISS-03A).  
- **Sprint prevista:** Consolidação / wiring / deprecação pós Base Packs  
- **Status:** Aceita

##### AER-RPEG-B1
- **Título:** Barrel exporta Store/seed + `getStore()` no Adapter  
- **Descrição:** `rule-pack-engine/index.ts` reexporta `InMemoryRulePackEngineStore` e seeds; adapters expõem `getStore()` fora do Port — superfície de uso indevido (sem consumidor produto atual). Espelho de **AER-TISSCG-B2**.  
- **Origem:** TISS-RULE-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Restringir superfície pública

##### AER-RPEG-B2
- **Título:** Best-effort `executePack` no TISS Runtime  
- **Descrição:** `DefaultTISSRuntimeAdapter.process()` envolve `rulePackEnginePort.executePack` em try/catch best-effort — falha do Engine não bloqueia o process estrutural (`processedViaRulePackEnginePort` pode ficar false). Não é bypass do Port; é degradação suave deliberada na fundação.  
- **Origem:** TISS-RULE-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Endurecer falha quando packs forem críticos (pós TISS-03A)

#### TISS-RULEPACK-GATE-01 (GO COM RESSALVAS) — AER-RPKG-B1 / B2
Riscos **Baixa**, **Não bloqueantes**, status **Aceita**.  
Certificação: Enterprise Base Rule Packs utilizam exclusivamente `RulePackEnginePort` + `TISSCatalogPort`; packs 100% genéricos; sem operadora/contrato/tenant; Gates PASS.

##### AER-RPKG-B1
- **Título:** Runtime `process()` executa apenas o pack default (foundation)  
- **Descrição:** `executePack` sem `packId`/`code` resolve o primeiro pack ativo do store (`structural-foundation-pack`). Os 7 Base Rule Packs estão seeded e executáveis via Port com código explícito, mas não são todos disparados automaticamente em `TISSRuntimePort.process()`.  
- **Origem:** TISS-RULEPACK-GATE-01  
- **Categoria:** Architecture  
- **Prioridade:** Baixa  
- **Criticidade:** Não bloqueante  
- **Justificativa técnica:** Fundação deliberada — default estável preservado; Base Packs certificados via Port/`listPacks`/`executePack(code)`. Não é bypass nem pack paralelo.  
- **Sprint prevista:** Multi-pack execution / seleção explícita (pós convergência ou com XML Runtime)  
- **Status:** Aceita

##### AER-RPKG-B2
- **Título:** Lacuna de cobertura do seed: References + Catalog Metadata  
- **Descrição:** Seed mínimo do `TISSCatalog` possui 1 `CanonicalTISSReference` e 1 `CanonicalTISSMetadata` sem Rule Pack de existência dedicado. Demais áreas do seed (versions, guide-types, domains, procedure-*, profiles, vocabulary) possuem cobertura via Base Packs.  
- **Origem:** TISS-RULEPACK-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Packs de existência para reference/metadata (ou expansão do Catalog)

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

### Atualização TISS-CATALOG-GATE-01 (02/08/2026)

1. **TISS-02 certificada com ressalvas** — Canonical Catalog é a única fonte oficial de conhecimento TISS **na cadeia Enterprise**.  
2. Parecer: **GO COM RESSALVAS** (não GO puro: conhecimento TISS/TUSS permanece no produto Capture — **AER-TISSCG-A1** / **AER-GA03-A4**).  
3. Novas ressalvas: **AER-TISSCG-A1** (Alta), **AER-TISSCG-M1** (Média), **AER-TISSCG-B1…B2** (Baixa) — todas Aceitas, não bloqueantes.  
4. Catálogo permanece puro (sem regras/validações/XML); Gates Build/TS/ESLint/Smoke/Enterprise/Capture **PASS**.  
5. Sprint **TISS-02 encerrada oficialmente**. Roadmap liberado para **TISS-03 — Enterprise TISS Rule Packs**. Nenhuma ressalva impede Rule Packs; convergência produto permanece em **TISS-CONV-01**.

### Atualização TISS-03 (03/08/2026)

1. **TISS-03 implementado** — Enterprise Rule Pack Engine (`RulePackEnginePort` + adapters + factory + registry + modelos canônicos).  
2. Cadeia oficial: Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → Adapter → Rule Pack Store.  
3. **Ressalva resolvida:** **AER-TISSCG-B1** (`getTISSCatalogPort` obrigatório no TISS Runtime).  
4. Novas ressalvas Baixa: **AER-RPE-B1…B2** (Aceitas, não bloqueantes).  
5. Sem lógica específica de operadora/contrato/tenant; sem bypass do Port; conhecimento TISS exclusivamente via `TISSCatalogPort`.  
6. Hardcodes/catálogos/bypasses de produto **não** removidos nesta Sprint (permanecem em **TISS-CONV-01** / **AER-TISSCG-A1**).  
7. Roadmap liberado para **TISS-RULE-GATE-01**. **Não iniciar XML TISS / Base Rule Packs (TISS-03A) antes do Gate.**

### Atualização TISS-RULE-GATE-01 (03/08/2026)

1. **TISS-03 certificada com ressalvas** — Rule Pack Engine é o único mecanismo oficial de interpretação **na cadeia Enterprise**.  
2. Parecer: **GO COM RESSALVAS** (não GO puro: dual-path produto Capture **AER-TISSCG-A1** / **AER-GA03-A4**; fundação EPC-09/23/06A paralela **AER-RPEG-M1**).  
3. Novas ressalvas: **AER-RPEG-M1** (Média), **AER-RPEG-B1…B2** (Baixa) — todas Aceitas, não bloqueantes.  
4. Engine permanece genérico (sem regras de negócio / XML / operadora / contrato / tenant); conhecimento via `TISSCatalogPort`; Gates Build/TS/ESLint/Smoke/Enterprise/Capture **PASS**.  
5. Sprint **TISS-03 encerrada oficialmente**. Roadmap liberado para **TISS-03A — Enterprise Base Rule Packs**. Nenhuma ressalva impede Base Rule Packs; convergência produto permanece em **TISS-CONV-01**.

### Atualização TISS-03A (03/08/2026)

1. **TISS-03A implementado** — Enterprise Base Rule Packs canônicos (7 packs base + foundation).  
2. Cadeia oficial: Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → Base Rule Packs → Canonical Rule Execution.  
3. **Ressalva resolvida:** **AER-RPE-B2** (seed mínimo substituído por Base Rule Packs versionados com metadata/priority/tags/categories/expectedResult/multi-versão).  
4. **Novas ressalvas:** nenhuma. Dívida de produto Capture / fundação paralela permanece em **AER-TISSCG-A1** / **AER-GA03-A4** / **AER-RPEG-M1** (fora do escopo desta Sprint).  
5. Packs 100% genéricos; conhecimento exclusivamente via `TISSCatalogPort`; sem operadora/contrato/tenant/XML.  
6. Hardcodes/catálogos/bypasses de produto **não** removidos (permanecem em **TISS-CONV-01**).  
7. Roadmap liberado para **TISS-RULEPACK-GATE-01**. **Não iniciar XML TISS nem regras específicas de operadoras.**

### Atualização TISS-RULEPACK-GATE-01 (03/08/2026)

1. **TISS-03A certificada com ressalvas** — Base Rule Packs são o mecanismo oficial de regras estruturais **na cadeia Enterprise**, via `RulePackEnginePort` + `TISSCatalogPort`.  
2. Parecer: **GO COM RESSALVAS** (não GO puro: dual-path produto Capture **AER-TISSCG-A1** / **AER-GA03-A4**; fundação paralela **AER-RPEG-M1**; execução default de um pack **AER-RPKG-B1**; lacuna References/Metadata **AER-RPKG-B2**).  
3. **Ressalvas resolvidas nesta Gate:** nenhuma (AER-RPE-B2 já Resolvida em TISS-03A).  
4. **Novas ressalvas:** **AER-RPKG-B1…B2** (Baixa, Aceitas, não bloqueantes).  
5. Packs genéricos; sem operadora/contrato/tenant; sem RulePackEngine paralelo; sem bypass de interpretação na cadeia wired; Gates Build/TS/ESLint/Smoke/Enterprise/Capture **PASS**.  
6. Sprint **TISS-03A encerrada oficialmente**.  
7. **Recomendação de roadmap:** próxima Sprint **TISS-CONV-01 — Convergência do Produto** (reduz risco Alta do dual-path antes de XML). **Não iniciar TISS-04 (XML Runtime) nem regras de operadoras antes da convergência.**

### Atualização TISS-CONV-01 (03/08/2026)

1. **TISS-CONV-01 implementado** — Capture consome conhecimento TISS exclusivamente via Enterprise Foundation.  
2. Cadeia oficial do produto: Capture → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → Base Rule Packs.  
3. **Ressalvas resolvidas:** **AER-GA03-A4**, **AER-TISSCG-A1** (dual-path de conhecimento TISS/TUSS eliminado).  
4. **Novas ressalvas Baixa:** **AER-TISSCV-B1** (patterns OCR no parser — adapter, não conhecimento TISS), **AER-TISSCV-B2** (`tuss_procedures` CRUD operacional; membership canônico só via Catalog).  
5. Hardcodes `TUSS_CATALOG` / `TUSS_REQUIRES_AUTH` removidos; seed canônico no Catalog; pack `base-procedure-authorization-pack`; guide types canônicos (`guia-honorario` incluso).  
6. **Não** removeu seeds Unimed/Bradesco de Contract Intelligence (**AER-GA03-M8** permanece Aceita — fora do escopo de conhecimento TISS).  
7. Percentual de convergência TISS conhecimento Capture→Enterprise: **~95%** (residual: OCR patterns + CRUD operacional).  
8. Sprint **TISS-CONV-01 encerrada oficialmente**. Roadmap liberado para **TISS-04 — Enterprise XML Runtime**.  

#### AER-TISSCV-B1
- **Título:** Patterns OCR de templates permanecem no Capture  
- **Descrição:** Regex/labelPatterns/expectedRegion dos templates são adapters OCR→campos, não conhecimento TISS. Tipos de guia canônicos vivem no Catalog (`catalogGuideTypeCode`).  
- **Origem:** TISS-CONV-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Aceitável por desenho

#### AER-TISSCV-B2
- **Título:** Tabela `tuss_procedures` permanece como CRUD operacional  
- **Descrição:** Persistência tenant para specialty/default_value; membership/validação canônica exclusivamente via `TISSCatalogPort` (`listCanonicalTussProcedureCodes` / gateway).  
- **Origem:** TISS-CONV-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Opcional sync Catalog↔DB futura

### Atualização TISS-04 (03/08/2026)

1. **TISS-04 implementado** — Enterprise XML Runtime Foundation (`src/lib/enterprise/xml-runtime/`).  
2. Cadeia oficial: Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → Adapter → Store.  
3. Operações estruturais: `generate()` / `validate()` / `health()` / `cancel()` — **sem geração XML real**.  
4. **Novas ressalvas Baixa:** **AER-XMLRT-B1…B3** (Aceitas, não bloqueantes).  
5. **AER-TISS-B3** permanece Aceita (ainda sem XML/dispatch reais).  
6. Sprint **TISS-04 encerrada oficialmente**. Próxima Sprint recomendada: **TISS-XML-GATE-01**.

#### AER-XMLRT-B1
- **Título:** Escape hatch `getXMLRuntimePort()`  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getRulePackEnginePort` / AER-RPE-B1). Cadeia oficial permanece Runtime → TISS Runtime → XMLRuntimePort.  
- **Origem:** TISS-04 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

#### AER-XMLRT-B2
- **Título:** Produto `xml-export-service` permanece fora do XML Runtime  
- **Descrição:** Export MVP do produto (`src/lib/services/tiss/xml-export-service.ts`) gera XML esquelético (`medflowTissExport`) fora da cadeia Enterprise. Confirmado em TISS-XML-GATE-01: não é Provider/Adapter Enterprise paralelo; isolado no produto (API/UI TISS). Dívida de convergência aceita.  
- **Origem:** TISS-04 / TISS-XML-GATE-01 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Convergência futura / pós TISS-05

#### AER-XMLRT-B3
- **Título:** Barrel exporta Store + `getStore()` no Adapter  
- **Descrição:** `xml-runtime/index.ts` reexporta `InMemoryXMLRuntimeStore`; adapters expõem `getStore()` fora do Port — superfície de uso indevido (sem consumidor produto atual). Espelho de **AER-TISSCG-B2** / **AER-RPEG-B1**.  
- **Origem:** TISS-04 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Restringir superfície pública

### Atualização TISS-XML-GATE-01 (03/08/2026)

1. **Auditoria exclusivamente de leitura** — nenhuma alteração de código/Runtime/Provider/Adapter/testes/comportamento.  
2. **Cadeia oficial confirmada íntegra:** Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → Adapter → Store.  
3. **Sem Provider paralelo / sem Adapter paralelo / sem Runtime ignorado / sem bypass Enterprise** ao `XMLRuntimePort`.  
4. **XML Runtime desacoplado:** apenas modelos canônicos; não conhece operadoras/contratos/tenants/versões específicas/XML TISS/regras ANS.  
5. **Ressalvas resolvidas nesta Gate:** nenhuma.  
6. **Ressalvas confirmadas Aceitas:** **AER-XMLRT-B1…B3** (escape hatch; MVP `xml-export-service` isolado; barrel/`getStore()`).  
7. **Nova ressalva bloqueante:** **AER-XMLG-T1** — `npx tsc --noEmit` FAIL (3× TS2352) em `DefaultXMLRuntimeAdapter.runOperation` (`as T &` sem `unknown`; siblings Catalog/RulePack usam `as unknown as`). Build Vite PASS (não typecheck estrito).  
8. **Gates:** Build PASS · TypeScript **FAIL** · ESLint PASS (0 errors / 7 warnings pré-existentes) · Smoke PASS · Enterprise PASS · Capture PASS.  
9. **Indicadores XML (permanentes):** Coverage **50%** · Runtime Coverage **100%** · Legacy Components **1** · Enterprise Compliance **95%**.  
10. **Parecer:** **NO-GO**.  
11. **Roadmap:** **não liberar TISS-05** até hotfix de **AER-XMLG-T1** + re-certificação do Gate TypeScript.  
12. Sprint **TISS-04 permanece encerrada** (fundação entregue); certificação da infraestrutura **não** está completa enquanto **AER-XMLG-T1** estiver Aberta.

#### AER-XMLG-T1
- **Título:** `tsc --noEmit` FAIL no DefaultXMLRuntimeAdapter (3× TS2352)  
- **Descrição:** Casts `as T & XMLRuntimeOperationEnvelope` nas linhas de erro/cancelamento de `runOperation` falhavam sob `strict`. Corrigido em XML-HOTFIX-01 alinhando ao padrão dos adapters irmãos (`as unknown as T & …`). Sem alteração funcional, arquitetural, de Runtime, Providers ou contratos.  
- **Origem:** TISS-XML-GATE-01  
- **Categoria:** Infrastructure  
- **Prioridade:** Alta  
- **Impacto:** Bloqueava certificação da infraestrutura XML e liberação de TISS-05  
- **Criticidade:** **Bloqueante** (histórico)  
- **Justificativa técnica:** Defeito de tipagem introduzido em TISS-04; correção trivial e local (alinhar cast ao padrão dos siblings). Sem impacto arquitetural de Ports/Adapters.  
- **Sprint de resolução:** XML-HOTFIX-01  
- **Status:** **Resolvida**

### Atualização XML-HOTFIX-01 (03/08/2026)

1. **Hotfix de governança** — exclusivamente tipagem; sem funcionalidade, Runtime, Providers, contratos ou XML TISS.  
2. **Escopo:** `DefaultXMLRuntimeAdapter.runOperation` — 3 casts `as T &` → `as unknown as T &` (padrão Catalog/RulePack).  
3. **AER-XMLG-T1 Resolvida.**  
4. **Gates pós-hotfix:** Build PASS · TypeScript PASS · ESLint PASS · Smoke PASS · Enterprise PASS · Capture PASS.  
5. **Parecer XML-HOTFIX-01:** **GO**.  
6. **Roadmap:** reexecutar **TISS-XML-GATE-01** imediatamente; **não liberar TISS-05** até GO na re-certificação.

### Atualização TISS-XML-GATE-01A (03/08/2026)

1. **Recertificação exclusivamente de leitura** — nenhuma alteração de código/Runtime/Provider/Adapter/Store/Models/testes/comportamento.  
2. **Cadeia oficial reconfirmada íntegra:** Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → Adapter → Store.  
3. **Sem Provider paralelo / sem Adapter paralelo / sem bypass Enterprise** ao `XMLRuntimePort`.  
4. **AER-XMLG-T1 permanece oficialmente RESOLVIDA** (casts `as unknown as` confirmados; `tsc --noEmit` PASS).  
5. **Ressalvas Baixa confirmadas Aceitas (não bloqueantes):** **AER-XMLRT-B1…B3**.  
6. **Nenhuma nova ressalva** / **nenhuma regressão** / **ECS-01 íntegro**.  
7. **Gates:** Build PASS · TypeScript PASS · ESLint PASS · Smoke PASS · Enterprise PASS · Capture PASS.  
8. **Indicadores XML (sem regressão):** Coverage **50%** · Runtime Coverage **100%** · Legacy Components **1** · Enterprise Compliance **95%**.  
9. **Parecer:** **GO COM RESSALVAS**.  
10. **Roadmap:** **TISS-05 — Enterprise XML Generation Runtime oficialmente liberada**.  
11. Documento: `docs/enterprise/TISS-XML-GATE-01A_XML_RUNTIME_RECERTIFICATION.md`.

### Atualização TISS-05 (03/08/2026)

1. **TISS-05 implementado** — Enterprise XML Generation Runtime (`src/lib/enterprise/xml-generation-runtime/`).  
2. Cadeia oficial: Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → `XMLGenerationRuntimePort` → Adapter → Store → Canonical XML Result.  
3. Materialização canônica apenas — **`realXmlGenerated = false`** hardcoded; sem XML TISS/ANS/operadora.  
4. **Novas ressalvas Baixa:** **AER-XMLGEN-B1…B2** (Aceitas, não bloqueantes).  
5. **AER-XMLRT-B1…B3** permanecem Aceitas (sem regressão).  
6. Indicador permanente novo: **XML Generation Runtime Coverage = 100%**.  
7. Sprint **TISS-05 encerrada oficialmente**. Próxima Sprint recomendada: **TISS-XMLGEN-GATE-01**.  
8. Documentos: `TISS-05_ENTERPRISE_XML_GENERATION_RUNTIME.md`, `TISS-05_XML_GENERATION_ARCHITECTURE.md`, `TISS-05_XML_GENERATION_CERTIFICATION.md`.

#### AER-XMLGEN-B1
- **Título:** Escape hatch `getXMLGenerationRuntimePort()`  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getXMLRuntimePort` / AER-XMLRT-B1). Cadeia oficial permanece Runtime → TISS Runtime → XMLRuntimePort → XMLGenerationRuntimePort.  
- **Origem:** TISS-05 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

#### AER-XMLGEN-B2
- **Título:** Barrel exporta Store + `getStore()` no Adapter (Generation)  
- **Descrição:** `xml-generation-runtime/index.ts` reexporta `InMemoryXMLGenerationRuntimeStore`; adapters expõem `getStore()` fora do Port — superfície de uso indevido (sem consumidor produto atual). Espelho de **AER-XMLRT-B3**.  
- **Origem:** TISS-05 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Restringir superfície pública

### Atualização TISS-XMLGEN-GATE-01 (03/08/2026)

1. **Auditoria exclusivamente de leitura** — nenhuma alteração de código/Runtime/Provider/Adapter/Store/Models/testes/comportamento.  
2. **Cadeia oficial reconfirmada íntegra:** Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → `XMLGenerationRuntimePort` → Adapter → Store → Canonical XML Result.  
3. **Sem Provider paralelo / sem Adapter paralelo / sem Runtime paralelo / sem bypass Enterprise** ao `XMLGenerationRuntimePort`.  
4. **XML Generation Runtime permanece estrutural e desacoplado:** `realXmlGenerated = false`; sem XML TISS/ANS; sem operadora/contrato/tenant.  
5. **Ressalvas resolvidas nesta Gate:** nenhuma.  
6. **Ressalvas Baixa confirmadas Aceitas (não bloqueantes):** **AER-XMLGEN-B1…B2**, **AER-XMLRT-B1…B3**.  
7. **Nenhuma nova ressalva** / **nenhuma regressão** / **ECS-01 íntegro**.  
8. **Gates:** Build PASS · TypeScript PASS · ESLint PASS · Smoke PASS · Enterprise PASS · Capture PASS.  
9. **Indicadores XML (sem regressão):** Coverage **50%** · Runtime Coverage **100%** · Generation Runtime Coverage **100%** · Legacy Components **1** · Enterprise Compliance **95%**.  
10. **Parecer:** **GO COM RESSALVAS**.  
11. **Roadmap:** **TISS-06 — Enterprise XML TISS Serializer Runtime oficialmente liberada**.  
12. Documento: `docs/enterprise/TISS-XMLGEN-GATE-01_CERTIFICATION.md`.

### Atualização TISS-06 (03/08/2026)

1. **TISS-06 implementado** — Enterprise XML Serializer Runtime (`src/lib/enterprise/xml-serializer-runtime/`).  
2. Cadeia oficial: Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → `XMLGenerationRuntimePort` → `XMLSerializerRuntimePort` → Adapter → Store → Canonical XML String.  
3. Serialização canônica apenas — **`realTissXmlGenerated = false`** e **`realAnsXmlGenerated = false`** hardcoded; sem XML TISS/ANS/operadora/XSD.  
4. Integração ao XML Generation Runtime via Port (estrutura canônica consumida pelo Serializer; módulos Generation/XML Runtime não importam Serializer).  
5. **Novas ressalvas Baixa:** **AER-XMLSER-B1…B2** (Aceitas, não bloqueantes).  
6. **AER-XMLGEN-B1…B2** / **AER-XMLRT-B1…B3** permanecem Aceitas (sem regressão).  
7. Indicador permanente novo: **XML Serializer Runtime Coverage = 100%**.  
8. Sprint **TISS-06 encerrada oficialmente**. Próxima Sprint recomendada: **TISS-06A — XML Serializer Gate**.  
9. Documentos: `TISS-06_ENTERPRISE_XML_SERIALIZER_RUNTIME.md`, `TISS-06_XML_SERIALIZER_ARCHITECTURE.md`, `TISS-06_XML_SERIALIZER_CERTIFICATION.md`.

#### AER-XMLSER-B1
- **Título:** Escape hatch `getXMLSerializerRuntimePort()`  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getXMLGenerationRuntimePort` / AER-XMLGEN-B1). Cadeia oficial permanece Runtime → TISS Runtime → XMLRuntimePort → XMLGenerationRuntimePort → XMLSerializerRuntimePort.  
- **Origem:** TISS-06 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

#### AER-XMLSER-B2
- **Título:** Barrel exporta Store + `getStore()` no Adapter (Serializer)  
- **Descrição:** `xml-serializer-runtime/index.ts` reexporta `InMemoryXMLSerializerRuntimeStore`; adapters expõem `getStore()` fora do Port — superfície de uso indevido (sem consumidor produto atual). Espelho de **AER-XMLGEN-B2**.  
- **Origem:** TISS-06 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Restringir superfície pública

### Atualização TISS-06A (03/08/2026)

1. **Auditoria exclusivamente de leitura** — nenhuma alteração de código/Runtime/Provider/Adapter/Store/Models/testes/comportamento.  
2. **Cadeia oficial reconfirmada íntegra:** Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → `XMLGenerationRuntimePort` → `XMLSerializerRuntimePort` → Adapter → Store → Canonical XML String.  
3. **Sem Provider paralelo / sem Adapter paralelo / sem Runtime paralelo / sem bypass Enterprise** ao `XMLSerializerRuntimePort`.  
4. **XML Serializer Runtime permanece estrutural e desacoplado:** `realTissXmlGenerated = false` / `realAnsXmlGenerated = false`; sem XML TISS/ANS; sem namespace ANS; sem XSD/SOAP; sem operadora/contrato/tenant.  
5. **Ressalvas resolvidas nesta Gate:** nenhuma.  
6. **Ressalvas Baixa confirmadas Aceitas (não bloqueantes):** **AER-XMLSER-B1…B2**, **AER-XMLGEN-B1…B2**, **AER-XMLRT-B1…B3**.  
7. **Nenhuma nova Architectural Exception encontrada.** / **nenhuma regressão** / **ECS-01 íntegro**.  
8. **Gates:** Build PASS · TypeScript PASS · ESLint PASS · Smoke PASS · Enterprise PASS (63/63) · Capture PASS (198/1 skipped).  
9. **Indicadores XML (sem regressão):** Coverage **50%** · Runtime Coverage **100%** · Generation Runtime Coverage **100%** · Serializer Runtime Coverage **100%** · Legacy Components **1** · Enterprise Compliance **95%**.  
10. **Parecer:** **GO COM RESSALVAS**.  
11. **Roadmap:** **TISS-07 — Enterprise XML Schema Runtime oficialmente liberada**.
12. Documento: `docs/enterprise/TISS-06A_XML_SERIALIZER_GATE_CERTIFICATION.md`.

### Atualização TISS-07 (03/08/2026)

1. **TISS-07 implementado** — Enterprise XML Schema Runtime (`src/lib/enterprise/xml-schema-runtime/`).  
2. Cadeia oficial: Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → `XMLGenerationRuntimePort` → `XMLSerializerRuntimePort` → `XMLSchemaRuntimePort` → Adapter → Store → Canonical XML Schema.  
3. Gerenciamento canônico apenas — **`officialXsdLoaded = false`**, **`xsdValidationPerformed = false`**, **`realTissXmlValidated = false`**, **`realAnsXmlValidated = false`** hardcoded; sem XSD oficial / validação / XML TISS/ANS / namespace / SOAP.  
4. Integração à cadeia XML via composition root (Enterprise/TISS Runtime); módulos XML Runtime / Generation / Serializer não importam Schema Runtime.  
5. **Novas ressalvas Baixa:** **AER-XMLSCH-B1…B2** (Aceitas, não bloqueantes).  
6. **AER-XMLSER-B1…B2** / **AER-XMLGEN-B1…B2** / **AER-XMLRT-B1…B3** permanecem Aceitas (sem regressão).  
7. Indicador permanente novo: **XML Schema Runtime Coverage = 100%**.  
8. Sprint **TISS-07 encerrada oficialmente**. Próxima Sprint obrigatória: **TISS-SCHEMA-GATE-01**.  
9. Documentos: `TISS-07_ENTERPRISE_XML_SCHEMA_RUNTIME.md`, `TISS-07_XML_SCHEMA_ARCHITECTURE.md`, `TISS-07_XML_SCHEMA_CERTIFICATION.md`.

#### AER-XMLSCH-B1
- **Título:** Escape hatch `getXMLSchemaRuntimePort()`  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getXMLSerializerRuntimePort` / AER-XMLSER-B1). Cadeia oficial permanece Runtime → TISS Runtime → XMLRuntimePort → XMLGenerationRuntimePort → XMLSerializerRuntimePort → XMLSchemaRuntimePort.  
- **Origem:** TISS-07 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

#### AER-XMLSCH-B2
- **Título:** Barrel exporta Store + `getStore()` no Adapter (Schema)  
- **Descrição:** `xml-schema-runtime/index.ts` reexporta `InMemoryXMLSchemaRuntimeStore`; adapters expõem `getStore()` fora do Port — superfície de uso indevido (sem consumidor produto atual). Espelho de **AER-XMLSER-B2**.  
- **Origem:** TISS-07 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Restringir superfície pública

### Atualização TISS-SCHEMA-GATE-01 (03/08/2026)

1. **Auditoria exclusivamente de leitura** — nenhuma alteração de código/Runtime/Provider/Adapter/Store/Models/Factory/Registry/testes/comportamento.  
2. **Cadeia oficial reconfirmada íntegra:** Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → `XMLGenerationRuntimePort` → `XMLSerializerRuntimePort` → `XMLSchemaRuntimePort` → Adapter → Store → Canonical XML Schema.  
3. **Sem Provider paralelo / sem Adapter paralelo / sem Runtime paralelo / sem bypass Enterprise** ao `XMLSchemaRuntimePort`.  
4. **XML Schema Runtime permanece estrutural e desacoplado:** `officialXsdLoaded = false` / `xsdValidationPerformed = false` / `realTissXmlValidated = false` / `realAnsXmlValidated = false`; sem XSD oficial; sem namespace oficial; sem validação XSD; sem XML TISS/ANS; sem SOAP; sem Reader/Parser/Validator; sem operadora/contrato/tenant.  
5. **Ressalvas resolvidas nesta Gate:** nenhuma.  
6. **Ressalvas Baixa confirmadas Aceitas (não bloqueantes):** **AER-XMLSCH-B1…B2**, **AER-XMLSER-B1…B2**, **AER-XMLGEN-B1…B2**, **AER-XMLRT-B1…B3**.  
7. **Nenhuma nova Architectural Exception encontrada.** / **nenhuma regressão** / **ECS-01 íntegro**.  
8. **Gates:** Build PASS · TypeScript PASS · ESLint PASS · Smoke PASS · Enterprise PASS (64/64) · Capture PASS (198/1 skipped).  
9. **Indicadores XML (sem regressão):** Coverage **50%** · Runtime Coverage **100%** · Generation Runtime Coverage **100%** · Serializer Runtime Coverage **100%** · Schema Runtime Coverage **100%** · Legacy Components **1** · Enterprise Compliance **95%**.  
10. **Parecer:** **GO COM RESSALVAS**.  
11. **Roadmap:** **TISS-08 — Enterprise XML Validation Runtime oficialmente liberada**.  
12. Documento: `docs/enterprise/TISS-SCHEMA-GATE-01_CERTIFICATION.md`.

### Atualização TISS-08 (03/08/2026)

1. **TISS-08 implementado** — Enterprise XML Validation Runtime (`src/lib/enterprise/xml-validation-runtime/`).  
2. Cadeia oficial: Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → `XMLGenerationRuntimePort` → `XMLSerializerRuntimePort` → `XMLSchemaRuntimePort` → `XMLValidationRuntimePort` → Adapter → Store → Canonical XML Validation Result.  
3. Resposta estrutural apenas — **`validationExecuted = false`**, **`realValidationPerformed = false`**, **`officialXsdLoaded = false`**, **`officialAnsValidation = false`**, **`officialTissValidation = false`**, **`validationRulesLoaded = false`**, **`validationEngineReady = true`** hardcoded; sem XSD oficial / validação real / XML TISS/ANS / namespace / SOAP.  
4. Integração à cadeia XML via composition root (Enterprise/TISS Runtime); módulos XML Runtime / Generation / Serializer / Schema não importam Validation Runtime.  
5. **Novas ressalvas Baixa:** **AER-XMLVAL-B1…B2** (Aceitas, não bloqueantes).  
6. **AER-XMLSCH-B1…B2** / **AER-XMLSER-B1…B2** / **AER-XMLGEN-B1…B2** / **AER-XMLRT-B1…B3** permanecem Aceitas (sem regressão).  
7. Indicador permanente novo: **XML Validation Runtime Coverage = 100%**.  
8. Sprint **TISS-08 encerrada oficialmente**. Próxima Sprint obrigatória: **TISS-VALIDATION-GATE-01**.  
9. Documentos: `TISS-08_ENTERPRISE_XML_VALIDATION_RUNTIME.md`, `TISS-08_XML_VALIDATION_ARCHITECTURE.md`, `TISS-08_XML_VALIDATION_CERTIFICATION.md`.

#### AER-XMLVAL-B1
- **Título:** Escape hatch `getXMLValidationRuntimePort()`  
- **Descrição:** Runtime expõe o Port diretamente (paralelo a `getXMLSchemaRuntimePort` / AER-XMLSCH-B1). Cadeia oficial permanece Runtime → TISS Runtime → XMLRuntimePort → XMLGenerationRuntimePort → XMLSerializerRuntimePort → XMLSchemaRuntimePort → XMLValidationRuntimePort.  
- **Origem:** TISS-08 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** API interna / proibir produto

#### AER-XMLVAL-B2
- **Título:** Barrel exporta Store + `getStore()` no Adapter (Validation)  
- **Descrição:** `xml-validation-runtime/index.ts` reexporta `InMemoryXMLValidationRuntimeStore`; adapters expõem `getStore()` fora do Port — superfície de uso indevido (sem consumidor produto atual). Espelho de **AER-XMLSCH-B2**.  
- **Origem:** TISS-08 · **Prioridade:** Baixa · **Status:** Aceita · **Sprint:** Restringir superfície pública

### Atualização TISS-VALIDATION-GATE-01 (03/08/2026)

1. **Auditoria exclusivamente de leitura** — nenhuma alteração de código/Runtime/Provider/Adapter/Store/Models/Factory/Registry/testes/comportamento.  
2. **Cadeia oficial reconfirmada íntegra:** Produto → Enterprise Runtime → TISS Runtime → `TISSCatalogPort` → `RulePackEnginePort` → `XMLRuntimePort` → `XMLGenerationRuntimePort` → `XMLSerializerRuntimePort` → `XMLSchemaRuntimePort` → `XMLValidationRuntimePort` → Adapter → Store → Canonical XML Validation Result.  
3. **Sem Provider paralelo / sem Adapter paralelo / sem Runtime paralelo / sem bypass Enterprise** ao `XMLValidationRuntimePort`.  
4. **XML Validation Runtime permanece estrutural e desacoplado:** `validationExecuted = false` / `realValidationPerformed = false` / `officialXsdLoaded = false` / `officialAnsValidation = false` / `officialTissValidation = false` / `validationRulesLoaded = false` / `validationEngineReady = true`; sem XSD oficial; sem namespace oficial; sem validação XSD; sem validação XML real; sem XML TISS/ANS; sem SOAP; sem Reader/Parser/Validator; sem operadora/contrato/tenant; sem regras ANS.  
5. **Ressalvas resolvidas nesta Gate:** nenhuma.  
6. **Ressalvas Baixa confirmadas Aceitas (não bloqueantes):** **AER-XMLVAL-B1…B2**, **AER-XMLSCH-B1…B2**, **AER-XMLSER-B1…B2**, **AER-XMLGEN-B1…B2**, **AER-XMLRT-B1…B3**.  
7. **Nenhuma nova Architectural Exception encontrada.** / **nenhuma regressão** / **ECS-01 íntegro**.  
8. **Gates:** Build PASS · TypeScript PASS · ESLint PASS · Smoke PASS · Enterprise PASS (65/65) · Capture PASS (198/1 skipped).  
9. **Indicadores XML (sem regressão):** Coverage **50%** · Runtime Coverage **100%** · Generation Runtime Coverage **100%** · Serializer Runtime Coverage **100%** · Schema Runtime Coverage **100%** · Validation Runtime Coverage **100%** · Legacy Components **1** · Enterprise Compliance **95%**.  
10. **Parecer:** **GO COM RESSALVAS**.  
11. **Roadmap:** **TISS-09 — Enterprise XSD Runtime oficialmente liberada**.  
12. Documento: `docs/enterprise/TISS-VALIDATION-GATE-01_CERTIFICATION.md`.

---

## 10. Controle de mudanças do registro

| Data | Sprint | Alteração |
|------|--------|-----------|
| 02/08/2026 | ARCH-DEBT-01 | Criação do registro oficial e consolidação inicial |
| 02/08/2026 | SEARCH-GATE-01 | Certificação Search (GO); AER-SRCHG-B1…B4; liberação TISS-01 |
| 02/08/2026 | TISS-01 | Enterprise TISS Provider/Runtime; AER-TISS-B1…B3; liberação TISS-GATE-01 |
| 02/08/2026 | TISS-02 | Enterprise TISS Canonical Catalog; AER-TISS-B4…B5; liberação TISS-CATALOG-GATE-01 |
| 02/08/2026 | TISS-CATALOG-GATE-01 | Certificação Catalog (GO COM RESSALVAS); AER-TISSCG-A1/M1/B1/B2; liberação TISS-03 |
| 03/08/2026 | TISS-03 | Enterprise Rule Pack Engine; AER-TISSCG-B1 Resolvida; AER-RPE-B1…B2; liberação TISS-RULE-GATE-01 |
| 03/08/2026 | TISS-RULE-GATE-01 | Certificação Rule Pack Engine (GO COM RESSALVAS); AER-RPEG-M1/B1/B2; liberação TISS-03A |
| 03/08/2026 | TISS-03A | Enterprise Base Rule Packs; AER-RPE-B2 Resolvida; liberação TISS-RULEPACK-GATE-01 |
| 03/08/2026 | TISS-RULEPACK-GATE-01 | Certificação Base Rule Packs (GO COM RESSALVAS); AER-RPKG-B1…B2; encerramento TISS-03A; recomendação TISS-CONV-01 |
| 03/08/2026 | TISS-CONV-01 | Convergência Capture→Enterprise; AER-GA03-A4 / AER-TISSCG-A1 Resolvidas; AER-TISSCV-B1…B2; liberação TISS-04 |
| 03/08/2026 | TISS-04 | Enterprise XML Runtime Foundation; AER-XMLRT-B1…B3; liberação TISS-XML-GATE-01 |
| 03/08/2026 | TISS-XML-GATE-01 | Certificação XML Runtime (**NO-GO**); AER-XMLG-T1 Aberta/Bloqueante; indicadores XML permanentes; TISS-05 não liberado |
| 03/08/2026 | XML-HOTFIX-01 | Gate TypeScript restaurado; AER-XMLG-T1 Resolvida; re-run TISS-XML-GATE-01 pendente antes de TISS-05 |
| 03/08/2026 | TISS-XML-GATE-01A | Recertificação XML Runtime (**GO COM RESSALVAS**); AER-XMLG-T1 reconfirmada Resolvida; TISS-05 liberado |
| 03/08/2026 | TISS-05 | Enterprise XML Generation Runtime; AER-XMLGEN-B1…B2; liberação TISS-XMLGEN-GATE-01 |
| 03/08/2026 | TISS-XMLGEN-GATE-01 | Certificação XML Generation Runtime (**GO COM RESSALVAS**); AER-XMLGEN-B1…B2 / AER-XMLRT-B1…B3 reconfirmadas; TISS-06 liberado |
| 03/08/2026 | TISS-06 | Enterprise XML Serializer Runtime; AER-XMLSER-B1…B2; liberação TISS-06A (Serializer Gate) |
| 03/08/2026 | TISS-06A | Certificação XML Serializer Runtime (**GO COM RESSALVAS**); AER-XMLSER-B1…B2 / AER-XMLGEN-B1…B2 / AER-XMLRT-B1…B3 reconfirmadas; TISS-07 liberado |
| 03/08/2026 | TISS-07 | Enterprise XML Schema Runtime; AER-XMLSCH-B1…B2; liberação TISS-SCHEMA-GATE-01 |
| 03/08/2026 | TISS-SCHEMA-GATE-01 | Certificação XML Schema Runtime (**GO COM RESSALVAS**); AER-XMLSCH-B1…B2 / AER-XMLSER-B1…B2 / AER-XMLGEN-B1…B2 / AER-XMLRT-B1…B3 reconfirmadas; nenhuma nova AER; TISS-08 liberado |
| 03/08/2026 | TISS-08 | Enterprise XML Validation Runtime; AER-XMLVAL-B1…B2; liberação TISS-VALIDATION-GATE-01 |
| 03/08/2026 | TISS-VALIDATION-GATE-01 | Certificação XML Validation Runtime (**GO COM RESSALVAS**); AER-XMLVAL-B1…B2 / AER-XMLSCH-B1…B2 / AER-XMLSER-B1…B2 / AER-XMLGEN-B1…B2 / AER-XMLRT-B1…B3 reconfirmadas; nenhuma nova AER; TISS-09 liberado |
