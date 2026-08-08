# ENTERPRISE DEPENDENCY MAP

**Sprint:** ARCH-I00 — Enterprise Master Architecture Discovery  
**Data:** 2026-08-08  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`

---

## 1. Mapa vertical de blocos

```
Bloco A — Captura Inteligente
    ↓
Bloco B — Inteligência Documental
    ↓
Bloco C — Integração Corporativa
    ↓
Bloco D — Funcionalização Progressiva dos Runtimes
    ↓
Bloco E — Enterprise Business Engine
    ↓
Bloco F — Enterprise Integration Engine
    ↓
Bloco G — TISS Enterprise
    ↓
Bloco H — TISS Enterprise Integration
    ↓
Bloco I — (futuro — ainda não iniciado)
```

---

## 2. Dependências cruzadas detalhadas

### 2.1 Bloco A → Bloco B

- Bloco B consome os Ports de captura, OCR, extração, classificação e validação do Bloco A como dependências estruturais.
- Não há acoplamento direto a stores ou adapters.

### 2.2 Bloco B → Bloco C

- Bloco C consome `AIOrchestrationRuntimePort` do Bloco B.
- Bloco C também consome `AuditRuntimePort`, `ValidationRuntimePort`, `DocumentExtractionRuntimePort`, `DocumentClassificationRuntimePort`, `OCRRuntimePort`, `IntelligentCaptureRuntimePort`, `ScannerRuntimePort`, `WatchFolderRuntimePort`, `UploadRuntimePort`.

### 2.3 Bloco C → Bloco D

- Bloco D reutiliza os Ports do `XMLValidationRuntime` do Bloco C.
- Bloco D ativa funcionalmente as capacidades de validação XML.
- Engines do Bloco D são consumidos pelos Blocos E, F, G, H.

### 2.4 Bloco D → Bloco E

- Bloco E depende de `XMLValidationRuntimePort` e `XMLRuntimePort` do Bloco C/D.
- Bloco E expõe `BusinessEnginePort` para os Blocos F, G, H.

### 2.5 Bloco E → Bloco F

- Bloco F depende de `BusinessEnginePort` do Bloco E.
- Bloco F expõe `EnterpriseIntegrationEnginePort` para os Blocos G, H.

### 2.6 Bloco F → Bloco G

- Bloco G depende de `EnterpriseIntegrationEnginePort` do Bloco F.
- Bloco G expõe `TISSEnterprisePort` para o Bloco H.

### 2.7 Bloco G → Bloco H

- Bloco H depende de `TISSEnterprisePort` do Bloco G.
- Bloco H implementa todas as engines de integração TISS e expõe `TISSIntegrationPort`.

### 2.8 Bloco H → Bloco I

- Bloco I deverá consumir exclusivamente `GenericTissIntegrationEngine` e `TISSIntegrationPort`.
- Nenhuma dependência direta a stores, adapters ou registries do Bloco H.

---

## 3. Mapa de reutilização

### 3.1 Engines que reutilizam outras engines

| Engine | Reutiliza |
| ------ | ---------- |
| TissSoapEngine | TissCommunicationEngine |
| TissAuthenticationEngine | TissCommunicationEngine, TissSoapEngine |
| TissSubmissionEngine | TissCommunicationEngine, TissSoapEngine, TissAuthenticationEngine |
| TissBatchEngine | TissSubmissionEngine |
| TissReturnProcessingEngine | TissSubmissionEngine, TissBatchEngine |
| TissStatusTrackingEngine | TissSubmissionEngine, TissBatchEngine, TissReturnProcessingEngine |
| TissRetryEngine | TissSubmissionEngine, TissBatchEngine, TissReturnProcessingEngine |
| TissAuditEngine | TissSubmissionEngine, TissBatchEngine, TissReturnProcessingEngine |
| GenericTissIntegrationEngine | todas as engines H-01 a H-09 |
| GenericTissEngine | (futuro) orquestrará engines G-01 a G-09 |
| GenericIntegrationEngine | (futuro) orquestrará engines F-01 a F-09 |
| GenericBusinessEngine | (futuro) orquestrará engines E-01 a E-09 |
| XMLGenericValidator | orquestra validadores do Bloco D |

### 3.2 Providers compartilhados

- Cada bloco possui seu próprio provider factory. Não existem providers globalmente compartilhados entre blocos.
- O padrão é: `create-<runtime>-port` por módulo.

### 3.3 Registries compartilhados

- `AIProviderRegistry` é compartilhado dentro do Bloco B.
- `AIOrchestrationRuntimeRegistry` é compartilhado dentro do Bloco B.
- Demais registries são locais ao seu respectivo runtime.

### 3.4 Adapters compartilhados

- Cada runtime possui Mock, Default e Enterprise adapters.
- `Enterprise*Adapter` geralmente é alias/export do `Default*Adapter`.
- Não há compartilhamento de adapters entre blocos; cada bloco consome apenas Ports.

### 3.5 Contratos (Ports) compartilhados

| Port | Consumido por |
| ---- | -------------- |
| XMLValidationRuntimePort | Blocos D, E, F, G, H |
| XMLTISSRuntimePort | Blocos D, E, F, G, H |
| SOAPRuntimePort | Bloco H |
| OperatorRuntimePort | Blocos E, F, G, H |
| AuthorizationRuntimePort | Blocos E, F, G, H |
| BatchRuntimePort | Blocos E, F, G, H |
| ProtocolRuntimePort | Bloco H |
| ReturnRuntimePort | Blocos E, F, G, H |
| ReconciliationRuntimePort | Blocos E, F, G, H |
| WorkflowRuntimePort | Blocos E, F, G, H |
| BusinessEnginePort | Blocos F, G, H |
| EnterpriseIntegrationEnginePort | Blocos G, H |
| TISSEnterprisePort | Bloco H |
| TISSIntegrationPort | Bloco I (futuro) |

---

## 4. Componentes canônicos

- Ports dos Blocos A, B, C.
- `XMLGenericValidator` (Bloco D).
- `GenericBusinessEngine` (Bloco E — arquitetura).
- `GenericIntegrationEngine` (Bloco F — arquitetura).
- `GenericTissEngine` (Bloco G — arquitetura).
- `GenericTissIntegrationEngine` (Bloco H).

---

## 5. Recomendação para o Bloco I

O Bloco I deve:

1. Depender unicamente de `TISSIntegrationPort` e `GenericTissIntegrationEngine`.
2. Não importar stores, adapters ou registries dos blocos anteriores.
3. Não duplicar as 9 engines H-01 a H-09.
4. Não criar nova fachada de integração TISS (a `GenericTissIntegrationEngine` já é a fachada final).
5. Atuar como camada de orquestração operacional (comandos, monitoramento, alertas) sobre a fachada H.
