# ENTERPRISE MASTER ARCHITECTURE

**Sprint:** ARCH-I00 — Enterprise Master Architecture Discovery  
**Data:** 2026-08-08  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`

---

## 1. Sumário executivo

Este documento consolida o inventário arquitetural da plataforma Enterprise construída nos Blocos A a H. A auditoria foi realizada sem alterar código, engines, providers, registries, adapters, contratos, testes ou documentação existente.

**Parecer:** a arquitetura está organizada em camadas unidirecionais, com consumo exclusivo via Ports e reutilização controlada. Nenhuma violação arquitetural crítica foi detectada. O Bloco I pode ser iniciado sobre a camada H, desde que respeite as regras de dependência e reutilização.

---

## 2. Blocos auditados

| Bloco | Nome                                  | Status          |
| ----- | ------------------------------------- | --------------- |
| A     | Captura Inteligente                   | Congelado       |
| B     | Inteligência Documental               | Congelado       |
| C     | Integração Corporativa                | Congelado       |
| D     | Funcionalização Progressiva dos Runtimes | Congelado    |
| E     | Enterprise Business Engine            | Homologado      |
| F     | Enterprise Integration Engine         | Homologado      |
| G     | TISS Enterprise                       | Homologado      |
| H     | TISS Enterprise Integration           | Certificado     |

---

## 3. Inventário por bloco

### 3.1 Bloco A — Captura Inteligente

**Objetivo arquitetural:** infraestrutura canônica vendor-agnostic para captura de documentos (scanner, watch folder, upload), processamento inteligente (OCR, classificação, extração, validação), orquestração de IA, auditoria, mapeamento TISS, auto-fill e avaliação de qualidade.

- **Engines:** 0 (padrão Runtime/Adapter).
- **Ports/Contracts:** 12 (ScannerRuntimePort, WatchFolderRuntimePort, UploadRuntimePort, IntelligentCaptureRuntimePort, OCRRuntimePort, DocumentClassificationRuntimePort, DocumentExtractionRuntimePort, ValidationRuntimePort, AIOrchestrationRuntimePort, AuditRuntimePort, TISSMappingRuntimePort, AutoFillRuntimePort, QualityRuntimePort).
- **Adapters:** ~26 (Default + Enterprise + Mock por runtime).
- **Registries:** 12.
- **Fachadas:** 0.
- **Capabilities:** todas `false` (fundação estrutural).
- **Congelado:** sim (F3-CAP-13).

### 3.2 Bloco B — Inteligência Documental

**Objetivo arquitetural:** orquestração de IA, seleção de providers e auditoria de decisões de IA, sem implementar IA real.

- **Engines:** 0 (padrão Runtime/Adapter).
- **Ports/Contracts:** 5 (AIAuditorPort, AIOrchestratorPort, AIProviderRuntimePort, AIProviderPort, AIOrchestrationRuntimePort).
- **Adapters:** ~15.
- **Registries:** 2.
- **Fachadas:** 0.
- **Capabilities:** todas `false` (fundação estrutural).
- **Congelado:** sim.

### 3.3 Bloco C — Integração Corporativa

**Objetivo arquitetural:** infraestrutura de integração corporativa genérica para processamento XML, validação, SOAP, operadoras, autorização, lotes, protocolos, retornos, reconciliação e workflows.

- **Engines:** 0 (padrão Runtime/Adapter).
- **Ports/Contracts:** 10 (XMLTISSRuntimePort, XMLValidationRuntimePort, SOAPRuntimePort, OperatorRuntimePort, AuthorizationRuntimePort, BatchRuntimePort, ProtocolRuntimePort, ReturnRuntimePort, ReconciliationRuntimePort, WorkflowRuntimePort).
- **Adapters:** ~20.
- **Registries:** 10.
- **Fachadas:** 0.
- **Capabilities:** todas `false` (fundação estrutural).
- **Congelado:** sim.

### 3.4 Bloco D — Funcionalização Progressiva dos Runtimes

**Objetivo arquitetural:** implementação progressiva de capacidades funcionais de validação XML, uma por Sprint, seguindo a RULE_23.

- **Engines:** 9 (XSDValidator, NamespaceValidator, VersionValidator, BusinessValidator, OperatorValidator, XMLRepairEngine, XMLAutomaticCorrectionEngine, XMLValidationReportEngine, XMLGenericValidator).
- **Ports/Contracts:** reutiliza XMLValidationRuntimePort do Bloco C.
- **Adapters:** reutiliza Bloco C.
- **Registries:** reutiliza Bloco C.
- **Fachadas:** 1 (XMLGenericValidator).
- **Capabilities implementadas (true):** `parserImplemented`, `xsdValidationImplemented`, `schemaSelectionImplemented`, `namespaceValidationImplemented`, `versionValidationImplemented`, `businessValidationImplemented`, `operatorValidationImplemented`, `xmlRepairImplemented`, `automaticCorrectionImplemented`, `validationReportImplemented`, `xmlValidationImplemented`.
- **Congelado:** sim (AUDIT-D).

### 3.5 Bloco E — Enterprise Business Engine

**Objetivo arquitetural:** lógica de negócio declarativa e executável: catálogo, execução, transações, workflows, orquestração de processos, tabelas de decisão, eventos, auditoria e relatórios.

- **Engines:** 10 (BusinessRuleCatalog, BusinessRuleExecutionEngine, BusinessTransactionEngine, BusinessWorkflowEngine, BusinessProcessOrchestrationEngine, BusinessDecisionTableEngine, BusinessEventLogEngine, BusinessAuditTrailEngine, BusinessReportEngine, GenericBusinessEngine).
- **Ports/Contracts:** 1 (BusinessEnginePort).
- **Adapters:** 2 (Default, Mock).
- **Registries:** 1.
- **Fachadas:** 1 (GenericBusinessEngine).
- **Capabilities:** todas `false` (E-01 autorizada, não iniciada).
- **Status:** arquitetura homologada, aguardando sprints E-01 a E-10.

### 3.6 Bloco F — Enterprise Integration Engine

**Objetivo arquitetural:** camada genérica de integração para conectar, transformar, validar, rotear e monitorar dados entre motores Enterprise sem conhecimento de domínio.

- **Engines:** 10 (IntegrationRegistryEngine, IntegrationConnectorEngine, IntegrationPipelineEngine, IntegrationMappingEngine, IntegrationTransformationEngine, IntegrationValidationEngine, IntegrationRoutingEngine, IntegrationMonitoringEngine, IntegrationReportEngine, GenericIntegrationEngine).
- **Ports/Contracts:** 1 (EnterpriseIntegrationEnginePort).
- **Adapters:** 2 (Default, Mock).
- **Registries:** 1.
- **Fachadas:** 1 (GenericIntegrationEngine).
- **Capabilities:** todas `false` (F-01 autorizada, não iniciada).
- **Status:** arquitetura homologada, aguardando sprints F-01 a F-10.

### 3.7 Bloco G — TISS Enterprise

**Objetivo arquitetural:** conhecimento, processamento, validação, correção e orquestração específica do padrão TISS.

- **Engines:** 10 (TissKnowledgeEngine, TissLayoutEngine, TissParserEngine, TissSerializerEngine, TissSchemaValidationEngine, TissBusinessValidationEngine, TissOperatorValidationEngine, TissRepairEngine, TissCorrectionEngine, GenericTissEngine).
- **Ports/Contracts:** 1 (TISSEnterprisePort).
- **Adapters:** 2 (Default, Mock).
- **Registries:** 1.
- **Fachadas:** 1 (GenericTissEngine).
- **Capabilities:** todas `false` (G-01 autorizada, não iniciada).
- **Status:** arquitetura homologada, aguardando sprints G-01 a G-10.

### 3.8 Bloco H — TISS Enterprise Integration

**Objetivo arquitetural:** integração corporativa TISS com operadoras de saúde: comunicação, SOAP, autenticação, envio, lote, retorno, status, retry, auditoria e fachada final.

- **Engines:** 10 (TissCommunicationEngine, TissSoapEngine, TissAuthenticationEngine, TissSubmissionEngine, TissBatchEngine, TissReturnProcessingEngine, TissStatusTrackingEngine, TissRetryEngine, TissAuditEngine, GenericTissIntegrationEngine).
- **Ports/Contracts:** 1 (TISSIntegrationPort).
- **Adapters:** 2 (Default, Mock).
- **Registries:** 1.
- **Fachadas:** 1 (GenericTissIntegrationEngine).
- **Capabilities implementadas (true):** `tissCommunicationImplemented`, `tissSoapImplemented`, `tissAuthenticationImplemented`, `tissSubmissionImplemented`, `tissBatchImplemented`, `tissReturnProcessingImplemented`, `tissStatusTrackingImplemented`, `tissRetryImplemented`, `tissAuditImplemented`, `tissIntegrationEngineImplemented`.
- **Status:** certificado, congelado e encerrado (AUDIT-H).

---

## 4. Totais gerais

| Tipo | Quantidade |
| ---- | ---------- |
| Engines | 49 |
| Ports/Contracts | 36+ |
| Adapters | 67+ |
| Registries | 27+ |
| Fachadas | 4 |
| Capabilities true | 21 (11 do Bloco D + 10 do Bloco H) |

---

## 5. Componentes canônicos e congelados

- Todos os Ports/Contracts dos Blocos A, B, C.
- Engines e fachadas do Bloco D.
- Engines e fachadas do Bloco H.
- Arquiteturas homologadas dos Blocos E, F, G (sem implementação funcional).

---

## 6. Componentes que servem como fundação para novos blocos

- Blocos A/B/C/D: fundação para captura, IA, validação XML.
- Bloco E: fundação para regras de negócio.
- Bloco F: fundação para integração genérica.
- Bloco G: fundação para TISS.
- Bloco H: fundação para integração TISS (camada imediatamente abaixo do Bloco I).

---

## 7. Validação da arquitetura

### 7.1 Violações arquiteturais

Nenhuma violação arquitetural crítica identificada. A estrutura segue:

- ECS-01 (Port → Provider → Factory → Registry → Adapter → Store);
- RULE_23 (uma capability por Sprint);
- dependências unidirecionais A → B → C → D → E → F → G → H;
- consumo exclusivo via Ports;
- especialização via Adapters.

### 7.2 Duplicações identificadas (não corrigidas)

1. **Adapters Default/Enterprise/Mock:** padrão comum, porém o Enterprise geralmente é alias do Default.
2. **Stores In-Memory:** cada runtime possui sua própria implementação; oportunidade futura de abstração compartilhada.
3. **Capacidades de validação XML entre Bloco C e Bloco D:** Bloco C define as flags estruturais; Bloco D as ativa funcionalmente — isso é intencional, não duplicação.

### 7.3 Riscos arquiteturais para o Bloco I

- O Bloco I dependerá exclusivamente do Bloco H (fachada `GenericTissIntegrationEngine`) e, transitivamente, de C, D, E, F, G.
- Deve-se evitar importar stores ou adapters diretamente; usar sempre Ports.
- Deve-se reutilizar as 9 engines H-01 a H-09 em vez de recriar lógica.

---

## 8. Recomendação para o Bloco I

1. A arquitetura atual suporta o início do Bloco I.
2. Não existem pendências arquiteturais críticas.
3. Risco de duplicação é baixo, desde que o Bloco I consuma exclusivamente via `TISSIntegrationPort` e `GenericTissIntegrationEngine`.
4. Componentes obrigatoriamente reutilizáveis pelo Bloco I: `GenericTissIntegrationEngine` e as 9 engines H-01 a H-09.
5. A camada arquitetural imediatamente acima do Bloco H deve ser um **Bloco I — TISS Orchestration & Operations** ou **TISS Operational Command Engine**, que orquestre a fachada H sem duplicar integração.
