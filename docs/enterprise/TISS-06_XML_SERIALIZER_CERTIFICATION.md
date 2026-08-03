# TISS-06 — XML Serializer Certification

**Sprint:** TISS-06 — Enterprise XML TISS Serializer Runtime  
**Data:** 03/08/2026  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Auditoria obrigatória

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Existe serialização XML fora do `XMLSerializerRuntimePort`? | **Não** (na Enterprise Foundation canônica) |
| 2 | Existe Provider paralelo? | **Não** |
| 3 | Existe Adapter paralelo? | **Não** |
| 4 | Existe Runtime paralelo? | **Não** |
| 5 | Existe bypass? | **Não** |
| 6 | Existe serializer específico? | **Não** |
| 7 | Existe serializer TISS? | **Não** |
| 8 | Existe serializer ANS? | **Não** |
| 9 | Existe lógica de operadora? | **Não** |
| 10 | Existe lógica de contrato? | **Não** |
| 11 | Existe lógica de tenant? | **Não** |
| 12 | Existe XML TISS real? | **Não** (`realTissXmlGenerated = false`) |
| 13 | Existe XML ANS real? | **Não** (`realAnsXmlGenerated = false`) |

---

## 2. Checklist de aceite

| Critério | Status |
|----------|--------|
| `XMLSerializerRuntimePort` implementado | ✓ |
| Integração ao XML Generation Runtime (estrutura canônica via Port) | ✓ |
| Integração ao Enterprise Runtime | ✓ |
| Integração ao TISS Runtime | ✓ |
| Nenhum bypass | ✓ |
| Nenhum Provider/Adapter/Runtime paralelo | ✓ |
| Nenhum serializer específico / TISS / ANS | ✓ |
| Nenhum XML TISS/ANS real | ✓ |
| ECS-01 aderente | ✓ |
| Testes `enterprise:xml-serializer-runtime:test` | ✓ |

---

## 3. Gates

| Gate | Comando | Esperado |
|------|---------|----------|
| Serializer Runtime | `npm run enterprise:xml-serializer-runtime:test` | PASS |
| Enterprise Runtime | `npm run enterprise:runtime:test` | PASS |
| XML Runtime | `npm run enterprise:xml-runtime:test` | PASS |
| XML Generation Runtime | `npm run enterprise:xml-generation-runtime:test` | PASS |
| TISS Catalog | `npm run enterprise:tiss-catalog:test` | PASS |
| Rule Pack Engine | `npm run enterprise:rule-pack-engine:test` | PASS |
| Capture | `npm run capture:test` | PASS |
| Build | `npm run build` | PASS |
| TypeScript | `npx tsc --noEmit` | PASS |
| ESLint | `npm run lint` | PASS |
| Smoke | `npm run smoke-check` | PASS |

---

## 4. Ressalvas (Baixa / Aceitas)

| ID | Título | Status |
|----|--------|--------|
| AER-XMLSER-B1 | Escape hatch `getXMLSerializerRuntimePort()` | Aceita |
| AER-XMLSER-B2 | Barrel exporta Store + `getStore()` no Adapter | Aceita |

Ressalvas pré-existentes reconfirmadas Aceitas: **AER-XMLGEN-B1…B2**, **AER-XMLRT-B1…B3**.

---

## 5. Roadmap pós-Sprint

1. **TISS-06A — XML Serializer Gate** (obrigatório)
2. Somente depois: **TISS-07 — Enterprise XML Schema Runtime**
