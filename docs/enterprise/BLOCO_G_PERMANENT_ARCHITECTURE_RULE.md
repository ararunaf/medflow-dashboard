# BLOCO G — Regra Permanente de Arquitetura — TISS Enterprise

**Bloco:** BLOCO G — TISS Enterprise  
**Status:** Arquitetura homologada; G-01 autorizada (não iniciada)  
**Data:** 2026-08-07  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`

---

## 1. Objetivo do Bloco G

O BLOCO G define a **TISS Enterprise**, responsável por processar, validar, corrigir, serializar e orquestrar mensagens no padrão TISS (Troca de Informações em Saúde Suplementar) de forma declarativa, versionada e desacoplada dos demais domínios do sistema.

O Bloco G consome os produtos entregues pelo Bloco D (XML Runtime, XML Validation Runtime), pelo Bloco E (Enterprise Business Engine) e pelo Bloco F (Enterprise Integration Engine) para aplicar conhecimento canônico de TISS sem hardcode de versões, operadoras ou regras específicas.

---

## 2. Princípios Permanentes

### 2.1 Regra Permanente nº 34 — TISS Contido no Bloco G

Toda lógica específica de TISS, ANS, operadoras de saúde, versões de layout, terminologias e regras de negócio do padrão TISS estará exclusivamente no Bloco G. Nenhum outro bloco poderá conter lógica TISS específica.

### 2.2 Regra Permanente nº 35 — Consumo Exclusivo via Port

O Bloco G expõe suas capacidades exclusivamente por Ports. Nenhum produto externo pode importar implementações concretas (Adapters, Stores, Engines) do Bloco G. O acesso é feito somente via `TISSEnterprisePort`.

### 2.3 Regra Permanente nº 36 — Incremental Functional Evolution

Cada Sprint do Bloco G ativa **exatamente uma** nova capability. As Sprints anteriores permanecem íntegras e homologadas. A matriz de capabilities `TISSEnterpriseCapabilities` reflete a sequência G-01 a G-10.

### 2.4 Regra Permanente nº 37 — Orquestração sem Duplicação

A Sprint final (G-10) atua apenas como orquestradora das capabilities G-01 a G-09. Não pode reimplementar lógica já entregue pelas Sprints anteriores.

### 2.5 Regra Permanente nº 38 — Reutilização Obrigatória

Todo engine G-N deve reutilizar os engines G-1 a G-(N-1) e, quando necessário, as capacidades canônicas dos Blocos D, E e F. Nenhuma lógica de TISS pode ser duplicada entre engines.

### 2.6 Regra Permanente nº 39 — Conhecimento Canônico

Toda regra, layout, versão, terminologia e configuração de operadora deve ser carregada externamente como conhecimento canônico. Nenhum dado TISS pode ser hardcoded em engines, adapters ou ports.

---

## 3. Responsabilidades

A TISS Enterprise é responsável por:

1. **TISS Knowledge (G-01):** base de conhecimento de versões, layouts e terminologias TISS.
2. **TISS Layout (G-02):** definição e resolução de layouts TISS canônicos.
3. **TISS Parser (G-03):** parse de mensagens TISS em estruturas canônicas.
4. **TISS Serializer (G-04):** serialização de estruturas canônicas para mensagens TISS.
5. **TISS Schema Validation (G-05):** validação de schema e estrutura XML TISS.
6. **TISS Business Validation (G-06):** validação de regras de negócio TISS / ANS.
7. **TISS Operator Validation (G-07):** validação de regras específicas de operadoras.
8. **TISS Repair (G-08):** correção estrutural automática de TISS.
9. **TISS Correction (G-09):** correção declarativa e sugestiva de TISS.
10. **TISS Engine (G-10):** orquestrar G-01 a G-09 via `TISSEnterprisePort`.

---

## 4. Dependências Permitidas

| Dependência                          | Fonte   | Uso                                                 |
| ------------------------------------ | ------- | --------------------------------------------------- |
| `XMLRuntimePort` (Bloco D)           | Bloco D | Parse e serialização XML                            |
| `XMLValidationRuntimePort` (Bloco D) | Bloco D | Validação estrutural, schema e regras XML           |
| `BusinessEnginePort` (Bloco E)       | Bloco E | Orquestrar regras, decisões e validações de negócio |
| `IntegrationEnginePort` (Bloco F)    | Bloco F | Orquestrar integração, transformação e roteamento   |
| `EnterpriseRuntime` (Bloco C)        | Bloco C | Wiring e health do runtime enterprise               |

O Bloco G **não** pode importar diretamente Adapters, Stores ou implementações concretas dos Blocos C, D, E ou F. O acesso deve ocorrer exclusivamente via Ports.

---

## 5. Roadmap

| Sprint   | Sprint de certificação | Capability                          | Nome oficial                                 | Status                    |
| -------- | ---------------------- | ----------------------------------- | -------------------------------------------- | ------------------------- |
| ARCH-G01 | ARCH-G01-A             | —                                   | TISS Enterprise Architecture                 | Concluída / homologada    |
| G-01     | G-01R                  | `tissKnowledgeImplemented`          | TISS Enterprise — Knowledge Engine           | Concluída / certificada   |
| G-02     | G-02R                  | `tissLayoutImplemented`             | TISS Enterprise — Layout Engine              | Concluída / certificada   |
| G-03     | G-03R                  | `tissParserImplemented`             | TISS Enterprise — Parser Engine              | Autorizada (não iniciada) |
| G-04     | G-04R                  | `tissSerializerImplemented`         | TISS Enterprise — Serializer Engine          | Planejada                 |
| G-05     | G-05R                  | `tissSchemaValidationImplemented`   | TISS Enterprise — Schema Validation Engine   | Planejada                 |
| G-06     | G-06R                  | `tissBusinessValidationImplemented` | TISS Enterprise — Business Validation Engine | Planejada                 |
| G-07     | G-07R                  | `tissOperatorValidationImplemented` | TISS Enterprise — Operator Validation Engine | Planejada                 |
| G-08     | G-08R                  | `tissRepairImplemented`             | TISS Enterprise — Repair Engine              | Planejada                 |
| G-09     | G-09R                  | `tissCorrectionImplemented`         | TISS Enterprise — Correction Engine          | Planejada                 |
| G-10     | G-10R                  | `tissEngineImplemented`             | TISS Enterprise — Generic TISS Engine        | Planejada                 |
| AUDIT-G  | AUDIT-G-R              | —                                   | TISS Enterprise — Architecture Audit         | Planejada                 |

---

## 6. Interfaces Públicas

A superfície pública do Bloco G será composta por:

- `TISSEnterprisePort` — contrato único de TISS Enterprise.
- `TISSEnterpriseCapabilities` — matriz progressiva de capabilities.
- `TISSEnterpriseRegistry` — registro de providers e adapters.
- `createTISSEnterprisePort` — factory oficial.
- Modelos canônicos de `TISSKnowledge`, `TISSLayout`, `TISSMessage`, `TISSValidation`, `TISSRepair`, `TISSCorrection` e `TISSReport`.

Nenhuma implementação concreta (Adapter, Store, Engine) será pública.

---

## 7. Canonical Models

O Bloco G operará com os seguintes modelos canônicos genéricos:

- `CanonicalTISSVersion`
- `CanonicalTISSLayout`
- `CanonicalTISSMessage`
- `CanonicalTISSValidation`
- `CanonicalTISSRepair`
- `CanonicalTISSCorrection`
- `CanonicalTISSReport`

Cada modelo será estrutural e não conterá regras específicas hardcoded.

---

## 8. Regras de Evolução

- Cada Sprint implementa **uma única capability**.
- Nenhum código pode conter versões, operadoras, regras ou terminologias TISS hardcoded.
- Toda configuração TISS é representada por conhecimento canônico carregado externamente.
- Adapters e Engines reutilizam Ports estabelecidos.
- Testes devem evidenciar a capability sem duplicar lógica de testes anteriores.

---

## 9. Critérios para Início de G-01

A Sprint G-01 poderá iniciar apenas após:

1. Homologação da arquitetura ARCH-G01.
2. Aprovação desta Regra Permanente.
3. Baseline do Bloco F congelada.

---

## 10. O que esta regra NÃO é

- Não é uma especificação técnica detalhada de cada engine.
- Não substitui os critérios de aceite individuais de cada Sprint.
- Não autoriza alterações em Blocos D, E ou F.
- Não antecipa a implementação de nenhuma Sprint funcional.
