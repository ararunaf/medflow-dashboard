# TISS-SCHEMA-GATE-01 — Enterprise XML Schema Runtime Certification

**Sprint:** TISS-SCHEMA-GATE-01 — Enterprise XML Schema Runtime Certification  
**Data:** 03/08/2026  
**Natureza:** Auditoria arquitetural de leitura — **sem alteração de Runtime, Provider, Adapter, Store, Models, Factory, Registry, Enterprise Runtime, TISS Runtime, XML Runtime, XML Generation Runtime, XML Serializer Runtime, XML Schema Runtime, Capture, banco, APIs, UI ou comportamento**  
**Pré-requisito:** TISS-07 — Enterprise XML Schema Runtime  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Objetivo

Certificar oficialmente toda a infraestrutura do XML Schema Runtime antes da futura implementação de XSD, namespaces, validações ou qualquer conhecimento XML específico, confirmando que:

- `XMLSchemaRuntimePort` permanece o **único ponto de entrada** oficial para gerenciamento de XML Schemas na cadeia Enterprise;
- não há bypass, Provider paralelo, Adapter paralelo ou Runtime paralelo de schema;
- a infraestrutura permanece **exclusivamente estrutural** (`officialXsdLoaded = false`, `xsdValidationPerformed = false`, `realTissXmlValidated = false`, `realAnsXmlValidated = false`);
- a arquitetura permanece aderente ao **ECS-01**;
- o XML Schema Runtime está oficialmente liberado para receber **TISS-08 — Enterprise XML Validation Runtime** (ainda sem validações XSD reais).

---

## 2. Inventário completo do XML Schema Runtime

### 2.1 Cadeia oficial

```
Produto (intended)
  → Enterprise Runtime
  → TISS Runtime
  → TISSCatalogPort
  → RulePackEnginePort
  → XMLRuntimePort                    (TISS-04 — orquestração)
  → XMLGenerationRuntimePort          (TISS-05 — estrutura canônica)
  → XMLSerializerRuntimePort          (TISS-06 — string XML canônica)
  → XMLSchemaRuntimePort              (TISS-07 — schema canônico)
  → DefaultXMLSchemaAdapter
  → InMemoryXMLSchemaRuntimeStore
  → Canonical XML Schema
```

### 2.2 Artefatos oficiais (`src/lib/enterprise/xml-schema-runtime/`)

| Papel | Artefato oficial |
|-------|------------------|
| Único Runtime de XML Schema | `src/lib/enterprise/xml-schema-runtime/` |
| Único contrato Enterprise de schema | `XMLSchemaRuntimePort` |
| Port / types / canonical / capabilities / identity | `ports/` |
| Factory | `XMLSchemaRuntimeFactory` / `createXMLSchemaRuntimeFactory` |
| Provider | `createXMLSchemaRuntimePort` / `XMLSchemaRuntimeProvider` (default `enterprise`) |
| Registry | `XMLSchemaRuntimeRegistry` (`mock` / `test` / `default` / `enterprise`) |
| Adapters | `DefaultXMLSchemaAdapter` (= `EnterpriseXMLSchemaAdapter`) / `MockXMLSchemaAdapter` |
| Store | `InMemoryXMLSchemaRuntimeStore` (`XMLSchemaRuntimeStore`) |
| Canonical models | `CanonicalXMLSchema` / `Request` / `Result` / `Version` / `Profile` / `Reference` / `Metadata` / `Capabilities` / `Statistics` / `Health` |
| Demo | `getXMLSchemaRuntimeHealthSummary` |
| Testes oficiais | `scripts/enterprise/tests/xml-schema-runtime-engine.test.ts` |
| Docs TISS-07 | `TISS-07_ENTERPRISE_XML_SCHEMA_RUNTIME.md`, `TISS-07_XML_SCHEMA_ARCHITECTURE.md`, `TISS-07_XML_SCHEMA_CERTIFICATION.md` |

### 2.3 Distinção canônica (sem Runtime paralelo)

| Runtime | Responsabilidade |
|---------|------------------|
| **XML Runtime** | Orquestração estrutural XML |
| **XML Generation Runtime** | Materialização da estrutura canônica |
| **XML Serializer Runtime** | Serialização da estrutura em string XML canônica |
| **XML Schema Runtime** | Gerenciamento de XML Schemas canônicos (estrutural) |

Capture Runtime permanece sibling (não wired na cadeia XML).  
Módulos `xml-runtime`, `xml-generation-runtime` e `xml-serializer-runtime` **não** importam o Schema Runtime (composição no Enterprise/TISS Runtime).

### 2.4 Flags estruturais obrigatórias

| Flag | Valor certificado |
|------|-------------------|
| `officialXsdLoaded` | `false` |
| `xsdValidationPerformed` | `false` |
| `realTissXmlValidated` | `false` |
| `realAnsXmlValidated` | `false` |
| `implementsOfficialXsd` | `false` |
| `implementsXsdValidation` | `false` |
| `implementsRealTissXml` / `implementsRealAnsXml` | `false` |
| `knowsOperatorOrCooperative` / `knowsContract` / `knowsTenant` / `knowsTissPattern` | `false` |

---

## 3. Resultado detalhado da auditoria

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Existe XSD fora do `XMLSchemaRuntimePort`? | **NÃO** — zero arquivos `.xsd` no repositório; nenhum conteúdo XSD no módulo Schema |
| 2 | Existe validação XSD fora do Runtime? | **NÃO** |
| 3 | Existe Provider paralelo? | **NÃO** — único provider oficial via `createXMLSchemaRuntimePort` |
| 4 | Existe Adapter paralelo? | **NÃO** — `Default`/`Enterprise` + `Mock` (mesmo Port); sem adapter produto paralelo |
| 5 | Existe Runtime paralelo? | **NÃO** — único módulo `xml-schema-runtime/` |
| 6 | Existe bypass? | **NÃO** na cadeia Enterprise (escape hatch documentado: **AER-XMLSCH-B1**) |
| 7 | Existe acesso direto ao Store? | Superfície barrel/`getStore()` **sim** / consumidor produto **NÃO** (**AER-XMLSCH-B2**) |
| 8 | Existe acesso direto ao Adapter? | Superfície barrel; TISS path usa Port apenas |
| 9 | Existe conhecimento XML específico? | **NÃO** — apenas modelos canônicos estruturais |
| 10 | Existe conhecimento TISS? | **NÃO** no Schema Runtime (`knowsTissPattern: false`) |
| 11 | Existe conhecimento ANS? | **NÃO** |
| 12 | Existe namespace oficial? | **NÃO** |
| 13 | Existe XSD oficial? | **NÃO** |
| 14 | Existe validação XSD? | **NÃO** (`implementsXsdValidation: false`) |
| 15 | Existe XML Reader? | **NÃO** |
| 16 | Existe XML Parser? | **NÃO** (no Schema Runtime) |
| 17 | Existe XML Validator? | **NÃO** |
| 18 | Existe SOAP? | **NÃO** |
| 19 | Existe conhecimento de operadora? | **NÃO** |
| 20 | Existe conhecimento de contrato? | **NÃO** |
| 21 | Existe conhecimento de tenant? | **NÃO** |
| 22 | Existe regressão? | **NÃO** |

### Evidências de composição

- Enterprise Runtime: `getXMLSchemaRuntimePort()` + wiring `createXMLSchemaRuntimePort({ provider: "enterprise" })` + health `xmlSchemaRuntimeOk`
- TISS Runtime: `enterpriseDeps.getXMLSchemaRuntimePort` obrigatório; `register()` após serialize via Port
- XML Runtime / Generation / Serializer: **sem** import de `xml-schema-runtime`
- Produto Capture: **sem** consumo de `XMLSchemaRuntimePort` / Store / Adapter
- Legado produto `xml-export-service` permanece isolado (**AER-XMLRT-B2**) — não é Schema Runtime paralelo

---

## 4. Resultado dos Gates

| Gate | Comando | Resultado |
|------|---------|-----------|
| Build | `npm run build` | **PASS** |
| TypeScript | `npx tsc --noEmit` | **PASS** |
| ESLint | `npm run lint` | **PASS** (0 errors / 7 warnings pré-existentes — **AER-GA03-B11**) |
| Smoke | `npm run smoke-check` | **PASS** |
| Enterprise (64 scripts `enterprise:*:test`) | todos | **PASS** (64/64) |
| XML Schema Runtime | `npm run enterprise:xml-schema-runtime:test` | **PASS** (18/18) |
| XML Runtime | `npm run enterprise:xml-runtime:test` | **PASS** (20/20) |
| XML Generation Runtime | `npm run enterprise:xml-generation-runtime:test` | **PASS** (17/17) |
| XML Serializer Runtime | `npm run enterprise:xml-serializer-runtime:test` | **PASS** (18/18) |
| Enterprise Runtime | `npm run enterprise:runtime:test` | **PASS** (6/6) |
| Capture | `npm run capture:test:all` | **PASS** (198 pass / 1 skipped) |

Nenhuma alteração de código Runtime foi necessária. Nenhuma alteração de comportamento foi introduzida nesta Sprint (somente documentação de certificação + atualização do registro AER).

---

## 5. Tabela completa de certificação

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | XML Schema Runtime continua sendo o único Runtime oficial? | **SIM** |
| 2 | Todo acesso passa exclusivamente pelo `XMLSchemaRuntimePort`? | **SIM** (cadeia Enterprise) |
| 3 | Existe Provider paralelo? | **NÃO** |
| 4 | Existe Adapter paralelo? | **NÃO** |
| 5 | Existe Runtime paralelo? | **NÃO** |
| 6 | Existe bypass? | **NÃO** (cadeia Enterprise) |
| 7 | Existe XSD oficial? | **NÃO** |
| 8 | Existe namespace oficial? | **NÃO** |
| 9 | Existe validação XSD? | **NÃO** |
| 10 | Existe XML TISS? | **NÃO** |
| 11 | Existe XML ANS? | **NÃO** |
| 12 | Build PASS? | **SIM** |
| 13 | TypeScript PASS? | **SIM** |
| 14 | ESLint PASS? | **SIM** |
| 15 | Smoke PASS? | **SIM** |
| 16 | Enterprise PASS? | **SIM** (64/64) |
| 17 | Capture PASS? | **SIM** |
| 18 | Existe regressão? | **NÃO** |
| 19 | ECS-01 permanece íntegro? | **SIM** |
| 20 | O XML Schema Runtime está oficialmente certificado para suportar futuramente XSD e validações XML? | **SIM** — via **TISS-08** (Validation Runtime estrutural; sem XSD real nesta liberação) |

---

## 6. Architectural Exception Register

| ID | Status | Nota |
|----|--------|------|
| **AER-XMLSCH-B1** | Aceita (Baixa) | Escape hatch `getXMLSchemaRuntimePort()` — reconfirmada; não bloqueante |
| **AER-XMLSCH-B2** | Aceita (Baixa) | Barrel / `getStore()` — reconfirmada; não bloqueante |
| **AER-XMLSER-B1…B2** | Aceitas (Baixa) | Pré-existentes; sem regressão |
| **AER-XMLGEN-B1…B2** | Aceitas (Baixa) | Pré-existentes; sem regressão |
| **AER-XMLRT-B1…B3** | Aceitas (Baixa) | Pré-existentes; sem regressão |
| **AER-XMLRT-B2** | Aceita (Baixa) | MVP `xml-export-service` permanece isolado do Enterprise |
| **AER-XMLG-T1** | **RESOLVIDA** | Hotfix TypeScript permanece resolvido |

**Nenhuma nova Architectural Exception encontrada.**

### Indicadores XML (permanentes — sem regressão)

| Indicador | Valor |
|-----------|------:|
| XML Coverage | **50%** |
| XML Runtime Coverage | **100%** |
| XML Generation Runtime Coverage | **100%** |
| XML Serializer Runtime Coverage | **100%** |
| XML Schema Runtime Coverage | **100%** |
| XML Legacy Components | **1** |
| XML Enterprise Compliance | **95%** |

---

## 7. Parecer final

**GO COM RESSALVAS**

### Justificativa

- Infraestrutura canônica TISS-07 permanece íntegra, wired e estrutural.
- `XMLSchemaRuntimePort` é o único ponto oficial de gerenciamento de XML Schemas na cadeia Enterprise.
- Sem bypass, sem Provider/Adapter/Runtime paralelo de Schema Enterprise.
- Sem XSD oficial; sem namespace oficial; sem validação XSD; sem XML TISS/ANS; sem SOAP; sem Reader/Parser/Validator; sem lógica de operadora/contrato/tenant.
- Todos os Gates e suítes obrigatórias **PASS**; sem regressão; ECS-01 íntegro.
- Ressalvas remanescentes (**AER-XMLSCH-B1…B2**, **AER-XMLSER-B1…B2**, **AER-XMLGEN-B1…B2**, **AER-XMLRT-B1…B3**) são **Aceitas / Baixa / não bloqueantes** — não impedem liberação do roadmap.

### Recomendação obrigatória de roadmap

**Não** implementar imediatamente XSD oficial, namespaces ANS/TISS, validação XSD real, XML Reader/Parser/Validator, SOAP, regras ANS, operadoras, contratos ou tenants.

**Liberar oficialmente** a Sprint **TISS-08 — Enterprise XML Validation Runtime**.

Objetivo da próxima Sprint: criar apenas a infraestrutura canônica de validação XML (Validation Runtime), ainda sem validações XSD reais, sem regras ANS e sem lógica de negócio, mantendo o mesmo padrão arquitetural da Enterprise Foundation.
