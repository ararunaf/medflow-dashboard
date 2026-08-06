# Regra Permanente nº 23 — Release Baseline Certification (RULE_23)

**Status:** Vigente a partir da Sprint D-01A (2026-08-05)  
**Escopo:** Todas as Sprints Enterprise (BLOCO D e subsequentes); qualquer Sprint que pretenda servir de base para a seguinte  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_20.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_20.md)

---

## 1. Regra Permanente

### 1.1 Fonte única do roadmap

A **RULE_23** é a **única fonte oficial** para definição do escopo das Sprints do BLOCO D.

Nenhuma Sprint funcional pode ser iniciada sem estar previamente registrada no Roadmap do BLOCO D (seção 5 deste documento), e a sua capability de entrega deve estar explicitamente listada e com status `autorizada (não iniciada)`.

### 1.2 Uma capability por Sprint

Toda Sprint funcional do BLOCO D implementa **exatamente uma capability**.

A capability é declarada por um único flag `*Implemented = true` no runtime correspondente. Nenhuma Sprint pode ativar mais de um desses flags nem pode antecipar capabilities futuras.

### 1.3 Sprint funcional seguida de certificação

Toda Sprint funcional deverá ser seguida por uma **Sprint de Release Certification e Baseline Freeze**.

O ciclo obrigatório é:

```
D-NN  →  Sprint funcional (uma capability)
D-NNR →  Release Certification (auditoria • gates • documentação • publicação)
        →  OFFICIAL RELEASE BASELINE congelada
D-(NN+1) → próxima Sprint funcional autorizada sobre a Baseline congelada
```

### 1.4 Nenhuma capability sem registro

Nenhuma capability poderá ser implementada sem estar previamente registrada na RULE_23.

### 1.5 Nenhuma antecipação de capabilities futuras

Nenhuma Sprint poderá antecipar, esboçar, simular ou parcialmente implementar capabilities de Sprints futuras, mesmo como `false`, `stub` ou `placeholder` funcional.

### 1.6 Nenhuma ampliação de escopo

Nenhuma Sprint poderá ampliar seu escopo além da capability definida.

Correções, ajustes de teste e documentação de entrega podem ocorrer, desde que não ativem flags de capabilities fora da Sprint.

---

## 2. Release Baseline Certification

Toda Sprint somente poderá servir de base para a Sprint seguinte quando possuir:

| Critério            | Obrigatório |
| ------------------- | ----------- |
| GO Técnico          | ✓           |
| GO Administrativo   | ✓           |
| Working Tree limpa  | ✓           |
| Push realizado      | ✓           |
| Hash local = remoto | ✓           |
| Ahead = 0           | ✓           |
| Behind = 0          | ✓           |

A Sprint certificada passa a ser denominada:

**OFFICIAL RELEASE BASELINE**

Nenhuma implementação funcional é realizada por esta regra — apenas governança de baseline.

---

## 3. Definições oficiais

| Termo                          | Significado                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GO Técnico**                 | Build, TypeScript, ESLint, Smoke e suítes Enterprise/peers relevantes em **PASS**, sem regressão                                                                           |
| **GO Administrativo**          | Auditoria de escopo concluída; documentação oficial publicada; commit de entrega confirmado; Working Tree limpa; push sincronizado (ahead/behind = 0; hash local = remoto) |
| **OFFICIAL RELEASE BASELINE**  | Sprint que cumpriu GO Técnico + GO Administrativo e está publicada como base autorizada para a Sprint seguinte                                                             |
| **Baseline Funcional Oficial** | Primeira baseline do BLOCO D com capacidade funcional certificada (D-01 / D-01A = XML Functional Parser)                                                                   |

---

## 4. Princípios oficiais

| Princípio                     | Aplicação                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Base só após certificação     | A Sprint N+1 só inicia sobre uma OFFICIAL RELEASE BASELINE                          |
| Duplo GO                      | Técnico e Administrativo são independentes e ambos obrigatórios                     |
| Sincronização Git             | Local e remoto idênticos; ahead = 0; behind = 0                                     |
| Working Tree limpa            | Nenhum arquivo da Sprint fora do Git; sem untracked da Sprint                       |
| Sem implementação nesta regra | RULE_23 não autoriza código funcional — só publicação/governança                    |
| Fonte única                   | Apenas RULE_23 define o roadmap do BLOCO D                                          |
| Uma capability por Sprint     | Cada Sprint funcional ativa exatamente um `*Implemented = true`                     |
| Certificação obrigatória      | Cada Sprint funcional é seguida de D-NNR de Release Certification e Baseline Freeze |

---

## 5. Relação com RULE_20

| Regra                                      | Foco                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| RULE_20 — Incremental Functional Evolution | Uma capacidade funcional por Sprint                                              |
| RULE_23 — Release Baseline Certification   | A Sprint só vira base da seguinte após GO Técnico + GO Administrativo + sync Git |

RULE_23 complementa RULE_20: além de evoluir uma capacidade por vez, cada entrega funcional (e seu gate) deve ser publicada como **OFFICIAL RELEASE BASELINE** antes de autorizar a próxima Sprint.

---

## 6. Roadmap do Bloco D

**Fonte única e oficial do roadmap de implementação.**

A ordem das Sprints segue uma sequência funcional coerente derivada da matriz canônica de capabilities em `XMLValidationRuntimeCapabilities` (`src/lib/enterprise/xml-validation-runtime/ports/canonical.ts`), respeitando as dependências entre as validações. O fechamento `xmlValidationImplemented` é a capability agregadora do runtime, portanto é a última Sprint do Bloco D.

| Sprint | Sprint de certificação | Capability                       | Nome oficial                                                              | Status                    |
| ------ | ---------------------- | -------------------------------- | ------------------------------------------------------------------------- | ------------------------- |
| D-01   | D-01A                  | `parserImplemented`              | Enterprise XML Functional Parser Foundation                               | Concluída / certificada   |
| D-02   | D-02R                  | `xsdValidationImplemented`       | Enterprise XML Validation Runtime — XSD Validation                        | Concluída / certificada   |
| D-03   | D-03R                  | `schemaSelectionImplemented`     | Enterprise XML Schema Runtime — Schema Selection                          | Concluída / certificada   |
| D-04   | D-04R                  | `namespaceValidationImplemented` | Enterprise XML Namespace Runtime — Namespace Validation                   | Concluída / certificada   |
| D-05   | D-05R                  | `versionValidationImplemented`   | Enterprise XML Version Runtime — Version Validation                       | Concluída / certificada   |
| D-06   | D-06R                  | `businessValidationImplemented`  | Enterprise XML Business Validation Runtime — Business Rules Validation    | Autorizada (não iniciada) |
| D-07   | D-07R                  | `operatorValidationImplemented`  | Enterprise XML Operator Validation Runtime — Operator-Specific Validation | Planejada                 |
| D-08   | D-08R                  | `xmlRepairImplemented`           | Enterprise XML Repair Runtime — XML Repair                                | Planejada                 |
| D-09   | D-09R                  | `automaticCorrectionImplemented` | Enterprise XML Correction Runtime — Automatic Correction                  | Planejada                 |
| D-10   | D-10R                  | `validationReportImplemented`    | Enterprise XML Report Runtime — Validation Report                         | Planejada                 |
| D-11   | D-11R                  | `xmlValidationImplemented`       | Enterprise XML Validation Runtime — Generic XML Validation                | Planejada                 |

**Regras do Roadmap:**

1. Uma Sprint só pode iniciar quando a anterior estiver certificada e congelada.
2. O status `Autorizada (não iniciada)` indica que a Baseline anterior permite o início.
3. O status `Planejada` indica que ainda depende da conclusão de Sprints anteriores.
4. Nenhuma Sprint pode alterar o escopo de outra Sprint.
5. A identificação do runtime (`xml-validation-runtime`, `xml-namespace-runtime`, `xml-version-runtime`, etc.) será definida no planejamento da Sprint, respeitando a arquitetura Ports / Adapters / Registry existente.

---

## 7. Aplicação na Sprint D-01A

| Item                                     | Valor                                                              |
| ---------------------------------------- | ------------------------------------------------------------------ |
| Sprint de entrega                        | D-01 — Enterprise XML Functional Parser Foundation                 |
| Sprint de gate                           | D-01A — Enterprise XML Functional Parser Gate                      |
| Capacidade certificada                   | XML Parser genérico (`parserImplemented = true`)                   |
| Resultado                                | D-01 torna-se a **primeira Baseline Funcional Oficial** do BLOCO D |
| Próxima Sprint autorizada (não iniciada) | D-02 — Enterprise XML Validation Runtime Functional Foundation     |

---

## 8. Aplicação na Sprint D-02R

| Item                                     | Valor                                                            |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Sprint de entrega                        | D-02 — Enterprise XML Validation Runtime Functional Foundation   |
| Sprint de gate                           | D-02R — XML Validation Runtime Release Certification             |
| Capacidade certificada                   | XSD Validation (`xsdValidationImplemented = true`)               |
| Commit de entrega                        | `f552553`                                                        |
| Data                                     | 2026-08-06                                                       |
| Resultado                                | D-02 torna-se a **segunda OFFICIAL RELEASE BASELINE** do BLOCO D |
| Próxima Sprint autorizada (não iniciada) | **D-03** — Enterprise XML Schema Runtime Functional Foundation   |

---

## 9. Aplicação na Sprint D-03R

| Item                                     | Valor                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Sprint de entrega                        | D-03 — Enterprise XML Schema Runtime Functional Foundation                                            |
| Sprint de gate                           | D-03R — XML Schema Runtime Release Certification                                                      |
| Capacidade certificada                   | Schema Selection (`schemaSelectionImplemented = true`)                                                |
| Commit de entrega                        | `31deb22`                                                                                             |
| Data                                     | 2026-08-06                                                                                            |
| Resultado                                | D-03 torna-se a **terceira OFFICIAL RELEASE BASELINE** do BLOCO D                                     |
| Próxima Sprint autorizada (não iniciada) | **D-04** — Enterprise XML Namespace Runtime — Namespace Validation (`namespaceValidationImplemented`) |

---

## 10. Aplicação na Sprint D-04R

| Item                                     | Valor                                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Sprint de entrega                        | D-04 — Enterprise XML Namespace Runtime — Namespace Validation                                  |
| Sprint de gate                           | D-04R — XML Namespace Validation Release Certification                                          |
| Capacidade certificada                   | Namespace Validation (`namespaceValidationImplemented = true`)                                  |
| Commit de entrega                        | `dcd6d84`                                                                                       |
| Data                                     | 2026-08-06                                                                                      |
| Resultado                                | D-04 torna-se a **quarta OFFICIAL RELEASE BASELINE** do BLOCO D                                 |
| Próxima Sprint autorizada (não iniciada) | **D-05** — Enterprise XML Version Runtime — Version Validation (`versionValidationImplemented`) |

---

## 11. O que esta regra NÃO é

## 10. Aplicação na Sprint D-05R

| Item                                     | Valor                                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Sprint de entrega                        | D-05 — Enterprise XML Version Runtime — Version Validation                                               |
| Sprint de gate                           | D-05R — XML Version Validation Release Certification                                                     |
| Capacidade certificada                   | Version Validation (`versionValidationImplemented = true`)                                               |
| Commit de entrega                        | `c6aa570`                                                                                                |
| Data                                     | 2026-08-06                                                                                               |
| Resultado                                | D-05 torna-se a **quinta OFFICIAL RELEASE BASELINE** do BLOCO D                                          |
| Próxima Sprint autorizada (não iniciada) | **D-06** — Enterprise XML Business Validation Runtime — Business Rules (`businessValidationImplemented`) |

---

## 11. O que esta regra NÃO é

- Não implementa XSD / XML Validation / SOAP / Operadoras / Workflow / Authorization
- Não altera XML Parser, XML Runtime, Enterprise Runtime ou Contratos Canônicos
- Não autoriza iniciar a Sprint seguinte dentro da Sprint de certificação
- Não substitui as Regras Permanentes 1–22
- Não é uma especificação técnica de implementação (detalhes de cada Sprint são definidos no respectivo documento de entrega)

---

## 12. Vigência

A partir de **D-01A — Enterprise XML Functional Parser Gate**, toda Sprint somente poderá servir de base para a Sprint seguinte quando cumprir **RELEASE BASELINE CERTIFICATION** e for publicada como **OFFICIAL RELEASE BASELINE**.

A partir desta refatoração (ARCH-01), a RULE_23 passa a ser a **única fonte oficial do roadmap de Sprints do BLOCO D**. Qualquer outro documento, comentário ou contexto que conflite com a RULE_23 deve ser considerado obsoleto até que seja atualizado.
