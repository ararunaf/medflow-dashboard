# TISS-06 — Enterprise XML Serializer Runtime

**Sprint:** TISS-06 — Enterprise XML TISS Serializer Runtime  
**Data:** 03/08/2026  
**Natureza:** Fundação arquitetural de serialização XML canônica  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Objetivo

Implementar exclusivamente a infraestrutura canônica de serialização XML dentro da Enterprise Foundation.

Esta Sprint transforma o modelo XML canônico produzido pelo XML Generation Runtime em uma **string XML canônica**, sem implementar regras ANS, operadoras, contratos, tenants, XSD ou validação.

O Serializer permanece completamente desacoplado da lógica de negócio e **não conhece padrões TISS**.

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
  → XMLSerializerRuntimePort
  → DefaultXMLSerializerAdapter
  → InMemoryXMLSerializerRuntimeStore
  → Canonical XML String
```

Único contrato de serialização canônica: `XMLSerializerRuntimePort`.  
Módulo oficial: `src/lib/enterprise/xml-serializer-runtime/`.

Flags obrigatórias do resultado:

- `realTissXmlGenerated = false`
- `realAnsXmlGenerated = false`

---

## 3. Entregáveis

| # | Entregável | Status |
|---|------------|--------|
| 1 | `XMLSerializerRuntimePort` | ✓ |
| 2 | Canonical XML Serializer Request | ✓ |
| 3 | Canonical XML Serializer Result | ✓ |
| 4 | Canonical XML String (`realTissXmlGenerated = false`, `realAnsXmlGenerated = false`) | ✓ |
| 5 | XML Serializer Provider (`createXMLSerializerRuntimePort`) | ✓ |
| 6 | XML Serializer Factory | ✓ |
| 7 | XML Serializer Registry | ✓ |
| 8 | Default XML Serializer Adapter | ✓ |
| 9 | Mock XML Serializer Adapter | ✓ |
| 10 | InMemory XML Serializer Store | ✓ |
| 11 | Wiring Enterprise Runtime | ✓ |
| 12 | Wiring TISS Runtime | ✓ |
| 13 | Integração obrigatória ao XML Generation Runtime (via Port / estrutura canônica) | ✓ |
| 14 | Health Check | ✓ |
| 15 | Capabilities | ✓ |
| 16 | Demo (`getXMLSerializerRuntimeHealthSummary`) | ✓ |
| 17 | Testes (`enterprise:xml-serializer-runtime:test`) | ✓ |
| 18 | Documentação | ✓ |

---

## 4. Escopo explícito fora desta Sprint

- XML TISS oficial / ANS / operadora / contrato / tenant
- Namespaces ANS, schemas XSD, validação XML/XSD
- Assinatura digital, certificado digital
- SOAP, WebService, envio, upload, download
- Serializer específico de operadora / TISS / ANS
- Regras de negócio

---

## 5. Integração

- `DefaultEnterpriseRuntime` resolve e expõe `getXMLSerializerRuntimePort()`
- `DefaultTISSRuntimeAdapter` exige `getXMLSerializerRuntimePort()` em `enterpriseDeps`
- Após `XMLRuntimePort.generate()` (que consome `XMLGenerationRuntimePort`), o TISS Runtime serializa a `CanonicalXMLStructure` exclusivamente via `XMLSerializerRuntimePort.serialize()`
- Health agregado inclui `xmlSerializerRuntimeOk`
- Módulos `xml-runtime` e `xml-generation-runtime` **não** importam o Serializer (preserva auditorias que proíbem API DOM `XMLSerializer` nesses módulos)

---

## 6. Roadmap

**Não** iniciar imediatamente suporte a XSD, namespaces ANS ou validações.

Executar obrigatoriamente a Sprint **TISS-06A — XML Serializer Gate** para certificar exclusividade do Port, ausência de bypasses e aderência ao ECS-01.

Somente após essa certificação liberar:

**TISS-07 — Enterprise XML Schema Runtime** (infraestrutura de schemas XSD, ainda sem validações ANS/operadoras/regras).
