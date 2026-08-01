# EPC-15 — OCR Provider Foundation Certification Report

**Sprint:** EPC-15 — OCR Provider Foundation  
**Data:** 31/07/2026  
**Resultado:** **APROVADA** (fundação arquitetural; comportamento do produto inalterado)

---

## 1. Questionário obrigatório

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Alguma funcionalidade mudou? | **Não** |
| 2 | Alguma tela mudou? | **Não** |
| 3 | Alguma API mudou? | **Não** |
| 4 | Alguma migration foi criada? | **Não** |
| 5 | Algum comportamento mudou? | **Não** |
| 6 | Quantos Providers OCR foram criados? | **1** funcional mock (`DefaultMockOCRProvider`); **3** ids no registry (`mock` / `test` / `default`) — todos o mesmo adapter |
| 7 | Quantos Ports foram criados? | **1** (`OCRProviderPort`) |
| 8 | Quantos modelos canônicos foram utilizados? | **4** (`ProcessingOutput`, `DocumentProcessingResult`, `DocumentIdentityReference`, `MetadataReference`) + descriptor EPC-14 / `OCRCapabilities` |
| 9 | Existe OCR real implementado? | **Não** |
| 10 | Existe qualquer integração HTTP? | **Não** |
| 11 | Existe qualquer IA utilizada? | **Não** |
| 12 | Todos os testes passaram? | **Sim** nos gates executados para esta sprint (ver §4) |
| 13 | O comportamento permanece 100% compatível? | **Sim** — nenhum fluxo de usuário foi redirecionado ao Port |
| 14 | O OCR produz exclusivamente ProcessingOutput? | **Sim** |
| 15 | O OCR está registrado no Processing Provider Registry? | **Sim** — via `registerOCRProviderWithProcessingFramework` |
| 16 | O OCR respeita Document Processing Foundation? | **Sim** — tipos canônicos EPC-13; `processorType: "OCR"` |
| 17 | Existem pontos de extensão documentados para futura normalização? | **Sim** — EP-NORM-01..04 |
| 18 | O OCR continua totalmente desacoplado de contratos? | **Sim** |
| 19 | O OCR continua totalmente desacoplado do Rule Engine? | **Sim** |
| 20 | O OCR continua totalmente desacoplado do Workflow? | **Sim** |
| 21 | O OCR continua totalmente desacoplado da IA? | **Sim** |

---

## 2. Critérios de aprovação

| Critério | Status |
|----------|--------|
| Nenhuma funcionalidade existente mudou | ✅ |
| Nenhuma tela mudou | ✅ |
| Nenhuma API mudou | ✅ |
| Nenhuma migration criada | ✅ |
| Nenhum OCR real integrado | ✅ |
| Nenhuma IA utilizada | ✅ |
| OCR produz exclusivamente ProcessingOutput | ✅ |
| OCR permanece completamente genérico | ✅ |
| OCR registrado no Processing Provider Framework | ✅ |
| Pontos de extensão para normalização documentados | ✅ |
| Arquitetura segue integralmente ECS-01 | ✅ |

---

## 3. Inventário de arquivos EPC-15

### Código

- `src/lib/enterprise/ocr-provider/ports/types.ts`
- `src/lib/enterprise/ocr-provider/ports/capabilities.ts`
- `src/lib/enterprise/ocr-provider/ports/ocr-provider-port.ts`
- `src/lib/enterprise/ocr-provider/ports/identity.ts`
- `src/lib/enterprise/ocr-provider/ports/extension-points.ts`
- `src/lib/enterprise/ocr-provider/ports/index.ts`
- `src/lib/enterprise/ocr-provider/adapters/mock-ocr-provider-adapter.ts`
- `src/lib/enterprise/ocr-provider/adapters/index.ts`
- `src/lib/enterprise/ocr-provider/descriptor/ocr-provider-descriptor.ts`
- `src/lib/enterprise/ocr-provider/descriptor/index.ts`
- `src/lib/enterprise/ocr-provider/registry/ocr-provider-registry.ts`
- `src/lib/enterprise/ocr-provider/registry/register-with-processing-provider-framework.ts`
- `src/lib/enterprise/ocr-provider/registry/index.ts`
- `src/lib/enterprise/ocr-provider/factory/ocr-provider-factory.ts`
- `src/lib/enterprise/ocr-provider/factory/index.ts`
- `src/lib/enterprise/ocr-provider/providers/create-ocr-provider-port.ts`
- `src/lib/enterprise/ocr-provider/providers/index.ts`
- `src/lib/enterprise/ocr-provider/demo/ocr-provider-health-query.ts`
- `src/lib/enterprise/ocr-provider/demo/index.ts`
- `src/lib/enterprise/ocr-provider/index.ts`

### Testes / tooling

- `scripts/enterprise/tests/ocr-provider-engine.test.ts`
- `package.json` (script `enterprise:ocr-provider:test`)

### Documentação

- `docs/enterprise/EPC-15_OCR_PROVIDER_FOUNDATION.md`
- `docs/enterprise/EPC-15_OCR_PROVIDER_MODEL.md`
- `docs/enterprise/EPC-15_ARCHITECTURE.md`
- `docs/enterprise/EPC-15_CERTIFICATION.md`

Nenhum arquivo de rotas, Server Functions, Settings, Auth, Capture OCR de produto, UI, APIs, migrations, Contract, Rule, Workflow ou AI de produto foi modificado por esta sprint (exceto o script npm em `package.json`).

---

## 4. Evidência de testes (31/07/2026)

### RESULTADO DA SPRINT (escopo EPC-15)

| Gate | Comando | Resultado |
|------|---------|-----------|
| OCR Provider Engine | `npm run enterprise:ocr-provider:test` | **PASS** — 18/18 |
| Processing Provider (regressão EPC-14) | `npm run enterprise:processing-provider:test` | **PASS** — 18/18 |
| Document Processor (regressão EPC-13) | `npm run enterprise:document-processor:test` | **PASS** — 15/15 |
| Smoke | `npm run smoke-check` | **PASS** |
| ESLint (escopo EPC-15) | `npx eslint src/lib/enterprise/ocr-provider/** scripts/enterprise/tests/ocr-provider-engine.test.ts` | **PASS** |
| TypeScript (arquivos EPC-15) | `npx tsc --noEmit` filtrado | **0 erros** sob `src/lib/enterprise/ocr-provider/` |

### ESTADO GLOBAL DO PROJETO (pré-existente — fora do escopo EPC-15)

| Gate | Resultado | Nota |
|------|-----------|------|
| Build | **FAIL pré-existente** | `useTenantBranding` não exportado em `tenant-branding-provider.tsx` / rota `executivo.tsx` — **igual às EPC anteriores**; não introduzido pelo OCR Provider |
| TypeScript (repo) | **FAIL pré-existente** | Diagnósticos em Capture/TISS/Operational/UI — **nenhum** sob `src/lib/enterprise/ocr-provider/` |

A certificação desta sprint valida que:

1. A fundação OCR Provider está operacional em isolamento.
2. Nenhum comportamento de produto foi alterado.
3. Processing Provider Framework (EPC-14) e Document Processing Foundation (EPC-13) permanecem intactos.
4. Falhas globais de Build/TS são pré-existentes e fora do escopo.

---

## 5. Princípio arquitetural certificado

> O OCR Provider é apenas o primeiro de vários Providers futuros.  
> Não contém conhecimento de domínio.  
> Seu único papel é representar um mecanismo genérico de extração documental,  
> produzindo sempre um `ProcessingOutput` padronizado.
