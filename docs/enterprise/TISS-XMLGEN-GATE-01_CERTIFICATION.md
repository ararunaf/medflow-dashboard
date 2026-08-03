# TISS-XMLGEN-GATE-01 — Certificação do Enterprise XML Generation Runtime

**Sprint:** TISS-XMLGEN-GATE-01  
**Data:** 03/08/2026  
**Natureza:** Auditoria arquitetural de leitura — **sem alteração de Runtime, Provider, Adapter, Store, Models, Rule Pack Engine, TISS Runtime, TISS Catalog, Capture, OCR, Classification, Storage, Search, AI Runtime ou comportamento**  
**Pré-requisito:** TISS-05 — Enterprise XML Generation Runtime  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Objetivo

Certificar oficialmente a infraestrutura do **Enterprise XML Generation Runtime** implementada na Sprint TISS-05, confirmando que:

- `XMLGenerationRuntimePort` permanece o **único ponto de entrada** oficial para geração XML na cadeia Enterprise;
- não há bypass, Provider paralelo, Adapter paralelo ou Runtime paralelo de geração;
- a infraestrutura permanece **exclusivamente estrutural** (`realXmlGenerated = false`);
- a arquitetura permanece aderente ao **ECS-01**;
- o Runtime está oficialmente liberado para receber **TISS-06 — Enterprise XML TISS Serializer Runtime**.

---

## 2. Cadeia oficial confirmada

```
Produto
  → Enterprise Runtime
  → TISS Runtime
  → TISSCatalogPort
  → RulePackEnginePort
  → XMLRuntimePort
  → XMLGenerationRuntimePort
  → DefaultXMLGenerationAdapter
  → InMemoryXMLGenerationRuntimeStore
  → Canonical XML Result
```

| Papel | Artefato oficial |
|-------|------------------|
| Único Runtime de materialização XML | `src/lib/enterprise/xml-generation-runtime/` |
| Único contrato Enterprise de geração | `XMLGenerationRuntimePort` |
| Factory / Provider | `createXMLGenerationRuntimePort` / `XMLGenerationRuntimeProvider` (default `enterprise`) |
| Registry | `XMLGenerationRuntimeRegistry` (`mock` / `test` / `default` / `enterprise`) |
| Adapters | `DefaultXMLGenerationAdapter` (= `EnterpriseXMLGenerationAdapter`) / `MockXMLGenerationAdapter` |
| Store | `InMemoryXMLGenerationRuntimeStore` |

**Distinção canônica (sem Runtime paralelo):**

- **XML Runtime** (`xml-runtime`) — orquestração estrutural XML (Catalog + RulePack + Generation).
- **XML Generation Runtime** (`xml-generation-runtime`) — materialização canônica da estrutura XML.

Não há segundo Runtime de geração fora de `xml-generation-runtime/`.

---

## 3. Auditoria obrigatória

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Existe geração XML fora do `XMLGenerationRuntimePort`? | **NÃO** na cadeia Enterprise; legado produto `xml-export-service` permanece isolado (**AER-XMLRT-B2**) |
| 2 | Existe bypass? | **NÃO** na cadeia Enterprise |
| 3 | Existe Provider paralelo? | **NÃO** (apenas `mock`/`test`/`default`/`enterprise` no Registry oficial) |
| 4 | Existe Adapter paralelo? | **NÃO** (`DefaultXMLGenerationAdapter` / `MockXMLGenerationAdapter` apenas) |
| 5 | Existe Runtime paralelo? | **NÃO** |
| 6 | Existe geração XML fora da Enterprise Foundation? | **SIM — legado isolado** (`xml-export-service` / **AER-XMLRT-B2**; não é Provider/Adapter Enterprise) |
| 7 | Existe conhecimento XML específico (TISS/ANS)? | **NÃO** no XML Generation Runtime |
| 8 | Existe lógica de operadora? | **NÃO** |
| 9 | Existe lógica de contrato? | **NÃO** |
| 10 | Existe lógica de tenant? | **NÃO** |
| 11 | O XML Runtime continua sendo o único Runtime oficial de orquestração XML? | **SIM** |
| 12 | O XML Generation Runtime permanece totalmente desacoplado? | **SIM** |
| 13 | O ECS-01 permanece íntegro? | **SIM** (ports / adapters / factory / registry / providers / store / demo) |
| 14 | Existe qualquer regressão arquitetural? | **NÃO** |

### Evidências de integridade

- `DefaultXMLRuntimeAdapter.generate()` consome exclusivamente `getXMLGenerationRuntimePort().generate(...)`.
- `DefaultTISSRuntimeAdapter` exige `getXMLGenerationRuntimePort` e propaga `processedViaXMLGenerationRuntimePort`.
- `EnterpriseRuntime` instancia via `createXMLGenerationRuntimePort({ provider: "enterprise" })` e injeta na cadeia TISS/XML.
- Capabilities hardcoded: `implementsRealXml: false`, `implementsAnsValidation: false`, `knowsOperatorOrCooperative: false`, `knowsContract: false`, `knowsTenant: false`.
- `realXmlGenerated = false` em Port, Adapter, Store statistics e cadeia XML Runtime.
- Produto `src/lib/services/tiss/**` **não** importa `xml-generation-runtime` / adapters / store.
- Sem matches de serializer/DOM/XSD/SOAP/namespaces reais em `src/lib/enterprise/xml-generation-runtime/`.

---

## 4. Validação dos Gates (reexecução)

| Gate | Comando | Resultado |
|------|---------|-----------|
| Build | `npm run build` | **PASS** |
| TypeScript | `npx tsc --noEmit` | **PASS** |
| ESLint | `npm run lint` | **PASS** (0 errors / 7 warnings pré-existentes — **AER-GA03-B11**) |
| Smoke | `npm run smoke-check` | **PASS** |
| Enterprise Runtime | `npm run enterprise:runtime:test` | **PASS** (6/6) |
| XML Runtime | `npm run enterprise:xml-runtime:test` | **PASS** (20/20) |
| XML Generation Runtime | `npm run enterprise:xml-generation-runtime:test` | **PASS** (17/17) |
| TISS Runtime / Provider | `npm run enterprise:tiss-provider:test` | **PASS** (18/18) |
| TISS Catalog | `npm run enterprise:tiss-catalog:test` | **PASS** (18/18) |
| Rule Pack Engine | `npm run enterprise:rule-pack-engine:test` | **PASS** |
| Capture | `npm run capture:test:all` | **PASS** (198 pass / 1 skipped) |

---

## 5. Architectural Exception Register

| ID | Status | Nota |
|----|--------|------|
| **AER-XMLGEN-B1** | Aceita (Baixa) | Escape hatch `getXMLGenerationRuntimePort()` — reconfirmada; não bloqueante |
| **AER-XMLGEN-B2** | Aceita (Baixa) | Barrel / `getStore()` — reconfirmada; não bloqueante |
| **AER-XMLRT-B1…B3** | Aceitas (Baixa) | Pré-existentes; sem regressão |
| **AER-XMLRT-B2** | Aceita (Baixa) | MVP `xml-export-service` permanece isolado do Enterprise |
| **AER-XMLG-T1** | **RESOLVIDA** | Hotfix TypeScript permanece resolvido |

Nenhuma nova ressalva aberta nesta Sprint. Nenhuma ressalva resolvida nesta Sprint.

### Indicadores XML (permanentes — sem regressão)

| Indicador | Valor |
|-----------|------:|
| XML Coverage | **50%** |
| XML Runtime Coverage | **100%** |
| XML Generation Runtime Coverage | **100%** |
| XML Legacy Components | **1** |
| XML Enterprise Compliance | **95%** |

---

## 6. Certificação (checklist obrigatório)

1. XML Generation Runtime continua sendo o único Runtime oficial de geração? **SIM**
2. Toda geração passa exclusivamente pelo `XMLGenerationRuntimePort`? **SIM** (cadeia Enterprise)
3. Existe bypass? **NÃO** (cadeia Enterprise)
4. Existe Provider paralelo? **NÃO**
5. Existe Adapter paralelo? **NÃO**
6. Existe Runtime paralelo? **NÃO**
7. Existe XML específico? **NÃO** (no Generation Runtime)
8. Existe XML ANS? **NÃO**
9. Existe XML por operadora? **NÃO**
10. Existe XML por contrato? **NÃO**
11. Existe XML por tenant? **NÃO**
12. Existe geração XML real? **NÃO** (`realXmlGenerated = false`)
13. Build PASS? **SIM**
14. TypeScript PASS? **SIM**
15. ESLint PASS? **SIM**
16. Smoke PASS? **SIM**
17. Enterprise PASS? **SIM**
18. Capture PASS? **SIM**
19. Existe regressão? **NÃO**
20. ECS-01 permanece íntegro? **SIM**
21. O XML Generation Runtime está oficialmente certificado para suportar a futura geração de XML TISS? **SIM** (via TISS-06 Serializer)

---

## 7. Parecer final

**GO COM RESSALVAS**

### Justificativa

- Infraestrutura canônica TISS-05 permanece íntegra, wired e estrutural.
- `XMLGenerationRuntimePort` é o único ponto oficial de geração na cadeia Enterprise.
- Sem bypass, sem Provider/Adapter/Runtime paralelo de geração.
- Sem XML TISS/ANS real; sem lógica de operadora/contrato/tenant.
- Todos os Gates e suítes obrigatórias **PASS**; sem regressão; ECS-01 íntegro.
- Ressalvas remanescentes (**AER-XMLGEN-B1…B2**, **AER-XMLRT-B1…B3**) são **Aceitas / Baixa / não bloqueantes** — não impedem liberação do roadmap.

### Recomendação obrigatória de roadmap

**Não** implementar imediatamente integrações com operadoras nem regras específicas da ANS.

**Liberar oficialmente** a Sprint **TISS-06 — Enterprise XML TISS Serializer Runtime**.

A Sprint TISS-06 deverá implementar apenas o **serializador XML canônico da Foundation**, mantendo lógica de negócio, regras ANS, operadoras e contratos **fora** do Core da Enterprise Foundation.
