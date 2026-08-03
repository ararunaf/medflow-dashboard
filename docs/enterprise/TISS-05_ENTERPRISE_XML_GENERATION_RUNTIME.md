# TISS-05 — Enterprise XML Generation Runtime

**Sprint:** TISS-05 — Enterprise XML Generation Runtime  
**Data:** 03/08/2026  
**Natureza:** Fundação arquitetural de geração XML canônica  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Objetivo

Implementar exclusivamente a infraestrutura canônica de geração de XML dentro da Enterprise Foundation.

Esta Sprint **não** gera XML TISS válido para operadoras, **não** implementa regras ANS e **não** cria lógica específica de operadora, contrato ou tenant.

---

## 2. Cadeia oficial

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

Único contrato de materialização canônica: `XMLGenerationRuntimePort`.  
Módulo oficial: `src/lib/enterprise/xml-generation-runtime/`.

---

## 3. Entregáveis

| # | Entregável | Status |
|---|------------|--------|
| 1 | `XMLGenerationRuntimePort` | ✓ |
| 2 | Canonical XML Request | ✓ |
| 3 | Canonical XML Result | ✓ |
| 4 | Canonical XML Structure (`realXmlGenerated = false`) | ✓ |
| 5 | XML Generation Provider (`createXMLGenerationRuntimePort`) | ✓ |
| 6 | XML Generation Factory | ✓ |
| 7 | XML Generation Registry | ✓ |
| 8 | Default XML Generation Adapter | ✓ |
| 9 | Mock XML Generation Adapter | ✓ |
| 10 | InMemory XML Generation Store | ✓ |
| 11 | Wiring Enterprise Runtime | ✓ |
| 12 | Wiring TISS Runtime | ✓ |
| 13 | Wiring XML Runtime → Generation Runtime | ✓ |
| 14 | Health Check | ✓ |
| 15 | Capabilities | ✓ |
| 16 | Demo (`getXMLGenerationRuntimeHealthSummary`) | ✓ |
| 17 | Testes (`enterprise:xml-generation-runtime:test`) | ✓ |
| 18 | Documentação | ✓ |

---

## 4. Escopo explícito fora desta Sprint

- XML TISS oficial / ANS / operadora / contrato / tenant
- Namespaces reais, XSD, validação XML, assinatura, certificado
- SOAP, WebService, envio, upload, download
- Parser/serializer XML específico
- Regras de negócio

---

## 5. Integração

- `DefaultEnterpriseRuntime` resolve e expõe `getXMLGenerationRuntimePort()`
- `DefaultTISSRuntimeAdapter` exige `getXMLGenerationRuntimePort()` em `enterpriseDeps`
- `DefaultXMLRuntimeAdapter.generate()` consome exclusivamente `XMLGenerationRuntimePort.generate()`
- Health agregado inclui `xmlGenerationRuntimeOk`

---

## 6. Roadmap

**Não** iniciar imediatamente integrações com operadoras ou geração de XML TISS real.

Executar obrigatoriamente a Sprint **TISS-XMLGEN-GATE-01** (auditoria arquitetural completa) antes de qualquer etapa funcional seguinte.
