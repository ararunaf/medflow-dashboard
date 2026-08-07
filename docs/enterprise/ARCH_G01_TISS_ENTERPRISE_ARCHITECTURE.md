# ARCH-G01 — TISS Enterprise Architecture

**Sprint de entrega:** ARCH-G01 — TISS Enterprise Architecture  
**Bloco:** BLOCO G — TISS Enterprise  
**Status:** Arquitetura homologada  
**Data:** 2026-08-07  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`  
**Próxima Sprint autorizada (não iniciada):** G-01 — TISS Knowledge Base

---

## 1. Objetivos

Projetar a arquitetura oficial do **TISS Enterprise**, a camada de conhecimento, processamento, validação, correção e orquestração específica do padrão TISS (Troca de Informações em Saúde Suplementar) do sistema.

## 2. Limites

O Bloco G:

- **Faz parte do** `src/lib/enterprise/tiss-enterprise/`.
- **Consome** exclusivamente Ports do Bloco D (`XMLValidationRuntimePort`, `XMLRuntimePort`) e do Bloco F (`EnterpriseIntegrationEnginePort`) quando necessário.
- **Implementa** conhecimento canônico de TISS (versões, layouts, terminologias, operadoras, regras ANS) de forma declarativa e configurável.
- **Não altera** os Blocos D, E ou F.
- **Não é iniciado** nesta Sprint (apenas arquitetura).
- **Não cria** código funcional, classes, interfaces, testes ou mocks nesta Sprint.

## 3. Responsabilidades

| Componente                            | Responsabilidade                                        |
| ------------------------------------- | ------------------------------------------------------- |
| `TISSKnowledgeEngine` (G-01)          | Base de conhecimento de versões, layouts e terminologia |
| `TISSLayoutEngine` (G-02)             | Definição e resolução de layouts TISS canônicos         |
| `TISSParserEngine` (G-03)             | Parse de mensagens TISS em estruturas canônicas         |
| `TISSSerializerEngine` (G-04)         | Serialização de estruturas canônicas para TISS          |
| `TISSSchemaValidationEngine` (G-05)   | Validação de schema TISS e estrutura XML                |
| `TISSBusinessValidationEngine` (G-06) | Validação de regras de negócio TISS / ANS               |
| `TISSOperatorValidationEngine` (G-07) | Validação de regras específicas de operadoras           |
| `TISSRepairEngine` (G-08)             | Correção estrutural automática de TISS                  |
| `TISSCorrectionEngine` (G-09)         | Correção declarativa e sugestiva de TISS                |
| `TISSEngine` (G-10)                   | Orquestração de G-01 a G-09                             |

## 4. Capabilities

A capability `TISSEnterpriseCapabilities` é a matriz canônica de flags:

```ts
interface TISSEnterpriseCapabilities {
  tissKnowledgeImplemented: boolean; // G-01
  tissLayoutImplemented: boolean; // G-02
  tissParserImplemented: boolean; // G-03
  tissSerializerImplemented: boolean; // G-04
  tissSchemaValidationImplemented: boolean; // G-05
  tissBusinessValidationImplemented: boolean; // G-06
  tissOperatorValidationImplemented: boolean; // G-07
  tissRepairImplemented: boolean; // G-08
  tissCorrectionImplemented: boolean; // G-09
  tissEngineImplemented: boolean; // G-10
}
```

Todas as capabilities encontram-se **desabilitadas** na ARCH-G01. Apenas uma será ativada por Sprint funcional.

## 5. Sequência das Sprints

| Sprint  | Capability                          | Objetivo                              |
| ------- | ----------------------------------- | ------------------------------------- |
| G-01    | `tissKnowledgeImplemented`          | Base de conhecimento TISS             |
| G-02    | `tissLayoutImplemented`             | Definição de layouts TISS             |
| G-03    | `tissParserImplemented`             | Parser de mensagens TISS              |
| G-04    | `tissSerializerImplemented`         | Serializador de mensagens TISS        |
| G-05    | `tissSchemaValidationImplemented`   | Validação de schema TISS              |
| G-06    | `tissBusinessValidationImplemented` | Validação de regras de negócio TISS   |
| G-07    | `tissOperatorValidationImplemented` | Validação de regras de operadoras     |
| G-08    | `tissRepairImplemented`             | Reparo estrutural de TISS             |
| G-09    | `tissCorrectionImplemented`         | Correção declarativa de TISS          |
| G-10    | `tissEngineImplemented`             | Engine genérica TISS                  |
| AUDIT-G | —                                   | Auditoria arquitetural e congelamento |

## 6. Dependências

### 6.1 Internas

- `XMLValidationRuntimePort` (Bloco D) — validação estrutural e de schema.
- `XMLRuntimePort` (Bloco D) — parse e serialização XML.
- `EnterpriseIntegrationEnginePort` (Bloco F) — orquestração de integração quando necessário.
- `EnterpriseBusinessEnginePort` (Bloco E) — regras de negócio declarativas quando necessário.

### 6.2 Externas

- `EnterpriseRuntime` (wiring e health)
- `DefaultTISSEnterpriseAdapter` (adapter enterprise oficial)
- `MockTISSEnterpriseAdapter` (adapter mock/test)
- `TISSEnterpriseRegistry` (registro de providers e adapters)

## 7. Critérios de Aceite

### 7.1 Para ARCH-G01

- Documentação de arquitetura publicada.
- Roadmap completo do Bloco G aprovado.
- Regras permanentes definidas.
- Nenhuma alteração funcional.
- Nenhuma capability ativada.

### 7.2 Para cada G-N

- Uma única capability ativada.
- Todos os gates em PASS.
- Testes dedicados passando.
- Documentação de certificação publicada.

## 8. Regras Permanentes do Bloco G

1. **RP-34:** TISS somente no Bloco G — nenhum outro bloco conterá lógica específica de TISS.
2. **RP-35:** Consumo exclusivo via `TISSEnterprisePort`.
3. **RP-36:** Uma capability por Sprint.
4. **RP-37:** Sprint final (G-10) apenas orquestra, sem duplicar.
5. **RP-38:** Cada Sprint certificada (G-NR) antes de congelar.
6. **RP-39:** TISS é carregado como conhecimento canônico, nunca hardcoded.

## 9. Critérios para Início do Bloco G

- Bloco F concluído e auditado.
- Baseline Oficial do Bloco F congelada.
- ARCH-G01 homologada e aprovada.
