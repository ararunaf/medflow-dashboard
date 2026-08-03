# PHASE 2 — Final Architecture Report

**Sprint:** INF-FINAL-GATE-01  
**Data:** 03/08/2026  
**Natureza:** Relatório arquitetural final da Fase 2 — **somente leitura / documentação**  
**Documento irmão:** [`ENTERPRISE_FOUNDATION_FINAL_CERTIFICATION.md`](./ENTERPRISE_FOUNDATION_FINAL_CERTIFICATION.md)

---

## 1. Escopo da Fase 2 (encerrada)

A Fase 2 consolidou a Enterprise Foundation operacional e TISS/XML/INF sobre o Core EPC e a integração ARCH-01:

| Trilha | Entregas principais |
|--------|---------------------|
| Runtime de produto | Enterprise Runtime, Capture Engine, OCR, Classification, Storage Manager, Document Search, AI Provider Runtime |
| Providers | OCR-01 Azure, CLASS-01, STORAGE-01, SEARCH-01, TISS-01 |
| TISS | Catalog, Rule Pack Engine, TISS Runtime, cadeia XML (Generation → Serializer → Schema → Validation → XSD → Namespace) |
| Infrastructure | Queue, Worker, Scheduler, Persistent Queue, Observability, Scalability Runtimes |
| Governança | ECS-01, Architectural Exception Register, Gates de certificação por Sprint |

---

## 2. Topologia oficial

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUTO (UI / API)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ getEnterpriseRuntime()
┌───────────────────────────▼─────────────────────────────────┐
│                 ENTERPRISE RUNTIME (único)                   │
├───────────────┬─────────────────────┬───────────────────────┤
│ Capture / DIP │   INF Runtimes      │   TISS Runtime        │
│ OCR / Class   │ Queue → Worker →    │ Catalog / RulePack    │
│ Storage/Search│ Scheduler → PQR →   │ XML* → XSD → NS       │
│ AI Runtime    │ Observability →     │ TISS Provider         │
│               │ Scalability         │                       │
└───────────────┴─────────────────────┴───────────────────────┘
        │ Ports exclusively          │
        ▼                            ▼
   Adapters (Default/Enterprise/Mock) → In-memory / Vendor Stores
```

---

## 3. Inventário de Runtimes oficiais (Fase 2)

### 3.1 Composition

| Runtime | Pasta |
|---------|-------|
| Enterprise Runtime | `runtime/` |

### 3.2 Document Intelligence / Capture

| Runtime | Pasta |
|---------|-------|
| Document Intake Runtime | `document-intake-runtime/` |
| Capture Engine Runtime | `capture-engine-runtime/` |
| OCR Runtime | `ocr-runtime/` |
| Document Classification Runtime | `document-classification-runtime/` |
| Storage Manager Runtime | `storage-manager-runtime/` |
| Document Search Runtime | `document-search-runtime/` |
| AI Provider Runtime | `ai-provider-runtime/` |

### 3.3 TISS / XML

| Runtime / Engine | Pasta |
|------------------|-------|
| TISS Runtime | `tiss-runtime/` |
| TISS Catalog | `tiss-catalog/` |
| Rule Pack Engine | `rule-pack-engine/` |
| XML Runtime | `xml-runtime/` |
| XML Generation Runtime | `xml-generation-runtime/` |
| XML Serializer Runtime | `xml-serializer-runtime/` |
| XML Schema Runtime | `xml-schema-runtime/` |
| XML Validation Runtime | `xml-validation-runtime/` |
| XSD Runtime | `xsd-runtime/` |
| Namespace Runtime | `namespace-runtime/` |

### 3.4 Infrastructure

| Runtime | Pasta |
|---------|-------|
| Queue Runtime | `queue-runtime/` |
| Worker Runtime | `worker-runtime/` |
| Scheduler Runtime | `scheduler-runtime/` |
| Persistent Queue Runtime | `persistent-queue-runtime/` |
| Observability Runtime | `observability-runtime/` |
| Scalability Runtime | `scalability-runtime/` |

---

## 4. Princípios arquiteturais congelados

1. **Um composition root** — `getEnterpriseRuntime()` / `createEnterpriseRuntime()`.
2. **Um Port oficial por capacidade** — sem bypass na cadeia Enterprise.
3. **ECS-01** — Port, Models, Types, Capabilities, Identity, Provider, Factory, Registry, Adapters, Store, Demo, Barrel.
4. **Runtimes estruturais primeiro** — backends reais / scaling / XML TISS-ANS oficiais ficam para fases posteriores.
5. **Dual-paths de produto** só existem como dívida documentada (AER), nunca como segundo Runtime oficial.
6. **Foundations Phase B** não competem com Runtimes Fase 2.

---

## 5. Integração verificada

| De | Para | Mecanismo |
|----|------|-----------|
| Enterprise Runtime | Todos os Ports Fase 2 | constructor composition + getters |
| Queue ↔ Worker ↔ Scheduler ↔ PQR | uns aos outros | `enterpriseDeps` lazy |
| INF ↔ Observability / Scalability | TISS + filas | deps preparadas |
| TISS Runtime | Catalog, RulePack, XML*, XSD, NS, INF | deps obrigatórias |
| XML Runtime | Catalog, RulePack, XML Generation | deps |
| Capture chain | Intake → OCR → Class → Storage → Search | orchestration via Capture Engine |

Dependências circulares estruturais evitadas por **lazy getters** no `DefaultEnterpriseRuntime` (campos `!` atribuídos após criação dos Ports).

---

## 6. Estado de maturidade por domínio

| Domínio | Maturidade Foundation | Maturidade funcional real |
|---------|----------------------|---------------------------|
| Enterprise composition | Completa | Bridge Capture parcial (dual-path AER) |
| OCR Provider Azure | Completa (estrutural+provider) | Produto ainda pode ter path legado (AER histórico Resolvido no Runtime) |
| TISS Catalog / Rule Packs | Completa (estrutural + seeds) | Sem XML TISS/ANS real |
| XML chain | Completa (estrutural) | Sem XSD oficial / namespaces oficiais reais |
| Queue / Worker / Scheduler / PQR | Completa (in-memory) | Sem backends reais |
| Observability / Scalability | Completa (estrutural) | Sem métricas/escala reais |
| Storage / Search Providers | Completa | Dual-path Storage produto (**AER-STG-A1** Planejada) |

---

## 7. Dívidas arquiteturais conscientes (não bloqueiam freeze)

| ID / Tema | Impacto no freeze Fase 2 |
|-----------|--------------------------|
| AER-STG-A1 / STORAGE-CONV-01 | Não bloqueia — Planejada para Fase posterior |
| AER-GA03-A1 dual-path Capture | Não bloqueia — Aceita |
| AER-XMLRT-B2 xml-export-service | Não bloqueia — Aceita |
| AER-GA02-B2/B4 trunk/staging | Dívida de governança — Aceita; não impede certificação Foundation no branch |
| Escape hatches `getXxxPort` | Aceitas Baixa |
| Harness sem `enterprise:tiss-runtime:test` | Dívida de teste — cobertura indireta OK |

---

## 8. Evidência de estabilidade

| Evidência | Resultado em 03/08/2026 |
|-----------|-------------------------|
| `npm run build` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run smoke-check` | PASS |
| `enterprise:*:test` | 73/73 PASS |
| `capture:test:all` | 198 pass / 1 skip / 0 fail |

---

## 9. Conclusão arquitetural

A arquitetura da **Enterprise Foundation Fase 2** está:

- **Consistente** com ECS-01 nos módulos canônicos.
- **Integrada** em um único Enterprise Runtime.
- **Livre de Runtimes/Providers/Factories/Registries/Adapters/Stores paralelos oficiais.**
- **Preparada** para evolução funcional (Fase 3+), sem exigir redesign do composition root.

**Relatório arquitetural final da Fase 2: APROVADO COM RESSALVAS DOCUMENTADAS.**
