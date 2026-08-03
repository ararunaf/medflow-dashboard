# TISS-08 — XML Validation Certification

**Sprint:** TISS-08 — Enterprise XML Validation Runtime  
**Data:** 03/08/2026  
**Parecer:** **GO COM RESSALVAS**

---

## 1. Certificação obrigatória (25 perguntas)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | XML Validation Runtime criado? | **SIM** — `src/lib/enterprise/xml-validation-runtime/` |
| 2 | Integrado ao Enterprise Runtime? | **SIM** — `getXMLValidationRuntimePort()` + health `xmlValidationRuntimeOk` |
| 3 | Integrado ao TISS Runtime? | **SIM** — `enterpriseDeps.getXMLValidationRuntimePort` obrigatório |
| 4 | Integrado ao XML Runtime? | **SIM** — cadeia oficial inclui XML Runtime antes da Validation |
| 5 | Integrado ao XML Generation Runtime? | **SIM** — cadeia oficial inclui Generation |
| 6 | Integrado ao XML Serializer Runtime? | **SIM** — cadeia oficial inclui Serializer |
| 7 | Integrado ao XML Schema Runtime? | **SIM** — TISS Runtime chama `validate()` após `register()` do Schema |
| 8 | Todo acesso passa exclusivamente pelo XMLValidationRuntimePort? | **SIM** |
| 9 | Existe Provider paralelo? | **NÃO** |
| 10 | Existe Adapter paralelo? | **NÃO** |
| 11 | Existe Runtime paralelo? | **NÃO** |
| 12 | Existe bypass? | **NÃO** |
| 13 | Existe validação XML real? | **NÃO** |
| 14 | Existe validação XSD? | **NÃO** |
| 15 | Existe XSD oficial? | **NÃO** |
| 16 | Existe namespace oficial? | **NÃO** |
| 17 | Build PASS? | **SIM** (evidência na execução da Sprint) |
| 18 | TypeScript PASS? | **SIM** |
| 19 | ESLint PASS? | **SIM** |
| 20 | Smoke PASS? | **SIM** |
| 21 | Enterprise PASS? | **SIM** |
| 22 | Capture PASS? | **SIM** |
| 23 | Existe regressão? | **NÃO** |
| 24 | ECS-01 permanece íntegro? | **SIM** |
| 25 | XML Validation Runtime está oficialmente integrado à Enterprise Foundation? | **SIM** |

---

## 2. Auditoria

| Item | Resultado |
|------|-----------|
| Validação fora do Runtime? | **NÃO** |
| XSD fora do Runtime? | **NÃO** |
| Provider paralelo? | **NÃO** |
| Adapter paralelo? | **NÃO** |
| Runtime paralelo? | **NÃO** |
| Bypass? | **NÃO** |
| Conhecimento XML específico? | **NÃO** (apenas canônico estrutural) |
| Conhecimento TISS? | **NÃO** |
| Conhecimento ANS? | **NÃO** |
| Conhecimento de operadora? | **NÃO** |
| Conhecimento de contrato? | **NÃO** |
| Conhecimento de tenant? | **NÃO** |

---

## 3. Checklist de aceitação

- [x] XML Validation Runtime criado
- [x] XMLValidationRuntimePort integrado
- [x] Enterprise Runtime integrado
- [x] TISS Runtime integrado
- [x] XML Runtime / Generation / Serializer / Schema na cadeia oficial
- [x] Nenhum Provider/Adapter/Runtime paralelo
- [x] Nenhum bypass
- [x] Nenhuma validação XML real / XSD / XSD oficial / namespace oficial
- [x] Build / TypeScript / ESLint / Smoke / Enterprise / Capture PASS
- [x] Nenhuma regressão / ECS-01 íntegro

---

## 4. Ressalvas AER

| ID | Título | Prioridade | Status |
|----|--------|------------|--------|
| AER-XMLVAL-B1 | Escape hatch `getXMLValidationRuntimePort()` | Baixa | Aceita |
| AER-XMLVAL-B2 | Barrel exporta Store + `getStore()` no Adapter (Validation) | Baixa | Aceita |

---

## 5. Próximo roadmap

**TISS-VALIDATION-GATE-01** — certificar oficialmente a infraestrutura do XML Validation Runtime antes de qualquer XSD oficial, validação XML real, namespaces ANS ou regras de negócio.
