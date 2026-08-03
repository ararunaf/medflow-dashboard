# TISS-07 — XML Schema Certification

**Sprint:** TISS-07 — Enterprise XML Schema Runtime  
**Data:** 03/08/2026  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Certificação obrigatória (25 perguntas)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | XML Schema Runtime foi criado? | **SIM** — `src/lib/enterprise/xml-schema-runtime/` |
| 2 | Foi integrado ao Enterprise Runtime? | **SIM** — `getXMLSchemaRuntimePort()` + health `xmlSchemaRuntimeOk` |
| 3 | Foi integrado ao TISS Runtime? | **SIM** — `enterpriseDeps.getXMLSchemaRuntimePort` obrigatório |
| 4 | Foi integrado ao XML Runtime? | **SIM** — cadeia oficial inclui XML Runtime antes do Schema |
| 5 | Foi integrado ao XML Generation Runtime? | **SIM** — cadeia oficial inclui Generation antes do Schema |
| 6 | Foi integrado ao XML Serializer Runtime? | **SIM** — TISS Runtime registra schema após serialize |
| 7 | Todo acesso passa exclusivamente pelo XMLSchemaRuntimePort? | **SIM** |
| 8 | Existe Provider paralelo? | **NÃO** |
| 9 | Existe Adapter paralelo? | **NÃO** |
| 10 | Existe Runtime paralelo? | **NÃO** |
| 11 | Existe bypass? | **NÃO** |
| 12 | Existe XSD oficial? | **NÃO** |
| 13 | Existe validação XSD? | **NÃO** |
| 14 | Existe XML TISS? | **NÃO** |
| 15 | Existe XML ANS? | **NÃO** |
| 16 | Existe namespace oficial? | **NÃO** |
| 17 | Build PASS? | **SIM** (evidência na execução da Sprint) |
| 18 | TypeScript PASS? | **SIM** |
| 19 | ESLint PASS? | **SIM** |
| 20 | Smoke PASS? | **SIM** |
| 21 | Enterprise PASS? | **SIM** |
| 22 | Capture PASS? | **SIM** |
| 23 | Existe regressão? | **NÃO** |
| 24 | ECS-01 permanece íntegro? | **SIM** |
| 25 | XML Schema Runtime está oficialmente integrado à Enterprise Foundation? | **SIM** |

---

## 2. Auditoria

| Item | Resultado |
|------|-----------|
| XSD fora do Runtime? | **NÃO** |
| Validação fora do Runtime? | **NÃO** |
| Provider paralelo? | **NÃO** |
| Adapter paralelo? | **NÃO** |
| Runtime paralelo? | **NÃO** |
| Bypass? | **NÃO** |
| Conhecimento XML específico? | **NÃO** (apenas canônico estrutural) |
| Conhecimento ANS? | **NÃO** |
| Conhecimento de operadora? | **NÃO** |
| Conhecimento de contrato? | **NÃO** |
| Conhecimento de tenant? | **NÃO** |

---

## 3. Checklist de aceitação

- [x] XML Schema Runtime criado
- [x] XMLSchemaRuntimePort integrado
- [x] Enterprise Runtime integrado
- [x] TISS Runtime integrado
- [x] XML Runtime / Generation / Serializer na cadeia oficial
- [x] Nenhum Provider/Adapter/Runtime paralelo
- [x] Nenhum bypass
- [x] Nenhum XSD oficial / validação XSD / XML TISS / XML ANS
- [x] Build / TypeScript / ESLint / Smoke / Enterprise / Capture PASS
- [x] Nenhuma regressão / ECS-01 íntegro

---

## 4. Ressalvas AER

| ID | Título | Prioridade | Status |
|----|--------|------------|--------|
| AER-XMLSCH-B1 | Escape hatch `getXMLSchemaRuntimePort()` | Baixa | Aceita |
| AER-XMLSCH-B2 | Barrel exporta Store + `getStore()` no Adapter (Schema) | Baixa | Aceita |

Espelhos conscientes de AER-XMLSER-B1/B2 / AER-XMLGEN-B1/B2.

---

## 5. Roadmap pós-sprint

**Não** implementar validação de XML.

Próxima Sprint obrigatória:

**TISS-SCHEMA-GATE-01** — Certificação completa da infraestrutura do XML Schema Runtime antes de qualquer implementação de XSD ou validação XML.
